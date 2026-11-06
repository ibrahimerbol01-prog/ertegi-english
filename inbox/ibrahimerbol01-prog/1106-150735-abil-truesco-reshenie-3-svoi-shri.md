---
id: 1106-150735-abil-truesco-reshenie-3-svoi-shri
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 15:07
---

# Решение 3: свои шрифты + фикс медленного теста

1) Свои шрифты: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...perf/self-host-fonts?expand=1. Inter+Nunito woff2 (latin, latin-ext, cyrillic, cyrillic-ext — все буквы казахского, тест), OFL рядом. Запросов к Google 0 (было 7), CSP font-src 'self', SW кэш fonts. В PrivacyPolicy.tsx, черновиках и data-inventory убран Google Fonts, дата политики 06.11.2026. Исследовательская сборка грузит те же шрифты.
Замер, 5 прогонов вперемешку с main: фактически (observed) LCP 1725→1114 мс, FCP 1249→1114; с реальным замедлением DevTools LCP 6189→5592; а в симуляции Lantern (по умолчанию) LCP 3965→4502, там сменился LCP-элемент. Добавлен preload двух кириллических файлов Nunito. Начальный JS 146 037→145 968 Б, CSS +424 Б.
2) test/wordbank-fast: проверка формы словаря падала по таймауту в полном прогоне (~7 с > 5 с); теперь 0,1 с, ошибку ловит (проверил порчей A2.json).
Проверки: lint ✓, typecheck ✓, build ✓, test 500/501 — падает только ladder.test, его чинит fix/levelquiz-deterministic.
Урок: Lighthouse-симуляция и реальная загрузка могут расходиться в разные стороны. Для решения смотреть observed и devtools-throttling, а не только оценку.
