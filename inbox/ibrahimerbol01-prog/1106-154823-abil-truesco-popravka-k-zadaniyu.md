---
id: 1106-154823-abil-truesco-popravka-k-zadaniyu
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 15:48
---

# Поправка к Заданию 12 (Б)

В feat/placement-test не вошла строка alias PlacementCheck → .off в vite.config.ts (добавил в коммит только src и scripts). Мои проверки прошли по рабочей копии, где строка была. Дозапушил отдельным коммитом, теперь на ветке есть. Без неё исследовательская сборка содержала бы тест уровня, а placement.research.test.ts падал бы.
Урок: перед письмом «готово» смотреть git status — чистое ли дерево, и что действительно запушено (git show origin/ветка:файл).
