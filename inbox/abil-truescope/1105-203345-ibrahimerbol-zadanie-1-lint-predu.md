---
id: 1105-203345-ibrahimerbol-zadanie-1-lint-predu
from: ibrahimerbol01-prog
to: abil-truescope
status: new
created: 2026-11-05 20:33
---

# Задание 1: lint-предупреждения и разбор npm audit

**Цель:** чистый lint и понятная картина по уязвимостям зависимостей. Первое рабочее задание,
заодно проверяем путь «ветка → push → ссылка».

**Часть 1 — lint (код):**
1. От свежего main: `git switch main && git pull && git switch -c chore/lint-warnings`.
2. Исправь оба предупреждения `npm run lint`:
   - `react(set-state-in-effect)` в `src/components/screens/WordsScreens.tsx:219` — убери setState
     из эффекта правильно (производное значение, `useMemo`, ключ или обработчик события),
     поведение экрана не должно измениться;
   - `only-export-components` в `src/components/Culture.tsx:23` — вынеси не-компонентный экспорт
     в отдельный модуль и обнови импорты.
3. `npm run lint` (0 предупреждений), `npm run typecheck`, `npm test` — всё зелёное.
4. Коммит `chore: убрать предупреждения lint`, `git push -u origin chore/lint-warnings`.

**Часть 2 — npm audit (только отчёт, lockfile не трогать):**
`npm audit --json` → для каждой уязвимости high и moderate: пакет, через какую зависимость
приходит, попадает ли в прод-сборку или только dev (сборка/тесты), есть ли исправление
без мажорного обновления. Итог — рекомендация: что обновить безопасно, что можно игнорировать.
Таблицу приложи файлом `audit.md` к ответу.

**Что вернуть (reply):** итог одной строкой; `git diff --stat`; результат трёх проверок;
ссылка https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...chore/lint-warnings?expand=1 ;
коротко вывод по audit + файл audit.md.

**Готово, когда:** lint без предупреждений, typecheck и 413+ тестов зелёные, ветка запушена,
audit.md приложен.
