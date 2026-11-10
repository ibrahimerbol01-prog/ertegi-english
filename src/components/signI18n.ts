import { useLang } from "../lang";

/* Interface text of the sign mode. It lives next to the feature, not in dict.ts,
   so the research build and the first screens carry none of it. */

export const SIGN_T = {
  kk: {
    mode: "Жест режимі",
    modeHint: "Жест бейнесі бар сөздерде жест түймесі үлкен болып көрінеді. Дыбыс түймелері өзгеріссіз қалады.",
    on: "Қосулы",
    off: "Өшірулі",
    show: "Жестті көрсету",
    hide: "Жестті жасыру",
    countLevel: "Бұл деңгейде жест бейнесі бар сөздер:",
    noneLevel: "Бұл деңгейде жест бейнесі бар сөздер әлі жоқ.",
    loadError: "Жест бейнелерінің тізімі жүктелмеді. Интернет байланысын тексер.",
    videoLabel: "Жест бейнесі",
    controls: "Бейне басқаруы",
    play: "Ойнату",
    pause: "Кідірту",
    replay: "Қайта көрсету",
    slow: "Баяу (0,5×)",
    mirror: "Айна",
    error: "Бейне ашылмады. Интернет байланысын тексер.",
    retry: "Қайталау",
    by: "Көрсеткен",
    checked: "Тексерген",
    language: "Жест тілі",
    sample: "Үлгі",
    sampleNote: "Нақты жест емес: сынақ бейне.",
  },
  en: {
    mode: "Sign mode",
    modeHint: "Words with a sign video get a larger sign button. The sound buttons stay as they are.",
    on: "On",
    off: "Off",
    show: "Show sign video",
    hide: "Hide sign video",
    countLevel: "Words with a sign video at this level:",
    noneLevel: "No words at this level have a sign video yet.",
    loadError: "The list of sign videos did not load. Check your connection.",
    videoLabel: "Sign video",
    controls: "Video controls",
    play: "Play",
    pause: "Pause",
    replay: "Replay",
    slow: "Slow (0.5×)",
    mirror: "Mirror",
    error: "The video did not open. Check your connection.",
    retry: "Try again",
    by: "Signed by",
    checked: "Reviewed by",
    language: "Sign language",
    sample: "Placeholder",
    sampleNote: "Not a real sign: a placeholder video.",
  },
} as const;

export type SignText = { [K in keyof (typeof SIGN_T)["kk"]]: string };

export const useSignT = (): SignText => SIGN_T[useLang() === "kk" ? "kk" : "en"];
