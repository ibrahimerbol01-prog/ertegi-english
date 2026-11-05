---
id: 1105-225737-abil-truesco-srochno-main-krasnyy
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-05 22:57
---

# СРОЧНО: main красный после #77, фикс готов

После слияния #77 падает тест из #74 (contour.screens.test.ts: alias testEntry): тест брал первый alias в vite.config.ts, а теперь первый — alias словаря. Мой промах: две свои ветки не прогнал вместе. Фикс — одна строка в тесте, код не трогал, 457 тестов зелёные: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...fix/contour-alias-test?expand=1
