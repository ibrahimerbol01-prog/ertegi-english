/* Words of the week (Word Generation, Snow & Lawrence): five words that come
   back in several tales, and a dilemma from the tales to argue any day of the week.
   Every word here appears in two or more tales (most in three or more), so a learner meets it
   again across days, not only inside one story. */

export interface WeekWord {
  word: string;
  kk: string;
  // Forms that count as using the word; matched as whole words, so "fair" never matches "fairy".
  forms: string[];
  // Word family shown in the reader: how the word grows.
  family: string;
}

export interface Week {
  theme: { kk: string; en: string };
  words: WeekWord[];
  dilemma: { kk: string; en: string };
  // Shoqan's counter-argument when he can't be reached, one per side the learner takes.
  counter: { yes: { en: string; kk: string }; no: { en: string; kk: string } };
}

const w = (word: string, kk: string, forms: string[], family: string): WeekWord => ({ word, kk, forms: [word, ...forms], family });

export const WEEKS: Week[] = [
  {
    theme: { kk: "Айла мен әділдік", en: "Tricks and fairness" },
    words: [
      w("clever", "ақылды, айлалы", ["cleverer", "cleverest", "cleverly", "cleverness"], "clever → cleverness"),
      w("trick", "айла", ["tricks", "tricked", "tricking", "tricky"], "trick → tricky"),
      w("poor", "кедей", ["poorer", "poorest", "poorly", "poverty"], "poor → poverty"),
      w("rich", "бай", ["richer", "richest", "riches"], "rich → riches"),
      w("decide", "шешу", ["decides", "decided", "deciding", "decision", "decisions"], "decide → decision"),
    ],
    dilemma: {
      kk: "Алдар Көсе бай адамның шапанын айламен алды. Ол кедей болғандықтан, бұл әділ ме?",
      en: "Aldar Köse took the rich man's coat with a trick. He was poor. Does that make it fair?",
    },
    counter: {
      yes: {
        en: "But a trick is still a lie. The rich man was scared and lost his coat. Is it fair to frighten people, even rich ones?",
        kk: "Бірақ айла бәрібір өтірік. Бай адам қорқып, шапанынан айырылды. Адамды қорқыту әділ ме, тіпті ол бай болса да?",
      },
      no: {
        en: "But Aldar Köse was poor and cold, and nobody was hurt. Can a clever trick be a kind of justice?",
        kk: "Бірақ Алдар Көсе кедей әрі тоңып жүрді, ешкім зардап шеккен жоқ. Ақылды айла әділдіктің бір түрі бола ала ма?",
      },
    },
  },
  {
    theme: { kk: "Батылдық", en: "Courage" },
    words: [
      w("brave", "батыл", ["braver", "bravest", "bravely", "bravery"], "brave → bravery"),
      w("courage", "ерлік, батылдық", ["courageous"], "courage → courageous"),
      w("fear", "қорқыныш", ["fears", "feared", "fearless", "fearful"], "fear → fearless"),
      w("defeat", "жеңу", ["defeats", "defeated", "defeating"], "defeat → defeated"),
      w("save", "құтқару", ["saves", "saved", "saving"], "save → saved"),
    ],
    dilemma: {
      kk: "Тазша дәуді айламен жеңді, ал Ер Төстік айдаһармен соғысты. Айла соғыс сияқты батылдық па?",
      en: "Tazsha beat the giant with a trick, and Er Tostik fought the dragon. Is a clever trick as brave as a fight?",
    },
    counter: {
      yes: {
        en: "But Er Tostik put his life in danger with a sword. Tazsha only used cheese. Is that really the same courage?",
        kk: "Бірақ Ер Төстік қылышпен өмірін қатерге тікті. Тазша тек ірімшік қолданды. Бұл шынымен бірдей ерлік пе?",
      },
      no: {
        en: "But Tazsha stood in front of a huge giant when his legs were shaking. Isn't it brave to stay when you are afraid?",
        kk: "Бірақ Тазша аяғы дірілдеп тұрса да, алып дәудің алдында қалды. Қорқып тұрып қалу батылдық емес пе?",
      },
    },
  },
  {
    theme: { kk: "Даналық", en: "Wisdom" },
    words: [
      w("wise", "дана", ["wiser", "wisest", "wisely", "wisdom"], "wise → wisdom"),
      w("answer", "жауап", ["answers", "answered", "answering"], "answer → answered"),
      w("respect", "құрмет", ["respects", "respected", "respectful"], "respect → respectful"),
      w("judge", "би, төреші", ["judges", "judged", "judging"], "judge → judging"),
      w("trust", "сену", ["trusts", "trusted", "trusting"], "trust → trusted"),
    ],
    dilemma: {
      kk: "Аяз би жаман адамдарға айғайлай алатын еді, бірақ кілтті үнсіз берді. Сабыр ету қарсы тұрудан дұрыс па?",
      en: "Ayaz Bi could shout at the bad men, but he quietly gave the key. Is staying calm better than fighting back?",
    },
    counter: {
      yes: {
        en: "But the bad men told lies about him. If a judge says nothing, will people respect him or think he is weak?",
        kk: "Бірақ ол жаман адамдар ол туралы өтірік айтты. Би үндемесе, адамдар оны құрметтей ме, әлде әлсіз деп ойлай ма?",
      },
      no: {
        en: "But Ayaz Bi showed the truth without one angry word, and the khan trusted him more. Isn't that wise?",
        kk: "Бірақ Аяз би бір ашулы сөз айтпай-ақ шындықты көрсетті, хан оған бұрынғыдан да көп сенді. Бұл даналық емес пе?",
      },
    },
  },
  {
    theme: { kk: "Адалдық", en: "Loyalty" },
    words: [
      w("promise", "уәде", ["promises", "promised"], "promise → promised"),
      w("loyal", "адал", ["loyalty"], "loyal → loyalty"),
      w("kind", "мейірімді", ["kinder", "kindest", "kindly", "kindness"], "kind → kindness"),
      w("help", "көмек", ["helps", "helped", "helping", "helpful"], "help → helpful"),
      w("believe", "сену", ["believes", "believed", "belief"], "believe → belief"),
    ],
    dilemma: {
      kk: "Қарлыға әкесінің жауы Алпамысқа шұңқырдан шығуға көмектесті. Ол дұрыс істеді ме?",
      en: "Karlyga helped Alpamys out of the pit, but he was her father's enemy. Was she right to help him?",
    },
    counter: {
      yes: {
        en: "But Karlyga went against her own father and her people. Is it loyal to help your family's enemy?",
        kk: "Бірақ Қарлыға өз әкесі мен еліне қарсы шықты. Отбасыңның жауына көмектесу адалдық па?",
      },
      no: {
        en: "But Alpamys was in a dark pit for seven years. Isn't kindness to a person in pain more important than a family fight?",
        kk: "Бірақ Алпамыс қараңғы шұңқырда жеті жыл отырды. Қиналған адамға мейірім көрсету отбасы дауынан маңыздырақ емес пе?",
      },
    },
  },
  {
    theme: { kk: "Ел үшін", en: "For your people" },
    words: [
      w("hungry", "аш", ["hunger"], "hungry → hunger"),
      w("choice", "таңдау", ["choices", "choose", "chooses", "chose", "chosen"], "choose → choice"),
      w("strong", "күшті", ["stronger", "strongest", "strength"], "strong → strength"),
      w("wise", "дана", ["wiser", "wisest", "wisely", "wisdom"], "wise → wisdom"),
      w("poor", "кедей", ["poorer", "poorest", "poorly", "poverty"], "poor → poverty"),
    ],
    dilemma: {
      kk: "Асан Қайғы хан қасындағы жылы үйін тастап, аш халқына жер іздеуге кетті. Басшы басқалар үшін жайлылығынан бас тартуы керек пе?",
      en: "Asan Kaigy left his warm home at the khan's side to find land for hungry people. Should a leader give up comfort for others?",
    },
    counter: {
      yes: {
        en: "But Asan Kaigy travelled for years and never found Zheruiyk. Could he help his people more by staying near the khan?",
        kk: "Бірақ Асан Қайғы көп жыл жүріп, Жерұйықты таппады. Хан қасында қалса, халқына көбірек көмектесе алар ма еді?",
      },
      no: {
        en: "But a leader who never leaves a warm home cannot see how poor families live. Isn't that a weak choice?",
        kk: "Бірақ жылы үйден шықпаған басшы кедей отбасылардың тұрмысын көрмейді. Бұл әлсіз таңдау емес пе?",
      },
    },
  },
];

