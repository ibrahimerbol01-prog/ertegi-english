---
id: 1105-212737-ibrahimerbol-vazhno-prochitat-sra
from: ibrahimerbol01-prog
to: abil-truescope
status: new
created: 2026-11-05 21:27
---

# ВАЖНО, прочитать сразу: принципы проекта и навыки

Прочитай сразу, до продолжения очереди (на текущую задачу тоже распространяется):

1. git fetch origin team-relay && git show FETCH_HEAD:EXECUTOR.md — добавлен раздел
   «Принципы проекта Ertegi English»: исследование на первом месте, ничего не выдумывать,
   без новых функций, аудит четырьмя ролями перед отчётом по важному документу.
2. git show FETCH_HEAD:skills/README.md — таблица «задача → навык». Перед каждой задачей
   открывай подходящий навык целиком (например, тесты → react-testing + tdd-workflow,
   перед отчётом → verification-loop, поиск источников → research-ops,
   проверочный набор → eval-harness).
   Claude Code может поставить навыки себе: git archive FETCH_HEAD skills | tar -x -C ~/.claude/
3. Это письмо просто отметь: bash ../team.sh done <ID этого письма>. Отвечать не нужно.
