// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

/* DOM test (owner's decision 4): the delete-account sheet as a user meets it.
   Supabase is a fake; nothing leaves the test. */

const api = vi.hoisted(() => ({
  rpc: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("../lib/supabase", () => ({
  supabase: { rpc: api.rpc, auth: { getSession: api.getSession, signOut: api.signOut } },
}));

const { DeleteAccountSheet } = await import("./DeleteAccount");
const { ACCOUNT_DELETED_EVENT } = await import("../utils/account");

const setOnline = (v: boolean) => Object.defineProperty(navigator, "onLine", { value: v, configurable: true });

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  api.getSession.mockResolvedValue({ data: { session: { access_token: "t" } } });
  api.rpc.mockResolvedValue({ error: null, status: 204 });
  api.signOut.mockResolvedValue({ error: null });
  setOnline(true);
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const open = (onClose = vi.fn()) => {
  render(<DeleteAccountSheet lang="en" onClose={onClose} />);
  return {
    onClose,
    input: screen.getByLabelText(/type delete to confirm/i) as HTMLInputElement,
  };
};
/** The main action: "Delete for good", then "Deleting…", then "Try again" on failure. Same element throughout. */
const confirmButton = () => screen.getAllByRole("button").find((b) => /delete for good|deleting|try again/i.test(b.textContent ?? ""))!;

describe("Delete account sheet (DOM)", () => {
  it("is a dialog; the delete button stays off until the confirm word is typed", () => {
    const { input } = open();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(confirmButton().disabled).toBe(true);
    fireEvent.change(input, { target: { value: "delet" } });
    expect(confirmButton().disabled).toBe(true);
    fireEvent.change(input, { target: { value: " delete " } });
    expect(confirmButton().disabled).toBe(false);
  });

  it("deletes once even on a double tap, signs out locally and tells the app", async () => {
    const deleted = vi.fn();
    window.addEventListener(ACCOUNT_DELETED_EVENT, deleted);
    const { input } = open();
    fireEvent.change(input, { target: { value: "DELETE" } });
    const button = confirmButton();
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(api.signOut).toHaveBeenCalled());
    expect(api.rpc).toHaveBeenCalledTimes(1);
    expect(api.rpc).toHaveBeenCalledWith("delete_my_account");
    expect(api.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(deleted).toHaveBeenCalledTimes(1);
    window.removeEventListener(ACCOUNT_DELETED_EVENT, deleted);
  });

  it("offline: nothing is sent, the learner is told nothing was deleted", async () => {
    setOnline(false);
    const { input } = open();
    fireEvent.change(input, { target: { value: "DELETE" } });
    fireEvent.click(confirmButton());
    expect((await screen.findByRole("alert")).textContent).toMatch(/nothing was deleted/i);
    expect(api.rpc).not.toHaveBeenCalled();
    expect(api.signOut).not.toHaveBeenCalled();
  });

  it("a server error shows a message and a retry, and does not sign out", async () => {
    api.rpc.mockResolvedValueOnce({ error: { code: "XX000", message: "boom" }, status: 500 });
    const { input } = open();
    fireEvent.change(input, { target: { value: "DELETE" } });
    fireEvent.click(confirmButton());
    expect((await screen.findByRole("alert")).textContent).toMatch(/nothing was deleted/i);
    expect(confirmButton().textContent).toMatch(/try again/i);
    expect(api.signOut).not.toHaveBeenCalled();
  });

  it("no session: the request is not sent as a guest", async () => {
    api.getSession.mockResolvedValueOnce({ data: { session: null } });
    const { input } = open();
    fireEvent.change(input, { target: { value: "DELETE" } });
    fireEvent.click(confirmButton());
    await screen.findByRole("alert");
    expect(api.rpc).not.toHaveBeenCalled();
  });

  it("cancel closes the sheet", () => {
    const { onClose } = open();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
