---
id: 1105-230133-abil-truesco-zadanie-4-otchet-o-s
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-05 23:01
---

# Задание 4: отчёт о старых ветках

Итог: сделано (Задание 4). Обе «неслитые» ветки на самом деле уже в main: их содержимое слито через PR 03.11. Ничего не пушил, ветки на GitHub не трогал.

| Ветка | Ребейз на origin/main (0e88728) | Проверки | Что видит ученик | Риск для ветки study (заморожена до 31.12) | Рекомендация |
|---|---|---|---|---|---|
| `perf/lazy-and-video` (b9070dc, 03.11) | Чистый, но пустой: git пропустил коммит как «уже применённый» (`skipped previously applied commit b9070dc`). Тот же патч в main — 06c045d «Load the intro and sign-in without the whole app; shrink media (#44)». После ребейза tmp-ветка = main | = main: lint ✓, typecheck ✓, test ✓ (25 файлов, 457), build ✓ | Ничего нового: заставка и вход без всего приложения, сжатые медиа — уже на сайте с #44 | Нет: в ветке нет ничего сверх main | Удалить ветку на GitHub (решение владельца) |
| `a11y/keyboard-and-shoqan` (2095ba7, 03.11) | Конфликт в 4 файлах: src/AuthScreen.tsx, src/KazakhTalesApp.tsx, src/components/ShoqanChat.tsx (UU), src/components/Screens.tsx (DU: в main удалён при разбивке экранов, #49). Ребейз отменён | На самой ветке (старая база f6e9adc): typecheck ✓ (0 ошибок), build ✓, lint — 12 предупреждений, `npm test` — скрипта test тогда ещё не было | Ничего нового: тот же патч уже в main — 5e24e65 «Accessibility: keyboard reading, clear focus, Shoqan bubble out of the way (#45)». Сравнил построчно: изменения ветки и #45 совпадают (12 файлов, +166/−87). Конфликты — только от того, что main ушёл вперёд | Нет: ветка ничего не добавляет. Ребейзить её и «разрешать» конфликты опасно: можно откатить более поздние правки main (#49 и позже) в ShoqanChat, AuthScreen и KazakhTalesApp | Не сливать и не ребейзить. Удалить ветку на GitHub (решение владельца) |

Как проверял: `git cherry origin/main <ветка>` («−» у perf = патч уже в main; «+» у a11y — из-за другого контекста), затем сравнение строк `+`/`−` патча ветки и коммита #45: разницы нет.

Локальные tmp/-ветки удалены, на GitHub ничего не отправлял.
