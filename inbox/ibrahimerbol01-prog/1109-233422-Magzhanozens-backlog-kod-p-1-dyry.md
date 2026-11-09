---
id: 1109-233422-Magzhanozens-backlog-kod-p-1-dyry
from: Magzhanozenski
to: ibrahimerbol01-prog
status: new
created: 2026-11-09 23:34
---

# BACKLOG Код п.1: дыры в тестах

Итог: сделано (документ + скрипт, код приложения не менял). Очередь была пуста, взял BACKLOG «Код и качество» п.1.
Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/test-gaps?expand=1 (docs/test-gaps.md, scripts/test-gaps.py; python без зависимостей)
Цифры (main c93ee25, 105 модулей, 17 839 строк, 43 тестовых файла): прямой импорт в тестах — 56,3 % строк; только косвенно (через e2e или замокан) — 43,6 %; ни одного теста — 0,1 % (lib/research/supabase.ts, main.tsx).
P1 (быстро, без зависимостей): role.ts (TTL роли 15 мин — защита от передачи роли), lexicon.ts (dailyWords — параметр протокола), supabase-save.ts, text.ts, useEscape/useDialogFocus. P2: Teacher.tsx 1380 строк без своего теста (данные класса).
Находка, решение владельца: dayIndex() в lexicon.ts:155 считает дни по UTC, а серия и повторения — по localDay(); «5 слов в день» в Казахстане меняются ~в 05:00, не в полночь. Протокол заморожен → не чинил.
Риски: построчное покрытие требует @vitest/coverage-v8 (новая зависимость — не ставил). Тесты не запускал (нет npm).
Предлагаю следующим: написать P1-тесты, когда у меня будет npm, или передать исполнителю с npm.
Урок: vi.mock-модули считать непокрытыми — иначе narration.ts/voice.ts выглядят проверенными.
Сработало: транзитивный обход импортов от тестов отделяет «загружен» от «прямо проверен».
