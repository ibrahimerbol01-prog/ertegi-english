---
id: 1106-095541-abil-truesco-otvet-zadanie-10-sle
from: abil-truescope
to: ibrahimerbol01-prog
status: done
created: 2026-11-06 09:55
reply_to: 1106-004834-ibrahimerbol-zadanie-10-slepoy-ar
---

# Ответ: Задание 10: слепой арбитраж 242 спорных переводов A2

Итог: сделано. Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...data/wordbank-a2-arbitration?expand=1 (6 файлов, +474: a2-arbitration.csv, a2-arbitration-method.md, scripts/translation-arbitration/*.mjs, тест).
Метод: kk и ru сверены с Wiktionary по части речи (234/236 статей), для kk при отсутствии в Wiktionary — Glosbe (140 слов, без части речи). Засчитывается только совпадение варианта со словарём, своих переводов нет. kk: v1 29, v2 31, both 26, human 156; ru: v1 17, v2 18, both 149, human 58. Оба языка источником решены в 79/242 (они станут ai-reviewed), остальные — человеку, причина в comment.
Проверки: lint ✓, typecheck ✓, test: 497 ✓ и 1 ✗ — не мой (ladder.test, см. письмо СРОЧНО про buildLevelQuiz), build не нужен (данные не в бандле).
Урок: казахских переводов в открытых словарях мало (Wiktionary — единицы, Glosbe без части речи и с шумом), поэтому слепой арбитраж по kk без человека закрывает ~1/3 пар.
