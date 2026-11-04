/* Learning parameters: the one place for every number that shapes how
   Ertegi teaches (review gaps, pass marks, branching thresholds, word counts,
   XP, limits, playback speeds).

   Rule: a new pedagogical number goes here, never inline in a component.
   Each value has a matching entry in ./params.meta.ts (source, evidence
   strength, section of docs/research-evidence.md); params.test.ts fails if
   one is missing or out of sync. This file holds values only, so the app
   bundle gets the numbers and nothing else. Evidence strength refers to the
   study, not to our feature (docs/research-evidence.md, section 2). */

/* ---------- 3.4 Spaced review (Leitner boxes) ---------- */

/** Days until the next review for each Leitner box 0..6; box 0 is a new word.
 *  Source: Cepeda, Vul, Rohrer, Wixted & Pashler 2008 (strong); the sequence
 *  1, 3, 7, 16, 35, 90 is the report's recommendation. docs §3.4. */
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35, 90] as const;

/** Boxes a forgotten word drops ("Әлі жоқ"): one, not back to the start.
 *  Source: report recommendation (design decision). docs §3.4. */
export const LAPSE_BOX_DROP = 1;

/** Days until a forgotten word comes back. Design decision. docs §3.4. */
export const LAPSE_RETRY_DAYS = 1;

/** XP for "Білдім" in flashcard review. Design decision. docs §3.4. */
export const REVIEW_KNOWN_XP = 2;

/** XP for each matched pair in "Жұбын тап". Recognition only, so it does
 *  not move the review date. Design decision. docs §3.4. */
export const MATCH_XP = 4;

/** XP for saving a new word from the reader. Design decision. */
export const SAVE_WORD_XP = 5;

/* ---------- 3.5 Quiz: no timer, second try with the line from the tale ---------- */

/** Share of right answers that passes a quiz: Math.ceil(total × 0.6), i.e.
 *  5 of 7 and 3 of 4. Kept from before the report; no study behind 60 %
 *  (task I1 plans to drop it). Design decision. docs §3.5. */
export const QUIZ_PASS_SHARE = 0.6;

/** The same pass mark in percent, for teacher reports (score < 60 % is "low").
 *  Must equal QUIZ_PASS_SHARE × 100. Design decision. docs §3.5. */
export const QUIZ_PASS_PERCENT = 60;

/** Tries per quiz question before the answer, the line from the tale and the
 *  "Неге? Шоқаннан сұра" button are shown. Source: Wisniewski, Zierer &
 *  Hattie 2020 (corrective feedback over punishment, strong); Bastani et al.
 *  2025 (Shoqan only after the learner's own attempts). docs §3.5, §3.8. */
export const QUIZ_MAX_TRIES = 2;

/** XP for a right answer on the first try. No speed bonus (Wang & Tahir
 *  2020); the amount itself is a design decision. docs §3.5. */
export const QUIZ_XP_FIRST_TRY = 10;

/** XP for a right answer on the second try, after the hint. docs §3.5. */
export const QUIZ_XP_SECOND_TRY = 5;

/** Questions in the short level check built from one level's text
 *  (buildLevelQuiz). Design decision. docs §3.5. */
export const LEVEL_QUIZ_QUESTIONS = 4;

/* ---------- 3.2 Steppe council (Peer Instruction) ---------- */

/** Share of right first votes below which the learner re-reads the key line
 *  before the council. Mazur's 30–70 % rule (Crouch & Mazur 2001); SERC uses
 *  35 %, we keep 30 % from the report. docs §3.2. */
export const COUNCIL_LOW_SHARE = 0.3;

/** Share of right first votes above which a learner who was right skips the
 *  second round. Crouch & Mazur 2001; SERC. docs §3.2. */
export const COUNCIL_HIGH_SHARE = 0.7;

/** Votes needed before the class distribution is shown and branching starts.
 *  The server uses the same number to switch council_stats() to the
 *  learner's own class (migration 20261107000000, checked by params.test.ts).
 *  From the report's UI spec ("fewer than 10 votes"). Design decision. docs §3.2. */
