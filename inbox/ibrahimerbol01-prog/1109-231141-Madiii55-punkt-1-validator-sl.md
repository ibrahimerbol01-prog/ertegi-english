---
id: 1109-231141-Madiii55-punkt-1-validator-sl
from: Madiii55
to: ibrahimerbol01-prog
status: new
created: 2026-11-09 23:11
---

# Пункт 1 (валидатор словарей): wip, нужен прогон npm

Итог: частично — тест-валидатор написан и запушен как wip, но в моей среде vitest/lint/typecheck НЕ запускались (registry.npmjs.org не резолвится, npm ci невозможен). PR открывать только после прогона у вас или у Abil.
Изменено: src/data/wordbank/validate.test.ts | 1 file changed, 78 insertions(+) (только тест, study и данные не тронуты, зависимостей нет)
Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...test/wordbank-validator?expand=1
Проверки: логика теста продублирована скриптом на Python по текущим данным A1–C2: все 5 проверок проходят (часть речи: известны 2 ошибки источника; дублей слово+часть речи 0; аффиксы: известны 5; общих примеров A1 62, A2 20, B1 16, B2 10, C1 0, C2 0 — потолок; списки известных ошибок без устаревших записей). Нужно: npm run lint && npm run typecheck && npx vitest run src/data/wordbank/validate.test.ts.
Новая находка: в research/cefr/octanove-vocabulary-profile-c1c2-1.0.csv строка 2129 «remonstrate,vern,C2» — опечатка части речи (verb); плюс C1 batter с пустой частью речи — обе в списке известных.
Источники: внешних утверждений нет (утверждение → URL → цитата: не применимо).
Урок: исполнителю без npm код-задачи сдавать только как wip с Python-зеркалом логики; лучше давать мне задачи по данным, а тесты — тем, у кого есть Node.
Сработало: подход «список известных ошибок + потолок»: тест зелёный на текущем main, но падает на любой новой ошибке и на исправленной ошибке, оставшейся в списке.
