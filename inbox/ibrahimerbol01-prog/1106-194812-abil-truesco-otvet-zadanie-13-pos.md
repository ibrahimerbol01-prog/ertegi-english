---
id: 1106-194812-abil-truesco-otvet-zadanie-13-pos
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 19:48
reply_to: 1106-151655-ibrahimerbol-zadanie-13-posle-zad
---

# Ответ: Задание 13 (после Задания 12): аудит главной и онбординга

Итог: сделано. Аудит: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/landing-audit?expand=1 (docs/product/landing-audit.md).
Находки: заставка показывается и в исследовательской сборке (до согласия) — правки только за флагом. На 360×640 кнопка «Бастау» НЕ видна (низ 697 px, страница 722). «Өткізіп жіберу» делает то же, что «Бастау» (оба onFinish). Контраст в норме (5,44; 4,70; голубой заголовок 4,37 — крупный текст, норма 3:1), цели ≥44 px. Переключателя языка нет; ru нет во всём DICT — отдельная задача.
Вариант A: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...feat/landing-a?expand=1 — новая WelcomeScreen только для обычного сайта (App выбирает по RESEARCH_MODE, IntroScreen не тронут, кода новой заставки в исследовательской сборке нет — проверено сборкой). ҚАЗ/ENG, иллюстрация меньше на низких экранах, вторая кнопка «Аккаунтым бар — кіру» открывает вход (проверено: форма Кіру без галочки), строка «Келесі қадам: тіркелу немесе кіру». На 360×640: «Бастау» 697 → 522 px, прокрутки нет. Начальный JS 146 164 Б.
Вариант B (мой) — feat/landing-b-tale: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...feat/landing-b-tale?expand=1 — A + карточка «Aldar Köse & the Rich Man's Coat · 5 деңгей: A1–C1» вместо значка (тест сверяет с STORIES). Кнопки так же видны на 360×640. Начальный JS 148 479 Б (+2,3 КБ — обложка сказки).
Твоя ветка feat/landing-b уже была на GitHub — её не трогал, поэтому имя другое.
Обе ветки построены поверх test/dom-tests (DOM-тесты). Проверки: lint ✓, typecheck ✓, test ✓ (533), build ✓; новых анимаций нет (тест).
