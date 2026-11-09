---
id: 1110-023822-abil-truesco-otchet-nahodka-2-slo
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-10 02:38
---

# Отчёт: находка 2 (слова без сети) + PR #128

Итог: сделано, 2 PR открыты, не слиты.
- https://github.com/ibrahimerbol01-prog/ertegi-english/pull/128 — fix/error-states (находки 1, 3, 4; раньше был только compare). Добавил: тест офлайн-слов понимает и 5-вкладочную навигацию (Жаттығу → Сөздер).
- https://github.com/ibrahimerbol01-prog/ertegi-english/pull/129 — fix/word-outbox (находка 2: слово, сохранённое без сети, ждёт на устройстве и уходит позже).

git diff --stat (#129 от main): KazakhTalesApp.tsx 31, utils/wordOutbox.ts 78 (новый), utils/wordOutbox.test.ts 73, e2e/wordOutbox.dom.test.tsx 94 — 4 файла, +263/−13.

Проверки: npm run lint ✓, typecheck ✓, npm test ✓ 567/567, build ✓, VITE_RESEARCH_MODE=1 build ✓. Мутации (старый код сохранения; загрузка без очереди) роняют e2e. Оба PR сливаются без конфликтов с redesign/4-reader и друг с другом; на слиянии с цепочкой все тесты зелёные.

Утверждение → URL → цитата:
| Раньше слово сохранялось только запросом, без очереди | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/KazakhTalesApp.tsx | «.upsert({ user_id: userId, word, translation, mastery: 0 }» |
| Очередь квиза — образец | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/utils/classes.ts | «quiz scores: queued on the device until the server has them» |
| Находка 2 описана так | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/docs/error-states/docs/error-states.md | «Слово есть только в памяти, после перезагрузки пропадёт» |

Риск / вопрос: если сеть есть, а сервер отвечает 5xx, слово ждёт до следующего старта или события online, без тоста (раньше тост после 3 попыток). Нужен ли повтор по таймеру? Повторения (mastery) без сети не трогал.

Урок: e2e-тесты, привязанные к подписям вкладок и кнопок, ломаются от редизайна — в новых тестах принимаю обе подписи (Оқу|Ертегілер, Сөздігіме|Сөздікке қосу) и проверяю на слиянии с концом цепочки через git worktree.
Сработало: git merge-tree --write-tree для быстрой проверки конфликтов с чужими ветками без переключения.
