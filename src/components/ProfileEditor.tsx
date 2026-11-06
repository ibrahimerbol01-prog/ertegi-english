import { useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { Sheet } from "./UIHelpers";
import { AvatarBadge } from "./AvatarBadge";
import { supabase } from "../lib/supabase";
import { DICT } from "../dict";
import { AVATAR_IDS, validateNick, type NickError } from "../utils/profileEdit";

/* Edit the display name and pick an avatar (ordinary site only: the research
   build swaps this file for ProfileEditor.off.tsx in vite.config.ts). The name
   goes to profiles.display_name and the auth metadata; the avatar id only to the
   auth metadata, so no database migration is needed. */
export default function ProfileEditor({ userId, lang, name, avatar, onSaved }: {
  userId: string;
  lang: string;
  name: string;
  avatar: string | null;
  onSaved: (name: string, avatar: string | null) => void;
}) {
  const t = DICT[lang === "kk" ? "kk" : "en"];
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(name);
  const [pick, setPick] = useState<string | null>(avatar);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const errText: Record<NickError, string> = { empty: t.peErrEmpty, too_long: t.peErrLong, bad_chars: t.peErrChars, blocked: t.peErrBlocked };

  const start = () => { setDraft(name); setPick(avatar); setError(null); setOpen(true); };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const v = validateNick(draft);
    if (!v.ok) { setError(errText[v.error]); return; }
    setBusy(true);
    setError(null);
    const [p, a] = await Promise.all([
      supabase.from("profiles").update({ display_name: v.value }).eq("id", userId),
      supabase.auth.updateUser({ data: { display_name: v.value, avatar: pick } }),
    ]);
    setBusy(false);
    if (p.error || a.error) { setError(t.peErrSave); return; }
    onSaved(v.value, pick);
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={start} className="btn btn-ghost btn-sm">
        <Pencil size={15} aria-hidden="true" /> {t.peEdit}
      </button>
      {open && (
        <Sheet open onClose={() => !busy && setOpen(false)} label={t.peEdit}>
          <form onSubmit={save} className="space-y-4">
            <h3 className="font-display text-xl font-black text-ink pr-8">{t.peEdit}</h3>
            <label className="block">
              <span className="text-xs font-semibold text-ink-2 mb-1 block">{t.peName}</span>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={60} autoComplete="nickname"
                aria-invalid={!!error || undefined} aria-describedby={error ? "pe-error" : undefined} className="field" />
            </label>
            <fieldset>
              <legend className="text-xs font-semibold text-ink-2 mb-2">{t.peAvatar}</legend>
              <div className="grid grid-cols-6 gap-2">
                <button type="button" aria-pressed={pick === null} aria-label={t.peNoAvatar} onClick={() => setPick(null)}
                  className={`rounded-full p-0.5 border-2 ${pick === null ? "border-sky" : "border-transparent"}`}>
                  <AvatarBadge id={null} initial={(draft.trim()[0] ?? "?").toUpperCase()} className="w-11 h-11 text-lg" />
                </button>
                {AVATAR_IDS.map((id, i) => (
                  <button key={id} type="button" aria-pressed={pick === id} aria-label={`${t.peAvatar} ${i + 1}`} onClick={() => setPick(id)}
                    className={`rounded-full p-0.5 border-2 ${pick === id ? "border-sky" : "border-transparent"}`}>
                    <AvatarBadge id={id} initial="" className="w-11 h-11" />
                  </button>
                ))}
              </div>
            </fieldset>
            {error && <p id="pe-error" role="alert" className="text-sm text-felt-deep bg-felt-soft rounded-xl px-3 py-2.5">{error}</p>}
            <button type="submit" disabled={busy} className="btn w-full">{busy ? t.peSaving : t.peSave}</button>
          </form>
        </Sheet>
      )}
    </>
  );
}
