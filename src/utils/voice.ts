export const safePlayVoice = (text: string, onFallback?: (msg?: string) => void) => {
  try {
    if (!("speechSynthesis" in window)) {
      if (onFallback) onFallback("Speech synthesis not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 0.6;
    utterance.lang = "en-US";
    utterance.onerror = (e) => console.warn("Speech synthesis error:", e);
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Voice playback failed:", err);
  }
};
