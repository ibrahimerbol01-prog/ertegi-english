import { bestBrowserVoice, speakClip, stopClip } from "./narration";

/* Every "listen" button in the app: the neural Azure voice first, the best
   English browser voice if that service can't be reached. */
export const safePlayVoice = (text: string, onFallback?: (msg?: string) => void, rate = 1) => {
  speakClip(text, rate).catch(() => browserSpeak(text, rate, onFallback));
};

export const stopVoice = () => stopClip();

function browserSpeak(text: string, rate: number, onFallback?: (msg?: string) => void) {
  try {
    if (!("speechSynthesis" in window)) {
      onFallback?.("Speech synthesis not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = bestBrowserVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "en-US";
    utterance.rate = rate;
    utterance.onerror = (e) => console.warn("Speech synthesis error:", e);
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Voice playback failed:", err);
  }
}
