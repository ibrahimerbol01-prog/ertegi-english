/* Kazakh culture content that sets Ertegi apart: proverbs (maqal), blessings
   (bata) and ornaments (oıu). Kazakh text is in Cyrillic, like WORD_TRANSLATIONS. */

export type Maqal = {
  kk: string;
  literal: string;   // word-for-word English, so the learner sees the image
  english: string;   // the real English proverb with the same meaning
};

// Pairs are chosen so the English proverb carries the same meaning, not just similar words.
export const MAQALS: Maqal[] = [
  { kk: "Бірлік болмай, тірлік болмайды.", literal: "Without unity there is no life.", english: "United we stand, divided we fall." },
  { kk: "Тамшы тамып, тас теседі.", literal: "Drop by drop, water pierces stone.", english: "Constant dripping wears away the stone." },
  { kk: "Асықпаған арбамен қоян алады.", literal: "The one who doesn't hurry catches a hare with a cart.", english: "Slow and steady wins the race." },
  { kk: "Жеті рет өлшеп, бір рет кес.", literal: "Measure seven times, cut once.", english: "Measure twice, cut once." },
  { kk: "Ештен кеш жақсы.", literal: "Late is better than nothing.", english: "Better late than never." },
  { kk: "Отан — оттан да ыстық.", literal: "The homeland is hotter than fire.", english: "East or West, home is best." },
  { kk: "Көп түкірсе — көл.", literal: "If many spit, it becomes a lake.", english: "Many hands make light work." },
  { kk: "Әке көрген оқ жонар, шеше көрген тон пішер.", literal: "Who saw his father carves arrows; who saw her mother sews coats.", english: "Like father, like son." },
  { kk: "Құдыққа түкірме, қайтып су ішесің.", literal: "Don't spit in the well, you will drink from it again.", english: "Don't bite the hand that feeds you." },
  { kk: "Сабыр түбі — сары алтын.", literal: "At the bottom of patience lies yellow gold.", english: "Patience is a virtue." },
  { kk: "Еңбек етсең ерінбей, тояды қарның тіленбей.", literal: "Work without laziness and you'll be fed without begging.", english: "No pain, no gain." },
  { kk: "Бас аман болса, бөрік табылады.", literal: "If the head is safe, a hat will be found.", english: "Where there's life, there's hope." },
  { kk: "Сөз — күміс, үндемеу — алтын.", literal: "Speech is silver, silence is gold.", english: "Speech is silver, silence is golden." },
  { kk: "Білім — бақыт кілті.", literal: "Knowledge is the key to happiness.", english: "Knowledge is power." },
];

const DAY_MS = 86_400_000;
export const dayNumber = (now = Date.now()) => Math.floor(now / DAY_MS);

/* Today's proverb plus three answer options (the right English proverb and two
   others), in a fixed order for the day so a reload doesn't reshuffle them. */
export function maqalOfDay(day: number) {
  const index = day % MAQALS.length;
  const maqal = MAQALS[index];
  const others = [MAQALS[(index + 5) % MAQALS.length], MAQALS[(index + 9) % MAQALS.length]].map((m) => m.english);
  const options = [maqal.english, ...others];
  const shift = day % 3;
  const rotated = [...options.slice(shift), ...options.slice(0, shift)];
  return { index, maqal, options: rotated, correct: rotated.indexOf(maqal.english) };
}

/* Blessing given when a learner completes a whole story (passes its quiz). */
export const BATAS: Record<string, { kk: string; en: string }> = {
  aldar_kose: {
    kk: "Ақылың тасысын, тапқырлығың таусылмасын! Жолың ашық болсын!",
    en: "May your wit overflow and your cleverness never run dry! May your road be open!",
  },
  zhirenshe: {
    kk: "Сөзің дана, ойың терең болсын! Білімің бақыт әкелсін!",
    en: "May your words be wise and your thoughts deep! May your knowledge bring you happiness!",
  },
  er_tostik: {
    kk: "Жүрегің батыл, пейілің кең болсын! Жолың ашық болып, үйіңе аман-есен жет!",
    en: "May your heart be brave and your spirit generous! May your road be open, and may you reach home safe and sound!",
  },
  tazsha_bala: {
    kk: "Ақылың алда, жолың ашық болсын!",
    en: "May your wisdom lead the way, and may your road be open!",
  },
  ayaz_bi: {
    kk: "Әліңді біл, тегіңді ұмытпа! Мансап басыңды айналдырмасын, әділ де кішіпейіл бол!",
    en: "Know your measure and never forget your roots! May high rank never turn your head; be just and humble!",
  },
  asan_kaigy: {
    kk: "Туған жерің құтты болсын, ағайының ынтымақты болсын, дастарханың мол болсын!",
    en: "May your homeland be blessed, may your kin live in harmony, and may your table always be full!",
  },
  alpamys: {
    kk: "Үмітің сөнбесін, адалдығың айнымасын! Қандай қиындық болса да, жолың ашық болып, еліңе аман-есен орал!",
    en: "May your hope never fade and your loyalty never waver! Whatever hardship comes, may your road be open and may you return safely to your people!",
  },
};
export const DEFAULT_BATA = {
  kk: "Жолың ашық, ісің оң болсын!",
  en: "May your road be open and your work go well!",
};

/* One ornament per story, unlocked with its bata. Together they form the
   learner's kilim in the profile. */
