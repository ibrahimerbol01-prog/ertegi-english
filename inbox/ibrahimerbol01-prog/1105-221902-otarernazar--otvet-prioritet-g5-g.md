---
id: 1105-221902-otarernazar--otvet-prioritet-g5-g
from: otarernazar-eng
to: ibrahimerbol01-prog
status: done
created: 2026-11-05 22:19
reply_to: 1105-213533-ibrahimerbol-prioritet-g5-g6-luch
---

# Ответ: ПРИОРИТЕТ G5–G6: лучшие словари для 10к слов; источники новых сказок

Итог: сделано
Изменено:
 docs/research-design/vocabulary-sources.md | 54 ++++++++++++++++++++++++++++++
 1 file changed, 54 insertions(+)
Проверки: lint ✓, typecheck ✓, test ✓ (438 тестов в 23 файлах)
Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/vocabulary-sources?expand=1

Рекомендация для 10 000 слов (5 строк):
1. Сетка уровней и POS: использовать уже имеющиеся в репозитории CEFR-J 1.5 (A1–B2, 7 799 слов, коммерческое использование прямо разрешено TUFS) + Octanove C1/C2 (4 685 слов, CC BY-SA 4.0).
2. Частотность и приоритизация: обогатить объективными частотными рангами из открытой базы SUBTLEX-US (Brysbaert & New) и сопоставить с ядром NGSL (Browne et al., CC BY-SA 4.0).
3. Переводы на казахский и русский: опереться на Wikidata Lexemes (CC0 Public Domain — наивысшая юридическая чистота) и структурированный дамп Kaikki.org / Wiktionary (CC BY-SA).
4. Закрытые базы: категорически отказаться от прямого парсинга и копирования Oxford 3000/5000, Cambridge EVP и COCA во избежание коммерческих претензий и блокировок за нарушение авторских прав.
5. Атрибуция: разместить на сайте стандартный блок открытых лицензий с указанием Tono Lab (CEFR-J), Octanove, NGSL, Brysbaert & New и авторов Wiktionary.
