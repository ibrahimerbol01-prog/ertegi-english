-- R9: the learner's own assent to take part in the study (research build,
-- docs/research-build.md, "Согласие ученика"). One record per learner in
-- learner_state: kind 'study_assent', key 'assent', value
-- { version, answer: 'yes' | 'no', at, sample } where version is the version
-- of the assent text the learner saw (src/data/studyAssent.json).
-- This is the learner's assent only. The parent's consent is collected on paper
-- before the participant code is handed out (ethics-consent-package.md, 1 and 2).
-- The check is only widened: every row allowed before is allowed after.
-- Needs 20261106000000_learner_state.sql and 20261109000000_study_code.sql.
-- Safe to run more than once.

alter table public.learner_state drop constraint if exists learner_state_kind_check;
alter table public.learner_state add constraint learner_state_kind_check check (kind in (
  'card', 'maqal', 'known_word', 'council_vote', 'debate', 'trail', 'trail_draft',
  'study_code',   -- 'code'; value: { code: 'ERT-NNNC', at } (research build only)
  'study_assent'  -- 'assent'; value: { version, answer: 'yes'|'no', at, sample } (research build only)
));

alter table public.learner_state drop constraint if exists learner_state_study_assent_shape;
alter table public.learner_state add constraint learner_state_study_assent_shape check (
  kind <> 'study_assent'
  or (key = 'assent' and (value is null
      or (jsonb_typeof(value) = 'object'
          and coalesce(value->>'answer', '') in ('yes', 'no')
          and char_length(coalesce(value->>'version', '')) between 1 and 40)))
);
