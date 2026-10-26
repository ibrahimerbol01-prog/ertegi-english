import { useEffect, useRef, useState } from "react";
import { ChevronRight, MessageCircle, Volume2, Check, WifiOff, Pencil } from "lucide-react";
import { STORIES } from "../constants";
import { currentWeek, wordsUsed, type Dilemma, type Week } from "../data/weekWords";
import { supabase } from "../lib/supabase";
import { safePlayVoice } from "../utils/voice";
import { Sheet } from "./UIHelpers";

/* Words of the week and a daily debate (Word Generation): use the week's
   words in an argument, hear Shoqan disagree, answer him, then decide again. */

type Side = "yes" | "no";
interface Entry {
  side: Side | null;
  text: string;
  objection: string;
  objectionKk: string;
  // The objection came from the prepared set because Shoqan couldn't be reached.
  offline: boolean;
  reply: string;
  finalSide: Side | null;
  submitted: boolean;
  xpGiven: number;
}
const EMPTY: Entry = { side: null, text: "", objection: "", objectionKk: "", offline: false, reply: "", finalSide: null, submitted: false, xpGiven: 0 };

// One answer per day. Monday's key is the week start, so answers saved before daily questions carry over.
const storeKey = (userId: string | undefined, day: string) => `ertegi_debate_${userId || "guest"}_${day}`;
function loadEntry(userId: string | undefined, week: string): Entry {
  try {
    const raw = JSON.parse(localStorage.getItem(storeKey(userId, week)) || "null");
    return raw && typeof raw === "object" ? { ...EMPTY, ...raw } : EMPTY;
  } catch {
    return EMPTY;
  }
}
function saveEntry(userId: string | undefined, week: string, entry: Entry) {
  try { localStorage.setItem(storeKey(userId, week), JSON.stringify(entry)); } catch { /* storage full or blocked */ }
}

