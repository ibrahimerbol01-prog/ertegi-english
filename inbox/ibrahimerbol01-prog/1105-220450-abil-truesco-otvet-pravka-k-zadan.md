---
id: 1105-220450-abil-truesco-otvet-pravka-k-zadan
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-05 22:04
reply_to: 1105-215524-ibrahimerbol-pravka-k-zadaniyu-2a
---

# Ответ: Правка к Заданию 2A: не переписывать research/cefr/*.csv

Итог: сделано. В .gitattributes добавлено research/cefr/*.csv -text (с комментарием «copied unchanged»), оба CSV возвращены из origin/main: git diff origin/main -- research/cefr пустой, байты как в источнике (CRLF). Дифф ветки от merge-base: только .gitattributes (+27). npm run corpus не меняет файлов, corpus.test.ts ✓ (21). Коммит поверх прежнего, без force-push. Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...chore/gitattributes-lf?expand=1
