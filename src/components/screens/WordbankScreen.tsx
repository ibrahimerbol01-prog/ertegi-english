import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Volume2 } from "lucide-react";
import { safePlayVoice } from "../../utils/voice";
import { glossKey } from "../../utils/gloss";
import { WORD_TRANSLATIONS } from "../../constants";
import { DICT } from "../../dict";
import { useLang } from "../../lang";
import type { SavedWord } from "../../types";
import { WordsHeader } from "./WordsScreens";
import { EXCLUDED_UNTIL_DELAYED_TEST, POS_GROUPS, WORDBANK_LEVELS, WORDBANK_SOURCES, cardWord, posGroup, type PosGroup, type WordbankLevel } from "../../data/wordbank/config";
import { loadWordbankLevel } from "../../data/wordbank";
import type { WordbankEntry } from "../../data/wordbank/types";

/* «Сөздік қоры»: the CEFR word lists by level and part of speech (ordinary
   site only, never in the research build: KazakhTalesApp.tsx). Each level is
   its own chunk, loaded when picked. A word goes into the learner's existing
   flashcards (spaced repetition) with the app's own Kazakh gloss; a word the
   glossary does not have yet cannot be added, since a card needs a meaning. */

const PAGE = 60;
const excluded = new Set(EXCLUDED_UNTIL_DELAYED_TEST);
const POS_LABEL: Record<PosGroup, "wbNouns" | "wbVerbs" | "wbAdjectives" | "wbOther"> = {
  noun: "wbNouns", verb: "wbVerbs", adjective: "wbAdjectives", other: "wbOther",
};


export default function WordbankScreen({ savedWords, onAdd, mode, setMode }: {
  savedWords: SavedWord[];
  onAdd: (word: string, translation: string) => void;
  mode?: string;
  setMode?: (m: string) => void;
}) {
  const lang = useLang();
  const t = DICT[lang === "kk" ? "kk" : "en"];
  const [level, setLevel] = useState<WordbankLevel>("A1");
  const [group, setGroup] = useState<PosGroup>("noun");
  const [data, setData] = useState<{ level: WordbankLevel; words: WordbankEntry[] } | null>(null);
  const [failed, setFailed] = useState<WordbankLevel | null>(null);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    let live = true;
    loadWordbankLevel(level).then(
      (words) => { if (live) setData({ level, words }); },
      () => { if (live) setFailed(level); },
    );
    return () => { live = false; };
  }, [level]);

  const saved = useMemo(() => new Set(savedWords.map((w) => w.word.toLowerCase())), [savedWords]);
  const list = useMemo(
    () => (data && data.level === level ? data.words.filter((e) => posGroup(e.pos) === group && !excluded.has(cardWord(e.word).toLowerCase())) : null),
    [data, level, group],
  );
  const pick = (l: WordbankLevel) => { setLevel(l); setShown(PAGE); setFailed(null); };
  const pickGroup = (g: PosGroup) => { setGroup(g); setShown(PAGE); };

  return (
    <div className="animate-pop-in">
      <WordsHeader mode={mode} setMode={setMode} />

      <p className="eyebrow mb-2">{t.wbLevel}</p>
      <div className="segmented mb-4" role="group" aria-label={t.wbLevel}>
        {WORDBANK_LEVELS.map((l) => (
          <button key={l} aria-pressed={level === l} onClick={() => pick(l)}>{l}</button>
        ))}
      </div>
      <p className="eyebrow mb-2">{t.wbPos}</p>
      <div className="segmented mb-5" role="group" aria-label={t.wbPos}>
        {POS_GROUPS.map((g) => (
          <button key={g} aria-pressed={group === g} onClick={() => pickGroup(g)}>{t[POS_LABEL[g]]}</button>
        ))}
      </div>

      {failed === level ? (
        <p role="alert" className="card p-4 text-[15px] text-ink-2">{t.wbLoadError}</p>
      ) : !list ? (
        <p className="card p-4 text-[15px] text-ink-2" aria-live="polite">{t.wbLoading}</p>
      ) : (
        <>
          <p className="text-sm text-ink-2 mb-3" aria-live="polite">{list.length} {t.wbCount}</p>
          <ul className="card overflow-hidden divide-y divide-line">
            {list.slice(0, shown).map((e) => {
              const word = cardWord(e.word);
              const key = glossKey(word, WORD_TRANSLATIONS);
              const translation = key ? WORD_TRANSLATIONS[key] : "";
              const isSaved = saved.has(word.toLowerCase());
              return (
                <li key={`${e.word}|${e.pos}`} className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-extrabold text-[17px] text-ink">
                      <span lang="en">{e.word}</span> <span className="text-sm font-bold text-ink-3">{e.pos}</span>
                    </p>
                    {translation && <p className="text-[15px] text-ink-2">{translation}</p>}
                    {e.example && (
                      <p className="text-sm text-ink-2 mt-1">
                        <span className="text-ink-3">{t.wbExampleFrom}: </span><span lang="en">{e.example.text}</span>
                      </p>
                    )}
                  </div>
                  <button type="button" onClick={() => safePlayVoice(word)} aria-label={`${t.wbListen}: ${word}`} className="btn btn-ghost btn-sm shrink-0">
                    <Volume2 size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={isSaved || !translation}
                    onClick={() => onAdd(word, translation)}
                    aria-label={`${isSaved ? t.wbAdded : translation ? t.wbAdd : t.wbNoTranslation}: ${word}`}
                    title={isSaved ? t.wbAdded : translation ? t.wbAdd : t.wbNoTranslation}
                    className="btn btn-ghost btn-sm shrink-0 disabled:opacity-50"
                  >
                    {isSaved ? <Check size={16} /> : <Plus size={16} />}
                  </button>
                </li>
              );
            })}
          </ul>
          {shown < list.length && (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="btn btn-ghost w-full mt-4">{t.wbMore}</button>
          )}
        </>
      )}

      <section className="mt-8 text-xs text-ink-3 space-y-1" aria-label={t.wbSources}>
        <p className="font-bold">{t.wbSources}</p>
        {WORDBANK_SOURCES.map((s) => (
          <p key={s.id} lang="en">{s.attribution} {s.licence}. <a className="underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.url}</a></p>
        ))}
      </section>
    </div>
  );
}
