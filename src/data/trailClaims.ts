/* "Ой ізі" (Thinking trail): the claim question for each tale, and how a
   level's text is cut into the sentences a learner taps as evidence. Shared by
   the trail itself and the teacher's view of it (Teacher.tsx), so evidence
   ids in trail_entries point at the same sentences on both sides. */

export const CLAIMS: Record<string, { en: string; kk: string }> = {
  aldar_kose: { en: "Was Aldar Köse right to take the coat?", kk: "Алдар Көсе шапанды алып дұрыс істеді ме?" },
  zhirenshe: { en: "Is a wise word stronger than a khan's power?", kk: "Дана сөз ханның билігінен күшті ме?" },
  er_tostik: { en: "Was Er Tostik right to fight when it was \"not his fight\"?", kk: "«Бұл менің соғысым емес» болса да, Ер Төстік соғысып дұрыс істеді ме?" },
  tazsha_bala: { en: "Was it right for Tazsha to trick the giant?", kk: "Тазша дәуді алдап дұрыс істеді ме?" },
  ayaz_bi: { en: "Was Ayaz Bi right not to shout at the bad men?", kk: "Аяз би жаман адамдарға айғайламай дұрыс істеді ме?" },
  asan_kaigy: { en: "Was Asan Kaigy's long journey worth it?", kk: "Асан Қайғының ұзақ сапары керек пе еді?" },
  alpamys: { en: "Is hope stronger than a prison?", kk: "Үміт зынданнан күшті ме?" },
};

// Sentence i here is evidence id i in trail_entries.
export const splitSentences = (text: string) => (text.match(/[^.!?]+[.!?]+["”]?/g) ?? [text]).map((s) => s.trim());
