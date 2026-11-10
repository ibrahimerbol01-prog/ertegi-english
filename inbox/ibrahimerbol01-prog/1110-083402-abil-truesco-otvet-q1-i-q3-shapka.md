---
id: 1110-083402-abil-truesco-otvet-q1-i-q3-shapka
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-10 08:34
reply_to: 1110-072742-ibrahimerbol-q1-i-q3-shapka-rider
---

# Ответ: Q1 и Q3: шапка ридера и экран Мен

Итог: сделано, 3 PR открыты, не слиты. Все от origin/main (по письму 1110-073939).
- https://github.com/ibrahimerbol01-prog/ertegi-english/pull/131 — #129: прежний тост t.saveError («Деректер сақталмады — байланысты тексер») после 3 неудачных отправок слова подряд; без таймера, повтор при старте и online.
- https://github.com/ibrahimerbol01-prog/ertegi-english/pull/132 — Q1 шапка ридера.
- https://github.com/ibrahimerbol01-prog/ertegi-english/pull/133 — Q3 экран «Мен».

git diff --stat от main:
#131: KazakhTalesApp.tsx, utils/wordOutbox.ts, 2 теста — 4 файла, +41/−9
#132: ReaderScreen.tsx 43, ReaderScreen.dom.test.tsx 20 — 2 файла, +53/−10
#133: ProfileScreen.tsx 15, ProfileScreen.dom.test.tsx 46 (новый) — 2 файла, +58/−3

Проверки (каждая ветка): npm run lint ✓, typecheck ✓, npm test ✓ (600 / 600 / 603), npm run build ✓, VITE_RESEARCH_MODE=1 npm run build ✓. Мутации: #131 без тоста — e2e падает; #133 старый экран — 3 из 4 тестов падают. Playwright 360/390/1440 + axe-core: 0 нарушений, текста <12 px нет, горизонтальной прокрутки нет. Снимки во вложении (q1-*, q3-before-360, q3-after-*).

Q1: назад 44×44 (aria-label t.changeLevel), название и глава truncate, чип уровня, полоса 6 px bg-ember role=progressbar. «Aa» нет — настройки размера в коде нет. События не тронуты.
Q3: «Профильді өзгерту» вынесена из колонки 182 px в свою строку (было 182×49 в 2 строки, стало 204×44 в 1); cardsEntry выше «Статистика»; все нули → t.noDataYet.

Утверждение → URL → цитата:
| Полоса Q1 берёт существующую позицию «Бірге оқу» | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/components/screens/ReaderScreen.tsx | «const [readAlongSentence, setReadAlongSentence] = useState<number | null>(null);» |
| Тост берёт существующую строку | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/dict.ts | «saveError: "Деректер сақталмады — байланысты тексер",» |
| Пустое состояние — существующая строка | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/dict.ts | «noDataYet: "Деректер әлі жоқ",» |

Вопросы:
1. Q1: полоса движется только во время «Бірге оқу», при обычном чтении она на 0. Нужен прогресс по прокрутке? Это новое состояние — сделаю отдельно, если скажешь.
2. Q3: под именем «… · 1-деңгей» на 360 px тоже переносится — поправить заодно?

Урок: перед «одна строка на 360 px» мерить ширину колонки-родителя: кнопке 204 px не хватало колонки 182 px, nowrap там дал бы переполнение — решение в раскладке, не в размере шрифта.
Урок: get_by_role("header") находит первую шапку страницы (приложения), а не ридера — искать по содержимому (header:has([role=progressbar])).
Сработало: замер «до» тем же скриптом, что и «после» (182×49 → 204×44) — до/после в PR из цифр, а не на глаз.

## Файлы

- files/1110-083402-abil-truesco-otvet-q1-i-q3-shapka/q3-after-360.png
- files/1110-083402-abil-truesco-otvet-q1-i-q3-shapka/q3-before-360.png
- files/1110-083402-abil-truesco-otvet-q1-i-q3-shapka/q1-1440.png
- files/1110-083402-abil-truesco-otvet-q1-i-q3-shapka/q3-after-1440.png
- files/1110-083402-abil-truesco-otvet-q1-i-q3-shapka/q1-360.png
- files/1110-083402-abil-truesco-otvet-q1-i-q3-shapka/q3-after-390.png
