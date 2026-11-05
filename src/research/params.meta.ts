/* Where each learning parameter comes from. Used by params.test.ts and the
   documentation only; app code imports ./params and never this file, so none
   of this text reaches the bundle.

   `value` repeats the number on purpose: the test checks it equals the one in
   params.ts, so changing a number means looking at its source again.
   `evidence` is the strength of the cited study (docs/research-evidence.md,
   section 2), not proof that our exact number works. "design" means there is
   no study behind the number: it is our decision. */

import type * as Params from "./params";

export type EvidenceStrength = "strong" | "medium" | "weak" | "design";

export interface ParamMeta<V = unknown> {
  value: V;
  /** Author(s) and year as in docs/research-evidence.md, section 7, or "проектное решение". */
  source: string;
  evidence: EvidenceStrength;
  /** Section of docs/research-evidence.md. */
  doc: string;
  /** File(s) that use the parameter. */
  usedIn: string;
  note?: string;
}

type Meta = { [K in keyof typeof Params]: ParamMeta<(typeof Params)[K]> };

const DESIGN = "Проектное решение";
const REPORT = "Отчёт «EdTech функции и методики Гарварда»";

export const RESEARCH_PARAMS: Meta = {
  // 3.4 Spaced review
  REVIEW_INTERVAL_DAYS: {
    value: [0, 1, 3, 7, 16, 35, 90],
    source: "Cepeda, Vul, Rohrer, Wixted & Pashler (2008); последовательность 1, 3, 7, 16, 35, 90 — рекомендация отчёта",
    evidence: "strong",
    doc: "3.4",
    usedIn: "src/utils/progress.ts (nextReview)",
    note: "Cepeda изучал оптимальный интервал для заданного срока удержания, а не схему Лейтнера; рост до 90 дней — наш вывод для учебного года.",
  },
  LAPSE_BOX_DROP: { value: 1, source: `${REPORT}: откат на одну коробку, а не в первую`, evidence: "design", doc: "3.4", usedIn: "src/utils/progress.ts (lapse)" },
  LAPSE_RETRY_DAYS: { value: 1, source: DESIGN, evidence: "design", doc: "3.4", usedIn: "src/utils/progress.ts (lapse)" },
  REVIEW_KNOWN_XP: { value: 2, source: DESIGN, evidence: "design", doc: "3.4", usedIn: "src/KazakhTalesApp.tsx (handleReview)" },
  MATCH_XP: {
    value: 4, source: DESIGN, evidence: "design", doc: "3.4", usedIn: "src/components/screens/WordsScreens.tsx (MatchingGame)",
    note: "Сопоставление — узнавание, срок повторения не меняет (вывод отчёта).",
  },
  SAVE_WORD_XP: { value: 5, source: DESIGN, evidence: "design", doc: "3.4", usedIn: "src/KazakhTalesApp.tsx (handleSaveWord)" },

  // 3.5 Quiz
  QUIZ_PASS_SHARE: {
    value: 0.6, source: DESIGN, evidence: "design", doc: "3.5",
    usedIn: "src/KazakhTalesApp.tsx, src/components/screens/QuizScreens.tsx, src/utils/classes.ts",
    note: "Порог сохранён с прежней версии; отчёт предлагает отказаться от него (задача I1).",
  },
  QUIZ_PASS_PERCENT: { value: 60, source: DESIGN, evidence: "design", doc: "3.5", usedIn: "src/utils/classes.ts (helpFlags), src/components/Teacher.tsx" },
  QUIZ_MAX_TRIES: {
    value: 2,
    source: "Wisniewski, Zierer & Hattie (2020); Bastani et al. (2025)",
    evidence: "strong",
    doc: "3.5, 3.8",
    usedIn: "src/components/screens/QuizScreens.tsx (QuizScreen)",
    note: "Исследования поддерживают корректирующую обратную связь и Шоқана после собственной попытки; конкретное число 2 — проектный вывод.",
  },
  QUIZ_XP_FIRST_TRY: {
    value: 10, source: `${DESIGN}; без бонуса за скорость — Wang & Tahir (2020)`, evidence: "design", doc: "3.5",
    usedIn: "src/components/screens/QuizScreens.tsx",
  },
  QUIZ_XP_SECOND_TRY: { value: 5, source: DESIGN, evidence: "design", doc: "3.5", usedIn: "src/components/screens/QuizScreens.tsx" },
  LEVEL_QUIZ_QUESTIONS: { value: 4, source: DESIGN, evidence: "design", doc: "3.5", usedIn: "src/utils/levelQuiz.ts (buildLevelQuiz)" },

  // 3.2 Steppe council
  COUNCIL_LOW_SHARE: {
    value: 0.3, source: "Crouch & Mazur (2001); SERC, Carleton College", evidence: "medium", doc: "3.2",
    usedIn: "src/components/Council.tsx (submitFirst)",
    note: "SERC даёт 35 %; взято 30 % по отчёту. Перенос в язык и асинхронный формат — проектный вывод.",
  },
  COUNCIL_HIGH_SHARE: {
    value: 0.7, source: "Crouch & Mazur (2001); SERC, Carleton College", evidence: "medium", doc: "3.2",
    usedIn: "src/components/Council.tsx (submitFirst)",
  },
  COUNCIL_MIN_VOTES: {
    value: 10, source: `${DESIGN} (UI-спецификация отчёта: «меньше 10 голосов»)`, evidence: "design", doc: "3.2",
    usedIn: "src/components/Council.tsx; council_stats() в supabase/migrations/20261107000000_teacher_panel.sql (min_votes, сверяет params.test.ts)",
  },
  COUNCIL_REASON_MAX_CHARS: { value: 140, source: DESIGN, evidence: "design", doc: "3.2", usedIn: "src/components/Council.tsx" },
  COUNCIL_REASON_MIN_WORDS: { value: 3, source: DESIGN, evidence: "design", doc: "3.2", usedIn: "src/components/Council.tsx (finish)" },
  COUNCIL_XP_RIGHT: { value: 10, source: DESIGN, evidence: "design", doc: "3.2", usedIn: "src/components/Council.tsx (finish)" },
  COUNCIL_XP_TAKING_PART: { value: 3, source: DESIGN, evidence: "design", doc: "3.2", usedIn: "src/components/Council.tsx (finish)" },
  COUNCIL_XP_CHANGED_TO_RIGHT: {
    value: 5, source: `${DESIGN}; переход «неверно → верно» — ключевая метрика Peer Instruction по отчёту`, evidence: "design", doc: "3.2",
    usedIn: "src/components/Council.tsx (finish)",
  },
  COUNCIL_XP_REASON: { value: 3, source: DESIGN, evidence: "design", doc: "3.2", usedIn: "src/components/Council.tsx (finish)" },

  // 3.1 Words of the week
  WEEK_WORDS_PER_WEEK: {
    value: 5, source: "Word Generation: Snow (HGSE) и SERP Institute, RCT CCDD; Lawrence, Crosson, Paré-Blagoev & Snow (2015)", evidence: "strong", doc: "3.1",
    usedIn: "src/data/weekWords.ts (данные недель; проверяется тестом)",
    note: "Эффект RCT относится к классам с полным внедрением и к английскому как языку окружения; для EFL не проверялось.",
  },
  DEBATE_MIN_WEEK_WORDS: {
    value: 2, source: `${DESIGN} (UI-спецификация отчёта: «нужно ≥2 слова недели»)`, evidence: "design", doc: "3.1",
    usedIn: "src/components/WeekWords.tsx",
  },
  DEBATE_MAX_CHARS: { value: 400, source: DESIGN, evidence: "design", doc: "3.1", usedIn: "src/components/WeekWords.tsx" },
  DEBATE_XP_PER_WORD: { value: 3, source: `${DESIGN}; XP за слова, а не за скорость — отчёт`, evidence: "design", doc: "3.1", usedIn: "src/components/WeekWords.tsx" },
  DEBATE_XP_REPLY: { value: 5, source: DESIGN, evidence: "design", doc: "3.1", usedIn: "src/components/WeekWords.tsx" },
  DEBATE_XP_NOT_ENGLISH: { value: 5, source: DESIGN, evidence: "design", doc: "3.1", usedIn: "src/components/WeekWords.tsx" },
  COPY_RUN_WORDS: { value: 8, source: DESIGN, evidence: "design", doc: "3.1, 3.3", usedIn: "src/components/WeekWords.tsx, src/components/ThinkingTrail.tsx" },

  // 3.3 Thinking trail
  TRAIL_MAX_EVIDENCE: {
    value: 2, source: "Project Zero, Claim–Support–Question; Dajani (2016)", evidence: "weak", doc: "3.3",
    usedIn: "src/components/ThinkingTrail.tsx",
    note: "Выбор предложения нажатием — ответ на вывод Dajani о нехватке английского; число 2 — проектное решение.",
  },
  TRAIL_CLAIM_MIN_WORDS: { value: 3, source: DESIGN, evidence: "design", doc: "3.3", usedIn: "src/components/ThinkingTrail.tsx" },
  TRAIL_WONDER_MIN_WORDS: { value: 2, source: DESIGN, evidence: "design", doc: "3.3", usedIn: "src/components/ThinkingTrail.tsx" },
  TRAIL_XP_FIRST: { value: 11, source: DESIGN, evidence: "design", doc: "3.3", usedIn: "src/components/ThinkingTrail.tsx" },
  TRAIL_XP_REVISION: { value: 5, source: DESIGN, evidence: "design", doc: "3.3", usedIn: "src/components/ThinkingTrail.tsx" },

  // 3.6 Five words of the day
  DAILY_WORDS_AT_LEVEL: {
    value: 3, source: `${DESIGN}; источника для правила «3 + 2» в отчёте нет`, evidence: "design", doc: "3.6",
    usedIn: "src/utils/lexicon.ts (dailyWords)",
  },
  DAILY_WORDS_STRETCH: { value: 2, source: DESIGN, evidence: "design", doc: "3.6", usedIn: "src/utils/lexicon.ts (dailyWords)" },
  LEVEL_TARGET_SHARE: { value: 0.6, source: DESIGN, evidence: "design", doc: "3.6", usedIn: "src/utils/lexicon.ts (analyseLearner)" },
  LEVEL_TARGET_MAX_WORDS: { value: 25, source: DESIGN, evidence: "design", doc: "3.6", usedIn: "src/utils/lexicon.ts (analyseLearner)" },
  WORD_MASTERED_BOX: { value: 2, source: DESIGN, evidence: "design", doc: "3.6", usedIn: "src/utils/lexicon.ts (analyseLearner)" },
  WORD_OF_DAY_XP: { value: 2, source: DESIGN, evidence: "design", doc: "3.6", usedIn: "src/components/WordCoach.tsx" },

  // 3.8 Shoqan
  SHOQAN_DAILY_CHAT_LIMIT: {
    value: 10, source: `${DESIGN} (стоимость запросов к модели)`, evidence: "design", doc: "3.8",
    usedIn: "api/shoqan.js (DAILY_LIMIT.chat, сервер), src/components/ShoqanChat.tsx (текст)",
  },
  SHOQAN_DAILY_TOOL_LIMIT: {
    value: 10, source: `${DESIGN} (стоимость запросов к модели)`, evidence: "design", doc: "3.8",
    usedIn: "api/shoqan.js (DAILY_LIMIT.tool, сервер)",
  },
  SHOQAN_HINT_STEPS: {
    value: 3, source: "Bastani et al. (2025, PNAS): подсказки вместо готовых ответов; число ступеней — проектное решение", evidence: "strong", doc: "3.8",
    usedIn: "src/utils/hintLadder.ts, api/shoqan.js (HINT_STEPS, сервер)",
  },
  SHOQAN_HINT_ANSWER_MIN_ATTEMPTS: {
    value: 1, source: `${DESIGN} (ответ только после попытки ученика, Bastani et al. 2025)`, evidence: "design", doc: "3.8",
    usedIn: "src/utils/hintLadder.ts",
  },

  // 3.9 Narration
  READ_SPEEDS: {
    value: [0.75, 1, 1.25, 1.5, 2], source: "Webb, Uchihara & Yanagisawa (2023); Nation; Millett", evidence: "medium", doc: "3.9",
    usedIn: "src/components/screens/ReaderScreen.tsx",
    note: "Отчёт советовал открывать скорость выше 1,25 только со второго прочтения или с B1; сейчас доступна сразу.",
  },
  SCENE_SPEEDS: { value: [0.75, 1, 1.25], source: DESIGN, evidence: "design", doc: "3.9", usedIn: "src/components/ScenePlayer.tsx" },

  // 3.10 Streak and goal
  DAILY_GOAL_XP: {
    value: 50, source: `${DESIGN}; отделение серии от цели — Duolingo, Improving the streak`, evidence: "design", doc: "3.10",
    usedIn: "src/KazakhTalesApp.tsx, src/components/screens/HomeScreen.tsx",
    note: "Отчёт предлагает выбор 20/50/100 XP (задача I6).",
  },
  XP_PER_LEVEL: { value: 100, source: DESIGN, evidence: "design", doc: "3.10", usedIn: "src/KazakhTalesApp.tsx, src/components/screens/ProfileScreen.tsx" },
  TEACHER_AWAY_DAYS: { value: 7, source: DESIGN, evidence: "design", doc: "8", usedIn: "src/utils/classes.ts (helpFlags)" },

  // Gamification
  LEGEND_CARD_PASS: { value: 4, source: DESIGN, evidence: "design", doc: "8", usedIn: "src/data/legends.ts (PASS)" },
  MAQAL_XP: { value: 5, source: DESIGN, evidence: "design", doc: "8", usedIn: "src/components/Culture.tsx (MaqalCard)" },
  SPEAK_XP_MIN_SCORE: { value: 50, source: DESIGN, evidence: "design", doc: "8", usedIn: "src/components/screens/SpeakScreen.tsx" },
  SPEAK_XP_BASE: { value: 5, source: DESIGN, evidence: "design", doc: "8", usedIn: "src/components/screens/SpeakScreen.tsx" },
  SPEAK_XP_RANGE: { value: 15, source: DESIGN, evidence: "design", doc: "8", usedIn: "src/components/screens/SpeakScreen.tsx" },

  // 3.11 Corpus profile (R6)
  CORPUS_COVERAGE_ADEQUATE: {
    value: 0.95, source: "Laufer (1989); Hu & Nation (2000)", evidence: "medium", doc: "3.11",
    usedIn: "src/research/corpus.ts (scripts/corpus-report.mjs, docs/corpus.md)",
    note: "Работы не прочитаны в оригинале, сверить перед цитированием. Порог только для анализа корпуса, ученику не показывается.",
  },
  CORPUS_COVERAGE_OPTIMAL: {
    value: 0.98, source: "Hu & Nation (2000)", evidence: "medium", doc: "3.11",
    usedIn: "src/research/corpus.ts (scripts/corpus-report.mjs, docs/corpus.md)",
    note: "Сверить по первоисточнику.",
  },
  CORPUS_MATTR_WINDOW: {
    value: 50, source: `${DESIGN}; метод MATTR — Covington & McFall (2010)`, evidence: "design", doc: "3.11",
    usedIn: "src/research/corpus.ts (mattr)",
  },
  CORPUS_TARGETS_PER_LEVEL: {
    value: { A1: 4, A2: 6, B1: 8, B2: 10, C1: 12 }, source: `${DESIGN} (спецификация уровней ertegi-story-method)`, evidence: "design", doc: "3.11",
    usedIn: "src/research/corpus.ts (targetCandidates)",
    note: "Это черновик целевых слов для проверки учителем, не утверждённый список.",
  },
  CORPUS_TARGET_MIN_REPEATS: {
    value: { A1: 3, A2: 3, B1: 2, B2: 2, C1: 2 }, source: `${DESIGN} (спецификация уровней ertegi-story-method)`, evidence: "design", doc: "3.11",
    usedIn: "src/research/corpus.ts (targetCandidates)",
  },
};
