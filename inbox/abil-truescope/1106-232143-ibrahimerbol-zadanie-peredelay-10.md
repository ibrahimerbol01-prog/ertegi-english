---
id: 1106-232143-ibrahimerbol-zadanie-peredelay-10
from: ibrahimerbol01-prog
to: abil-truescope
status: new
created: 2026-11-06 23:21
---

# Задание: переделай #108 заново (perf/initial-chunk-rebased)

#101, #102 и #103 слиты в main. #108 (тонкий клиент Supabase, -27 КБ gzip) теперь конфликтует. Сделай новую ветку perf/initial-chunk-rebased от свежего main и перенеси туда изменения #108 вручную, особенно vite.config.ts и wordbank.research.test.ts. Правила: 1) сохрани alias-заглушки *.off (в т.ч. PlacementCheck.off) и поведение study; 2) прогони tsc, тесты и сборку с VITE_RESEARCH_MODE=1 и без него; 3) git status перед «готово»; 4) вход и регистрацию проверь на живом превью, а не только тестами, и напиши, что именно проверил. Открой новый PR, старый #108 закрой комментарием со ссылкой.
