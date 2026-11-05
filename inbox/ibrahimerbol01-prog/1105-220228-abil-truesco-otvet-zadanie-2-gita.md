---
id: 1105-220228-abil-truesco-otvet-zadanie-2-gita
from: abil-truescope
to: ibrahimerbol01-prog
status: done
created: 2026-11-05 22:02
reply_to: 1105-211458-ibrahimerbol-zadanie-2-gitattribu
---

# Ответ: Задание 2: .gitattributes и тесты исследовательского контура

Итог: сделано — обе части, две ветки запушены, настоящих ошибок в коде не нашёл (есть 2 риска, см. ниже).

## Часть A — переводы строк

Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...chore/gitattributes-lf?expand=1
Коммит 9fc1d51:
 .gitattributes                                     |    24 +
 research/cefr/cefrj-vocabulary-profile-1.5.csv     | 15598 +++++++++----------
 .../cefr/octanove-vocabulary-profile-c1c2-1.0.csv  |  4274 ++---

- `* text=auto eol=lf`; `binary` для png jpg jpeg gif webp avif ico mp3 mp4 wav ogg webm pdf zip gz woff woff2 ttf otf (в репо есть png, jpg, webp, ico, mp4, zip).
- `git add --renormalize .` затронул только два CSV словарей CEFR: в репо они лежали с CRLF. Изменились только переводы строк (`git diff --cached --ignore-cr-at-eol` пустой, кроме .gitattributes).
- Проверено при `core.autocrlf=true`: файлы заново выкачаны с LF (0 байт CR), `npm run corpus` не меняет ни одного файла, corpus.test.ts ✓ (21 тест).
- Проверки: lint ✓ (2 предупреждения — те же из main, их убирает chore/lint-warnings), typecheck ✓, test ✓ (413).

## Часть B — тесты исследовательского контура

Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...test/research-contour?expand=1
Коммит c42ab03, только новые файлы:
 src/research/contour.events.test.ts  | 123 ++++
 src/research/contour.screens.test.ts | 216 +++++++

Как устроено: `vi.mock("./mode")` включает RESEARCH_MODE и STUDY_ID, Supabase — фейк, записывающий строки learning_events. Используется настоящий src/utils/events.ts. Экраны рендерятся в HTML через react-dom/server (jsdom в проекте нет, новые зависимости нельзя). То, что живёт в useEffect (EventsOn, setEventsUser в KazakhTalesApp), проверяется по исходнику.
Проверка на мутациях: если убрать `!RESEARCH_MODE` у совета Шоқана на главной и у кнопки в квизе, падают 3 теста; без мутации всё зелёное.

Проверки: lint ✓ (новых предупреждений нет), typecheck ✓, test ✓ (22 файла, 435 тестов, было 413).

| Пункт | Было покрыто | Что сделал |
|---|---|---|
| 1. Нет событий до «да» и после «нет» | частично: только чистая функция assentStatus | добавил тест: track() без включённого ученика ничего не кладёт в очередь и не шлёт; после закрытия ворот (setEventsUser(null)) новые события отбрасываются; у ученика с «нет» нет своей очереди. StudyGate (SSR): нет кода / нет ответа / «нет» / «да» на старую версию текста — приложение не рендерится; «да» на текущую — рендерится. По исходнику: события включает только EventsOn при «да», в KazakhTalesApp в исследовательском режиме свой выключатель стоит на return, других вызовов setEventsUser нет |
| 2. research=true и study_id в каждом событии | частично: только чистая функция researchContext | добавил тест: через настоящий events.ts каждая строка в очереди и каждая отправленная строка несут research=true, study_id, study_code, assent_version; на общем устройстве у каждого ученика свой код |
| 3. Нет Шоқана | не было | добавил тест: главная (kk/en) без совета, аватара и кнопки; квиз без «Шоқаннан сұра»; fetch не вызывается; по исходнику: все 3 модуля с /api/shoqan (ShoqanChat, ThinkingTrail→TrailButton, WeekWords→WeekWordsCard) монтируются только под !RESEARCH_MODE, каждое открытие чата (askShoqan, shoqan:open) — тоже |
| 4. Экран теста без XP и подсказок | частично: движок и подсчёт баллов (engine.test.ts) | добавил тест: TestScreen рендерится без XP и Шоқана; у него нет onReward, кода XP/params/hintLadder/evidence/озвучки/таймеров; монтируется только с userId и lang и не для учителя; после ответа нет показа верно/неверно |
| 5. Своё | — | добавил тест: обычная сборка не может получить экран теста (alias из vite.config.ts реально превращает импорт в testEntry.off, там null); учитель в исследовательской сборке не проходит через ворота, а значит, не отслеживается; опечатка или подделанный код не попадает в события |

Ошибок в коде тесты не нашли.

## Вопросы/риски

1. **Исследовательская сборка без VITE_STUDY_ID собирается молча**, и все события получают `study_id: "unset"` (vite.config.ts:23 подставляет "", src/research/studyCode.ts → researchContext даёт "unset"). Данные этапа 0 можно перепутать. Предлагаю валить сборку при `VITE_RESEARCH_MODE=1` без `VITE_STUDY_ID` (код не трогал).
2. **Очередь остаётся на устройстве после закрытия ворот.** setEventsUser(null) чистит только память, а `ertegi_events_queue_<uid>` в localStorage остаётся (src/utils/events.ts, setUser). Если ученик ответил «да», а потом «нет» (например, ответ пришёл синхронизацией с другого устройства), неотправленные события периода «да» лежат на устройстве и уйдут, если он снова скажет «да». Нужно решение протокола: удалять их при «нет» или считать законными.
3. Для ясности: квиз (основной цикл) в исследовательской сборке XP по-прежнему даёт (QuizScreens.tsx:180). Я понял пункт 4 как экран теста R5. Если XP нужно убрать и в квизе — скажи.
4. Ограничение: без DOM-окружения часть проверок (эффекты) сделана по исходнику и может потребовать правки при рефакторинге этих строк. Полноценный рендер с эффектами требует jsdom или @testing-library — это новая зависимость, решать владельцу.
5. Окружение: у себя оставил `core.autocrlf=false` в клоне.
