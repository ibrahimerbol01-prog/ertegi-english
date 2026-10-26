/* Steppe Council (Peer Instruction, Mazur): one question per tale that needs
   the reader to interpret, not just find a word. Every wrong option is a
   common misreading, and every option has a short reason, written as Shoqan,
   shown while there are too few classmates' votes to show theirs. */

export interface CouncilQuestion {
  id: string;
  storyId: string;
  prompt: string;
  promptKk: string;
  options: string[];
  correct: number;
  // The line that settles it, from the A2 text.
  evidence: string;
  reasons: string[];
}

const WRITTEN: CouncilQuestion[] = [
  {
    id: "aldar_kose:why-praise",
    storyId: "aldar_kose",
    prompt: "Why did the villagers praise Aldar Köse?",
    promptKk: "Ауыл адамдары Алдар Көсені неге мақтады?",
    options: [
      "Because he was rich now",
      "Because a poor man outsmarted a rich man",
      "Because he found a lost coat",
      "Because he saved them from a wolf",
    ],
    correct: 1,
    evidence: "When the villagers hear the story, they laugh too and praise Aldar Köse for his clever trick.",
    reasons: [
      "He had a fine coat and a horse now, so people respected him.",
      "They laughed at the story. A poor man used his head and beat a rich man.",
      "The coat was on the ground, so maybe it was lost.",
      "He shouted about a wolf, so maybe there was a real wolf.",
    ],
  },
  {
    id: "zhirenshe:heaviest",
    storyId: "zhirenshe",
    prompt: "Why is a cruel word \"the heaviest thing\"?",
    promptKk: "Неге қатыгез сөз «ең ауыр нәрсе»?",
    options: [
      "Because it is hard to say",
      "Because people carry it in their hearts for years",
      "Because the khan's words are heavy",
      "Because words can break things like stones",
    ],
    correct: 1,
    evidence: "\"A cruel word is the heaviest thing, because people carry it in their hearts for many long years.\"",
    reasons: [
      "Saying something cruel is difficult, so it feels heavy.",
      "You can't see it, but it stays inside a person for a long time.",
      "The khan is powerful, so his words weigh more.",
      "A cruel word can hurt like a stone.",
    ],
  },
  {
    id: "er_tostik:why-fight",
    storyId: "er_tostik",
    prompt: "Er Tostik thought \"This is not my fight\". Why did he fight the dragon?",
    promptKk: "Ер Төстік «бұл менің соғысым емес» деп ойлады. Неге айдаһармен соғысты?",
    options: [
      "He wanted the dragon's gold",
      "His horse reminded him that the little birds needed him",
      "The dragon attacked him first",
      "Samruk told him to fight",
    ],
    correct: 1,
    evidence: "But Shalkuiryk said, \"Be brave. The little birds need you.\"",
    reasons: [
      "Heroes in tales often fight for treasure.",
      "He was afraid, but his horse told him the babies needed help, so he chose to be brave.",
      "Dragons are dangerous, so it probably attacked him.",
      "Samruk helped him later, so maybe she asked him first.",
    ],
  },
  {
    id: "tazsha_bala:why-run",
    storyId: "tazsha_bala",
    prompt: "Why did the giant run away from the village?",
    promptKk: "Дәу ауылдан неге қашып кетті?",
    options: [
      "Tazsha hit him with a stone",
      "He believed Tazsha was stronger than him",
      "The villagers chased him away",
      "He was hungry and went to find food",
    ],
    correct: 1,
    evidence: "\"He can squeeze water from a stone!\" the giant thought. \"He is stronger than me!\"",
    reasons: [
      "There was a stone in the story, so Tazsha used it to fight.",
      "He saw water come out of the \"stone\" and thought the boy was very strong.",
      "Everyone was afraid of the giant, so they made him go.",
      "Giants eat a lot, so he left to look for food.",
    ],
  },
  {
    id: "ayaz_bi:old-clothes",
    storyId: "ayaz_bi",
    prompt: "Why did Ayaz Bi keep his old clothes in the chest?",
    promptKk: "Аяз би ескі киімін неге сандықта сақтады?",
    options: [
      "To hide gold under them",
      "To remember where he came from",
      "Because he had no other clothes",
      "To sell them later",
    ],
    correct: 1,
    evidence: "Ayaz said, \"I look at my old clothes every day. I say, Ayaz, alindi bil. It means, Ayaz, know your measure.\"",
    reasons: [
      "The rich men said he hid gold there.",
      "He looked at them every day so he would not forget he was a poor shepherd.",
      "He was poor before, so maybe he still had nothing else.",
      "Old things can be sold at the bazaar.",
    ],
  },
  {
    id: "asan_kaigy:understood",
    storyId: "asan_kaigy",
    prompt: "What did Asan Kaigy finally understand?",
    promptKk: "Асан Қайғы ақырында нені түсінді?",
    options: [
      "Zheruiyk is far beyond the steppe",
      "A happy land is made by people who take care of their home",
      "His camel was too slow to find it",
      "He should have stayed with the khan",
    ],
    correct: 1,
    evidence: "His own land had water and grass. It only needed people to take care of it.",
    reasons: [
      "He did not find it, so it must be very far away.",
      "His own land already had water and grass. People only had to look after it together.",
      "He travelled for years, so maybe the camel was the problem.",
      "At the khan's side he had food and a warm home.",
    ],
  },
  {
    id: "alpamys:way-out",
    storyId: "alpamys",
    prompt: "What helped Alpamys get out of the pit?",
    promptKk: "Алпамысқа шұңқырдан шығуға не көмектесті?",
    options: [
      "His sword",
      "Karlyga's kindness, and his own hope",
      "Taishyk let him go",
      "Gulbarshyn came to save him",
    ],
    correct: 1,
    evidence: "One night she brought Baishubar and a rope to the pit. She tied the long rope to the horse.",
    reasons: [
      "He was a batyr, and batyrs fight their way out.",
      "Karlyga brought his horse and a rope, and he never gave up hope.",
      "Seven years is a long time, so maybe the khan forgot him.",
      "She loved him, so she came to help.",
    ],
  },
];

// Written with the right answer second; turn each question's options so the
// right one lands in a different place from tale to tale.
const SHIFT = [3, 1, 0, 2, 3, 0, 2];
export const COUNCIL: CouncilQuestion[] = WRITTEN.map((q, i) => {
  const k = SHIFT[i % SHIFT.length];
  const turn = <T,>(xs: T[]) => [...xs.slice(k), ...xs.slice(0, k)];
  return { ...q, options: turn(q.options), reasons: turn(q.reasons), correct: (q.correct - k + q.options.length) % q.options.length };
});
