// Batyr cards: heroes and scenes from Kazakh tales, epics, legends and history.
// Every scene is our own short retelling in English, read aloud by the browser
// voice. No film or cartoon clips: those are copyrighted.

export type Rarity = "ertegi" | "epos" | "anyz" | "tarih";
export type Ornament = "qoshqar" | "shanyraq" | "tumar";

export interface LegendCard {
  id: string;
  name: string;          // Kazakh in Latin, as in the UI
  kk: string;            // Kazakh in Cyrillic
  rarity: Rarity;
  ornament: Ornament;
  scene: string;         // the listening passage
  tf: { s: string; a: boolean }[];
  gap: { sentence: string; options: string[]; answer: number };
  fact: { kk: string; en: string };
}

export const RARITY: Record<Rarity, { kk: string; en: string; xp: number; tone: string; frame: string }> = {
  ertegi: { kk: "Ertegi", en: "Tale", xp: 10, tone: "bg-sky", frame: "border-sky" },
  epos: { kk: "Jyr", en: "Epic", xp: 15, tone: "bg-jade", frame: "border-jade" },
  anyz: { kk: "Añyz", en: "Legend", xp: 20, tone: "bg-felt", frame: "border-felt" },
  tarih: { kk: "Tarih", en: "History", xp: 25, tone: "bg-night", frame: "border-sun" },
};

