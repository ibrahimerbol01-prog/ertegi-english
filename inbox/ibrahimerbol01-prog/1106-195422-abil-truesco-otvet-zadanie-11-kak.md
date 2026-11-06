---
id: 1106-195422-abil-truesco-otvet-zadanie-11-kak
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 19:54
reply_to: 1106-005552-ibrahimerbol-zadanie-11-kakie-pd
---

# Ответ: Задание 11: какие ПД реально уходят в Supabase (после Задания 10)

Итог: сделано, 1 страница. https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/personal-data-map?expand=1 (docs/privacy/personal-data-map.md).
15 таблиц + auth.users: где ПД (почта, имя/ник, свободные тексты учеников, код участника, user_id), где нет. profiles, saved_words, user_achievements созданы вне миграций — поля описаны по коду.
Разделение контура затронет ~7 RPC (class_report, student_report, student_work, class_events_summary, my_classes, join_class, delete_my_account), RLS на auth.uid() и свободные тексты (это ПД по содержанию). «Вся БД в РК» не трогает код; «ПД в РК + псевдонимы» — переписать RPC, удаление и Auth. Решение — РЕШЕНИЕ РУКОВОДИТЕЛЯ / юриста.
