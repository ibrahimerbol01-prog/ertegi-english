import { STORIES } from "../constants";
import { RESEARCH_MODE } from "./mode";

/** The five tales of the study (docs/research-design/study-design.md, section 0). */
export const STUDY_STORY_IDS = ["er_tostik", "tazsha_bala", "ayaz_bi", "asan_kaigy", "alpamys"] as const;

/** Only the study tales, in the study order. */
export function studyStories<T extends { id: string }>(list: readonly T[]): T[] {
  return STUDY_STORY_IDS.map((id) => list.find((s) => s.id === id)).filter((s): s is T => !!s);
}

/** The tales the learner sees: all of them, or only the five study tales in the research build. */
export const APP_STORIES: typeof STORIES = RESEARCH_MODE ? studyStories(STORIES) : STORIES;