export const LEGENDS: LegendCard[] = [
  {
    id: "aldar", name: "Aldar Köse", kk: "Алдар Көсе", rarity: "ertegi", ornament: "qoshqar",
    scene: "Aldar Kose had no money, but he had a quick mind. One cold day he met a rich man in a warm fur coat. Aldar said his thin coat was magic and kept him warm. The greedy rich man swapped coats, and Aldar rode away laughing.",
    tf: [
      { s: "Aldar Kose was a rich man.", a: false },
      { s: "The rich man wanted the 'magic' coat.", a: true },
    ],
    gap: { sentence: "Aldar Kose had no money, but he had a quick ___.", options: ["horse", "mind", "coat"], answer: 1 },
    fact: { kk: "«Köse» degen – saqaly joq adam. Aldar – qazaq ertegileriniñ eñ aılaker keıipkeri.", en: "\"Köse\" means a man with no beard. Aldar is the great trickster of Kazakh tales." },
  },
  {
    id: "zhirenshe", name: "Jırenşe şeşen", kk: "Жиренше шешен", rarity: "ertegi", ornament: "tumar",
    scene: "Zhirenshe was famous for his clever words. One day he met a girl named Karashash who answered every riddle he asked. Zhirenshe was amazed by her wisdom, and soon she became his wife.",
    tf: [
      { s: "Karashash could answer his riddles.", a: true },
      { s: "Zhirenshe was famous for his strength.", a: false },
    ],
    gap: { sentence: "Zhirenshe was amazed by her ___.", options: ["wisdom", "horse", "song"], answer: 0 },
    fact: { kk: "Şeşen – sözge şeber, aqyldy adam. Qazaqtar sözdi qarudan da küşti sanaǵan.", en: "A şeşen is a master of words. Kazakhs said a good word is stronger than a weapon." },
  },
  {
    id: "tostik", name: "Er Töstik", kk: "Ер Төстік", rarity: "ertegi", ornament: "shanyraq",
    scene: "Er Tostik was the youngest son of the old man Ernazar. On a long journey he fell into the underground world. His wise horse Shalkuiryk could talk and gave him good advice. After many trials, Er Tostik came home to his family.",
    tf: [
      { s: "Er Tostik was the oldest son.", a: false },
      { s: "His horse could talk.", a: true },
    ],
    gap: { sentence: "On a long journey he fell into the ___ world.", options: ["frozen", "underground", "golden"], answer: 1 },
    fact: { kk: "Şalqūıryq – Er Töstiktiñ aqyldy tūlpary. Qazaq ertegilerinde at – adamnyñ eñ jaqyn dosy.", en: "Shalkuiryk is Er Tostik's wise horse. In Kazakh tales a horse is a hero's closest friend." },
  },
  {
    id: "qobylandy", name: "Qobylandy batyr", kk: "Қобыланды батыр", rarity: "epos", ornament: "qoshqar",
    scene: "Qobylandy was a brave warrior who protected his people. His wife Kurtka was wise and strong, and she raised his famous horse Taiburyl. When enemies came, Qobylandy rode Taiburyl into battle and saved his land.",
    tf: [
      { s: "Kurtka raised the horse Taiburyl.", a: true },
      { s: "Qobylandy ran away from the enemies.", a: false },
    ],
    gap: { sentence: "Qobylandy was a brave ___ who protected his people.", options: ["warrior", "farmer", "trader"], answer: 0 },
    fact: { kk: "«Qobylandy batyr» – qazaqtyñ batyrlyq jyrlarynyñ biri, ony jyraular ǵasyrlar boıy aıtqan.", en: "\"Qobylandy batyr\" is a Kazakh heroic epic, sung by storytellers (zhyrau) for centuries." },
  },
  {
    id: "alpamys", name: "Alpamys batyr", kk: "Алпамыс батыр", rarity: "epos", ornament: "tumar",
    scene: "Alpamys was a mighty hero who loved Gulbarshyn. Enemies tricked him and threw him into a deep pit. He stayed there for seven years, but he never lost hope. At last he escaped and returned home to Gulbarshyn.",
    tf: [
      { s: "Alpamys stayed in the pit for seven years.", a: true },
      { s: "Alpamys lost all hope.", a: false },
    ],
    gap: { sentence: "Enemies tricked him and threw him into a deep ___.", options: ["river", "pit", "forest"], answer: 1 },
    fact: { kk: "«Alpamys» jyry qazaq, özbek jäne basqa türki halyqtarynda bar.", en: "The Alpamys epic is shared by Kazakhs, Uzbeks and other Turkic peoples." },
  },
  {
    id: "qyzzhibek", name: "Qyz Jibek", kk: "Қыз Жібек", rarity: "epos", ornament: "shanyraq",
    scene: "Zhibek was the most beautiful girl of her tribe. A young man named Tolegen travelled far across the steppe to meet her. They fell in love, but jealous enemies attacked Tolegen on his way. Their sad love story is still sung today.",
    tf: [
      { s: "Tolegen travelled far to meet Zhibek.", a: true },
      { s: "Their story has a happy ending.", a: false },
    ],
    gap: { sentence: "Their sad love story is still ___ today.", options: ["sung", "sold", "built"], answer: 0 },
    fact: { kk: "«Qyz Jibek» – lırıkalyq jyr. 1970 jyly ol boıynşa ataqty fılm tüsirildi.", en: "\"Qyz Zhibek\" is a lyric epic. A famous Kazakh film was made from it in 1970." },
  },
  {
    id: "qozy", name: "Qozy Körpeş – Baıan Sulu", kk: "Қозы Көрпеш – Баян сұлу", rarity: "epos", ornament: "tumar",
    scene: "Before they were born, their fathers promised that Kozy and Bayan would marry. Years later, Bayan's father broke his promise. Kozy and Bayan stayed true to each other until the end. People say their tomb still stands near Ayagoz.",
    tf: [
      { s: "Bayan's father kept his promise.", a: false },
      { s: "Kozy and Bayan stayed true to each other.", a: true },
    ],
    gap: { sentence: "Their fathers ___ that Kozy and Bayan would marry.", options: ["forgot", "promised", "refused"], answer: 1 },
    fact: { kk: "Aıagöz mañynda Qozy Körpeş pen Baıan Sulu kesenesi bar.", en: "A mausoleum named after Kozy Korpesh and Bayan Sulu stands near Ayagoz." },
  },
  {
    id: "qorqyt", name: "Qorqyt Ata", kk: "Қорқыт Ата", rarity: "anyz", ornament: "shanyraq",
    scene: "Korkyt dreamed that he would die young, so he ran to every corner of the world. But everywhere people were digging a grave. He came back to the Syr Darya river and made the first kobyz. While he played, death could not come near him.",
    tf: [
      { s: "Korkyt made the first kobyz.", a: true },
      { s: "Korkyt found a place where nobody died.", a: false },
    ],
    gap: { sentence: "He came back to the Syr Darya ___.", options: ["mountain", "river", "city"], answer: 1 },
    fact: { kk: "Qorqyt Ata kesenesi Qyzylorda oblysynda, Syrdarıa boıynda tur.", en: "The Korkyt Ata memorial stands by the Syr Darya in the Kyzylorda region." },
  },
  {
    id: "asan", name: "Asan Qaıǵy", kk: "Асан Қайғы", rarity: "anyz", ornament: "qoshqar",
    scene: "Asan was a wise man who worried about his people. He rode his fast camel Zhelmaya across the steppe. He was looking for Zheruiyk, a land where people would never be hungry or sad. He searched all his life.",
    tf: [
      { s: "Asan rode a fast horse.", a: false },
      { s: "Zheruiyk was a land without hunger.", a: true },
    ],
    gap: { sentence: "Asan was a wise man who ___ about his people.", options: ["laughed", "worried", "forgot"], answer: 1 },
    fact: { kk: "Jeruıyq – qazaq añyzyndaǵy baqytty meken. Asan Qaıǵy XV ǵasyrda ömir sürgen dep sanalady.", en: "Zheruiyk is the land of happiness in Kazakh legend. Asan Kaigy is said to have lived in the 15th century." },
  },
  {
    id: "tomiris", name: "Tomırıs", kk: "Томирис", rarity: "tarih", ornament: "tumar",
    scene: "Tomiris was the queen of the Massagetae, nomads of the steppe. The great Persian king Cyrus wanted to take her land. Tomiris led her army against him. Around 530 BC her warriors defeated the Persian army.",
    tf: [
      { s: "Tomiris was a Persian queen.", a: false },
      { s: "Her army defeated Cyrus.", a: true },
    ],
    gap: { sentence: "Tomiris was the queen of the Massagetae, ___ of the steppe.", options: ["nomads", "farmers", "sailors"], answer: 0 },
    fact: { kk: "Tomırıs turaly grek tarıhşysy Gerodot jazǵan.", en: "The Greek historian Herodotus wrote about Tomiris." },
  },
  {
    id: "khanate", name: "Kereı men Jänibek", kk: "Керей мен Жәнібек", rarity: "tarih", ornament: "shanyraq",
    scene: "In the fifteenth century, two leaders, Kerey and Zhanibek, moved with their people to the Zhetysu region. Many families joined them there. This was the beginning of the Kazakh Khanate, the first Kazakh state.",
    tf: [
      { s: "Kerey and Zhanibek moved to Zhetysu.", a: true },
      { s: "The Kazakh Khanate began in the twentieth century.", a: false },
    ],
    gap: { sentence: "This was the beginning of the Kazakh ___.", options: ["Khanate", "Empire", "Republic"], answer: 0 },
    fact: { kk: "Qazaq handyǵy 1465 jyly qūrylǵan dep sanalady. 2015 jyly onyñ 550 jyldyǵy toılandy.", en: "The Kazakh Khanate is dated to 1465. Kazakhstan celebrated its 550th anniversary in 2015." },
  },
  {
    id: "abylai", name: "Abylaı han", kk: "Абылай хан", rarity: "tarih", ornament: "qoshqar",
    scene: "In the eighteenth century the Dzungars attacked the Kazakh steppe. A young warrior named Abylai fought bravely against them. He united many Kazakh clans, and in 1771 he became khan of the Kazakhs.",
    tf: [
      { s: "Abylai fought against the Dzungars.", a: true },
      { s: "Abylai became khan in 1871.", a: false },
    ],
    gap: { sentence: "He ___ many Kazakh clans.", options: ["divided", "united", "left"], answer: 1 },
    fact: { kk: "Abylaı hannyñ esimi Almatydaǵy dañǵyl men universitetke berilgen.", en: "An avenue and a university in Almaty are named after Abylai Khan." },
  },
  {
    id: "shoqan", name: "Şoqan Uälıhanov", kk: "Шоқан Уәлиханов", rarity: "tarih", ornament: "tumar",
    scene: "Shokan Ualikhanov was a Kazakh scholar and traveller. In 1858 he made a dangerous journey to Kashgar. He wrote down songs, legends and history of the peoples he met. He was only twenty-nine when he died.",
    tf: [
      { s: "Shokan travelled to Kashgar.", a: true },
      { s: "Shokan lived to be very old.", a: false },
    ],
    gap: { sentence: "He wrote down songs, legends and ___.", options: ["recipes", "history", "letters"], answer: 1 },
    fact: { kk: "Şoqan qyrǵyzdyñ «Manas» jyrynan üzindi jazyp alǵan alǵaşqy ǵalymdardyñ biri.", en: "Shokan was one of the first scholars to write down part of the Kyrgyz epic Manas." },
  },
];
