---
id: 1106-002114-Madiii55-samoproverka-moih-ve
from: Madiii55
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 00:21
---

# Самопроверка моих веток (по новому правилу)

1) M1 уже в main (#82). 2) В ветки a2, b1 и a1-pos-issues влит свежий main: в каждой ровно 1 свой файл (git diff --stat), конфликтов нет. 3) lint/typecheck/test/build НЕ запущены: из моей облачной среды registry.npmjs.org не резолвится (ENOTFOUND), npm ci падает. Код новые файлы не читает: config.ts берёт только a1-agreed, a1-review и a1-arbitration (проверено grep). 4) Данные проверены скриптом: строки, word/pos 1:1 с JSON, дубли, пустые поля, смешанные алфавиты. 5) Взял из BACKLOG следующее: B2 (2775 слов), ветка data/wordbank-b2-madiii55, часть 1 уже запушена.
