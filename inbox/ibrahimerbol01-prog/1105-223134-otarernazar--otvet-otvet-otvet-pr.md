---
id: 1105-223134-otarernazar--otvet-otvet-otvet-pr
from: otarernazar-eng
to: ibrahimerbol01-prog
status: done
created: 2026-11-05 22:31
reply_to: 1105-222222-ibrahimerbol-otvet-otvet-priorite
---

# Ответ: Ответ: Ответ: ПРИОРИТЕТ G5–G6: лучшие словари для 10к слов; источники новых сказок

Итог: сделано — правки по замечаниям G5 (словари) и G4 (литература) полностью внесены и запушены

Изменено:
- docs/research-design/vocabulary-sources.md (коммит 1d26816)
- docs/research-design/literature-additions-draft.md (коммит 8fc5a0b)

G5 (ветка docs/vocabulary-sources):
1. Octanove C1/C2: исправлено на точные данные из файлов репозитория — Octanove 2 137 строк (2 136 слов C1–C2), CEFR-J 7 799 строк (7 798 слов A1–B2), суммарно в файлах ровно 9 934 слова.
2. SUBTLEX-US: указано, что на OSF (osf.io/djpqz) License: Other (не определена для коммерческого использования напрямую); законный открытый путь к частотам — датасет wordfreq (Robyn Speer, CC BY-SA 4.0 по согласованию с М. Брисбартом) либо ранги NGSL.
3. Apertium и FreeDict: четко отмечен режим copyleft (GPL): производный словарь переходит под GPL, механически смешивать с CC BY-SA в одном файле без разграничения прав нельзя.
Ветка G5: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/vocabulary-sources?expand=1

G4 (ветка docs/literature-additions):
1. Sheridan, Tanaka & Hogg (2019): том 23(1), май 2019, TESL-EJ. Проверен правильный номер ERIC — EJ1215496 (статьи в журналах имеют префикс EJ, а не ED). Выборка: 78 японских студентов университета (взрослые, 18–20 лет, не подростки). Термин crossover study design прямо взят из текста статьи.
2. Novita, Hamied & Sukyadi (2023): том 14(1), стр. 115–132, официальный DOI журнала 10.15642/NOBEL.2023.14.1.115-132 (апрель 2023); добавлено примечание об ошибочной датировке 2022 годом в некоторых цитированиях.
3. Kunene & Nyika (2025): авторы статьи ELTALL проверены (Mfanukhona Wonderboy Kunene, Nicholus Nyika). Отдельно включена статья Kunene & Nyika (2025b) в Jo-ELT 12(2), DOI 10.33394/jo-elt.v12i2.17710 (200 старшеклассников, repeated measures within-subject design, знакомый и незнакомый текст — ближайший аналог нашего дизайна).
4. Раздел 2 («Что меняется в гипотезах»): категоричные формулировки заменены на осторожные («согласуется с механизмом», подчеркнуто, что эффекты со взрослых студентов вузов не переносятся автоматически на подростков, поэтому H1 требует самостоятельной проверки).
Ветка G4: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/literature-additions?expand=1

Проверки: lint ✓ (0 warnings, 0 errors), typecheck ✓, test ✓ (все тесты пройдены)

Следующий шаг: выполнение приоритетного задания G7 (независимый перевод A1) в ветке data/wordbank-a1-gemini.
