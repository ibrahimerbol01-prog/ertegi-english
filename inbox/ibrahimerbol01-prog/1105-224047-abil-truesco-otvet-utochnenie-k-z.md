---
id: 1105-224047-abil-truesco-otvet-utochnenie-k-z
from: abil-truescope
to: ibrahimerbol01-prog
status: done
created: 2026-11-05 22:40
reply_to: 1105-213646-ibrahimerbol-utochnenie-k-zadaniy
---

# Ответ: Уточнение к Заданию 5 (A1, kk+ru) и Задание 6: перевод A1

Итог: сделано (Задание 6). Уточнение к Заданию 5 учтено: экран открывается на A1, поля kk и ru есть (пустые) — см. ответ по Заданию 5.

Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...data/wordbank-a1-claude?expand=1
Коммит a014a12:
 research/wordbank-translations/a1-claude.csv | 1165 +++  (заголовок + 1164 слова)
 src/research/wordbankA1Claude.test.ts        |   46 +   (тест; vitest ищет тесты только в src/)

- Все 1164 строки A1 из CEFR-J 1.5 (слово + часть речи, порядок как в источнике). Колонки headword, pos, kk, ru, note.
- Переводил сам. Файл a1-gemini.csv не открывал (в main его и нет), закрытые словари не использовал.
- kk — кириллица; латиница только в аббревиатурах (CD-диск, DVD-диск). Для многозначных слов — самое частое значение для новичка, остальные в note («also: …»). Часть речи учтена (watch noun = қол сағат / наручные часы; watch verb = көру / смотреть).
- Служебные слова (a, the, to, 's, 'm, 're, is, am) — пометка «не переводится» в note; в kk — ближайшая форма или описание в скобках.

**Слов с «?» в note: 37**, из них по-настоящему неуверенных **33**. В 4 строках «?» — это знак вопроса в примере, а не сомнение: matter («What's the matter?»), may («May I …?»), old («How old?»), pardon («Pardon?»).
Неуверенные (33): almost, aunt, biscuit, block, case, catch (noun), climb (noun), corn, dad, dig (noun), drama, drive (noun), due, excited, feed (noun), fever, ghost, hold (noun), lily, off (adj), palace, picnic, pray, princess, self, soup, stand (noun), surf, uncle, underline (noun), vase, wake (noun), yogurt.
Причины: родство (aunt/uncle — в казахском зависит от линии родства), существительные, которые на A1 встречаются почти только как глаголы (catch, climb, dig, drive, feed, hold, stand, wake, underline), и альтернативные варианты, в которых я не уверен (отмечены «?» в note, сам основной перевод дан).

Проверки: lint ✓, typecheck ✓, test ✓ (24 файла, 443 теста; новый тест: все 1164 слова A1 ровно по разу, 5 полей, kk/ru не пустые, kk кириллица).

Риски: это машинный перевод без проверки носителем. Казахский особенно стоит проверить человеку: грамматические формы в kk для служебных слов (-мын, -да/-де) — описательные, не словарные. Использовать в приложении только после сверки с Gemini и человеком, как и задумано.

Дальше по очереди: Задание 3 (проверочный набор Шоқана), потом 4 (отчёт о старых ветках).
