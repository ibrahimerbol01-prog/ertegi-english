// Batyr cards: heroes and scenes from Kazakh tales, epics, legends and history.
// Every scene is our own short retelling in English, read aloud by the neural
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
  qs: Question[];        // six questions, in the order the scene tells it
  fact: { kk: string; en: string };
}

// True/false, a gap in a line from the scene (marked ___), or a question with options.
export type Question =
  | { kind: "tf"; s: string; a: boolean }
  | { kind: "gap"; s: string; options: string[]; answer: number }
  | { kind: "mc"; s: string; options: string[]; answer: number };

// Right answers needed to win a card.
export const PASS = 4;

export const RARITY: Record<Rarity, { kk: string; en: string; xp: number; tone: string; frame: string }> = {
  ertegi: { kk: "Ертегі", en: "Tale", xp: 10, tone: "bg-sky", frame: "border-sky" },
  epos: { kk: "Жыр", en: "Epic", xp: 15, tone: "bg-jade", frame: "border-jade" },
  anyz: { kk: "Аңыз", en: "Legend", xp: 20, tone: "bg-felt", frame: "border-felt" },
  tarih: { kk: "Тарих", en: "History", xp: 25, tone: "bg-night", frame: "border-sun" },
};

export const LEGENDS: LegendCard[] = [
  {
    id: "aldar", name: "Aldar Köse", kk: "Алдар Көсе", rarity: "ertegi", ornament: "qoshqar",
    scene: "Aldar Köse had no money, but he had a quick mind. One freezing winter day he was riding across the steppe in an old, thin coat full of holes. On the road he met a rich man in a warm fur coat. The rich man was shivering, but Aldar was smiling and singing. \"My coat is magic,\" Aldar said. \"The wind comes in through one hole and goes out through another, so I never feel cold.\" The greedy rich man wanted the magic coat, so he gave Aldar his fur coat for it. Aldar rode away laughing, warm and happy.",
    qs: [
      { kind: "tf", s: "Aldar Köse was a rich man.", a: false },
      { kind: "gap", s: "Aldar Köse had no money, but he had a quick ___.", options: ["horse", "mind", "coat"], answer: 1 },
      { kind: "tf", s: "Aldar's coat was old and full of holes.", a: true },
      { kind: "gap", s: "The rich man was wearing a warm ___ coat.", options: ["silk", "paper", "fur"], answer: 2 },
      { kind: "mc", s: "Why did Aldar say his coat was magic?", options: ["To keep it for his son", "To trick the greedy man", "To sell it at the bazaar"], answer: 1 },
      { kind: "tf", s: "The rich man wanted the 'magic' coat.", a: true },
    ],
    fact: { kk: "«Көсе» деген — сақалы жоқ адам. Алдар — қазақ ертегілерінің ең айлакер кейіпкері.", en: "\"Köse\" means a man with no beard. Aldar is the great trickster of Kazakh tales." },
  },
  {
    id: "zhirenshe", name: "Jırenşe şeşen", kk: "Жиренше шешен", rarity: "ertegi", ornament: "tumar",
    scene: "Zhirenshe was famous for his clever words, and even the khan asked him for advice. One day he was riding with his friends and stopped at a small village. A girl named Karashash came out to give them water. Zhirenshe asked her many difficult riddles. Karashash answered every riddle quickly and wisely. Then she asked him a riddle, and he could not answer it at once. Zhirenshe was amazed by her wisdom, and soon she became his wife.",
    qs: [
      { kind: "tf", s: "Zhirenshe was famous for his strength.", a: false },
      { kind: "tf", s: "Even the khan asked Zhirenshe for advice.", a: true },
      { kind: "gap", s: "A girl named Karashash came out to give them ___.", options: ["bread", "water", "milk"], answer: 1 },
      { kind: "mc", s: "What did Zhirenshe ask Karashash?", options: ["Difficult riddles", "The way to the city", "Her father's name"], answer: 0 },
      { kind: "tf", s: "Karashash could answer his riddles.", a: true },
      { kind: "gap", s: "Zhirenshe was amazed by her ___.", options: ["horse", "song", "wisdom"], answer: 2 },
    ],
    fact: { kk: "Шешен — сөзге шебер, ақылды адам. Қазақтар сөзді қарудан да күшті санаған.", en: "A şeşen is a master of words. Kazakhs said a good word is stronger than a weapon." },
  },
  {
    id: "tostik", name: "Er Töstik", kk: "Ер Төстік", rarity: "ertegi", ornament: "shanyraq",
    scene: "Er Tostik was the youngest son of the old man Ernazar. His older brothers went far away with the herds and did not come back for a long time. So Tostik rode out to look for them, found them and brought them home. Later, on another long journey, he fell into the underground world. There he met monsters and a cruel underground khan. His wise horse Shalkuiryk could talk and gave him good advice. After many trials, Er Tostik came home to his family.",
    qs: [
      { kind: "tf", s: "Er Tostik was the oldest son.", a: false },
      { kind: "gap", s: "His older brothers went far away with the ___.", options: ["ships", "herds", "books"], answer: 1 },
      { kind: "tf", s: "Tostik went to look for his brothers.", a: true },
      { kind: "gap", s: "On a long journey he fell into the ___ world.", options: ["frozen", "golden", "underground"], answer: 2 },
      { kind: "mc", s: "Who gave Er Tostik good advice?", options: ["The underground khan", "His horse Shalkuiryk", "His older brothers"], answer: 1 },
      { kind: "tf", s: "His horse could talk.", a: true },
    ],
    fact: { kk: "Шалқұйрық — Ер Төстіктің ақылды тұлпары. Қазақ ертегілерінде ат — адамның ең жақын досы.", en: "Shalkuiryk is Er Tostik's wise horse. In Kazakh tales a horse is a hero's closest friend." },
  },
  {
    id: "qobylandy", name: "Qobylandy batyr", kk: "Қобыланды батыр", rarity: "epos", ornament: "qoshqar",
    scene: "Qobylandy was a brave warrior who protected his people. His wife Kurtka was wise and strong. She raised a young foal with great care, and it grew into the famous horse Taiburyl. When enemies attacked, Qobylandy rode Taiburyl into battle. Taiburyl was so fast that no enemy horse could catch him. The fight was long and hard, but Qobylandy did not give up. In the end he defeated the enemies and saved his land.",
    qs: [
      { kind: "gap", s: "Qobylandy was a brave ___ who protected his people.", options: ["warrior", "farmer", "trader"], answer: 0 },
      { kind: "gap", s: "His wife Kurtka was wise and ___.", options: ["lazy", "strong", "silent"], answer: 1 },
      { kind: "tf", s: "Kurtka raised the horse Taiburyl.", a: true },
      { kind: "tf", s: "Enemy horses could easily catch Taiburyl.", a: false },
      { kind: "tf", s: "Qobylandy ran away from the enemies.", a: false },
      { kind: "mc", s: "What happened in the end?", options: ["He lost his horse", "He made peace and moved away", "He defeated the enemies and saved his land"], answer: 2 },
    ],
    fact: { kk: "«Қобыланды батыр» — қазақтың батырлық жырларының бірі, оны жыраулар ғасырлар бойы айтқан.", en: "\"Qobylandy batyr\" is a Kazakh heroic epic, sung by storytellers (zhyrau) for centuries." },
  },
  {
    id: "alpamys", name: "Alpamys batyr", kk: "Алпамыс батыр", rarity: "epos", ornament: "tumar",
    scene: "Alpamys was a mighty hero who loved the beautiful Gulbarshyn. When enemies took his people's herds, Alpamys rode out alone to bring them back. The enemies could not beat him in a fair fight, so they gave him strong drink and tricked him. Then they threw him into a deep pit. He stayed there for seven years, but he never lost hope. At last, with the help of a kind girl, he escaped. He came home just in time to save Gulbarshyn and his family.",
    qs: [
      { kind: "tf", s: "Alpamys rode out alone to bring back the herds.", a: true },
      { kind: "mc", s: "How did the enemies catch Alpamys?", options: ["They beat him in a fair fight", "They gave him strong drink and tricked him", "He got lost in the mountains"], answer: 1 },
      { kind: "gap", s: "Enemies tricked him and threw him into a deep ___.", options: ["river", "pit", "forest"], answer: 1 },
      { kind: "tf", s: "Alpamys stayed in the pit for seven years.", a: true },
      { kind: "tf", s: "Alpamys lost all hope.", a: false },
      { kind: "gap", s: "He escaped with the help of a kind ___.", options: ["girl", "king", "wolf"], answer: 0 },
    ],
    fact: { kk: "«Алпамыс» жыры қазақ, өзбек және басқа түркі халықтарында бар.", en: "The Alpamys epic is shared by Kazakhs, Uzbeks and other Turkic peoples." },
  },
  {
    id: "qyzzhibek", name: "Qyz Jibek", kk: "Қыз Жібек", rarity: "epos", ornament: "shanyraq",
    scene: "Zhibek was the most beautiful girl of her tribe. A young man named Tolegen heard about her and travelled far across the steppe to meet her. Many rich men wanted to marry Zhibek, but she chose Tolegen. They fell in love and promised to be together. But on his way back to her, jealous enemies attacked Tolegen. He died on the steppe, and Zhibek was heartbroken. Their sad love story is still sung today.",
    qs: [
      { kind: "tf", s: "Tolegen travelled far to meet Zhibek.", a: true },
      { kind: "gap", s: "Many rich men wanted to ___ Zhibek.", options: ["paint", "visit", "marry"], answer: 2 },
      { kind: "tf", s: "Zhibek chose Tolegen.", a: true },
      { kind: "mc", s: "Who attacked Tolegen?", options: ["A pack of wolves", "Jealous enemies", "Zhibek's brothers"], answer: 1 },
      { kind: "tf", s: "Their story has a happy ending.", a: false },
      { kind: "gap", s: "Their sad love story is still ___ today.", options: ["sung", "sold", "built"], answer: 0 },
    ],
    fact: { kk: "«Қыз Жібек» — лиро-эпостық жыр. 1970 жылы ол бойынша атақты фильм түсірілді.", en: "\"Qyz Zhibek\" is a lyric epic. A famous Kazakh film was made from it in 1970." },
  },
  {
    id: "qozy", name: "Qozy Körpeş – Baıan Sulu", kk: "Қозы Көрпеш – Баян сұлу", rarity: "epos", ornament: "tumar",
    scene: "Before Kozy and Bayan were born, their fathers, Sarybai and Karabai, promised that their children would marry. Sadly, Sarybai died before his son Kozy was born. Years later, Bayan's father Karabai broke his promise. He moved far away with his herds and his daughter. Kozy grew up, found Bayan, and they fell in love. Kozy and Bayan stayed true to each other until the end. People say their tomb still stands near Ayagoz.",
    qs: [
      { kind: "gap", s: "Their fathers ___ that their children would marry.", options: ["forgot", "promised", "refused"], answer: 1 },
      { kind: "tf", s: "Kozy's father died before Kozy was born.", a: true },
      { kind: "tf", s: "Bayan's father kept his promise.", a: false },
      { kind: "gap", s: "He moved far away with his ___ and his daughter.", options: ["herds", "books", "ships"], answer: 0 },
      { kind: "tf", s: "Kozy and Bayan stayed true to each other.", a: true },
      { kind: "mc", s: "Where does their tomb stand?", options: ["In Almaty", "By the Caspian Sea", "Near Ayagoz"], answer: 2 },
    ],
    fact: { kk: "Аягөз маңында Қозы Көрпеш пен Баян сұлу кесенесі бар.", en: "A mausoleum named after Kozy Korpesh and Bayan Sulu stands near Ayagoz." },
  },
  {
    id: "qorqyt", name: "Qorqyt Ata", kk: "Қорқыт Ата", rarity: "anyz", ornament: "shanyraq",
    scene: "Korkyt was a wise man and a great musician. One night he dreamed that he would die young. He was afraid, so he rode to every corner of the world to find a place without death. But everywhere he went, people were digging a grave, and they said it was for Korkyt. He came back to the Syr Darya river and made the first kobyz from wood. He played it day and night. While he played, death could not come near him.",
    qs: [
      { kind: "tf", s: "Korkyt dreamed that he would die young.", a: true },
      { kind: "tf", s: "Korkyt found a place where nobody died.", a: false },
      { kind: "mc", s: "Who was the grave for?", options: ["For a khan", "For Korkyt", "For his horse"], answer: 1 },
      { kind: "gap", s: "He came back to the Syr Darya ___.", options: ["mountain", "river", "city"], answer: 1 },
      { kind: "gap", s: "He made the first kobyz from ___.", options: ["wood", "stone", "gold"], answer: 0 },
      { kind: "tf", s: "Korkyt played the kobyz day and night.", a: true },
    ],
    fact: { kk: "Қорқыт ата кесенесі Қызылорда облысында, Сырдария бойында тұр.", en: "The Korkyt Ata memorial stands by the Syr Darya in the Kyzylorda region." },
  },
  {
    id: "asan", name: "Asan Qaıǵy", kk: "Асан Қайғы", rarity: "anyz", ornament: "qoshqar",
    scene: "Asan was a wise man who worried about his people. Life on the steppe was hard: cold winters, dry summers and hungry animals. So he rode his fast camel Zhelmaya across the steppe. He was looking for Zheruiyk, a land where people would never be hungry or sad. On his way he gave advice about every place he saw: where the water was good and where the grass was rich. He searched all his life, and people still remember his words today.",
    qs: [
      { kind: "gap", s: "Asan was a wise man who ___ about his people.", options: ["laughed", "worried", "forgot"], answer: 1 },
      { kind: "tf", s: "Asan rode a fast horse.", a: false },
      { kind: "mc", s: "What was Asan looking for?", options: ["A lost camel", "A new khan", "A land where people are never hungry or sad"], answer: 2 },
      { kind: "tf", s: "Zheruiyk was a land without hunger.", a: true },
      { kind: "gap", s: "He told people where the water was good and where the ___ was rich.", options: ["grass", "gold", "sand"], answer: 0 },
      { kind: "tf", s: "Asan searched all his life.", a: true },
    ],
    fact: { kk: "Жерұйық — қазақ аңызындағы бақытты мекен. Асан Қайғы XV ғасырда өмір сүрген деп саналады.", en: "Zheruiyk is the land of happiness in Kazakh legend. Asan Kaigy is said to have lived in the 15th century." },
  },
  {
    id: "tomiris", name: "Tomırıs", kk: "Томирис", rarity: "tarih", ornament: "tumar",
    scene: "Tomiris was the queen of the Massagetae, nomads of the steppe. The great Persian king Cyrus wanted to take her land. First he asked Tomiris to marry him, but she said no. Then Cyrus tricked her army and captured her son. Tomiris was angry, and she led her army against him in a great battle. Around 530 BC her warriors defeated the Persian army, and Cyrus was killed.",
    qs: [
      { kind: "gap", s: "Tomiris was the queen of the Massagetae, ___ of the steppe.", options: ["nomads", "farmers", "sailors"], answer: 0 },
      { kind: "tf", s: "Tomiris was a Persian queen.", a: false },
      { kind: "mc", s: "What did Cyrus want?", options: ["To trade horses", "To take her land", "To learn her language"], answer: 1 },
      { kind: "tf", s: "Tomiris agreed to marry Cyrus.", a: false },
      { kind: "gap", s: "Cyrus tricked her army and captured her ___.", options: ["horse", "city", "son"], answer: 2 },
      { kind: "tf", s: "Her army defeated Cyrus.", a: true },
    ],
    fact: { kk: "Томирис туралы грек тарихшысы Геродот жазған.", en: "The Greek historian Herodotus wrote about Tomiris." },
  },
  {
    id: "khanate", name: "Kereı men Jänibek", kk: "Керей мен Жәнібек", rarity: "tarih", ornament: "shanyraq",
    scene: "In the fifteenth century, much of the Kazakh steppe was ruled by Abulkhair Khan. Two leaders, Kerey and Zhanibek, did not agree with him. They moved with their people to the Zhetysu region, the land of seven rivers. Many families joined them there, and their people grew strong. This was the beginning of the Kazakh Khanate, the first Kazakh state. Kerey became its first khan.",
    qs: [
      { kind: "mc", s: "Why did Kerey and Zhanibek move away?", options: ["The winter was too cold", "They did not agree with Abulkhair Khan", "They were looking for gold"], answer: 1 },
      { kind: "tf", s: "Kerey and Zhanibek moved to Zhetysu.", a: true },
      { kind: "gap", s: "Zhetysu is the land of seven ___.", options: ["rivers", "mountains", "cities"], answer: 0 },
      { kind: "gap", s: "This was the beginning of the Kazakh ___.", options: ["Empire", "Republic", "Khanate"], answer: 2 },
      { kind: "tf", s: "The Kazakh Khanate began in the twentieth century.", a: false },
      { kind: "tf", s: "Kerey became the first khan.", a: true },
    ],
    fact: { kk: "Қазақ хандығы 1465 жылы құрылған деп саналады. 2015 жылы оның 550 жылдығы тойланды.", en: "The Kazakh Khanate is dated to 1465. Kazakhstan celebrated its 550th anniversary in 2015." },
  },
  {
    id: "abylai", name: "Abylaı han", kk: "Абылай хан", rarity: "tarih", ornament: "qoshqar",
    scene: "In the eighteenth century the Dzungars attacked the Kazakh steppe, and many Kazakh families lost their homes. A young warrior named Abilmansur fought bravely against them. In one famous battle he defeated a strong Dzungar warrior in a single fight, shouting the name of his grandfather, Abylai. From that day people called him Abylai. He was a wise leader as well as a brave fighter. He united many Kazakh clans, and in 1771 he became khan of the Kazakhs.",
    qs: [
      { kind: "tf", s: "Abylai fought against the Dzungars.", a: true },
      { kind: "gap", s: "He defeated a strong Dzungar warrior in a single ___.", options: ["race", "fight", "song"], answer: 1 },
      { kind: "mc", s: "Whose name did he shout in battle?", options: ["His horse's", "The Dzungar khan's", "His grandfather's"], answer: 2 },
      { kind: "tf", s: "Abylai was his name from birth.", a: false },
      { kind: "gap", s: "He ___ many Kazakh clans.", options: ["divided", "united", "left"], answer: 1 },
      { kind: "tf", s: "Abylai became khan in 1871.", a: false },
    ],
    fact: { kk: "Абылай ханның есімі Алматыдағы даңғыл мен университетке берілген.", en: "An avenue and a university in Almaty are named after Abylai Khan." },
  },
  {
    id: "shoqan", name: "Şoqan Uälıhanov", kk: "Шоқан Уәлиханов", rarity: "tarih", ornament: "tumar",
    scene: "Shokan Ualikhanov was a Kazakh scholar and traveller. He studied in Omsk, where he became friends with the writer Fyodor Dostoevsky. In 1858 he made a dangerous journey to Kashgar, dressed as a merchant. He wrote down songs, legends and the history of the peoples he met. He also drew maps and pictures of what he saw. He was only twenty-nine when he died, but his work is still read today.",
    qs: [
      { kind: "mc", s: "Where did Shokan study?", options: ["In Omsk", "In London", "In Kashgar"], answer: 0 },
      { kind: "tf", s: "Shokan was friends with the writer Dostoevsky.", a: true },
      { kind: "gap", s: "He travelled to Kashgar dressed as a ___.", options: ["soldier", "merchant", "monk"], answer: 1 },
      { kind: "tf", s: "Shokan travelled to Kashgar.", a: true },
      { kind: "gap", s: "He wrote down songs, legends and ___.", options: ["recipes", "letters", "history"], answer: 2 },
      { kind: "tf", s: "Shokan lived to be very old.", a: false },
    ],
    fact: { kk: "Шоқан қырғыздың «Манас» жырынан үзінді жазып алған алғашқы ғалымдардың бірі.", en: "Shokan was one of the first scholars to write down part of the Kyrgyz epic Manas." },
  },
];
