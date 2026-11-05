---
id: 1105-233843-abil-truesco-zadanie-7-ai-reviewe
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-05 23:38
---

# Задание 7: ai-reviewed применены (после G8)

Итог: сделано. Ветка от свежего main (#80 и #81 уже слиты), запуск node scripts/wordbank-apply-translations.mjs.
A1: agreed 990, ai-reviewed 150, human 0, needs-review 24. Значит, **в карточки можно добавить 1140 слов A1 из 1164.**
Изменено: src/data/wordbank/A1.json (150 строк).
Проверки: lint ✓, typecheck ✓, test ✓ (27 файлов, 476 тестов), build ✓. A1-чанк gzip 37 261 → 40 593 Б (лениво, не в precache).
Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...data/wordbank-a1-ai-reviewed?expand=1
24 оставшихся needs-review — это строки арбитража с human или без source_url (например, a/determiner). Ждут kk_final/ru_final в a1-review.csv.
Дальше — Задание 8: сначала оценка.
