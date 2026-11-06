// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AVATAR_IDS, AVATAR_TALES, parseAvatar, validateNick } from "../utils/profileEdit";
import { STORIES } from "../constants";

/* Profile nickname and avatar (Task 12 A). Supabase is a fake. */

const db = vi.hoisted(() => ({ update: vi.fn(), eq: vi.fn(), updateUser: vi.fn() }));
vi.mock("../lib/supabase", () => ({
  supabase: { from: () => ({ update: (row: unknown) => { db.update(row); return { eq: db.eq }; } }), auth: { updateUser: db.updateUser } },
}));
const { default: ProfileEditor } = await import("./ProfileEditor");

const root = join(__dirname, "..", "..");

beforeEach(() => {
  db.eq.mockResolvedValue({ error: null });
  db.updateUser.mockResolvedValue({ data: {}, error: null });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("nickname and avatar ids (pure)", () => {
  it("cleans and checks the nickname: 1–30 characters, letters, digits, space, . ' -", () => {
    expect(validateNick("  Әйгерім   Н.  ")).toEqual({ ok: true, value: "Әйгерім Н." });
    expect(validateNick("Aigerim-2")).toEqual({ ok: true, value: "Aigerim-2" });
    expect(validateNick("   ")).toEqual({ ok: false, error: "empty" });
    expect(validateNick("a".repeat(31))).toEqual({ ok: false, error: "too_long" });
    expect(validateNick("<script>")).toEqual({ ok: false, error: "bad_chars" });
    expect(validateNick("hi 😀")).toEqual({ ok: false, error: "bad_chars" });
    expect(validateNick("Badword Ali", ["badword"])).toEqual({ ok: false, error: "blocked" });
  });

  it("avatars are only our own: ornaments × colours and the tale covers; anything else is no avatar", () => {
    expect(AVATAR_IDS.length).toBe(22);
    expect(new Set(AVATAR_IDS).size).toBe(AVATAR_IDS.length);
    expect([...AVATAR_TALES].sort()).toEqual(STORIES.map((s) => s.id).sort());
    expect(parseAvatar("orn-tumar-felt")).toEqual({ kind: "ornament", ornament: "tumar", color: "felt" });
    expect(parseAvatar("tale-alpamys")).toEqual({ kind: "tale", tale: "alpamys" });
    for (const bad of ["https://example.org/me.jpg", "orn-tumar-pink", "", null, 3]) expect(parseAvatar(bad)).toBeNull();
  });
});

describe("ProfileEditor (DOM)", () => {
  const open = (onSaved = vi.fn()) => {
    render(<ProfileEditor userId="u1" lang="en" name="Aigerim" avatar={null} onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));
    return onSaved;
  };

  it("saves the cleaned name to the profile and the name and avatar to the account metadata", async () => {
    const onSaved = open();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "  Aigerim  N " } });
    fireEvent.click(screen.getByRole("button", { name: "Picture 3" }));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("Aigerim N", AVATAR_IDS[2]));
    expect(db.update).toHaveBeenCalledWith({ display_name: "Aigerim N" });
    expect(db.eq).toHaveBeenCalledWith("id", "u1");
    expect(db.updateUser).toHaveBeenCalledWith({ data: { display_name: "Aigerim N", avatar: AVATAR_IDS[2] } });
  });

  it("a bad name is refused before anything is sent", async () => {
    open();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: "<b>" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/only letters/i);
    expect(db.update).not.toHaveBeenCalled();
    expect(db.updateUser).not.toHaveBeenCalled();
  });

  it("a failed save says so and keeps the sheet open", async () => {
    db.updateUser.mockResolvedValueOnce({ data: {}, error: { message: "network" } });
    const onSaved = open();
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/not saved/i);
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("there is no photo upload anywhere in the editor", () => {
    open();
    expect(document.querySelector('input[type="file"]')).toBeNull();
    expect(readFileSync(join(root, "src/components/ProfileEditor.tsx"), "utf8")).not.toMatch(/type="file"|storage\.from|upload/i);
  });
});
