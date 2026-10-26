import { useEffect, useRef, useState } from "react";
import { Footprints, Volume2, MessageCircle, Check, ArrowLeft, ArrowRight, History } from "lucide-react";
import { supabase } from "../lib/supabase";
import { safePlayVoice } from "../utils/voice";
import { useEscape } from "../utils/useEscape";
import { Sheet } from "./UIHelpers";

/* Thinking Trail (Project Zero's Claim–Support–Question): say what you think,
   prove it by tapping sentences of the tale, then ask what you still wonder.
   Coming back to the tale shows the old claim: "I used to think… Now I think…". */

type Choice = "yes" | "no" | "partly";
interface Draft { step: 1 | 2 | 3; choice: Choice | null; claim: string; evidence: number[]; wonder: string }
const NEW_DRAFT: Draft = { step: 1, choice: null, claim: "", evidence: [], wonder: "" };
const draftKey = (userId: string | undefined, storyId: string, level: string) => `ertegi_trail_draft_${userId || "guest"}_${storyId}_${level}`;
function loadDraft(userId: string | undefined, storyId: string, level: string): Draft | null {
  try {
    const raw = JSON.parse(localStorage.getItem(draftKey(userId, storyId, level)) || "null");
    return raw && typeof raw === "object" ? { ...NEW_DRAFT, ...raw } : null;
  } catch {
    return null;
  }
}
function storeDraft(userId: string | undefined, storyId: string, level: string, d: Draft | null) {
  try {
    if (d) localStorage.setItem(draftKey(userId, storyId, level), JSON.stringify(d));
    else localStorage.removeItem(draftKey(userId, storyId, level));
  } catch { /* storage full or blocked */ }
}

interface Trail {
  level: string;
  choice: Choice;
  claim: string;
  evidence: number[]; // sentence indexes in that level's text
  evidenceText: string[]; // the sentences themselves, so another level's text can't shift them
  wonder: string;
  feedback: string;
  at: string;
}

const CLAIMS: Record<string, { en: string; kk: string }> = {
  aldar_kose: { en: "Was Aldar Köse right to take the coat?", kk: "Алдар Көсе шапанды алып дұрыс істеді ме?" },
  zhirenshe: { en: "Is a wise word stronger than a khan's power?", kk: "Дана сөз ханның билігінен күшті ме?" },
  er_tostik: { en: "Was Er Tostik right to fight when it was \"not his fight\"?", kk: "«Бұл менің соғысым емес» болса да, Ер Төстік соғысып дұрыс істеді ме?" },
  tazsha_bala: { en: "Was it right for Tazsha to trick the giant?", kk: "Тазша дәуді алдап дұрыс істеді ме?" },
  ayaz_bi: { en: "Was Ayaz Bi right not to shout at the bad men?", kk: "Аяз би жаман адамдарға айғайламай дұрыс істеді ме?" },
  asan_kaigy: { en: "Was Asan Kaigy's long journey worth it?", kk: "Асан Қайғының ұзақ сапары керек пе еді?" },
  alpamys: { en: "Is hope stronger than a prison?", kk: "Үміт зынданнан күшті ме?" },
};