export const OYU = [
  { id: "qoshqar", name: { kk: "Қошқар мүйіз", en: "Ram's horn" }, meaning: { kk: "Күш пен молшылық", en: "Strength and plenty" } },
  { id: "shanyraq", name: { kk: "Шаңырақ", en: "Shanyrak" }, meaning: { kk: "Шаңырақ — үйдің жүрегі", en: "The heart of the home" } },
  { id: "tumar", name: { kk: "Тұмар", en: "Tumar" }, meaning: { kk: "Қорғаныш пен сәттілік", en: "Protection and good luck" } },
] as const;
export const oyuForStory = (storyIndex: number) => OYU[storyIndex % OYU.length];

/* English words that came from Turkic languages, Kazakh included. */
export const TURKIC_WORDS = [
  { en: "khan", kk: "хан", note: { kk: "Түркі тілінен келген билеуші атағы.", en: "A ruler's title from Turkic qan." } },
  { en: "horde", kk: "орда", note: { kk: "«Орда» — ханның ордасы, әскері.", en: "From Turkic orda, the khan's camp." } },
  { en: "yurt", kk: "киіз үй", note: { kk: "Орыс тілі арқылы түркі «жұрт» сөзінен.", en: "Via Russian from Turkic jurt, homeland." } },
  { en: "koumiss", kk: "қымыз", note: { kk: "«Қымыз» сөзі ағылшын тіліне осылай жеткен.", en: "Fermented mare's milk, from qymyz." } },
];

/* Historical background shown above each tale in the reader. Kept to facts
   that hold for the legend itself, not for invented details. */
export const STORY_HISTORY: Record<string, { kk: string; en: string }> = {
  aldar_kose: {
    kk: "Алдар Көсе — қазақ фольклорының айлакер кейіпкері. «Көсе» — сақалы жоқ деген сөз. Ол сараң байларды ақылмен жеңеді, сондықтан халық оны ғасырлар бойы сүйіп айтқан.",
    en: "Aldar Köse is the trickster hero of Kazakh folklore. \"Köse\" means beardless. He outwits greedy rich men, which is why people have retold his tales for centuries.",
  },
  zhirenshe: {
    kk: "Жиренше шешен — аңыз бойынша XV ғасырда Қазақ хандығының негізін қалаған Жәнібек ханның кеңесшісі. «Шешен» — сөзге шебер, дана адам.",
    en: "Zhirenshe Sheshen is, by legend, an adviser to Janibek Khan, a 15th-century founder of the Kazakh Khanate. \"Sheshen\" means a master of words, a wise orator.",
  },
  er_tostik: {
    kk: "Ер Төстік — қазақтың ең көне әрі танымал батырлық ертегілерінің бірі, ол ғасырлар бойы ауыздан ауызға таралған. Алып құс Самұрық туралы аңыз Астанадағы Бәйтерек монументіне де негіз болған.",
    en: "Er Tostik is one of the oldest and best-known Kazakh hero tales, passed down by word of mouth for centuries on the steppe. The legend of the giant bird Samruk also inspired the Baiterek monument in Astana, which shows Samruk's golden egg resting in the tree of life.",
  },
  tazsha_bala: {
    kk: "Тазша бала — қазақ ертегілерінің кедей, бірақ тапқыр кейіпкері; ол күшпен емес, ақылмен жеңеді. Ірімшікті тас деп көрсетіп, алыпты алдаған айла әлемнің көп халқының ертегілерінде кездеседі.",
    en: "Tazsha bala (the bald boy) is a classic hero of Kazakh folk tales: a poor, often mocked boy who wins by cleverness, not strength. The trick of squeezing soft cheese as if it were a stone to scare a giant is an old tale type (ATU 1060) told by many peoples across Europe and Asia.",
  },
  ayaz_bi: {
    kk: "«Аяз би» — даналық пен кішіпейілділік туралы қазақ халық ертегісі. Осыған ұқсас Аяз бен Ғазна сұлтаны Махмұт (XI ғасыр) туралы аңыз Румидің «Мәснәуи» дастанында (XIII ғасыр) да кездеседі.",
    en: "Ayaz bi is a Kazakh folk tale (ertegi) about wisdom and humility. A very similar story, about Ayaz and Sultan Mahmud of Ghazni (11th century), who kept his old shepherd's clothes and looked at them every day, is also told in Rumi's Masnavi (13th century).",
  },
  asan_kaigy: {
    kk: "Асан Қайғы — XV ғасырда өмір сүрген жырау, аңыз бойынша Жәнібек ханның кеңесшісі болған. Оның Желмая түйесіне мініп, халқына Жерұйықты іздегені және жерлерге берген бағалары ел арасында аңыз болып тараған.",
    en: "Asan Kaigy was a 15th-century zhyrau (poet-thinker) whom tradition places at the court of Zhanibek Khan, one of the founders of the Kazakh Khanate. Legends of his search for Zheruiyk on the camel Zhelmaya, and his sayings about the lands he visited, have been passed down in Kazakh oral tradition.",
  },
  alpamys: {
    kk: "Алпамыс батыр — түркі халықтарына ортақ ең көне батырлық жырлардың бірі, оның өзбек нұсқасы «Алпамыш» деп аталады. Жырды ғасырлар бойы жыраулар мен ақындар ауыздан ауызға жеткізіп келді.",
    en: "Alpamys batyr is one of the oldest heroic epics (jyr) shared by several Turkic peoples; the Uzbek version is known as Alpamysh. For centuries it was performed from memory by zhyraus and akyns before it was written down.",
  },
};
