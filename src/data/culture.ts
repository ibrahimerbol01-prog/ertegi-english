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
};
export const DEFAULT_BATA = {
  kk: "Жолың ашық, ісің оң болсын!",
  en: "May your road be open and your work go well!",
};

/* One ornament per story, unlocked with its bata. Together they form the
   learner's kilim in the profile. */
export const OYU = [
  { id: "qoshqar", name: "Qoşqar müiız", meaning: { kk: "Küş pen molşylyq", en: "Strength and plenty" } },
  { id: "shanyraq", name: "Şañyraq", meaning: { kk: "Şañyraq — üıdıñ júregı", en: "The heart of the home" } },
  { id: "tumar", name: "Tumar", meaning: { kk: "Qorǵanysh pen sättilik", en: "Protection and good luck" } },
] as const;
export const oyuForStory = (storyIndex: number) => OYU[storyIndex % OYU.length];

/* English words that came from Turkic languages, Kazakh included. */
export const TURKIC_WORDS = [
  { en: "khan", kk: "хан", note: { kk: "Türkı tılınen kelgen bilеuşı ataǵy.", en: "A ruler's title from Turkic qan." } },
  { en: "horde", kk: "орда", note: { kk: "«Orda» — hannyñ ordasy, áskerı.", en: "From Turkic orda, the khan's camp." } },
  { en: "yurt", kk: "киіз үй", note: { kk: "Orys tılı arqyly türkı «jurt» sózınen.", en: "Via Russian from Turkic jurt, homeland." } },
  { en: "koumiss", kk: "қымыз", note: { kk: "«Qymyz» sózı aǵylşynǵa osylaı jetken.", en: "Fermented mare's milk, from qymyz." } },
];

/* Historical background shown above each tale in the reader. Kept to facts
   that hold for the legend itself, not for invented details. */
export const STORY_HISTORY: Record<string, { kk: string; en: string }> = {
  aldar_kose: {
    kk: "Aldar Köse — qazaq fol'klorynyñ ailaker keıipkerı. «Köse» — saqaly joq degen sóz. Ol sarañ baılardy aqylmen jeñedı, sondyqtan halyq ony ǵasyrlar boıy súıip aıtqan.",
    en: "Aldar Köse is the trickster hero of Kazakh folklore. \"Köse\" means beardless. He outwits greedy rich men, which is why people have retold his tales for centuries.",
  },
  zhirenshe: {
    kk: "Jirenşe şeşen — añyz boıynşa XV ǵasyrda Qazaq handyǵynyñ negızın qalaǵan Jänıbek hannyñ keñesşısı. «Şeşen» — sózge usta, dana adam.",
    en: "Zhirenshe Sheshen is, by legend, an adviser to Janibek Khan, a 15th-century founder of the Kazakh Khanate. \"Sheshen\" means a master of words, a wise orator.",
  },
};