const key = (userId?: string) => `ertegi_trail_${userId || "guest"}`;
function loadTrails(userId?: string): Record<string, Trail[]> {
  try {
    const raw = JSON.parse(localStorage.getItem(key(userId)) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}
function saveTrails(userId: string | undefined, all: Record<string, Trail[]>) {
  try { localStorage.setItem(key(userId), JSON.stringify(all)); } catch { /* storage full or blocked */ }
}

const splitSentences = (text: string) => (text.match(/[^.!?]+[.!?]+["”]?/g) ?? [text]).map((s) => s.trim());
const words = (s: string) => (s.match(/[\p{L}']+/gu) ?? []).length;
const mostlyNotEnglish = (s: string) => (s.match(/[а-яәіңғүұқөһё]/gi) ?? []).length > (s.match(/[a-z]/gi) ?? []).length;
// Eight words in a row from the tale: copied, not the learner's own claim.
function copied(s: string, text: string) {
  const tale = (text.toLowerCase().match(/[a-z']+/g) ?? []).join(" ");
  const mine = s.toLowerCase().match(/[a-z']+/g) ?? [];
  for (let i = 0; i + 8 <= mine.length; i++) if (tale.includes(mine.slice(i, i + 8).join(" "))) return true;
  return false;
}

export function TrailButton({ storyId, level, text, lang, userId, onReward = () => {} }: {
  storyId: string;
  level: string;
  text: string;
  lang: string;
  userId?: string;
  onReward?: (xp: number) => void;
}) {
  const kk = lang === "kk";
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState(() => loadTrails(userId));
  const btnRef = useRef<HTMLButtonElement>(null);
  const past = all[storyId] ?? [];
  if (!CLAIMS[storyId]) return null;

  return (
    <>
      <button ref={btnRef} onClick={() => setOpen(true)} aria-haspopup="dialog" className="btn btn-ghost w-full">
        <Footprints size={18} strokeWidth={2.6} /> {kk ? "Ой ізі" : "Thinking trail"}
        {past.length > 0 && <Check size={16} strokeWidth={3} className="text-jade" />}
      </button>
      <Sheet open={open} onClose={() => { setOpen(false); setTimeout(() => btnRef.current?.focus(), 0); }} label={kk ? "Ой ізі" : "Thinking trail"}>
        {open && (
          <TrailFlow
            kk={kk}
            claimQ={CLAIMS[storyId]}
            level={level}
            text={text}
            past={past}
            draft={loadDraft(userId, storyId, level)}
            onDraft={(d) => storeDraft(userId, storyId, level, d)}
            onSave={(entry) => {
              storeDraft(userId, storyId, level, null);
              const next = { ...all, [storyId]: [...past, entry] };
              setAll(next);
              saveTrails(userId, next);
              // Every revision is kept, so a teacher can see a mind change.
              if (userId) {
                supabase.from("trail_entries").insert({
                  user_id: userId, tale_id: storyId, cefr_level: entry.level, claim_choice: entry.choice, claim_text: entry.claim,
                  evidence_ids: entry.evidence, wonder_text: entry.wonder, revision: past.length + 1,
                }).then(() => {}, () => {});
              }
              onReward(past.length ? 5 : 11);
            }}
            onFeedback={(feedback) => {
              // Shoqan answers after the save; read the latest trails, not the ones from before it.
              const latest = loadTrails(userId);
              const list = [...(latest[storyId] ?? [])];
              if (!list.length) return;
              list[list.length - 1] = { ...list[list.length - 1], feedback };
              const next = { ...latest, [storyId]: list };
              setAll(next);
              saveTrails(userId, next);
            }}
          />
        )}
      </Sheet>
    </>
  );
}

function TrailFlow({ kk, claimQ, level, text, past, draft, onDraft, onSave, onFeedback }: {
  kk: boolean;
  draft: Draft | null;
  onDraft: (d: Draft) => void;
  claimQ: { en: string; kk: string };
  level: string;
  text: string;
  past: Trail[];
  onSave: (t: Trail) => void;
  onFeedback: (f: string) => void;
}) {
  const tr = (k: string, e: string) => (kk ? k : e);
  const last = past[past.length - 1] ?? null;
  const early = level === "A1" || level === "A2";
  const sentences = splitSentences(text);
  // A finished trail opens on its summary; "update" starts a new revision.
  // A draft (closed half-way) resumes where it was left; evidence indexes past this text's end are dropped.
  const start = draft && (draft.choice || draft.claim) ? draft : null;
  const [step, setStepRaw] = useState<1 | 2 | 3 | 4>(start ? start.step : last ? 4 : 1);
  const [choice, setChoice] = useState<Choice | null>(start?.choice ?? null);
  const [claim, setClaim] = useState(start?.claim ?? "");
  const [evidence, setEvidence] = useState<number[]>((start?.evidence ?? []).filter((i) => i < sentences.length));
  const [dropped, setDropped] = useState<number | null>(null);
  const [wonder, setWonder] = useState(start?.wonder ?? "");
  const setStep = (n: 1 | 2 | 3 | 4) => setStepRaw(n);
  useEffect(() => {
    if (step !== 4) onDraft({ step, choice, claim, evidence, wonder });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, choice, claim, evidence, wonder]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");

  // Escape while choosing evidence steps back first; the next Escape closes the window.
  useEscape(step === 2 || step === 3, () => setStep(step === 3 ? 2 : 1));

  const label = (c: Choice | null) => (c === "yes" ? tr("Иә", "Yes") : c === "no" ? tr("Жоқ", "No") : c === "partly" ? tr("Ішінара", "Partly") : "");
  const claimCopied = copied(claim, text);
  const claimOk = !!choice && !claimCopied && (early ? true : words(claim) >= 3);
  const wonderOk = words(wonder) >= 2;

  const toggle = (i: number) => {
    setDropped(null);
    if (evidence.includes(i)) return setEvidence(evidence.filter((x) => x !== i));
    if (evidence.length < 2) return setEvidence([...evidence, i]);
    // Only two: the oldest pick gives way, with a short flash so it's noticed.
    setDropped(evidence[0]);
    setTimeout(() => setDropped(null), 600);
    setEvidence([evidence[1], i]);
  };

  const askShoqan = async (entry: Trail) => {
    setAsking(true);
    setAskError("");
    try {
      if (!navigator.onLine) throw new Error("offline");
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/shoqan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Claim–Support–Question practice on a tale. Question: "${claimQ.en}" My answer: ${label(entry.choice)}. ${entry.claim ? `My claim: "${entry.claim}". ` : ""}My evidence from the tale: ${entry.evidenceText.map((x) => `"${x}"`).join(" ")}. I still wonder: "${entry.wonder}". In 2–3 short sentences: say whether my evidence really supports my answer and why, then one thought about my question. Focus on the reasoning, not grammar.${kk ? " Answer in Kazakh, in Cyrillic script." : ""}`,
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok || typeof data?.reply !== "string") throw new Error(data?.error || "failed");
      onFeedback(data.reply.trim());
    } catch {
      setAskError(tr("Шоқан қазір жауап бере алмады. Желі қосылғанда қайта бас. Жазғаның сақталды.", "Shoqan couldn't answer just now. Try again when you're online. Your trail is saved."));
    }
    setAsking(false);
  };

  const save = () => {
    if (!choice || !evidence.length || !wonderOk) return;
    const ids = [...evidence].sort((a, b) => a - b);
    const entry: Trail = { level, choice, claim: claim.trim(), evidence: ids, evidenceText: ids.map((i) => sentences[i]), wonder: wonder.trim(), feedback: "", at: new Date().toISOString() };
    onSave(entry);
    setStep(4);
    askShoqan(entry);
  };

  const steps = [tr("Пікір", "Claim"), tr("Дәлел", "Support"), tr("Сұрақ", "Question")];

  return (
    <div className="p-6 pt-2">
      <p className="eyebrow text-[#0F6E4B] pr-12">{tr("Ой ізі", "Thinking trail")} · {level}</p>
      <h3 lang="en" className="font-display font-black text-[20px] text-ink leading-snug mt-1 pr-12">{claimQ.en}</h3>
      {kk && <p className="text-[14px] text-ink-2 mt-1">{claimQ.kk}</p>}

      {step >= 1 && step <= 3 && (
        <ol className="flex gap-1.5 mt-4" aria-label={tr("Қадамдар", "Steps")}>
          {steps.map((s, i) => (
            <li key={s} className={`flex-1 rounded-full h-7 text-[12px] font-bold flex items-center justify-center ${i + 1 === step ? "bg-[#15805A] text-white" : i + 1 < step ? "bg-jade-soft text-[#0F6E4B]" : "bg-sand-2 text-ink-2"}`} aria-current={i + 1 === step ? "step" : undefined}>
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      )}

      {step === 1 && (
        <div className="mt-4">
          {last && (
            <div className="rounded-2xl bg-sand-2 p-3.5 mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-ink-3 flex items-center gap-1.5"><History size={13} /> I used to think…</p>
              <p className="text-[15px] text-ink mt-1"><b>{label(last.choice)}.</b> {last.claim}</p>
              <p className="text-[13px] text-ink-2 mt-1">{tr("Енді ойың қандай? Now I think…", "What do you think now? Now I think…")}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {(["yes", "no", "partly"] as Choice[]).map((c) => (
              <button key={c} onClick={() => setChoice(c)} aria-pressed={choice === c} className={`tile min-h-12 font-bold text-[15px] ${choice === c ? "tile-selected" : "text-ink"}`}>
                {label(c)}
              </button>
            ))}
          </div>
          <label htmlFor="trail-claim" className="block text-[14px] font-semibold text-ink mt-5">
            {early ? tr("Бір сөйлеммен түсіндір (міндетті емес)", "Say why in one sentence (optional)") : tr("Пікіріңді ағылшынша жаз (кемінде 3 сөз)", "Write your claim in English (at least 3 words)")}
          </label>
          <textarea
            id="trail-claim"
            value={claim}
            onChange={(e) => setClaim(e.target.value.slice(0, 280))}
            onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 300)}
            rows={2}
            maxLength={280}
            placeholder={early ? "I think … because …" : "I think …"}
            className="mt-2 w-full rounded-2xl border-2 border-line bg-card p-3 text-[16px] text-ink focus:border-sky outline-none resize-none"
          />
          <p className="text-[13px] mt-1 min-h-[18px]" aria-live="polite">
            {claimCopied ? <span className="text-felt-deep font-semibold">{tr("Бұл ертегіден көшірілген сияқты. Өз сөзіңмен жаз.", "This looks copied from the tale. Use your own words.")}</span>
              : claim && mostlyNotEnglish(claim) ? <span className="text-sun-deep font-semibold">{tr("Ағылшынша байқап көр. Қазақша да қабылданады.", "Try it in English. Kazakh is accepted too.")}</span>
              : !early && choice && words(claim) < 3 ? <span className="text-ink-3">{tr("Тағы бірнеше сөз жаз.", "Add a few more words.")}</span>
              : null}
          </p>
          <button onClick={() => setStep(2)} disabled={!claimOk} className="btn w-full mt-3">{tr("Келесі", "Next")} <ArrowRight size={18} /></button>
          {!choice && <p className="text-[13px] text-ink-3 mt-2 text-center">{tr("Алдымен Иә, Жоқ не Ішінара таңда.", "Pick Yes, No or Partly first.")}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="mt-4">
          <p className="text-[15px] text-ink font-semibold">{tr("Дәлел болатын 1–2 сөйлемді түрт.", "Tap 1–2 sentences that prove it.")}</p>
          <p className="text-[13px] text-ink-2">{tr(`Сенің жауабың: ${label(choice)}`, `Your answer: ${label(choice)}`)}</p>
          <div className="mt-3 rounded-2xl border-2 border-line p-2 max-h-[46dvh] overflow-y-auto">
            {sentences.map((s, i) => {
              const on = evidence.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  aria-pressed={on}
                  className={`block w-full text-left rounded-xl px-2.5 py-2 text-[15px] leading-relaxed transition-colors duration-300 ${on ? "bg-sun-soft text-ink font-semibold" : dropped === i ? "bg-felt-soft text-ink" : "text-ink-2 hover:bg-sand-2"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <p className="text-[13px] text-ink-3 mt-2" aria-live="polite">
            {evidence.length ? tr(`${evidence.length}/2 сөйлем таңдалды`, `${evidence.length}/2 sentences chosen`) : tr("Әзірге сөйлем таңдалмады.", "No sentence chosen yet.")}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button onClick={() => setStep(1)} className="btn btn-ghost"><ArrowLeft size={18} /> {tr("Артқа", "Back")}</button>
            <button onClick={() => setStep(3)} disabled={!evidence.length} className="btn">{tr("Келесі", "Next")} <ArrowRight size={18} /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4">
          <label htmlFor="trail-wonder" className="block text-[15px] text-ink font-semibold">{tr("Әлі де нені білгің келеді?", "What do you still wonder?")}</label>
          <input
            id="trail-wonder"
            value={wonder}
            onChange={(e) => setWonder(e.target.value.slice(0, 160))}
            onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 300)}
            maxLength={160}
            placeholder="I still wonder why …"
            className="mt-2 w-full h-12 rounded-2xl border-2 border-line bg-card px-3 text-[16px] text-ink focus:border-sky outline-none"
          />
          {wonder && mostlyNotEnglish(wonder) && <p className="text-[13px] text-sun-deep font-semibold mt-1">{tr("Ағылшынша байқап көр.", "Try it in English.")}</p>}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button onClick={() => setStep(2)} className="btn btn-ghost"><ArrowLeft size={18} /> {tr("Артқа", "Back")}</button>
            <button onClick={save} disabled={!wonderOk} className="btn btn-jade">{tr("Сақтау", "Save")}</button>
          </div>
        </div>
      )}

      {step === 4 && last && (
        <div className="mt-4">
          {past.length > 1 && (
            <div className="rounded-2xl bg-sand-2 p-3.5 mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-ink-3">I used to think…</p>
              <p className="text-[15px] text-ink mt-1"><b>{label(past[past.length - 2].choice)}.</b> {past[past.length - 2].claim}</p>
            </div>
          )}
          <div className="rounded-2xl bg-jade-soft p-4">
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-jade-deep">{past.length > 1 ? "Now I think…" : tr("Сенің пікірің", "Your claim")}</p>
            <p className="text-[15px] text-ink mt-1"><b>{label(last.choice)}.</b> {last.claim}</p>
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-jade-deep mt-3">{tr("Дәлел", "Support")} ({last.level})</p>
            {(last.evidenceText ?? []).map((line, i) => <p key={i} className="text-[15px] text-ink mt-1 italic">«{line}»</p>)}
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-jade-deep mt-3">{tr("Сұрақ", "Question")}</p>
            <p className="text-[15px] text-ink mt-1">{last.wonder}</p>
          </div>
          <div className="flex gap-3 mt-4">
            <img src="/shoqan-avatar.jpg" alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="rounded-2xl rounded-tl-md bg-sky-soft p-4 flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-sky-deep flex items-center gap-1.5"><MessageCircle size={12} /> {tr("Шоқан", "Shoqan")}</p>
              {last.feedback ? (
                <>
                  <p className="text-[15px] text-ink mt-1 leading-relaxed whitespace-pre-line">{last.feedback}</p>
                  {!kk && <button onClick={() => safePlayVoice(last.feedback)} className="mt-2 h-8 px-3 rounded-full bg-card text-sky-deep text-sm font-bold inline-flex items-center gap-1.5"><Volume2 size={15} /> Listen</button>}
                </>
              ) : asking ? (
                <p className="text-[15px] text-ink-2 mt-1">{tr("Шоқан дәлеліңді оқып жатыр…", "Shoqan is reading your evidence…")}</p>
              ) : (
                <>
                  <p className="text-[14px] text-ink-2 mt-1">{askError || tr("Шоқан әлі пікір айтқан жоқ.", "Shoqan hasn't replied yet.")}</p>
                  <button onClick={() => askShoqan(last)} className="mt-2 h-8 px-3 rounded-full bg-card text-sky-deep text-sm font-bold">{tr("Шоқаннан сұрау", "Ask Shoqan")}</button>
                </>
              )}
            </div>
          </div>
          <button onClick={() => { setChoice(null); setClaim(""); setEvidence([]); setWonder(""); setStep(1); }} className="btn btn-ghost w-full mt-5">
            {tr("Пікірімді жаңарту", "Update my thinking")}
          </button>
        </div>
      )}
    </div>
  );
}
