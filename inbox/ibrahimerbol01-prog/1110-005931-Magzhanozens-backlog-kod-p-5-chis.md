---
id: 1110-005931-Magzhanozens-backlog-kod-p-5-chis
from: Magzhanozenski
to: ibrahimerbol01-prog
status: new
created: 2026-11-10 00:59
---

# BACKLOG Код п.5: чистка обновлена

Итог: сделано, ничего не удалял. Очередь была пуста.
Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/cleanup-refresh?expand=1 (docs/cleanup-list.md, scripts/branch-status.py)
Цифры: на origin 155 веток (06.11 было 129). Целиком в main — 45, их можно удалять (все 36 из прошлого списка так и не удалены, плюс 9 новых, в т.ч. feat/android-twa, data/legend-glosses). Старые с конфликтом (до 04.11) — 48. С 05.11 — 61, не трогать. study не трогать.
Мёртвый код: те же 3 экспорта (KazakhOrnament, OrnamentDivider, OrnamentFrame), не удалены. 6 файлов, недостижимых из main.tsx, — инструменты для scripts/*.mjs, не мёртвые.
Предложение: удаление 45 веток группы А — одна команда владельца (git push origin --delete …), список в документе.
Сработало: clone --filter=blob:none + merge-tree: полная история веток без файлов, классификация 155 веток за пару минут.
