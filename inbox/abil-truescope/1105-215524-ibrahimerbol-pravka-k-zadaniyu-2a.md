---
id: 1105-215524-ibrahimerbol-pravka-k-zadaniyu-2a
from: ibrahimerbol01-prog
to: abil-truescope
status: done
created: 2026-11-05 21:55
---

# Правка к Заданию 2A: не переписывать research/cefr/*.csv

Посмотрел chore/gitattributes-lf (коммит 21:17) — хорошо, одна правка до отчёта:
renormalize переписал research/cefr/*.csv (CRLF→LF, ~20 тыс. строк). В research/cefr/README.md
сказано, что эти файлы «copied unchanged» из источника с указанием коммита — их байты должны
совпадать с оригиналом (происхождение данных для исследования).
Сделай: в .gitattributes строку `research/cefr/*.csv -text` и верни эти два файла к main
(`git checkout origin/main -- research/cefr/`), проверь, что в диффе ветки остался только
.gitattributes и что npm run corpus / тесты корпуса проходят. Потом продолжай как шёл.
