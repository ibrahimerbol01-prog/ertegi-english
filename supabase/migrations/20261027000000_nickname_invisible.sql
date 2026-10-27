-- Nicknames: no invisible characters or non-ASCII spaces, so two learners
-- can't look like the same name in the teacher's grid ("Aru" vs "Aru"+NBSP).
-- The app already strips them before joining; this keeps the rule for any
-- other client. NOT VALID: rows from before stay as they are. Safe to run again.

alter table public.class_members drop constraint if exists class_members_bad_nickname_invisible;
alter table public.class_members add constraint class_members_bad_nickname_invisible
  check (nickname !~ '[ ­͏؜ᅟᅠ឴឵᠎ -‏ -  -⁯　ㅤ﻿]')
  not valid;
