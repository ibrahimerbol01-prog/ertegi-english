---
id: 1105-210928-abil-truesco-otvet-zadanie-1-lint
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-05 21:09
reply_to: 1105-203345-ibrahimerbol-zadanie-1-lint-predu
---

# Ответ: Задание 1: lint-предупреждения и разбор npm audit

Итог: сделано — оба предупреждения lint убраны, ветка запушена, audit разобран (audit.md во вложении).

Изменено (коммит ceb8b45 «chore: убрать предупреждения lint»):
 src/KazakhTalesApp.tsx                  |  3 +-
 src/components/Culture.tsx              | 21 ++-----------
 src/components/screens/WordsScreens.tsx | 55 +++++++++++++++++++++------------
 src/utils/maqals.ts                     | 21 +++++++++++++
 4 files changed, 60 insertions(+), 40 deletions(-)

- only-export-components: loadMaqals/saveMaqal/maqalKey перенесены из Culture.tsx в новый src/utils/maqals.ts; импорт в KazakhTalesApp.tsx обновлён.
- set-state-in-effect: MatchingGame теперь тонкая обёртка, раунд вынесен в MatchingRound с key = номер раунда + состав слов. Раскладка плиток — в ленивом инициализаторе useState, «Следующий раунд» меняет key. Новый раунд или другой набор слов сбрасывает игру, как раньше эффект, но без setState в useEffect.

Проверки: lint ✓ (0 предупреждений; без правок те же 2 предупреждения воспроизводятся), typecheck ✓, test ✓ (20 файлов, 413 тестов).

Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...chore/lint-warnings?expand=1

Audit: 8 (2 low, 4 moderate, 2 high), все только в сборке и dev, в браузерный бандл не попадают. Оба high закрываются патчами без мажорных обновлений: vite 8.3.0 → 8.3.6, source-map-js 1.2.1 → 1.2.2 (`npm update vite source-map-js`, отдельным заданием, lockfile я не трогал). Цепочку vite-plugin-pwa → workbox-build → glob/minimatch/deepmerge можно игнорировать до новой версии workbox-build; совет npm откатить vite-plugin-pwa до 1.1.0 не применять.

Вопросы/риски:
- Мелочь в поведении: так как раунд перемонтируется, анимация появления (animate-pop-in) проигрывается при каждом новом раунде. Если не нужно — скажи, поправлю.
- На Windows с core.autocrlf=true (по умолчанию в Git for Windows) падают 3 теста src/research/corpus.test.ts: сгенерированные файлы приходят с CRLF, а тест сравнивает с LF. Я обошёл это у себя (core.autocrlf=false в клоне). Предлагаю отдельное задание: .gitattributes с `* text=auto eol=lf` или нормализация переводов строк в тесте.
- Окружение: Windows 11, Node v26.13.0 (winget OpenJS.NodeJS.LTS), npm 11.20.0, git 2.56.0. У прошлого исполнителя был Node 22 — всё зелёное и на 26.

## Файлы

- files/1105-210928-abil-truesco-otvet-zadanie-1-lint/audit.md
