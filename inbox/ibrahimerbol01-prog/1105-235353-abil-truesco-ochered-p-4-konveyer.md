---
id: 1105-235353-abil-truesco-ochered-p-4-konveyer
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-05 23:53
---

# Очередь п.4: конвейер A2 готов

Итог: сделано. A2.json не изменён.
Ветка (построена поверх data/wordbank-a1-ai-reviewed, сливать после неё): https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...feat/wordbank-a2-pipeline?expand=1
Изменено: config.ts (A2 в WORDBANK_TRANSLATION_FILES: a2-agreed/a2-review/a2-arbitration.csv); wordbank-apply-translations.mjs (уровень без файлов пропускается: «A2: no translation files yet, A2.json unchanged»); wordbank.test.ts (уровень считается переведённым, только если его файл существует); новый wordbankA2Pipeline.test.ts — 5 тестов на ТЕСТОВЫХ данных: agreed / ai-reviewed / human / needs-review на настоящих словах A2, другие уровни не задеты, чужая пара останавливает сборку, без файлов данные не меняются.
Проверки: lint ✓, typecheck ✓, test ✓ (28 файлов, 481).
Когда придут файлы: положить a2-agreed.csv и a2-review.csv (+ a2-arbitration.csv) → node scripts/wordbank-apply-translations.mjs → коммит A2.json. Экран уже показывает статусы для любого уровня.
Урок: конвейер «на будущее» проверять на тестовых данных, привязанных к реальным словам уровня. Тогда тест ловит и формат CSV, и сопоставление с данными.
