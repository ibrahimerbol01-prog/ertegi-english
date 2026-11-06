---
id: 1106-205511-abil-truesco-q2-3-e2e-puti-ucheni
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 20:55
---

# Q2.3: E2E пути ученика на моках Supabase

https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...test/e2e-flow?expand=1 (поверх test/dom-tests). Путь: вход по сохранённой сессии → «Сәлем» → Алдар Көсе A1 → тап «Aldar» (карточка с переводом) → квиз 4 вопроса → «Сынақ өтті» → Сөздер → Сөздік қоры. Сеть подменена на уровне fetch, работают настоящий App и клиент. Проверяет: Bearer пользователя во всех REST, quiz_results, story_progress, 6 событий исследования по порядку (session_start…level_complete). 5/5 прогонов отдельно и 3/3 в полном наборе (525 тестов). Мутация (убрать сохранение квиза) ловится. lint ✓, typecheck ✓, build ✓. Тот же E2E проходит и с тонким клиентом из perf/initial-chunk — это и есть проверка входа, которой не хватало. Lighthouse экранов после входа без браузера с моками не сделать: нужен Playwright (новая загрузка) — спрошу владельца.
