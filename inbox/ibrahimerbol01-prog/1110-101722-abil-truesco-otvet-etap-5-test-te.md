---
id: 1110-101722-abil-truesco-otvet-etap-5-test-te
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-10 10:17
reply_to: 1110-090053-ibrahimerbol-etap-5-test-teper-tv
---

# Ответ: Этап 5 (тест) теперь твой, затем Q5

Итог: этап 5 сделан — https://github.com/ibrahimerbol01-prog/ertegi-english/pull/135 (redesign/5-quiz от origin/main), не слит. Логика теста не менялась.

git diff --stat: QuizScreens.tsx 196, QuizScreen.dom.test.tsx 91 (новый), dict.ts 11, flow.dom.test.tsx 7 — 4 файла, +223/−82.

Что: «Жабу» 44×44; сегменты jade/rose/ember/sand + «n / всего»; варианты role=radio в radiogroup, 66 px; ошибка rose-soft + rose + ✕; верно jade-ink + ✓; одна постоянная панель aria-live: «Әзірге дұрыс емес. Ертегіге қара:» + прежняя подсказка (слова вопроса выделены sun-hl), «Тағы бір рет» (.btn-ember, фокус на вариант), «{n} мүмкіндік қалды · уақыт шектеусіз»; верно — «Дұрыс!» и «Келесі». «Тексеру» .btn-ember.

e2e flow — то же поведение, селекторы: «1/4»→«1 / 4»; button.tile[aria-pressed] → [role=radiogroup] button.tile[role=radio] (aria-pressed у radio недопустим); + «Келесі» в регулярку. «Тексеру», «Сенімдімін» как были.

Проверки: lint ✓, typecheck ✓, npm test ✓ 602/602, build ✓, VITE_RESEARCH_MODE=1 build ✓. Новый тест проверяет и журнал quiz_answer (attempt 1/2, hint none/evidence). Мутации ловятся. Playwright 360/390/1440 (начало/ошибка/верно) + axe: 0 нарушений, <12 px и <44 px нет. Снимки во вложении.

Утверждение → URL → цитата:
| Логика проверки не тронута, это та же функция | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/components/screens/QuizScreens.tsx | «const handleCheck = () => {» |
| Подсказка для пропуска — звук, не текст | там же | «A gap sentence read aloud carries the missing word, so it is the hint for gaps.» |

РЕШЕНИЕ РУКОВОДИТЕЛЯ:
1. «Мәтінге өту» не сделал: выход из теста сбрасывает прохождение (нет quiz_complete) — переход с сохранением = изменение логики.
2. Влияние на исследование: меняются тексты обратной связи, которые видит ученик (одинаково для F/C). Переносить ли в study — решать до заморозки.
3. Не решённый за 2 попытки вопрос в сегментах — rose (в промпте только jade/ember/sand).
Конфликт: #134 и #135 оба вставляют строки в dict.ts после learnersUnit — при слиянии второго оставить оба блока.

Урок: строки, которые читаются через t: Record<string,string>, typecheck не ловит — новые ключи dict проверять тестом по тексту (так и нашёл: я привязал вставку к copyCode, которого нет в main).
Урок: «Тағы бір рет» + «Тексеру» одновременно = две главные кнопки; разделил по состоянию «вариант выбран».
Сработало: прогон e2e с печатью кнопок на каждом шаге — сразу видно, что кнопки пустые (нет ключей словаря).

## Файлы

- files/1110-101722-abil-truesco-otvet-etap-5-test-te/q5-after-start-1440.png
- files/1110-101722-abil-truesco-otvet-etap-5-test-te/q5-after-start-390.png
- files/1110-101722-abil-truesco-otvet-etap-5-test-te/q5-after-wrong-360.png
- files/1110-101722-abil-truesco-otvet-etap-5-test-te/q5-after-right-390.png
