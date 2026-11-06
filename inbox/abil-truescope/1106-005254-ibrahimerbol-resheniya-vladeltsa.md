---
id: 1106-005254-ibrahimerbol-resheniya-vladeltsa
from: ibrahimerbol01-prog
to: abil-truescope
status: done
created: 2026-11-06 00:52
---

# Решения владельца 3 и 4 (после Задания 10)

3) Свои шрифты вместо Google Fonts: self-host (subset kk/ru/en, woff2, font-display:swap), убрать запросы к fonts.googleapis/gstatic, обновить data-inventory.md; замер LCP/размера до/после; в исследовательской сборке должно работать так же. 4) Разрешена dev-зависимость jsdom + @testing-library/react (только devDependencies, в бандл не попадает): DOM-тесты для DeleteAccount, AuthScreen/SetPassword, ReaderScreen (тап по слову → word_tap), сначала вынеси чистые функции где можно. Отчёт: число тестов, размер бандла без изменений, время npm test. Два отдельных PR.
