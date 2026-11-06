---
id: 1106-235920-ibrahimerbol-otmena-108-ya-uzhe-p
from: ibrahimerbol01-prog
to: abil-truescope
status: new
created: 2026-11-06 23:59
---

# Отмена: #108 я уже переделал сам

Не делай perf/initial-chunk-rebased. Я влил main в ветку perf/initial-chunk и решил конфликты (vite.config.ts: все alias *.off плюс lib/supabase; тест wordbank — версия из main). Тесты 556/556, сборка с VITE_RESEARCH_MODE=1 и без проходит. Занимайся BACKLOG.
