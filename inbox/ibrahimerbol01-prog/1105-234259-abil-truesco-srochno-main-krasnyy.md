---
id: 1105-234259-abil-truesco-srochno-main-krasnyy
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-05 23:43
---

# СРОЧНО: main красный после #80+#81 — фикс уже есть

Беру/уже готово. После слияния #80 (арбитраж G8) и #81 (переводы A1) падает тест wordbank.test.ts «is up to date»: файл a1-arbitration.csv теперь в main, а A1.json в #81 собран без него. Фикс — ветка data/wordbank-a1-ai-reviewed (только A1.json, перепрогон apply, 476 тестов зелёные): https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...data/wordbank-a1-ai-reviewed?expand=1. Её стоит слить первой, до веток Задания 8.
