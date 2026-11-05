---
id: 1105-231341-abil-truesco-otvet-prioritet-zada
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-05 23:13
reply_to: 1105-224930-ibrahimerbol-prioritet-zadanie-7
---

# Ответ: ПРИОРИТЕТ Задание 7: переводы A1 в словарь (85% совпало)

Итог: сделано (Задание 7 + дополнение про ai-reviewed).

Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...feat/wordbank-a1-translations?expand=1
Ветка от свежего main: feat/wordbank уже слит как #77. Коммит e3d76e9 (wip; при squash-слиянии заголовок задаёт PR), 15 файлов, +2655/−1187. В A1.json изменились все 1164 строки: у каждой появилось поле `tr`.

**В карточки теперь можно добавить 990 слов A1** (tr="agreed"). 174 — «Аударма тексерілуде», кнопка неактивна. human 0, ai-reviewed 0: a1-arbitration.csv в main пока нет, скрипт его пропускает.

## Что сделано

- `scripts/wordbank-apply-translations.mjs` → kk/ru/tr в A1.json. Логика — `src/utils/wordbankTranslations.ts`, ею же пользуется `npm run wordbank`, поэтому сборка и применение не расходятся, а тест «данные свежие» проверяет всё вместе. Пути файлов — `WORDBANK_TRANSLATION_FILES` в config.ts (следующий уровень = одна запись).
- Файлы: `research/wordbank-translations/a1-agreed.csv` (вложение agreed.csv, CRLF→LF) и `a1-review.csv` (needs-review.csv + пустые kk_final, ru_final, reviewer). a1-claude.csv / a1-gemini.csv в ветку не брал.
- Приоритет: human (kk_final и ru_final заполнены в a1-review.csv) > ai-reviewed (строка a1-arbitration.csv, где kk_choice и ru_choice не human и есть source_url) > agreed. Строка арбитража с human или без source_url пары не меняет: они остаются needs-review. Пара в файлах без записи в словаре — ошибка сборки, а не тихая потеря.
- **Сопоставление без регистра и апострофов.** В файлах сверки заголовки в нижнем регистре («a.m./a.m./am/am»), а у `'m`, `'re`, `'s` пропал апостроф («m», «re», «s»). На A1 коллизий от этого нет: «May» noun ≠ «may» modal — разная часть речи.
- Экран: для agreed/ai-reviewed/human показывается kk · ru. У agreed/ai-reviewed — мелкая пометка «автоаударма» с подсказкой «Машиналық аударма. Адам әлі тексерген жоқ.» У human пометки нет. needs-review: подпись «Аударма тексерілуде», кнопка ➕ неактивна. На карточку идёт kk, как в глоссарии. Уровни без переводов работают по-старому (глоссарий). DICT: +3 ключа kk/en.

## Проверки

lint ✓ (0), typecheck ✓, test ✓ (27 файлов, 476 тестов; новый wordbankTranslations.test.ts — 12 тестов), build ✓. Перед отчётом смержил свежий origin/main — урок из LESSONS.md.
Исследовательская сборка (`VITE_RESEARCH_MODE=1`): чанков словаря нет, строк данных и статусов перевода в JS нет. В JS есть только строки DICT (wbAutoTr и др.): DICT общий для всех сборок, так было и с #77.

## Размер (gzip -6)

| | до (#77) | после |
|---|---:|---:|
| A1-чанк (лениво, не в precache) | 172 464 / **22 322** | 215 593 / **37 261** (+14,9 КБ) |
| Начальный JS | 145 865 | 145 972 (+107 Б, строки DICT) |
| WordbankScreen | 2 121 | 2 319 |
| PWA precache | 1131,70 КиБ | 1132,59 КиБ |

## Вопросы/риски

1. «автоаударма» — это машинный перевод, который совпал у двух моделей, а не проверенный. Выборочную проверку agreed делает человек (как в a1-summary.md). Пометка на экране говорит об этом честно.
2. Когда человек заполнит kk_final/ru_final в a1-review.csv: `node scripts/wordbank-apply-translations.mjs` → коммит A1.json. Без этого тест «данные свежие» упадёт и напомнит.
3. Если в a1-arbitration.csv заголовки будут с апострофами или в другом регистре — сопоставится так же. Неизвестная пара даст ошибку с её именем.

Урок: файлы сверки нормализуют заголовки (нижний регистр, без апострофов). Сопоставлять с данными по нормализованному ключу и падать на «лишних» парах — так нашлись `'m`/`'re`/`'s`.
Сработало: одна функция применения переводов для сборки, скрипта и теста — данные не могут разойтись с файлами.
