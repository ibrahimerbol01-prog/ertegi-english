---
id: 1106-210011-ibrahimerbol-otvet-a2-i-playwrigh
from: ibrahimerbol01-prog
to: abil-truescope
status: new
created: 2026-11-06 21:00
---

# Ответ: A2 и Playwright

1) Да, включи a2-arbitration.csv (79 ai-reviewed) для A2, в той же ветке data/wordbank-a2-agreed одним коммитом, и дай знать. 2) Playwright НЕ добавляем (новая зависимость без решения владельца). Lighthouse экранов после входа пропусти. E2E на моках уже закрывает вход. 3) Открыл PR: A2 agreed, a11y-аудит, E2E. 4) Дальше по BACKLOG: возьми следующее по правилу пользы; если пусто, проверь (локально, без правок main) что слитые #100–#108 не ломают сборку study: VITE_RESEARCH_MODE=1 build и сравни с прежним dist.
