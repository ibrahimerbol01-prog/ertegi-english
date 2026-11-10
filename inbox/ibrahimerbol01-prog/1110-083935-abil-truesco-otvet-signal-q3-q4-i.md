---
id: 1110-083935-abil-truesco-otvet-signal-q3-q4-i
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-10 08:39
reply_to: 1110-082700-ibrahimerbol-signal-q3-q4-i-zapas
---

# Ответ: СИГНАЛ: Q3, Q4 и запасной план

Итог: Q3 и Q4 сделаны, PR открыты, не слиты.
1) Q3 «Мен» — https://github.com/ibrahimerbol01-prog/ertegi-english/pull/133 (сделан до этого письма; отчёт — ответ 1110-083402).
2) Q4 кабинет учителя — https://github.com/ibrahimerbol01-prog/ertegi-english/pull/134 (redesign/q4-teacher от origin/main).
3) Этап 5: жду до 13:00, PR Магжана проверю тогда.

git diff --stat #134 от main: Teacher.tsx, dict.ts — 2 файла, +19/−13.
Что: .btn-ember на «Ашу», «Тапсырма беру», «Тапсырма»; код класса 40 px (48 px ≥640, было 30); кнопка кода «Көшіру» (было «Код», копировала и раньше) — слово из твоего письма, добавлено в dict.ts как copyCode; плитки сводки те же три числа, 32 px, elev-1, «көмек керек» rose при >0. Новых данных/RPC нет.

Проверки: lint ✓, typecheck ✓, npm test ✓ 599/599, build ✓, VITE_RESEARCH_MODE=1 build ✓. Playwright 360/390/1440 + axe на экране класса: 0 нарушений, прокрутки нет. Снимки во вложении.
Те же замеры на main: подписи нижней навигации учителя <12 px (360/390) и имена в таблице прогресса 40 px — были и раньше, PR их не трогает. Можно отдельной задачей.

Утверждение → URL → цитата:
| Копирование кода уже было | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/components/Teacher.tsx | «<CopyButton text={cls.code} label={kk ? "Код" : "Code"}» |
| Сводка уже была из трёх чисел | там же | «l: kk ? "көмек керек" : "need help"» |

Вопросы: макет Teacher не открывается из этого аккаунта — плитки по токенам; если на макете иначе, опиши. «Көшіру» — новая строка в dict.ts (из письма), подтверди.

Урок: перед «исправил X» мерить тот же экран на main тем же скриптом — две находки (12 px, 40 px) оказались старыми, а не моими.
Сработало: подставной вход учителя + ответы RPC через Playwright route — кабинет проверяется без живой базы.

## Файлы

- files/1110-083935-abil-truesco-otvet-signal-q3-q4-i/q4-class-360.png
- files/1110-083935-abil-truesco-otvet-signal-q3-q4-i/q4-list-360.png
- files/1110-083935-abil-truesco-otvet-signal-q3-q4-i/q4-class-1440.png
