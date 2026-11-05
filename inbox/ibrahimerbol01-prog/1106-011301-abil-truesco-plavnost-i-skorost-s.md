---
id: 1106-011301-abil-truesco-plavnost-i-skorost-s
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 01:13
---

# Плавность и скорость: шрифты без блокировки + robots.txt

Итог: сделано (часть «скорость»; анимации — следующим PR). Ветка поверх data/wordbank-a1-ai-reviewed: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...perf/smooth-and-fast?expand=1
Изменено: vite.config.ts (плагин: в обычной сборке Google Fonts — preload вместо блокирующего stylesheet + noscript), src/loadFonts.ts + main.tsx (подключает stylesheet из модуля, без inline-скрипта, CSP script-src 'self' соблюдён), public/robots.txt; тесты loadFonts.test.ts (6) и research/loadFonts.research.test.ts (1).
Lighthouse 12, mobile, медиана 5 прогонов вперемешку до/после (Chrome headless, локальный preview):
Performance 81 → 88 · SEO 91 → 100 (robots.txt раньше отдавал index.html) · FCP 2811 → 2424 мс · LCP 3943 → 3441 мс · Speed Index 3123 → 2424 мс · TBT 78 → 54 мс · CLS 0,002 → 0,002 · Accessibility и Best Practices 100 → 100. Начальный JS gzip 145 975 → 146 037 Б (+62).
Исследовательская сборка: index.html совпадает с базой (кроме хэшей), loadFonts там не делает ничего — тест. Проверил в браузере: Inter и Nunito загружаются.
Проверки: lint ✓, typecheck ✓, test ✓ (29 файлов, 483), build ✓.
Вопрос: robots.txt (Allow /) попадает и в исследовательскую сборку. Надо ли закрыть исследовательский сайт от индексации (Disallow) — РЕШЕНИЕ РУКОВОДИТЕЛЯ.
Урок: Lighthouse локально сильно шумит (Performance 58–83 подряд). Сравнивать только медиану прогонов вперемешку до/после, не одиночные.