export const COUNCIL_MIN_VOTES = 10;

/** Longest reason a learner can write in round 1. Design decision. docs §3.2. */
export const COUNCIL_REASON_MAX_CHARS = 140;

/** English words a reason needs to earn the reason XP. Design decision. docs §3.2. */
export const COUNCIL_REASON_MIN_WORDS = 3;

/** XP for a right final answer. Design decision. docs §3.2. */
export const COUNCIL_XP_RIGHT = 10;
/** XP for taking part with a wrong final answer. Design decision. docs §3.2. */
export const COUNCIL_XP_TAKING_PART = 3;
/** Extra XP for changing from a wrong to the right answer between rounds:
 *  the key Peer Instruction outcome (report). Design decision. docs §3.2. */
export const COUNCIL_XP_CHANGED_TO_RIGHT = 5;
/** Extra XP for writing a reason. Design decision. docs §3.2. */
export const COUNCIL_XP_REASON = 3;

/* ---------- 3.1 Words of the week (Word Generation) ---------- */

/** Words in each week of src/data/weekWords.ts. Word Generation (Snow, HGSE
 *  & SERP; CCDD RCT) uses five words a week. docs §3.1. */
export const WEEK_WORDS_PER_WEEK = 5;

/** Words of the week a debate argument must use before it can be sent.
 *  From the report's UI spec. Design decision. docs §3.1. */
export const DEBATE_MIN_WEEK_WORDS = 2;

/** Longest debate argument, in characters. Design decision. docs §3.1. */
export const DEBATE_MAX_CHARS = 400;

/** XP for each word of the week used in the argument and the reply. docs §3.1. */
export const DEBATE_XP_PER_WORD = 3;
/** XP for answering Shoqan's objection. docs §3.1. */
export const DEBATE_XP_REPLY = 5;
/** XP for an answer that is mostly not in English. docs §3.1. */
export const DEBATE_XP_NOT_ENGLISH = 5;

/** Words in a row taken from a tale that count as copying (debate and
 *  thinking trail). Design decision. docs §3.1, §3.3. */
export const COPY_RUN_WORDS = 8;

/* ---------- 3.3 Thinking trail (Project Zero) ---------- */

/** Sentences of the tale a learner can tap as evidence. Tapping instead of
 *  writing answers Dajani 2016 (not enough English to say it). docs §3.3. */
export const TRAIL_MAX_EVIDENCE = 2;
/** Words a claim needs from B1 up (optional on A1–A2). Design decision. docs §3.3. */
export const TRAIL_CLAIM_MIN_WORDS = 3;
/** Words the "I still wonder…" line needs. Design decision. docs §3.3. */
export const TRAIL_WONDER_MIN_WORDS = 2;
/** XP for the first entry on a tale. Design decision. docs §3.3. */
export const TRAIL_XP_FIRST = 11;
/** XP for a revision ("Now I think…"). Design decision. docs §3.3. */
export const TRAIL_XP_REVISION = 5;

/* ---------- 3.6 Five words of the day ---------- */

/** New words a day at the learner's own level. Design decision (no source
 *  in the report). docs §3.6. */
export const DAILY_WORDS_AT_LEVEL = 3;
/** New words a day from the next level. Design decision. docs §3.6. */
export const DAILY_WORDS_STRETCH = 2;
/** Share of a level's words that counts as reaching that level. Design decision. docs §3.6. */
export const LEVEL_TARGET_SHARE = 0.6;
/** Cap on that target, in words. Design decision. docs §3.6. */
export const LEVEL_TARGET_MAX_WORDS = 25;
/** Leitner box from which a saved word counts as mastered. Design decision. docs §3.6. */
export const WORD_MASTERED_BOX = 2;
/** XP for "Білемін" on a word of the day. Design decision. docs §3.6. */
export const WORD_OF_DAY_XP = 2;

