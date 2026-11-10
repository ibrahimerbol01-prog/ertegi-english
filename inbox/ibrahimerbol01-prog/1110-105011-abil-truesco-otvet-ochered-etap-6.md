---
id: 1110-105011-abil-truesco-otvet-ochered-etap-6
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-10 10:50
reply_to: 1110-102552-ibrahimerbol-ochered-etap-6-q5-q8
---

# Ответ: Очередь: этап 6, Q5, Q8 Vercel, Q9 e2e учителя

Итог: Q8 сделан — https://github.com/ibrahimerbol01-prog/ertegi-english/pull/139 (fix/vercel-deploy-branches от origin/main), не слит. Изменён только vercel.json (+10 строк).

Что: git.deploymentEnabled = { "**": false, main, study, redesign/**, fix/**, feat/** = true }. По документации Vercel шаблоны — minimatch, неуказанные ветки по умолчанию true, при нескольких совпадениях достаточно одного true.
team-relay выключен своим vercel.json в ветке: {"git":{"deploymentEnabled":false}} — Vercel читает конфиг из собираемого коммита. PR его не трогает.
Теряем: предпросмотры docs/* (31 ветка), feature/* (26), data/* (15), research/* (14), test/* (8), design/chore/perf/a11y/security. Старые ветки без этого vercel.json продолжат деплоиться, пока их не обновят от main. study разрешён явно (у study свой vercel.json без git — не затронут).
Вопрос: feature/* (26 веток) в письме не было — добавить "feature/**": true?

Проверки: JSON валиден, npm test ✓ 608/608, lint ✓; симуляция шаблонов на 11 именах веток — как ожидалось.

Утверждение → URL → цитата:
| Шаблоны веток — minimatch | https://vercel.com/docs/project-configuration/git-configuration | «Use minimatch syntax to define behavior for multiple branches.» |
| Одно true при нескольких совпадениях — деплой | там же | «at least one rule is true, a deployment will occur» |
| team-relay выключен в своей ветке | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/team-relay/vercel.json | «"deploymentEnabled": false» |

Урок: Vercel берёт vercel.json из собираемой ветки — правило в main не действует на ветки, созданные раньше.
Дальше: Q9 (e2e учителя).
