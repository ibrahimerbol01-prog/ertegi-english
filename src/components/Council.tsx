import { useEffect, useRef, useState } from "react";
import { ChevronRight, Check, Lock, Users, Volume2, BookOpen } from "lucide-react";
import { STORIES } from "../constants";
import { COUNCIL, type CouncilQuestion } from "../data/council";
import { supabase } from "../lib/supabase";
import { safePlayVoice } from "../utils/voice";
import { displayTitle } from "../utils/text";
import { Sheet } from "./UIHelpers";

/* Steppe Council: vote, say how sure you are, read what others chose and why,
   then vote again (Peer Instruction). Classmates' votes come from Supabase
   once there are enough of them; until then Shoqan's reasons stand in. */

type Confidence = 0 | 1 | 2; // sure, about, don't know
interface Vote {
  first: number | null;
  confidence: Confidence | null;
  reason: string;
  second: number | null;
  done: boolean;
  xp: number;
}
const EMPTY: Vote = { first: null, confidence: null, reason: "", second: null, done: false, xp: 0 };
interface Stats { counts: number[]; total: number; reasons: { choice: number; reason: string }[] }

const key = (userId: string | undefined) => `ertegi_council_${userId || "guest"}`;
function loadAll(userId: string | undefined): Record<string, Vote> {
  try {
    const raw = JSON.parse(localStorage.getItem(key(userId)) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}
function saveVote(userId: string | undefined, id: string, vote: Vote) {
  const all = loadAll(userId);
  all[id] = vote;
  try { localStorage.setItem(key(userId), JSON.stringify(all)); } catch { /* storage full or blocked */ }
}

// Reasons others see go through a teacher first; this only keeps obvious junk out of the queue.
// \b ignores Cyrillic letters, so word edges are checked with Unicode letter classes.
const BLOCKED = /(?<!\p{L})(fuck|shit|bitch|idiot|stupid|дурак|тупой|сука|ахмақ|есек)(?!\p{L})/iu;
const cleanReason = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 140);

function pushVote(userId: string | undefined, q: CouncilQuestion, round: 1 | 2, choice: number, confidence: Confidence | null, reason: string) {
  if (!userId) return;
  supabase
    .from("council_votes")
    .upsert({
      user_id: userId, question_id: q.id, round, choice, confidence,
      reason: round === 1 && reason && !BLOCKED.test(reason) ? reason : null,
      // A changed reason goes back to the teacher; RLS also refuses approved = true from students.
      approved: false,
    }, { onConflict: "user_id,question_id,round" })
    .then(() => {}, () => {});
}

async function fetchStats(q: CouncilQuestion): Promise<Stats | null> {
  try {
    if (!navigator.onLine) return null;
    const { data, error } = await supabase.rpc("council_stats", { q: q.id });
    if (error || !data || typeof data.total !== "number") return null;
    return data as Stats;
  } catch {
    return null;
  }
}

const readTale = (storyId: string, progress: Set<string>) => ["A1", "A2", "B1", "B2", "C1", "quiz"].some((l) => progress.has(`${storyId}:${l}`));

export function CouncilCard({ lang, userId, progress = new Set<string>(), onReward = () => {} }: {
  lang: string;
  userId?: string;
  progress?: Set<string>;
  onReward?: (xp: number) => void;
}) {
  const kk = lang === "kk";
  const [votes, setVotes] = useState(() => loadAll(userId));
  const [openId, setOpenId] = useState<string | null>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const unlocked = COUNCIL.filter((q) => readTale(q.storyId, progress));
  // The next tale read but not yet discussed; otherwise the last one discussed.
  const next = unlocked.find((q) => !votes[q.id]?.done) ?? null;
  const shown = next ?? unlocked[unlocked.length - 1] ?? null;
  const doneCount = COUNCIL.filter((q) => votes[q.id]?.done).length;
  const story = shown ? STORIES.find((s: any) => s.id === shown.storyId) : null;
  const active = COUNCIL.find((q) => q.id === openId) ?? null;

  return (
    <>
      <button
        ref={cardRef}
        onClick={() => shown && setOpenId(shown.id)}
        disabled={!shown}
        aria-haspopup="dialog"
        className="card w-full text-left p-5 flex items-center gap-4 disabled:opacity-100"
      >
        <span className="w-12 h-12 rounded-2xl bg-sun-soft text-sun-deep flex items-center justify-center shrink-0">
          {shown ? <Users size={24} /> : <Lock size={20} />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="eyebrow text-sun-deep block">{kk ? "Дала кеңесі" : "Steppe council"} · {doneCount}/{COUNCIL.length}</span>
          <span className="font-display font-extrabold text-ink text-[16px] leading-snug block mt-0.5">
            {!shown
              ? (kk ? "Ертегінің бір деңгейін оқысаң, кеңес ашылады" : "Read one level of a tale to open the council")
              : next
                ? (kk ? next.promptKk : next.prompt)
                : (kk ? "Барлық ашық сұраққа жауап бердің" : "You've answered every open question")}
          </span>
          {story && next && <span className="text-sm text-ink-2 block mt-0.5 truncate">{displayTitle(story.title)}</span>}
          {shown && !next && unlocked.length < COUNCIL.length && (
            <span className="text-sm text-ink-2 block mt-0.5">{kk ? "Жаңа ертегі оқысаң, жаңа сұрақ ашылады." : "Read a new tale to open the next question."}</span>
          )}
        </span>
        {shown && (next ? <ChevronRight size={22} className="text-ink-3 shrink-0" /> : <Check size={22} strokeWidth={3} className="text-jade shrink-0" />)}
      </button>

      <Sheet open={!!active} onClose={() => { setOpenId(null); setTimeout(() => cardRef.current?.focus(), 0); }} label={kk ? "Дала кеңесі" : "Steppe council"}>
        {active && (
          <CouncilRound
            key={active.id}
            q={active}
            kk={kk}
            vote={votes[active.id] ?? EMPTY}
            onChange={(v) => { saveVote(userId, active.id, v); setVotes((all) => ({ ...all, [active.id]: v })); }}
            onPush={(round, choice, confidence, reason) => pushVote(userId, active, round, choice, confidence, reason)}
            onReward={onReward}
          />
        )}
      </Sheet>
    </>
  );
}

function CouncilRound({ q, kk, vote, onChange, onPush, onReward }: {
  q: CouncilQuestion;
  kk: boolean;
  vote: Vote;
  onChange: (v: Vote) => void;
  onPush: (round: 1 | 2, choice: number, confidence: Confidence | null, reason: string) => void;
  onReward: (xp: number) => void;
}) {
  const tr = (k: string, e: string) => (kk ? k : e);
  // Where to resume: a vote already cast picks up at the council, a finished one shows the result.
  const [stage, setStage] = useState<"vote" | "reread" | "council" | "result">(vote.done ? "result" : vote.first !== null ? "council" : "vote");
  const [pick, setPick] = useState<number | null>(vote.first);
  const [confidence, setConfidence] = useState<Confidence | null>(vote.confidence);
  const [reason, setReason] = useState(vote.reason);
  const [second, setSecond] = useState<number | null>(vote.second ?? vote.first);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stage === "council" && !stats) fetchStats(q).then(setStats);
  }, [stage, stats, q]);

  const enough = !!stats && stats.total >= 10;
  const share = (i: number) => (enough ? Math.round((stats!.counts[i] / stats!.total) * 100) : 0);

  const submitFirst = async () => {
    if (pick === null || confidence === null || loading) return;
    setLoading(true);
    const r = cleanReason(reason);
    onChange({ ...vote, first: pick, confidence, reason: r });
    onPush(1, pick, confidence, r);
    // Branch on how the class did (SERC): most right means explain, few right means re-read first.
    const s = await fetchStats(q);
    setStats(s);
    setLoading(false);
    if (s && s.total >= 10) {
      const right = s.counts[q.correct] / s.total;
      // Only a learner who was right skips the second round; no round-2 vote is recorded for them.
      if (right > 0.7 && pick === q.correct) return finish(pick, { ...vote, first: pick, confidence, reason: r }, false);
      if (right < 0.3) return setStage("reread");
    }
    setStage("council");
  };

  const finish = (final: number, base: Vote = vote, secondRound = true) => {
    const firstRight = base.first === q.correct;
    const finalRight = final === q.correct;
    const wroteReason = (base.reason.match(/[a-z]+/gi) ?? []).length >= 3;
    // Most for changing to the right answer with a reason; something for taking part.
    const xp = (finalRight ? 10 : 3) + (!firstRight && finalRight ? 5 : 0) + (wroteReason ? 3 : 0);
    const next = { ...base, second: final, done: true, xp: Math.max(base.xp, xp) };
    onChange(next);
    if (secondRound) onPush(2, final, null, "");
    if (!base.done) onReward(xp);
    setStage("result");
  };

  // Two reasons from options other than the learner's: classmates' when approved, Shoqan's until then.
  const others = (() => {
    const mine = vote.first ?? pick;
    const fromClass = (stats?.reasons ?? []).filter((r) => r.choice !== mine).slice(0, 2).map((r) => ({ ...r, ai: false }));
    if (fromClass.length >= 2) return fromClass;
    const order = [q.correct, ...q.options.map((_, i) => i).filter((i) => i !== q.correct)];
    const seeds = order.filter((i) => i !== mine).slice(0, 2 - fromClass.length).map((i) => ({ choice: i, reason: q.reasons[i], ai: true }));
    return [...fromClass, ...seeds];
  })();

  const options = (value: number | null, onPick: (i: number) => void) => (
    <div className="space-y-2.5 mt-4" role="radiogroup">
      {q.options.map((opt, i) => (
        <button
          key={i}
          role="radio"
          aria-checked={value === i}
          onClick={() => onPick(i)}
          className={`tile w-full min-h-12 text-left px-3.5 py-3 flex items-center gap-3 ${value === i ? "tile-selected" : "text-ink"}`}
        >
          <span className="w-7 h-7 rounded-lg border-2 border-current/25 flex items-center justify-center font-display font-black text-sm shrink-0 opacity-70">{String.fromCharCode(65 + i)}</span>
          <span className="flex-1 text-[15px] font-semibold">{opt}</span>
        </button>
      ))}
    </div>
  );

  const evidence = (
    <div className="mt-3 rounded-2xl bg-sun-soft p-4">
      <p className="text-xs font-bold uppercase tracking-[0.06em] text-sun-deep">{tr("Ертегіде (A2)", "In the tale (A2)")}</p>
      <p className="text-[15px] text-ink mt-1 leading-relaxed italic">{q.evidence}</p>
      <button onClick={() => safePlayVoice(q.evidence)} className="mt-2 h-8 px-3 rounded-full bg-card text-ink text-sm font-bold inline-flex items-center gap-1.5">
        <Volume2 size={15} /> {tr("Тыңдау", "Listen")}
      </button>
    </div>
  );

  const CONF = [
    { v: 0 as Confidence, kk: "🙂 Сенімдімін", en: "🙂 I'm sure" },
    { v: 1 as Confidence, kk: "😐 Шамамен", en: "😐 Maybe" },
    { v: 2 as Confidence, kk: "🤔 Білмеймін", en: "🤔 Not sure" },
  ];

  return (
    <div className="p-6 pt-2">
      <p className="eyebrow text-sun-deep pr-12">{tr("Дала кеңесі", "Steppe council")} · {displayTitle((STORIES.find((s: any) => s.id === q.storyId) as any)?.title ?? "")}</p>
      <h3 className="font-display font-black text-[20px] text-ink leading-snug mt-1 pr-12">{q.prompt}</h3>
      {kk && <p className="text-[14px] text-ink-2 mt-1">{q.promptKk}</p>}

      {stage === "vote" && (
        <>
          <p className="text-[14px] text-ink-2 mt-3">{tr("1-раунд: өзің ойлап, таңда. Уақыт шектеулі емес.", "Round 1: think for yourself and choose. No time limit.")}</p>
          {options(pick, setPick)}
          <p className="text-[14px] font-semibold text-ink mt-5">{tr("Қаншалықты сенімдісің?", "How sure are you?")}</p>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {CONF.map((c) => (
              <button key={c.v} onClick={() => setConfidence(c.v)} aria-pressed={confidence === c.v}
                className={`tile min-h-11 px-1 text-[13px] font-bold ${confidence === c.v ? "tile-selected" : "text-ink-2"}`}>
                {kk ? c.kk : c.en}
              </button>
            ))}
          </div>
          <label className="block text-[14px] font-semibold text-ink mt-5" htmlFor={`why-${q.id}`}>{tr("Неге? (міндетті емес)", "Why? (optional)")}</label>
          <input
            id={`why-${q.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 140))}
            onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 300)}
            maxLength={140}
            placeholder="because …"
            className="mt-2 w-full h-12 rounded-2xl border-2 border-line bg-card px-3 text-[16px] text-ink focus:border-sky outline-none"
          />
          <p className="text-[12px] text-ink-3 mt-1">{tr("Себеп жазсаң, +3 XP. Сыныптастарың оны мұғалім тексергеннен кейін ғана көреді.", "A reason earns +3 XP. Classmates only see it after a teacher checks it.")}</p>
          <button onClick={submitFirst} disabled={pick === null || confidence === null || loading} className="btn w-full mt-5">
            {loading ? tr("Сақталып жатыр…", "Saving…") : tr("Дауыс беру", "Vote")}
          </button>
          {(pick === null || confidence === null) && (
            <p className="text-[13px] text-ink-3 mt-2 text-center">{pick === null ? tr("Алдымен жауапты таңда.", "Choose an answer first.") : tr("Енді сенімділігіңді белгіле.", "Now say how sure you are.")}</p>
          )}
        </>
      )}

      {stage === "reread" && (
        <>
          <p className="text-[15px] text-ink mt-4 flex items-center gap-2 font-semibold"><BookOpen size={18} className="text-sun-deep" /> {tr("Бұл сұрақ көпшілікке қиын болды. Келесі дауыс алдында осы жерді қайта оқиық.", "Most of the class found this hard. Let's re-read this part before voting again.")}</p>
          {evidence}
          <button onClick={() => setStage("council")} className="btn w-full mt-5">{tr("Жалғастыру", "Continue")}</button>
        </>
      )}

      {stage === "council" && (
        <>
          <p className="text-[14px] text-ink-2 mt-3">
            {tr("Сенің дауысың: ", "Your vote: ")}<b className="text-ink">{String.fromCharCode(65 + (vote.first ?? 0))}</b>
            {" · "}{kk ? CONF[vote.confidence ?? 1].kk : CONF[vote.confidence ?? 1].en}
          </p>
          <div className="mt-4 rounded-2xl border-2 border-line p-4">
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-ink-3 flex items-center gap-1.5"><Users size={13} /> {tr("Сынып қалай дауыс берді", "How the class voted")}</p>
            {enough ? (
              <div className="space-y-2 mt-3">
                {q.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 font-display font-black text-sm text-ink-2 shrink-0">{String.fromCharCode(65 + i)}</span>
                    <div className="flex-1 h-6 rounded-lg bg-sand-2 overflow-hidden" role="img" aria-label={`${opt}: ${share(i)}%`}>
                      <div className={`h-full ${i === vote.first ? "bg-sky" : "bg-sand-3"}`} style={{ width: `${share(i)}%` }} />
                    </div>
                    <span className="w-10 text-right text-sm font-bold text-ink-2 tabular-nums shrink-0">{share(i)}%</span>
                  </div>
                ))}
                <p className="text-[12px] text-ink-3">{tr(`${stats!.total} дауыс`, `${stats!.total} votes`)}</p>
              </div>
            ) : (
              <p className="text-[14px] text-ink-2 mt-2">{tr("Әзірге дауыс аз. Сыныптастарың қосылғанда, мұнда олардың таңдауы шығады.", "Few votes yet. When classmates join, their choices will show here.")}</p>
            )}
          </div>
          <p className="text-[14px] font-semibold text-ink mt-5">{tr("Басқаша ойлайтындар былай дейді:", "People who chose differently say:")}</p>
          <div className="space-y-2.5 mt-2">
            {others.map((r, i) => (
              <div key={i} className="rounded-2xl bg-sand-2 p-3.5">
                <p className="text-xs font-bold text-ink-3">
                  {String.fromCharCode(65 + r.choice)} · {r.ai ? tr("🤖 Шоқанның мысалы", "🤖 Shoqan's example") : tr("сыныптасың", "a classmate")}
                </p>
                <p className="text-[15px] text-ink mt-1 leading-relaxed">{r.reason}</p>
              </div>
            ))}
          </div>
          <p className="text-[14px] text-ink-2 mt-5">{tr("2-раунд: ойлан да, қайта таңда. Пікіріңді өзгертуге де, сақтауға да болады.", "Round 2: think again and choose. You can change your answer or keep it.")}</p>
          {options(second, setSecond)}
          <button onClick={() => second !== null && finish(second)} disabled={second === null} className="btn w-full mt-5">{tr("Соңғы жауап", "Final answer")}</button>
        </>
      )}

      {stage === "result" && (() => {
        const final = vote.second ?? vote.first ?? 0;
        const right = final === q.correct;
        const changed = vote.first !== null && vote.first !== final;
        const sureButWrong = vote.confidence === 0 && vote.first !== q.correct;
        return (
          <>
            <div className={`mt-4 rounded-[24px] p-5 ${right ? "bg-jade-soft" : "bg-felt-soft"}`}>
              <p className={`font-display font-black text-xl ${right ? "text-jade-deep" : "text-felt-deep"}`}>
                {right ? (changed ? tr("Ойыңды дұрыс жаққа өзгерттің!", "You changed to the right answer!") : tr("Дұрыс!", "Right!")) : tr("Дұрыс жауап басқа", "The right answer is different")}
              </p>
              <p className="text-[15px] text-ink mt-1"><b>{String.fromCharCode(65 + q.correct)}.</b> {q.options[q.correct]}</p>
              <p className="text-sm text-ink-2 mt-1.5">
                {tr("1-раунд", "Round 1")}: {String.fromCharCode(65 + (vote.first ?? 0))} · {tr("2-раунд", "Round 2")}: {String.fromCharCode(65 + final)} · <b>+{vote.xp} XP</b>
              </p>
              {sureButWrong && (
                <p className="text-sm text-felt-deep font-semibold mt-1.5">{tr("Сенімді болдың, бірақ алғашқы жауап қате еді. Мұндай сұрақтарды мұқият оқы.", "You were sure, but your first answer was wrong. Read questions like this carefully.")}</p>
              )}
            </div>
            {evidence}
            {vote.reason && (
              <p className="text-[14px] text-ink-2 mt-3">{tr("Сенің себебің:", "Your reason:")} <span className="text-ink">«{vote.reason}»</span></p>
            )}
          </>
        );
      })()}
    </div>
  );
}
