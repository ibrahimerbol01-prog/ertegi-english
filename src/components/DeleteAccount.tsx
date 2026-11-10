import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { Sheet } from "./UIHelpers";
import { Shanyraq, SteppeBackground } from "./Ornaments";
import { supabase } from "../lib/supabase";
import { ACCOUNT_DELETED_EVENT, deleteAccount, isConfirmWord, type DeleteFailure } from "../utils/account";

/* Loaded only when someone opens "Delete account" (React.lazy in the
   profile), so the first screen does not carry it. */

type L = "kk" | "en";
const pick = (lang: string): L => (lang === "en" ? "en" : "kk");

const TEXT = {
  kk: {
    title: "Аккаунтты өшіру",
    lead: "Аккаунт біржола өшеді. Мұны қайтару мүмкін емес: біз де қалпына келтіре алмаймыз.",
    whatGoes: "Не өшеді:",
    teacherItems: [
      "сен ашқан сыныптар, олардың тапсырмалары мен коды; оқушылар сыныптан шығады (өз прогрестері өздерінде қалады)",
    ],
    items: [
      "кіру деректері: пошта, құпиясөз немесе Google арқылы кіру, атың",
      "прогресс: XP, күн қатары, ертегі деңгейлері, сынақ нәтижелері, белгілер",
      "сақтаған сөздерің және қайталау кестесі",
      "«Ой ізі» жазбалары, «Дала кеңесі» дауыстары мен себептері, апта дебатының мәтіндері",
      "сыныптарға мүшелігің және лақап атың",
      "осы құрылғыдағы қосымша деректері (тіл таңдауынан басқа)",
    ],
    after: "Кейін сол поштамен қайта тіркелуге болады, бірақ бәрі нөлден басталады.",
    typeLabel: "Растау үшін ӨШІРУ деп жаз",
    typeHint: "Орыс пернетақтасында ОШИРУ деп жазуға болады.",
    cancel: "Бас тарту",
    confirm: "Біржола өшіру",
    busy: "Өшіріліп жатыр…",
    retry: "Қайталау",
    errors: {
      offline: "Интернет жоқ сияқты. Ештеңе өшірілмеді. Байланысты тексеріп, қайтала.",
      unavailable: "Бұл мүмкіндік әзірге қосылмаған. Мұғаліміңе немесе сайт әкімшісіне жаз. Ештеңе өшірілмеді.",
      session: "Кіру мерзімі бітіп қалған. Шығып, қайта кір де, тағы байқап көр. Ештеңе өшірілмеді.",
      failed: "Сервер жауап бермеді. Ештеңе өшірілмеді. Сәлден соң қайтала.",
    } satisfies Record<DeleteFailure, string>,
  },
  en: {
    title: "Delete account",
    lead: "Your account will be deleted for good. This cannot be undone: we cannot bring it back either.",
    whatGoes: "What is deleted:",
    teacherItems: [
      "classes you created, their assignments and codes; learners leave those classes (their own progress stays with them)",
    ],
    items: [
      "your sign-in: email, password or Google sign-in, your name",
      "progress: XP, streak, tale levels, quiz results, badges",
      "your saved words and their review schedule",
      "Thinking trail entries, Steppe council votes and reasons, debate-of-the-week texts",
      "your class memberships and nicknames",
      "the app's data on this device (except the language setting)",
    ],
    after: "You can sign up again with the same email later, but everything starts from zero.",
    typeLabel: "Type DELETE to confirm",
    typeHint: "ӨШІРУ works too.",
    cancel: "Cancel",
    confirm: "Delete for good",
    busy: "Deleting…",
    retry: "Try again",
    errors: {
      offline: "You seem to be offline. Nothing was deleted. Check the connection and try again.",
      unavailable: "This feature is not switched on yet. Please ask your teacher or the site admin. Nothing was deleted.",
      session: "Your sign-in has expired. Sign out, sign in again and retry. Nothing was deleted.",
      failed: "The server did not answer. Nothing was deleted. Try again in a moment.",
    } satisfies Record<DeleteFailure, string>,
  },
} as const;

