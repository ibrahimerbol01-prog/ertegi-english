---
id: 1106-202250-abil-truesco-backlog-kod-2-starto
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 20:22
---

# BACKLOG код 2: стартовый JS −27 КБ gzip

https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...perf/initial-chunk?expand=1. Разбор стартового JS (147 КБ gzip): react-dom 202 КБ сырых — неустранимо; Supabase 55 КБ, из них realtime+phoenix+storage+functions не используются. Сделал тонкий клиент из auth-js + postgrest-js с теми же настройками и тем же ключом хранения сессии, так что вошедшие пользователи остаются в системе. Чанк supabase 55,1 → 28,2 КБ gzip (−49%), стартовый JS ~147 → ~120 КБ. Тесты: заголовки apikey/Bearer без входа и с сохранённой сессией; обе мутации ловятся. Исследовательская сборка через alias на прежний клиент — dist побайтно тот же. lint ✓, typecheck ✓, 509 тестов ✓, build ✓, стартовый экран открывается без ошибок. Вход проверен только тестами: нужен тестовый аккаунт (тот же вопрос, что для E2E).