// Synced to Supabase when the debate_entries table exists; local storage keeps working without it.
// The week_start column holds the day of the answer now that there is a question a day.
function syncEntry(userId: string | undefined, week: Week, day: string, entry: Entry) {
  if (!userId) return;
  supabase
    .from("debate_entries")
    .upsert({
      user_id: userId, week_start: day, side: entry.finalSide ?? entry.side, text: entry.text, reply_text: entry.reply,
      words_used: wordsUsed(week, `${entry.text} ${entry.reply}`), updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,week_start" })
    .then(() => {}, () => {});
}

// Tales the learner has read (any level) that use each word: the dots under the chips.
function encounters(week: Week, progress: Set<string>) {
  const counts = new Map<string, number>();
  for (const ww of week.words) {
    const tales = STORIES.filter((s: any) =>
      Object.entries(s.levels).some(([lvl, text]) => progress.has(`${s.id}:${lvl}`) && wordsUsed({ ...week, words: [ww] }, text as string).length)
    );
    counts.set(ww.word, tales.length);
  }
  return counts;
}

const latin = (s: string) => (s.match(/[a-z]/gi) ?? []).length;
const cyrillic = (s: string) => (s.match(/[а-яәіңғүұқөһё]/gi) ?? []).length;
const mostlyNotEnglish = (s: string) => cyrillic(s) > latin(s);
const hasWords = (s: string) => /[\p{L}]{2,}/u.test(s);

// Eight words in a row from a tale: copied, not argued.
const TALE_RUNS = (() => {
  const runs = new Set<string>();
  for (const s of STORIES as any[]) for (const text of Object.values(s.levels) as string[]) {
    const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
    for (let i = 0; i + 8 <= words.length; i++) runs.add(words.slice(i, i + 8).join(" "));
  }
  return runs;
})();
function copiedFromTale(s: string) {
  const words = s.toLowerCase().match(/[a-z']+/g) ?? [];
  for (let i = 0; i + 8 <= words.length; i++) if (TALE_RUNS.has(words.slice(i, i + 8).join(" "))) return true;
  return false;
}

type CardProps = {
  lang: string;
  userId?: string;
  progress?: Set<string>;
  onReward?: (xp: number) => void;
};

// A new day starts from a fresh card, even if the app stayed open past midnight.
export function WeekWordsCard(props: CardProps) {
  return <DailyCard key={currentWeek().dayKey} {...props} />;
}

const DAY_LETTERS = { kk: ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"], en: ["M", "T", "W", "T", "F", "S", "S"] };

function DailyCard({ lang, userId, progress = new Set<string>(), onReward = () => {} }: CardProps) {
  const kk = lang === "kk";
  const { week, startKey, weekday, dayKey, dilemma } = currentWeek();
  const seen = encounters(week, progress);
  const [entry, setEntry] = useState<Entry>(() => loadEntry(userId, dayKey));
  // Days of this week already argued: the dots on the card.
  const done = Array.from({ length: 7 }, (_, i) => {
    if (i === weekday) return entry.submitted;
    if (i > weekday) return false;
    const [y, m, d] = startKey.split("-").map(Number);
    const day = new Date(y, m - 1, d + i);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return loadEntry(userId, key).submitted;
  });
  const [showDebate, setShowDebate] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setShowDebate(false);
    // Back to where the learner was.
    setTimeout(() => cardRef.current?.focus(), 0);
  };

  return (
    <>
      <button ref={cardRef} onClick={() => setShowDebate(true)} className="card w-full text-left p-5" aria-haspopup="dialog">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="eyebrow text-sky-deep">{kk ? "Апта сөздері" : "Words of the week"} · {kk ? week.theme.kk : week.theme.en}</p>
            <p className="font-display font-extrabold text-ink text-[17px] mt-0.5">
              {entry.submitted
                ? (kk ? "Бүгінгі жауабың сақталды" : "Today's answer is saved")
                : (kk ? "Бүгінгі пікірталас" : "Today's debate")}
            </p>
            <p className="text-[14px] text-ink-2 mt-0.5 leading-snug line-clamp-2">{kk ? dilemma.kk : dilemma.en}</p>
          </div>
          {entry.submitted ? <Check size={22} strokeWidth={3} className="text-jade shrink-0 mt-1" /> : <ChevronRight size={22} className="text-ink-3 shrink-0 mt-1" />}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {week.words.map((ww) => {
            const n = Math.min(seen.get(ww.word) ?? 0, 3);
            return (
              <span key={ww.word} className="chip h-auto py-1.5 px-3 flex-col items-start gap-0.5 text-ink">
                <span className="font-bold text-[15px] leading-none">{ww.word}</span>
                <span className="flex gap-0.5" aria-label={kk ? `${n} ертегіде кездесті` : `met in ${n} tales`}>
                  {[0, 1, 2].map((i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < n ? "bg-jade" : "bg-sand-3"}`} />)}
                </span>
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 mt-3" aria-label={kk ? `Осы аптада ${done.filter(Boolean).length}/7 пікірталас` : `${done.filter(Boolean).length}/7 debates this week`}>
          {DAY_LETTERS[kk ? "kk" : "en"].map((d, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`h-7 min-w-7 px-1 rounded-full grid place-items-center text-[11px] font-bold ${done[i] ? "bg-jade text-white" : i === weekday ? "border-2 border-sky text-sky-deep" : "bg-sand-2 text-ink-3"}`}
            >
              {done[i] ? <Check size={13} strokeWidth={3.5} /> : d}
            </span>
          ))}
        </div>
        <p className="text-[12px] font-semibold text-ink-3 mt-1.5">{kk ? "Күн сайын жаңа сұрақ" : "A new question every day"}</p>
      </button>

      <Sheet open={showDebate} onClose={close} label={kk ? "Апта сөздері" : "Words of the week"}>
        <Debate
          key={dayKey}
          dilemma={dilemma}
          kk={kk}
          week={week}
          entry={entry}
          onChange={(next) => { setEntry(next); saveEntry(userId, dayKey, next); }}
          onSubmit={(next) => syncEntry(userId, week, dayKey, next)}
          onReward={onReward}
          seen={seen}
        />
      </Sheet>
    </>
  );
}

function Debate({ kk, week, dilemma, entry, onChange, onSubmit, onReward, seen }: {
  kk: boolean;
  week: Week;
  dilemma: Dilemma;
  entry: Entry;
  onChange: (e: Entry) => void;
  onSubmit: (e: Entry) => void;
  onReward: (xp: number) => void;
  seen: Map<string, number>;
}) {
  // Steps: 1 side, 2 argument, 3 Shoqan's objection and the reply, 4 summary.
  const [step, setStep] = useState(entry.submitted ? 4 : entry.objection ? 3 : entry.side ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const tr = (k: string, e: string) => (kk ? k : e);
  const set = (patch: Partial<Entry>) => onChange({ ...entry, ...patch });

  const used = wordsUsed(week, entry.text);
  const notEnglish = hasWords(entry.text) && mostlyNotEnglish(entry.text);
  const copied = copiedFromTale(entry.text);
  const missing = Math.max(0, 2 - used.length);
  const canSend = hasWords(entry.text) && !copied && (missing === 0 || notEnglish) && !loading;
  const replyNotEnglish = hasWords(entry.reply) && mostlyNotEnglish(entry.reply);
  const allUsed = wordsUsed(week, `${entry.text} ${entry.reply}`);

  useEffect(() => {
    if (step === 2) textRef.current?.focus();
  }, [step]);

  const askShoqan = async (side: Side, text: string) => {
    setLoading(true);
    const fallback = dilemma.counter[side];
    let objection = fallback.en;
    let objectionKk = fallback.kk;
    let offline = true;
    try {
      if (!navigator.onLine) throw new Error("offline");
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/shoqan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Debate practice for an English learner (A2–B1). The question: "${dilemma.en}" The learner answered "${side === "yes" ? "Yes" : "No"}" and wrote: "${text}". Take the other side and disagree politely in two short, simple English sentences, using one of these words: ${week.words.map((x) => x.word).join(", ")}. End with a question. Then on a new line write the Kazakh translation in Cyrillic, starting with "KK:". Don't correct grammar.`,
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok || typeof data?.reply !== "string") throw new Error(data?.error || "failed");
      const [en, kkPart] = data.reply.split(/\n?\s*KK:\s*/);
      if (en.trim()) {
        objection = en.trim();
        objectionKk = (kkPart || "").trim();
        offline = false;
      }
    } catch {
      // The prepared counter-argument keeps the debate going offline or over the daily limit.
    }
    setLoading(false);
    set({ objection, objectionKk, offline });
    setStep(3);
  };

  const finish = (finalSide: Side) => {
    const words = wordsUsed(week, `${entry.text} ${entry.reply}`).length;
    // XP for the words used and for answering Shoqan, never for speed; partial for an answer not in English.
    const earned = notEnglish ? 5 : words * 3 + (entry.reply.trim() ? 5 : 0);
    const extra = Math.max(0, earned - entry.xpGiven);
    const next = { ...entry, finalSide, submitted: true, xpGiven: Math.max(entry.xpGiven, earned) };
    onChange(next);
    onSubmit(next);
    if (extra) onReward(extra);
    setStep(4);
  };

  const sideLabel = (s: Side | null) => (s === "yes" ? tr("Иә", "Yes") : s === "no" ? tr("Жоқ", "No") : "");

  return (
    <div className="p-6 pt-2">
      {/* Right padding keeps the title and Listen clear of the sheet's close button. */}
      <p className="eyebrow text-sky-deep pr-12">{tr("Бүгінгі пікірталас · апта сөздері", "Today's debate · words of the week")}</p>
      <div className="flex items-start gap-2 mt-1 pr-12">
        <h3 className="font-display font-black text-[20px] text-ink leading-snug flex-1">{dilemma.en}</h3>
        <button onClick={() => safePlayVoice(dilemma.en)} aria-label={tr("Тыңдау", "Listen")} className="w-11 h-11 rounded-full bg-sky-soft text-sky flex items-center justify-center shrink-0">
          <Volume2 size={20} />
        </button>
      </div>
      {kk && <p className="text-[14px] text-ink-2 mt-1 leading-relaxed">{dilemma.kk}</p>}

      {step === 1 && (
        <div className="mt-5">
          <p className="text-[15px] text-ink-2 mb-3">{tr("Сенің ойың қандай?", "What do you think?")}</p>
          <div className="grid gap-3">
            {(["yes", "no"] as Side[]).map((s) => (
              <button key={s} onClick={() => { set({ side: s }); setStep(2); }} className={`btn w-full ${s === "yes" ? "btn-jade" : "btn-felt"}`}>
                {sideLabel(s)}
              </button>
            ))}
          </div>
          <WordList kk={kk} week={week} seen={seen} />
        </div>
      )}

      {step === 2 && (
        <div className="mt-5">
          <p className="text-[15px] text-ink-2">
            {tr(`Сен: ${sideLabel(entry.side)}. Себебін 1–3 сөйлеммен ағылшынша жаз, апта сөздерінің кемінде екеуін қолдан.`,
              `You said ${sideLabel(entry.side)}. Explain why in 1–3 English sentences, using at least two words of the week.`)}
            {" "}<button onClick={() => setStep(1)} className="text-sky-deep font-bold underline underline-offset-2">{tr("Ойымды өзгерту", "Change my side")}</button>
          </p>
          <div className="flex flex-wrap gap-2 mt-3" aria-label={tr("Апта сөздері", "Words of the week")}>
            {week.words.map((ww) => {
              const on = used.includes(ww.word);
              return (
                <span key={ww.word} className={`chip h-8 text-[14px] font-bold ${on ? "bg-jade-soft text-jade-deep border-jade" : "text-ink-2"}`}>
                  {on && <Check size={14} strokeWidth={3} />} {ww.word}
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["I think … because …", "In the tale, …", "I agree, because …", "I disagree, because …"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  const add = s.replace(/ …$/, " ").replace(/ … /, " ");
                  set({ text: entry.text.trim() ? `${entry.text.trim()} ${add}` : add });
                  textRef.current?.focus();
                }}
                className="h-8 px-3 rounded-full bg-sand-2 text-ink text-[13px] font-semibold"
              >
                {s}
              </button>
            ))}
          </div>
          <textarea
            ref={textRef}
            value={entry.text}
            onChange={(e) => set({ text: e.target.value.slice(0, 400) })}
            onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 300)}
            rows={4}
            maxLength={400}
            placeholder="I think … because …"
            aria-label={tr("Сенің дәлелің", "Your argument")}
            className="mt-3 w-full rounded-2xl border-2 border-line bg-card p-3 text-[16px] text-ink focus:border-sky outline-none resize-none"
          />
          <p className="text-[13px] mt-1.5 min-h-[20px]" aria-live="polite">
            {copied ? (
              <span className="text-felt-deep font-semibold">{tr("Бұл ертегіден көшірілген сияқты. Өз сөзіңмен жаз.", "This looks copied from the tale. Write it in your own words.")}</span>
            ) : notEnglish ? (
              <span className="text-sun-deep font-semibold">{tr("Ағылшынша жазып көр. Қазір жіберсең де болады, бірақ XP аз болады.", "Try it in English. You can still send it, for fewer XP.")}</span>
            ) : missing > 0 && hasWords(entry.text) ? (
              <span className="text-ink-2">{tr(`Тағы ${missing} апта сөзін қолдан.`, `Use ${missing} more word${missing > 1 ? "s" : ""} of the week.`)}</span>
            ) : used.length >= 2 ? (
              <span className="text-jade-deep font-semibold">{tr(`${used.length}/5 сөз қолданылды`, `${used.length}/5 words used`)}</span>
            ) : null}
          </p>
          <button onClick={() => entry.side && askShoqan(entry.side, entry.text.trim())} disabled={!canSend} className="btn w-full mt-3">
            {loading ? tr("Шоқан ойланып жатыр…", "Shoqan is thinking…") : tr("Жіберу", "Send")}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-5">
          <div className="rounded-2xl bg-sand-2 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-ink-3">{tr("Сенің дәлелің", "Your argument")} · {sideLabel(entry.side)}</p>
            <p className="text-[15px] text-ink mt-1 leading-relaxed">{entry.text}</p>
          </div>
          <div className="flex gap-3 mt-4">
            <img src="/shoqan-avatar.jpg" alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="rounded-2xl rounded-tl-md bg-sky-soft p-4 flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-sky-deep flex items-center gap-1.5">
                {tr("Шоқан қарсы", "Shoqan disagrees")}
                {entry.offline && <span className="inline-flex items-center gap-1 normal-case tracking-normal font-semibold text-ink-3"><WifiOff size={12} /> {tr("дайын пікір", "prepared reply")}</span>}
              </p>
              <p className="text-[16px] text-ink mt-1 leading-relaxed">{entry.objection}</p>
              {kk && entry.objectionKk && <p className="text-[14px] text-ink-2 mt-1.5 leading-relaxed">{entry.objectionKk}</p>}
              <button onClick={() => safePlayVoice(entry.objection)} className="mt-2 h-8 px-3 rounded-full bg-card text-sky-deep text-sm font-bold inline-flex items-center gap-1.5">
                <Volume2 size={15} /> {tr("Тыңдау", "Listen")}
              </button>
            </div>
          </div>
          <p className="text-[15px] text-ink-2 mt-5">{tr("Шоқанға бір сөйлеммен жауап бер:", "Answer Shoqan in one sentence:")}</p>
          <textarea
            value={entry.reply}
            onChange={(e) => set({ reply: e.target.value.slice(0, 240) })}
            onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 300)}
            rows={2}
            maxLength={240}
            placeholder="But …"
            aria-label={tr("Шоқанға жауап", "Your reply to Shoqan")}
            className="mt-2 w-full rounded-2xl border-2 border-line bg-card p-3 text-[16px] text-ink focus:border-sky outline-none resize-none"
          />
          {replyNotEnglish && <p className="text-[13px] text-sun-deep font-semibold mt-1">{tr("Ағылшынша жазып көр.", "Try it in English.")}</p>}
          <p className="text-[15px] text-ink-2 mt-4">{tr("Енді ойың қандай?", "So, what do you think now?")}</p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {(["yes", "no"] as Side[]).map((s) => (
              <button key={s} onClick={() => finish(s)} disabled={!hasWords(entry.reply)} className={`btn ${s === "yes" ? "btn-jade" : "btn-felt"}`}>
                {sideLabel(s)}
              </button>
            ))}
          </div>
          {!hasWords(entry.reply) && <p className="text-[13px] text-ink-3 mt-2 text-center">{tr("Алдымен Шоқанға жауап жаз.", "Write your reply to Shoqan first.")}</p>}
        </div>
      )}

      {step === 4 && (
        <div className="mt-5">
          <div className="rounded-[24px] bg-jade-soft p-5">
            <p className="font-display font-black text-xl text-jade-deep">{tr("Пікірталас аяқталды", "Debate done")}</p>
            <p className="text-[15px] text-ink mt-1">
              {tr(`Апта сөздерінің ${allUsed.length}/5 қолдандың.`, `You used ${allUsed.length}/5 words of the week.`)}
              {" "}
              {entry.finalSide && entry.side && entry.finalSide !== entry.side
                ? tr("Ойың өзгерді: бұл да ойлаудың белгісі.", "You changed your mind, which is part of thinking too.")
                : tr(`Соңғы шешімің: ${sideLabel(entry.finalSide)}.`, `Your final answer: ${sideLabel(entry.finalSide)}.`)}
            </p>
            <p className="text-sm font-bold text-ink-2 mt-1">+{entry.xpGiven} XP</p>
          </div>
          <div className="rounded-2xl bg-sand-2 p-4 mt-4 space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-ink-3">{tr("Сенің дәлелің", "Your argument")} · {sideLabel(entry.side)}</p>
              <p className="text-[15px] text-ink mt-1 leading-relaxed">{entry.text}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-sky-deep flex items-center gap-1"><MessageCircle size={12} /> {tr("Шоқан", "Shoqan")}</p>
              <p className="text-[15px] text-ink mt-1 leading-relaxed">{entry.objection}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-ink-3">{tr("Сенің жауабың", "Your reply")}</p>
              <p className="text-[15px] text-ink mt-1 leading-relaxed">{entry.reply}</p>
            </div>
          </div>
          {/* Tomorrow brings a new question, so today's answer stays editable until midnight. */}
          <button onClick={() => { onChange({ ...entry, objection: "", objectionKk: "", reply: "", finalSide: null, submitted: false }); setStep(2); }} className="btn btn-ghost w-full mt-4">
            <Pencil size={16} /> {tr("Бүгін түн ортасына дейін өзгертуге болады", "You can change it until midnight")}
          </button>
        </div>
      )}
    </div>
  );
}

function WordList({ kk, week, seen }: { kk: boolean; week: Week; seen: Map<string, number> }) {
  return (
    <ul className="mt-5 divide-y-2 divide-line rounded-2xl border-2 border-line overflow-hidden">
      {week.words.map((ww) => (
        <li key={ww.word} className="flex items-center gap-3 px-3 py-2.5 bg-card">
          <button onClick={() => safePlayVoice(ww.word)} aria-label={`${kk ? "Тыңдау" : "Listen"}: ${ww.word}`} className="w-9 h-9 rounded-full bg-sky-soft text-sky flex items-center justify-center shrink-0">
            <Volume2 size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink text-[15px]">{ww.word} <span className="font-semibold text-ink-2">· {ww.kk}</span></p>
            <p className="text-[13px] text-ink-3">{ww.family}</p>
          </div>
          <span className="text-[12px] font-semibold text-ink-3 shrink-0">{kk ? `${seen.get(ww.word) ?? 0} ертегіде кездесті` : `met in ${seen.get(ww.word) ?? 0}`}</span>
        </li>
      ))}
    </ul>
  );
}
