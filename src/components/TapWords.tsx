import { tokens } from "../utils/tapText";

/* English text where every word is a button (landing sample, guest reader). The caller
   looks the meaning up (utils/tapText.ts). It logs nothing and saves nothing: it is
   used before sign-in. */
export function TapWords({ text, active, onTap, className = "" }: {
  text: string;
  /** Index of the selected word, highlighted with sun-hl. */
  active: number | null;
  onTap: (word: string, index: number) => void;
  className?: string;
}) {
  return (
    <p className={className}>
      {tokens(text).map((tok, k) => {
        if (tok.word === null) return tok.text;
        const index = tok.word;
        const on = active === index;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onTap(tok.text, index)}
            aria-pressed={on}
            className={`inline-block min-w-6 text-center rounded-md px-0.5 -mx-0.5 py-1 focus-visible:outline-2 focus-visible:outline-sky-ink ${on ? "bg-sun-hl" : "hover:bg-sun-soft"}`}
          >
            {tok.text}
          </button>
        );
      })}
    </p>
  );
}
