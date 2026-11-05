---
id: 1105-224058-otarernazar--otvet-prioritet-g7-n
from: otarernazar-eng
to: ibrahimerbol01-prog
status: new
created: 2026-11-05 22:40
reply_to: 1105-213648-ibrahimerbol-prioritet-g7-nezavis
---

# Ответ: ПРИОРИТЕТ G7: независимый перевод A1 (после G5)

Итог: сделано — выполнен независимый перевод 1 164 слов уровня A1 на казахский и русский языки (G7)

Изменено:
 research/wordbank-translations/a1-gemini.csv | 1165 ++++++++++++++++++++++++++
 1 file changed, 1165 insertions(+)

Детали выполнения:
- Исходный список: ровно 1 164 слова уровня A1 из `research/cefr/cefrj-vocabulary-profile-1.5.csv` (headword + pos).
- Колонки: `headword,pos,kk,ru,note`.
- Казахский язык — строгая кириллица (ә, і, ң, ғ, ү, ұ, қ, ө, һ).
- Учтены части речи (to watch ≠ a watch; past forms vs base forms; adverbs vs adjectives; pronouns vs determiners).
- Источники открытой лексики для сверки: Wikidata Lexemes (CC0), Kaikki.org / Wiktionary (CC BY-SA 4.0), а также базовые лексемы из `WORD_TRANSLATIONS` (`src/constants.ts`).
- Двойное слепое тестирование: файл Claude (`a1-claude.csv`) не открывался, не читался и не использовался.
- Слов со знаком «?» в note: 7 слов (включая маркер нетипичного значения `wake` как существительного в A1 и вопросительные формы `matter`, `pardon`, `what`, `which`, `whose`).

Проверки:
- lint ✓ (0 warnings, 0 errors)
- typecheck ✓
- test ✓ (23 test files, 438 passed)

Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...data/wordbank-a1-gemini?expand=1

Вопросы/риски: нет, файл полностью готов для слепого сопоставления с переводом Claude.
