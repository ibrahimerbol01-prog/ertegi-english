import { useState } from "react";
import { Check } from "lucide-react";
import { IconBoard, IconLearner } from "./Icons";
import { Shanyraq, SteppeBackground, KilimStrip } from "./Ornaments";
import type { Role } from "../utils/role";

/* Two big choices: learner or teacher. Used on the sign-up form and on the
   one-time screen for accounts that have no role yet (Google, older accounts). */
export function RolePicker({ value, onChange, kk, describedBy }: {
  value: Role | null; onChange: (r: Role) => void; kk: boolean; describedBy?: string;
}) {
  const options: { id: Role; title: string; text: string; Icon: typeof IconLearner }[] = [
    {
      id: "student",
      title: kk ? "Оқушымын" : "I'm a learner",
      text: kk ? "Ертегі оқимын, сөз жаттаймын, тапсырма орындаймын" : "Read tales, learn words, do assignments",
      Icon: IconLearner,
    },
    {
      id: "teacher",
      title: kk ? "Мұғаліммін" : "I'm a teacher",
      text: kk ? "Сынып ашамын, тапсырма беремін, прогресті көремін" : "Create classes, give assignments, see progress",
      Icon: IconBoard,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3" role="group" aria-label={kk ? "Сен кімсің?" : "Who are you?"} aria-describedby={describedBy}>
      {options.map(({ id, title, text, Icon }) => {
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(id)}
            className={`tile relative text-left p-3.5 flex flex-col gap-2 ${on ? "tile-selected" : ""}`}
          >
            {on && (
              <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-sky text-white flex items-center justify-center" aria-hidden>
                <Check size={14} strokeWidth={3.2} />
              </span>
            )}
            <Icon size={40} />
            <span className="font-display font-extrabold text-[16px] text-ink leading-tight">{title}</span>
            <span className="text-[13px] text-ink-2 leading-snug">{text}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Shown once after sign-in when the account has no role yet. */
export function RoleScreen({ kk, initial, onPick, onSignOut }: {
  kk: boolean; initial: Role | null; onPick: (r: Role) => Promise<void>; onSignOut: () => void;
}) {
  const [role, setRole] = useState<Role | null>(initial);
  const [busy, setBusy] = useState(false);
  const [missing, setMissing] = useState(false);

  const go = async () => {
    if (!role) { setMissing(true); return; }
    if (busy) return;
    setBusy(true);
    await onPick(role);
    setBusy(false);
  };

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center bg-sand px-4 py-10 overflow-hidden">
      <SteppeBackground />
      <main className="relative z-10 w-full max-w-[420px] card overflow-hidden px-6 pt-10 pb-7 space-y-5">
        <KilimStrip className="absolute top-0 inset-x-0 h-2 w-full" />
        <div className="text-center">
          <span className="mx-auto w-16 h-16 rounded-[20px] bg-sky flex items-center justify-center shadow-[0_5px_0_var(--color-sky-deep)]">
            <Shanyraq className="w-11 h-11 text-white" strokeWidth={4} />
          </span>
          <h1 className="large-title mt-5">{kk ? "Сен кімсің?" : "Who are you?"}</h1>
          <p id="role-hint" className="text-[15px] text-ink-2 mt-1.5">
            {kk ? "Таңдауыңа қарай қосымша өз бөлімін ашады. Кейін профильден ауыстыруға болады." : "The app opens the right space for you. You can switch later in your profile."}
          </p>
        </div>
        <RolePicker value={role} onChange={(r) => { setRole(r); setMissing(false); }} kk={kk} describedBy="role-hint" />
        {missing && <p role="alert" className="text-sm text-felt-deep bg-felt-soft rounded-xl px-3 py-2.5">{kk ? "Біреуін таңда." : "Pick one to continue."}</p>}
        <button onClick={go} disabled={busy} className="btn w-full">
          {busy ? (kk ? "Күте тұр..." : "Please wait...") : (kk ? "Жалғастыру" : "Continue")}
        </button>
        <button onClick={onSignOut} className="block mx-auto text-[15px] text-[#075F75] font-semibold">
          {kk ? "Басқа аккаунтпен кіру" : "Use another account"}
        </button>
      </main>
    </div>
  );
}

/* Profile row that moves the account to the other side of the app. */
export function RoleSwitchRow({ kk, to, onSwitch }: { kk: boolean; to: Role; onSwitch: (r: Role) => Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const run = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const ok = await onSwitch(to);
    // On success the app reopens on the other side, so only failure needs a word here.
    if (!ok) { setBusy(false); setFailed(true); }
  };
  const Icon = to === "teacher" ? IconBoard : IconLearner;
  return (
    <div>
      <button onClick={run} disabled={busy} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-sand/60 disabled:opacity-60">
        <Icon size={32} className="shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[16px] text-ink">
            {to === "teacher" ? (kk ? "Мұғалім режиміне ауысу" : "Switch to teacher") : (kk ? "Оқушы режиміне ауысу" : "Switch to learner")}
          </span>
          <span className="block text-[13px] text-ink-2">
            {to === "teacher"
              ? (kk ? "Сынып ашу, тапсырма беру, прогресті көру" : "Create classes, give assignments, see progress")
              : (kk ? "Ертегі оқу, сөз жаттау, сыныпқа қосылу" : "Read tales, learn words, join a class")}
          </span>
        </span>
        {busy && <span className="text-[13px] text-ink-2">{kk ? "Күте тұр..." : "Wait..."}</span>}
      </button>
      {failed && (
        <p role="alert" className="px-4 pb-3 text-[14px] font-semibold text-felt-deep">
          {kk ? "Ауыстыру сәтсіз болды. Интернетті тексеріп, қайталап көр." : "Couldn't switch. Check your connection and try again."}
        </p>
      )}
    </div>
  );
}
