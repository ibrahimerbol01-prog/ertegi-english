---
id: 1109-230349-otarernazar--otvet-ochered-q2-gem
from: otarernazar-eng
to: ibrahimerbol01-prog
status: new
created: 2026-11-09 23:03
reply_to: 1106-005953-ibrahimerbol-ochered-q2-gemini
---

# Ответ: Очередь Q2 (Gemini)

Статус: готово (пункт 4 из очереди Q2 1106-005953 — раздел «Известные ограничения» в предрегистрации OSF, а также сводный отчёт по закрытию всех пунктов 1–4 очереди Q2).
Ветка: docs/osf-prereg-draft (свежий merge с origin/main).
Сравнение: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/osf-prereg-draft

1. Вывод git diff --stat origin/main...HEAD (в ветке docs/osf-prereg-draft):
 docs/research-design/osf-prereg-draft.md | 20 ++++++++++++++++++++
 1 file changed, 20 insertions(+)

(Сводка по всем 4 веткам очереди Q2 1106-005953:
- П. 1 (G15 полевой пакет): ветка `docs/field-pack` (коммит `2480505`), 3 файла (+258 строк) — отчёт отправлен письмом `1109-224711`;
- П. 2 (Литература, 10 источников): ветка `docs/literature-q2` (коммит `ad25657`), 1 файл (+40/-1 строк) — отчёт отправлен письмом `1109-225230`;
- П. 3 (Абай / Шәкәрім / Ыбырай — тематическая карта по CEFR): ветка `docs/classics-map` (коммит `eca63a5`), 1 файл (+87 строк) — отчёт отправлен письмом `1109-230129`;
- П. 4 (Известные ограничения в OSF-предрегистрации): ветка `docs/osf-prereg-draft`, раздел 7 в `docs/research-design/osf-prereg-draft.md` (+20 строк)).

2. Что сделано в пункте 4 (`docs/research-design/osf-prereg-draft.md`):
- Проведена программная сверка 13 карточек из `src/data/legends.ts` и `research/legend-glosses/legend-glosses.csv` с пулом целевых слов из `docs/research-design/study-design.md` (раздел 5.2) и `docs/research-design/test-items-review.md`.
- В `docs/research-design/osf-prereg-draft.md` добавлен **Раздел 7. Известные ограничения (Known Limitations)**:
  * В нейтральной научной формулировке зафиксировано, что в публичной версии платформы в **11 из 13 карточек раздела «Легенды»** (`src/data/legends.ts`, все кроме `aldar` и `qozy`) встречаются целевые слова или их словоформы из исследовательского пула — в частности `pit`, `hero`, `beat`, `escaped` в карточке `alpamys`, `jealous` в `qyzzhibek`, `brave`, `wise`, `land`, `protected` в `qobylandy`, `hero`, `journey`, `wise` в `tostik`, `camel`, `wise`, `land` в `asan`, `village`, `wisely` в `zhirenshe`, `wise` в `qorqyt`, `land` в `tomiris` и `khanate`, `brave`, `bravely`, `wise` в `abylai`, `journey` в `shoqan`.
  * Описаны 3 уровня статистического и технического контроля этой угрозы: (1) изоляция маршрута участников в исследовательском контуре (`VITE_RESEARCH_MODE=1` по кодам `ERT-NNNC`), (2) ковариационный контроль исходного знания слова на претесте (`known_pre`) в основной GLMM и анализ чувствительности строго на подмножестве `known_pre == 0`, (3) учёт флага ранней экспозиции (`early_exposure`) при формировании выборки Per-Protocol (PP).

3. Команды проверок и результат:
- npm run lint -> 0 errors, 1 warning (в существующем src/components/ShoqanMascot.tsx)
- npm run typecheck -> 0 errors (tsc -b)

4. Таблица «утверждение -> URL -> цитата до 15 слов»:
| Утверждение | URL | Цитата (до 15 слов) |
|---|---|---|
| В карточке легенды `alpamys` обычного сайта дважды встречается целевое слово `pit` | src/data/legends.ts (строки 92, 96–97) | «Then they threw him into a deep pit. He stayed there for seven years» |
| В карточке `qyzzhibek` встречается целевое слово `jealous` | src/data/legends.ts (строки 105, 110) | «But on his way back to her, jealous enemies attacked Tolegen.» |
| Словоформа `escaped` из карточки `alpamys` зафиксирована в аудите глоссария легенд | research/legend-glosses/legend-glosses.csv (строка 47) | «escaped,verb,қашып құтылды,сбежал,"перевод Claude, поштучно со словарём не сверен; форма escape",alpamys» |
| Чувствительный анализ основной модели GLMM проводится только по словам, неизвестным на претесте | docs/research-design/study-design.md (раздел 3.2) | «Анализ чувствительности: (а) только слова, неизвестные на претесте» |

5. Внутренний аудит с 4 ролей:
- Исследователь: Прозрачная фиксация пересечения 11 из 13 карточек легенд с целевыми словами в предрегистрации OSF предотвращает обвинения в скрытом конфаундере (uncontrolled extra exposure in L1-familiar context) при рецензировании статьи.
- UX: Разделение обычного продуктового сайта (с разделом «Легенды») и исследовательского контура (`VITE_RESEARCH_MODE=1`) не ломает пользовательский опыт открытого продукта и одновременно защищает чистоту эксперимента в школе.
- EdTech: Полная поименная раскладка всех 11 карточек (`alpamys`, `qyzzhibek`, `qobylandy`, `tostik`, `asan`, `zhirenshe`, `qorqyt`, `tomiris`, `khanate`, `abylai`, `shoqan`) позволяет при необходимости отфильтровать конкретные слова в разведочном анализе.
- Консультант стартапа: Честный раздел Known Limitations в OSF Preregistration повышает доверие жюри научных конкурсов и рецензентов Q1/Q2 журналов к методологической зрелости команды.

Урок: При проведении педагогического РКИ внутри живого EdTech-продукта необходимо сверять целевые слова не только по основным текстам вмешательства, но и по всем побочным игровым экранам (карточки, маскот, дейлики) и заранее фиксировать пересечения в предрегистрации.
Сработало: Автоматическая сверка `src/data/legends.ts` и `research/legend-glosses/legend-glosses.csv` против пула целевых слов подтвердила точное число карточек с пересечением (11 из 13, все кроме `aldar` и `qozy`).
