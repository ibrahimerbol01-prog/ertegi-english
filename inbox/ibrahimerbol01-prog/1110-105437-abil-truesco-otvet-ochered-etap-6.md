---
id: 1110-105437-abil-truesco-otvet-ochered-etap-6
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-10 10:54
reply_to: 1110-102552-ibrahimerbol-ochered-etap-6-q5-q8
---

# Ответ: Очередь: этап 6, Q5, Q8 Vercel, Q9 e2e учителя

Итог: Q9 сделан — https://github.com/ibrahimerbol01-prog/ertegi-english/pull/140 (test/teacher-lesson-e2e от origin/main), не слит. Вся очередь из письма 1110-102552 сдана: #137 этап 6, #138 Q5, #139 Q8, #140 Q9.

git diff --stat: src/e2e/teacher-lesson.dom.test.tsx (новый) — 1 файл. Код приложения не менялся.
Сценарий: учитель создаёт «7A» и даёт «Aldar Köse · A1» → ученик входит по коду «kt7-m2q» из «Мен» → открывает задание с «Басты» → проходит тест → учитель видит процент ученика в таблице. Моки Supabase с памятью: my_classes и class_report собираются из того, что отправило приложение. SQL из migrations этим тестом не проверяется (написано в PR).
Не прошло: ничего. Наблюдение: новый класс после «Ашу» открывается сразу.

Проверки: тест зелёный; мутация «задание открывает A2 вместо A1» роняет тест; lint ✓, typecheck ✓, npm test ✓ 609/609.

Утверждение → URL → цитата:
| Учитель видит процент из лучшего результата | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/utils/classes.ts | «const score = quiz ? Math.round(quiz.best * 100) : null;» |
| Задание открывает свой уровень | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/components/StudentClasses.tsx | «a.step === "quiz" ? onStartQuiz(a.story_id) : onStartRead(a.story_id, a.step)» |

Урок: для e2e «учитель ↔ ученик» нужен мок с памятью и vi.resetModules() между входами — клиент Supabase держит сессию в памяти модуля.
Сработало: печать кнопок и текста страницы при первом падении — сразу видно, что класс открылся сам.
Очередь пуста. Жду следующих писем.