export function DeleteAccountSheet({ lang, teacher = false, onClose }: { lang: string; teacher?: boolean; onClose: () => void }) {
  const l = pick(lang);
  const T = TEXT[l];
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<DeleteFailure | null>(null);
  const inFlight = useRef(false);
  const inputId = useId();
  const ok = isConfirmWord(word);
  const errRef = useRef<HTMLDivElement>(null);
  // The window scrolls on small screens: bring the message and the retry button into view.
  useEffect(() => { if (failure) errRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [failure]);

  const run = async () => {
    // A double tap sends one request.
    if (inFlight.current || !ok) return;
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    const res = await deleteAccount({
      // getSession refreshes an expired token first. Without a session the call
      // would go as anon and fail with 42501, which reads as "not switched on".
      rpc: async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return { error: { code: "PGRST301", message: "no session", status: 401 } };
        return supabase.rpc("delete_my_account");
      },
      // Local only: the server session ended with the user.
      signOut: () => supabase.auth.signOut({ scope: "local" }),
      // Tell App before sign-out, so it shows the goodbye screen instead of the sign-in form.
      onDeleted: () => window.dispatchEvent(new CustomEvent(ACCOUNT_DELETED_EVENT)),
    });
    if (!res.ok) {
      inFlight.current = false;
      setBusy(false);
      setFailure(res.reason);
    }
  };

  // While the request runs, the window stays: closing it would hide the outcome.
  const close = () => { if (!inFlight.current) onClose(); };
  const items = teacher ? [...T.teacherItems, ...T.items] : [...T.items, ...T.teacherItems.map((s) => (l === "kk" ? `мұғалім ретінде ашқан болсаң: ${s}` : `if you were a teacher: ${s}`))];

  return (
    <Sheet open onClose={close} label={T.title}>
      <div className="p-6 pt-4 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl bg-rose-soft flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-rose-ink" aria-hidden="true" />
          </span>
          <h3 className="font-display text-xl font-black text-ink">{T.title}</h3>
        </div>
        <p className="text-[15px] text-ink leading-relaxed font-semibold">{T.lead}</p>
        <p className="text-sm text-ink-2 mt-3 font-semibold">{T.whatGoes}</p>
        <ul className="mt-1.5 space-y-1.5 text-sm text-ink-2 leading-relaxed list-disc pl-5">
          {items.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <p className="text-sm text-ink-2 mt-3 leading-relaxed">{T.after}</p>

        <label htmlFor={inputId} className="text-sm font-semibold text-ink mt-5 mb-1 block">{T.typeLabel}</label>
        <input
          id={inputId}
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void run(); } }}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          disabled={busy}
          aria-describedby={`${inputId}-hint${failure ? ` ${inputId}-err` : ""}`}
          className="field"
        />
        <span id={`${inputId}-hint`} className="text-xs text-ink-2 mt-1 block">{T.typeHint}</span>

        <div ref={errRef}>
          {failure && (
            <p id={`${inputId}-err`} role="alert" className="mt-4 text-sm text-rose-ink bg-rose-soft rounded-xl px-3 py-2.5 leading-relaxed">
              {T.errors[failure]}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button type="button" onClick={close} disabled={busy} className="btn btn-ghost">{T.cancel}</button>
            <button type="button" onClick={run} disabled={!ok || busy} aria-busy={busy || undefined} className="btn btn-rose">
              {busy ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> {T.busy}</> : failure ? T.retry : T.confirm}
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/* Shown by App after the account is gone, in place of the signed-in app. */
export function AccountDeletedScreen({ lang, onDone }: { lang: string; onDone: () => void }) {
  const kk = pick(lang) === "kk";
  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center bg-sand px-4 py-10 overflow-hidden">
      <SteppeBackground />
      <main className="relative z-10 w-full max-w-[400px] card px-6 py-9 text-center">
        <span className="mx-auto w-16 h-16 rounded-[20px] bg-jade flex items-center justify-center shadow-[0_5px_0_#0F6446]">
          <Check className="w-9 h-9 text-white" strokeWidth={3} aria-hidden="true" />
        </span>
        <h1 tabIndex={-1} ref={(el) => el?.focus({ preventScroll: true })} className="large-title mt-5 outline-none">
          {kk ? "Аккаунт өшірілді" : "Account deleted"}
        </h1>
        <p className="text-[15px] text-ink-2 mt-3 leading-relaxed">
          {kk
            ? "Деректерің біздің дерекқордан және осы құрылғыдан өшірілді. Ertegi English-пен бірге болғаныңа рақмет!"
            : "Your data was removed from our database and from this device. Thank you for learning with Ertegi English!"}
        </p>
        <Shanyraq className="w-10 h-10 mx-auto text-sun mt-5" strokeWidth={3} aria-hidden="true" />
        <button onClick={onDone} className="btn w-full mt-6">{kk ? "Басты бетке" : "Back to start"}</button>
      </main>
    </div>
  );
}