/* ---------- 3.8 Shoqan ---------- */

/** Chat requests per learner per UTC day. The server enforces it in
 *  api/shoqan.js (DAILY_LIMIT.chat); here it is only shown to the learner, and
 *  params.test.ts checks both stay equal. Cost decision, not research. docs §3.8. */
export const SHOQAN_DAILY_CHAT_LIMIT = 10;
/** Lesson requests (kind "tool": debate, thinking trail) per learner per UTC
 *  day; server value in api/shoqan.js (DAILY_LIMIT.tool). docs §3.8. */
export const SHOQAN_DAILY_TOOL_LIMIT = 10;

/* ---------- 3.9 Reading along with narration ---------- */

/** Playback speeds in the reader. Reading while listening: Webb, Uchihara &
 *  Yanagisawa 2023 (medium); fast speeds as fluency practice: Nation &
 *  Millett. Speeds above 1.25 are open from the start (report advised
 *  otherwise). docs §3.9. */
export const READ_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
/** Playback speeds in the illustrated scene player. Design decision. docs §3.9. */
export const SCENE_SPEEDS = [0.75, 1, 1.25] as const;

/* ---------- 3.10 Streak, daily goal and levels ---------- */

/** Daily XP goal on the home ring. Fixed; the streak does not depend on it
 *  (Duolingo streak A/B test). The value 50 is a design decision; choice of
 *  20/50/100 is task I6. docs §3.10. */
export const DAILY_GOAL_XP = 50;

/** XP per profile level (0–99 XP is level 1). Design decision. */
export const XP_PER_LEVEL = 100;

/** Days without activity after which a learner is flagged "away" for the
 *  teacher. Design decision. */
export const TEACHER_AWAY_DAYS = 7;

/* ---------- Gamification (Sailer & Homner 2020: gamification in general) ---------- */

/** Right answers needed to win a legend card. Design decision. */
export const LEGEND_CARD_PASS = 4;
/** XP for the proverb of the day. Design decision. */
export const MAQAL_XP = 5;
/** Pronunciation score (0–100) from which speaking practice earns XP. Design decision. */
export const SPEAK_XP_MIN_SCORE = 50;
/** Speaking XP = round(SPEAK_XP_BASE + score / 100 × SPEAK_XP_RANGE), 13 to 20 XP. Design decision. */
export const SPEAK_XP_BASE = 5;
/** See SPEAK_XP_BASE. Design decision. */
export const SPEAK_XP_RANGE = 15;

/* ---------- 3.11 Corpus profile (R6): research analysis, not shown to learners ---------- */

/** Share of running words a reader must know to read with adequate
 *  comprehension: the lower threshold the corpus profile reports.
 *  Source: Laufer 1989; Hu & Nation 2000 (medium; not yet read in the
 *  original, verify before citing). docs §3.11. */
export const CORPUS_COVERAGE_ADEQUATE = 0.95;

/** The stricter threshold for reading without help. Source: Hu & Nation 2000
 *  (medium; verify before citing). docs §3.11. */
export const CORPUS_COVERAGE_OPTIMAL = 0.98;

/** Window for the moving-average type-token ratio (MATTR), so lexical
 *  diversity can be compared across texts of different length. Method:
 *  Covington & McFall 2010; the window of 50 is a design decision. docs §3.11. */
export const CORPUS_MATTR_WINDOW = 50;

/** Most draft target words proposed per text, by level (upper bound of the
 *  ertegi-story-method level spec). Design decision. docs §3.11. */
export const CORPUS_TARGETS_PER_LEVEL = { A1: 4, A2: 6, B1: 8, B2: 10, C1: 12 } as const;

/** Times a word must occur in one text to be proposed as a target
 *  (ertegi-story-method level spec). Design decision. docs §3.11. */
export const CORPUS_TARGET_MIN_REPEATS = { A1: 3, A2: 3, B1: 2, B2: 2, C1: 2 } as const;
