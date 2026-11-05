-- R4/R5: the research build (docs/research-build.md).
-- 1. learner_state gets the kind 'study_code': the participant code the
--    learner types once (ERT-NNNC), key 'code', value { code, at }.
-- 2. learning_events gets the verbs 'test_answer' and 'test_complete' of the
--    vocabulary test (src/research/test, docs/events.md).
-- Both checks are only widened: every row allowed before is allowed after.
-- Needs 20261105000000_learning_events.sql and 20261106000000_learner_state.sql.
-- Safe to run more than once.

alter table public.learner_state drop constraint if exists learner_state_kind_check;
alter table public.learner_state add constraint learner_state_kind_check check (kind in (
  'card', 'maqal', 'known_word', 'council_vote', 'debate', 'trail', 'trail_draft',
  'study_code'    -- 'code'; value: { code: 'ERT-NNNC', at } (research build only)
));

alter table public.learning_events drop constraint if exists learning_events_verb_check;
alter table public.learning_events add constraint learning_events_verb_check check (verb in (
  'session_start', 'story_open', 'level_complete', 'word_tap', 'audio_play',
  'quiz_answer', 'quiz_complete', 'srs_review', 'word_save',
  'daily_words_seen', 'daily_word_known', 'council_vote', 'trail_entry',
  'debate_entry', 'shoqan_open', 'shoqan_message', 'pronunciation_attempt',
  'test_answer', 'test_complete'
));

-- A participant code is one per learner and has the code's shape; anything
-- else under this kind is refused.
alter table public.learner_state drop constraint if exists learner_state_study_code_shape;
alter table public.learner_state add constraint learner_state_study_code_shape check (
  kind <> 'study_code'
  or (key = 'code' and (value is null
      or (jsonb_typeof(value) = 'object' and coalesce(value->>'code', '') ~ '^ERT-[0-9]{4}$')))
);
