// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

/* DOM tests (owner's decision 4): sign-up / sign-in / reset and the new-password
   screen. Supabase is a fake. */

const auth = vi.hoisted(() => ({
  signUp: vi.fn(), signInWithPassword: vi.fn(), signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(), updateUser: vi.fn(),
}));
vi.mock("./lib/supabase", () => ({ supabase: { auth } }));

const { default: AuthScreen } = await import("./AuthScreen");
const { SetPasswordScreen } = await import("./components/SetPassword");

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("ertegi_lang", "en");
  for (const f of Object.values(auth)) f.mockResolvedValue({ data: {}, error: null });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const type = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));

describe("AuthScreen (DOM)", () => {
  it("sign-up needs a role and the privacy consent before anything is sent", async () => {
    render(<AuthScreen />);
    type(/your name/i, "Aigerim");
    type(/^email$/i, "a@example.org");
    type(/^password$/i, "secret12");
    submit(/create account/i);
    expect((await screen.findByRole("alert")).textContent).toMatch(/learner or a teacher/i);
    fireEvent.click(screen.getByRole("button", { name: /i'm a learner/i }));
    submit(/create account/i);
    expect((await screen.findByRole("alert")).textContent).toMatch(/agree to the privacy policy/i);
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("with role and consent, sign-up sends the role, the name and the consent, and returns to this site", async () => {
    render(<AuthScreen />);
    fireEvent.click(screen.getByRole("button", { name: /i'm a teacher/i }));
    type(/your name/i, "Aigerim");
    type(/^email$/i, "a@example.org");
    type(/^password$/i, "secret12");
    fireEvent.click(screen.getByRole("checkbox"));
    submit(/create account/i);
    await waitFor(() => expect(auth.signUp).toHaveBeenCalledTimes(1));
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "a@example.org", password: "secret12",
      options: { emailRedirectTo: window.location.origin, data: { display_name: "Aigerim", agreed_to_privacy_policy: true, role: "teacher" } },
    });
  });

  it("Google sign-up without consent does not leave the site; with consent it marks the consent first", async () => {
    render(<AuthScreen />);
    fireEvent.click(screen.getByRole("button", { name: /i'm a learner/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    await screen.findByRole("alert");
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    await waitFor(() => expect(auth.signInWithOAuth).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem("ertegi_privacy_consent_pending")).toBe("1");
  });

  it("sign-in has no consent box and sends email and password", async () => {
    render(<AuthScreen />);
    fireEvent.click(screen.getAllByRole("button", { name: /^sign in$/i }).at(-1)!);
    expect(screen.queryByRole("checkbox")).toBeNull();
    type(/^email$/i, "a@example.org");
    type(/^password$/i, "secret12");
    fireEvent.click(screen.getAllByRole("button", { name: /^sign in$/i })[0]);
    await waitFor(() => expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@example.org", password: "secret12" }));
  });

  it("a wrong password shows the error and keeps the form", async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: new Error("Invalid login credentials") });
    render(<AuthScreen />);
    fireEvent.click(screen.getAllByRole("button", { name: /^sign in$/i }).at(-1)!);
    type(/^email$/i, "a@example.org");
    type(/^password$/i, "wrong123");
    fireEvent.click(screen.getAllByRole("button", { name: /^sign in$/i })[0]);
    expect((await screen.findByRole("alert")).textContent).toMatch(/invalid login credentials/i);
    expect(screen.getByLabelText(/^email$/i)).toBeTruthy();
  });

  it("forgot password sends the reset link back to this site", async () => {
    render(<AuthScreen />);
    fireEvent.click(screen.getAllByRole("button", { name: /^sign in$/i }).at(-1)!);
    fireEvent.click(screen.getByRole("button", { name: /forgot your password/i }));
    type(/^email$/i, "a@example.org");
    fireEvent.submit(screen.getByLabelText(/^email$/i).closest("form")!);
    await waitFor(() => expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("a@example.org", { redirectTo: window.location.origin }));
  });
});

describe("SetPasswordScreen (DOM)", () => {
  const open = (onDone = vi.fn()) => { render(<SetPasswordScreen lang="en" onDone={onDone} />); return onDone; };
  const fill = (a: string, b: string) => { type(/^new password$/i, a); type(/repeat the password/i, b); };
  const save = () => fireEvent.submit(screen.getByLabelText(/^new password$/i).closest("form")!);

  it("refuses a short password and a mismatch without calling the server", async () => {
    open();
    fill("abc", "abc"); save();
    expect((await screen.findByRole("alert")).textContent).toMatch(/at least 6/i);
    fill("abcdef", "abcdeg"); save();
    expect((await screen.findByRole("alert")).textContent).toMatch(/do not match/i);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("saves the new password, then Continue finishes", async () => {
    const onDone = open();
    fill("abcdef", "abcdef"); save();
    await waitFor(() => expect(auth.updateUser).toHaveBeenCalledWith({ password: "abcdef" }));
    expect(await screen.findByText(/password updated/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("a server error is shown and the form stays", async () => {
    auth.updateUser.mockResolvedValueOnce({ data: {}, error: { message: "Password is too weak" } });
    open();
    fill("abcdef", "abcdef"); save();
    expect((await screen.findByRole("alert")).textContent).toMatch(/too weak/i);
    expect(screen.queryByText(/password updated/i)).toBeNull();
  });
});

describe("AuthScreen accessibility", () => {
  it("the password field's accessible name is just its label (hint and 'forgot' button are not part of it)", () => {
    render(<AuthScreen />);
    fireEvent.click(screen.getAllByRole("button", { name: /^sign in$/i }).at(-1)!);
    const field = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    expect(field.type).toBe("password");
    expect(field.getAttribute("aria-describedby")).toContain("auth-pass-hint");
    expect(screen.getByRole("button", { name: /forgot your password/i }).closest("label")).toBeNull();
  });
});
