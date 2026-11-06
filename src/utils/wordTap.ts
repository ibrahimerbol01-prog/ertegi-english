import { glossKey, glossKeys } from "./gloss";
import type { EventPayload } from "./events";

/* A tap on a word in the reader (ReaderScreen.tsx): the glossary meaning shown to
   the learner and the word_tap event (docs/events.md). Pure, so it is tested on
   its own; the event fields are part of the study's data, keep them stable. */
export function wordTap(word: string, glossary: Record<string, string>, storyId: string, level: string, duringAudio: boolean): {
  translation: string | undefined;
  event: EventPayload;
} {
  const key = glossKey(word, glossary);
  const translation = key ? glossary[key] : undefined;
  return {
    translation,
    event: {
      object_type: "word", object_id: key ?? glossKeys(word)[2],
      story_id: storyId, level,
      result: { has_translation: !!translation, during_audio: duringAudio },
    },
  };
}