/* The week runs Monday to Sunday on the learner's own calendar. */
const EPOCH = new Date(2026, 9, 19); // a Monday

export function currentWeek(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today.getTime() - EPOCH.getTime()) / 86400000);
  const index = Math.floor(days / 7);
  // Calendar arithmetic, not milliseconds, so a DST change cannot shift the week start.
  const start = new Date(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate() + index * 7);
  const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  // 0 = Monday … 6 = Sunday.
  const weekday = ((days % 7) + 7) % 7;
  return { week: WEEKS[((index % WEEKS.length) + WEEKS.length) % WEEKS.length], startKey, weekday };
}

const formIndex = (week: Week) => {
  const map = new Map<string, string>();
  for (const ww of week.words) for (const f of ww.forms) map.set(f, ww.word);
  return map;
};

// Which of the week's words a text uses, by whole-word form.
export function wordsUsed(week: Week, text: string): string[] {
  const forms = formIndex(week);
  const used = new Set<string>();
  for (const tok of text.toLowerCase().match(/[a-z]+/g) ?? []) {
    const base = forms.get(tok);
    if (base) used.add(base);
  }
  return [...used];
}

// The week's word a reader token belongs to, if any.
export function weekWordOf(week: Week, token: string): WeekWord | null {
  const base = formIndex(week).get(token.toLowerCase().replace(/[^a-z]/g, ""));
  return base ? week.words.find((ww) => ww.word === base) ?? null : null;
}
