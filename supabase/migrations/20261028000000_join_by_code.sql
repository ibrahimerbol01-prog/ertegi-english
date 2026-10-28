-- Learners join a class with the code only. The name in the teacher's grid
-- comes from the learner's profile (display name, else the part of the email
-- before @), and gets " 2", " 3"… when the class already has that name.
--
-- Also rewrites the invisible-character rule from 20261027000000 with ASCII
-- \u escapes: pasted into the SQL editor, the literal invisible characters can
-- get lost and turn the class into a range that blocks ordinary letters.
-- Safe to run again.

alter table public.class_members drop constraint if exists class_members_bad_nickname_invisible;
alter table public.class_members add constraint class_members_bad_nickname_invisible
  check (nickname !~ '[\u00a0\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180e\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\u3164\ufeff]')
  not valid;

create or replace function public.join_class(p_code text)
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c public.classes;
  m public.class_members;
  base text;
  nick text;
  n int := 1;
  already_in boolean;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select * into c from classes where code = upper(btrim(coalesce(p_code, ''))) and archived_at is null for update;
  if not found then raise exception 'class_not_found'; end if;
  if c.teacher_id = auth.uid() then raise exception 'own_class'; end if;
  select * into m from class_members where class_id = c.id and user_id = auth.uid();
  if found and m.removed then raise exception 'removed'; end if;
  already_in := found and m.left_at is null;
  if already_in then
    return json_build_object('class_id', c.id, 'name', c.name);
  end if;
  if (select count(*) from class_members where class_id = c.id and left_at is null) >= 60 then
    raise exception 'class_full';
  end if;

  select coalesce(
    nullif(btrim(p.display_name), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(u.email, '@', 1), ''),
    'Оқушы')
  into base
  from auth.users u left join profiles p on p.id = u.id
  where u.id = auth.uid();
  base := coalesce(base, 'Оқушы');
  base := regexp_replace(base, '[[:cntrl:]\u00a0\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180e\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\u3164\ufeff]', '', 'g');
  base := left(btrim(regexp_replace(base, '\s+', ' ', 'g')), 26);
  if base = '' then base := 'Оқушы'; end if;

  nick := base;
  while exists (
    select 1 from class_members
    where class_id = c.id and left_at is null and user_id <> auth.uid() and lower(btrim(nickname)) = lower(nick)
  ) loop
    n := n + 1;
    nick := base || ' ' || n;
  end loop;

  insert into class_members (class_id, user_id, nickname)
  values (c.id, auth.uid(), nick)
  on conflict (class_id, user_id) do update set nickname = excluded.nickname, left_at = null
  where not class_members.removed;
  return json_build_object('class_id', c.id, 'name', c.name);
end;
$$;

revoke all on function public.join_class(text) from public, anon;
grant execute on function public.join_class(text) to authenticated;
