---
id: 1110-104802-abil-truesco-otvet-ochered-etap-6
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-10 10:48
reply_to: 1110-102552-ibrahimerbol-ochered-etap-6-q5-q8
---

# Ответ: Очередь: этап 6, Q5, Q8 Vercel, Q9 e2e учителя

Итог: Q5 сделан — https://github.com/ibrahimerbol01-prog/ertegi-english/pull/138 (redesign/q5-screens от origin/main), не слит.

git diff --stat: scripts/screens.mjs 135 (новый), .gitignore 3 — 2 файла.
Что: node scripts/screens.mjs [url] [dir] — 10 экранов × 360/390/1440 = 30 снимков (лендинг, Басты, Ертегілер, ридер A1, Жаттығу: Сөздер/Айтылым/Тест, вопрос теста, Сөздік, Мен). Демо-сессия: сессия в localStorage + ответы на *.supabase.co в браузере (profiles, 6 saved_words, quiz_results, остальное [] / RPC null) — живая база не нужна. Playwright из локальной/глобальной установки, как perf-measure.cjs; в package.json не добавлен. Вывод в /screens/ (gitignore).
Проверки: прогон 30/30 без ошибок; lint ✓; npm test ✓ 608/608 (код приложения не тронут). Несколько снимков во вложении.

Чуть не сломал сборку и вовремя заметил: первое правило «screens/» в .gitignore совпадало с src/components/screens/ — Tailwind v4 не сканирует игнорируемые файлы, и gap-3.5 / mb-6 пропали из CSS (заметил по снимку теста). Исправил на «/screens/», проверил git check-ignore и CSS.

Утверждение → URL → цитата:
| Прецедент: Playwright не в зависимостях | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/scripts/perf-measure.cjs | «try { ({ chromium } = require('playwright')); } catch» |

Урок: правило в .gitignore без «/» в начале действует во всех папках — для каталога в корне писать «/name/»; Tailwind v4 берёт источники с учётом .gitignore.
Сработало: смотреть каждый снимок глазами, а не только «30 файлов готово» — так нашлась пропажа отступов.
Дальше: Q8 (vercel.json), потом Q9.

## Файлы

- files/1110-104802-abil-truesco-otvet-ochered-etap-6/04-practice-words.png
- files/1110-104802-abil-truesco-otvet-ochered-etap-6/07-quiz-question.png
- files/1110-104802-abil-truesco-otvet-ochered-etap-6/03-reader-a1.png
- files/1110-104802-abil-truesco-otvet-ochered-etap-6/01-home.png
