# Карта персональных данных в Supabase (Задание 11, кратко)

Дата: 06.11.2026. Источник: `supabase/migrations/*.sql` (17 файлов) и код `src/`. Без изменений кода. Для решения «перенос БД в РК» или «ПД в РК + псевдонимы за рубежом». Не юридическое заключение.

ПД = данные, по которым можно узнать человека: почта, имя/ник, свободный текст ученика, а также `user_id` (UUID), который связывает запись с аккаунтом.

| Таблица | Поля с ПД | Чьи | Без ПД (можно держать за рубежом под псевдонимом) |
|---|---|---|---|
| `auth.users` (Supabase Auth) | email, хэш пароля, метаданные (display_name, роль, аватар; при Google — имя, почта, фото) | все | — |
| `profiles` * | display_name; согласие и дата | все | xp, streak_days, last_active_date |
| `class_members` | nickname, user_id | ученик | joined_at, left_at, removed |
| `classes` | teacher_id, name (название класса может содержать школу) | учитель | code, archived_at |
| `teacher_profiles` | user_id, note (пометка администратора, например школа) | учитель | status, даты |
| `debate_entries` | text, reply_text (свободный текст ученика) | ученик | side, words_used, week_start |
| `trail_entries` | claim_text, wonder_text (свободный текст) | ученик | claim_choice, evidence_ids, cefr_level |
| `council_votes` | reason (свободный текст) | ученик | choice, confidence, approved |
| `learner_state` | value для kind trail/trail_draft/debate (тексты); study_code (код участника исследования) | ученик | card, maqal, known_word, council_vote, study_assent |
| `saved_words` * | user_id | ученик | word, translation, mastery, next_review_at |
| `story_progress`, `quiz_results`, `user_achievements` * | user_id | ученик | всё остальное (уровни, баллы, значки) |
| `learning_events` | user_id; в context — class_id, study_code | ученик | verb, object_*, result (тексты не пишутся, только длина) |
| `assignments` | — | — | всё (класс, сказка, срок) |
| `api_usage_daily` | user_id | все | счётчики |

\* таблица создана вне миграций репозитория (схема в Supabase, поля — по коду).

**Что затронет разделение контура** (ПД в РК, остальное — по псевдониму `user_id`):
- RPC, которые соединяют имя/ник с данными: `class_report`, `student_report`, `student_work`, `class_events_summary`, `my_classes`, `join_class` (берёт имя из `profiles`), `delete_my_account` (удаляет во всех таблицах сразу — потребуется удаление в двух базах).
- Функции, читающие `auth.users` / `raw_user_meta_data` (имя по умолчанию в `join_by_code`).
- RLS везде опирается на `auth.uid()` — значит, Auth должен быть в том же контуре, что и таблицы с RLS, или нужна выдача токенов между контурами.
- Свободные тексты учеников (дебаты, «Ой ізі», причины) — ПД по содержанию: их нельзя просто вынести за рубеж под псевдонимом.

**Вывод для выбора:** почти каждая таблица связана с `user_id`, а свободные тексты и ники — сами ПД. Вариант «ПД в РК + псевдонимы за рубежом» требует переписать ~7 RPC и удаление аккаунта и разнести Auth. Вариант «вся БД в РК» не трогает код. Решение — за руководителем и юристом.
