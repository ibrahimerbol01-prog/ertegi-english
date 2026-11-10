---
id: 1110-103204-abil-truesco-otvet-etap-5-test-te
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-10 10:32
reply_to: 1110-090053-ibrahimerbol-etap-5-test-teper-tv
---

# Ответ: Этап 5 (тест) теперь твой, затем Q5

Итог: этап 6 сделан — https://github.com/ibrahimerbol01-prog/ertegi-english/pull/137 (redesign/6-practice от origin/main), не слит. Дальше беру Q5.

git diff --stat: KazakhTalesApp.tsx 31, PracticeWordsOverview.tsx 81 (новый), utils/wordState.ts 8, dict.ts 9, index.css 1 строка, 2 теста — 7 файлов, +251/−5.

Что: «Жаттығу → Сөздер» открывается обзором: night-карточка «Бүгін қайталау» (dueCount) + .btn-ember «Қайталауды бастау» → существующий FlashcardsScreen (логика не тронута), ✕ «Жабу» назад; счётчики «Үйреніп жүрмін» / «Білемін» по mastery (как ридер: < MAX_MASTERY / = MAX_MASTERY); список слов (Тыңдау 48 px, слово, перевод, чип). «Күннің 5 сөзі» в режиме обзора — под списком. Только обычная сборка, чанка в research нет.
«Жаңа» нет: у SavedWord нет даты сохранения — показаны 2 счётчика (как сказано в письме).
Заодно: вкладки «Сөздер/Айтылым/Тест» из этапа 2 имели role=tab + aria-pressed — axe aria-allowed-attr ×3. Убрал aria-pressed, .segmented выделяет и [role=tab][aria-selected=true]. Вид тот же.

Проверки: lint ✓, typecheck ✓, npm test ✓ 605/605, build ✓, VITE_RESEARCH_MODE=1 build ✓. Новые тесты: компонент (5) + e2e «Жаттығу → Сөздер → Қайталауды бастау → назад»; мутация «без обзора» роняет e2e. Playwright 360/390/1440 + axe: 0 нарушений, <12 px и <44 px нет. Снимки во вложении.

Утверждение → URL → цитата:
| Нет даты сохранения у слова | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/types.ts | «export interface SavedWord {» (word, translation, reviewCount, mastery, nextReviewAt) |
| Граница «знаю» — MAX_MASTERY = 6 | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/research/params.ts | «REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35, 90]» |
| Повторение начинается с очереди при открытии | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/components/screens/WordsScreens.tsx | «The session queue is fixed when the screen opens» |

Вопросы: «Қайталауды бастау» — строка из промпта (в письме разрешены 4 другие), подтверди. Для «Жаңа» нужна дата сохранения при загрузке saved_words — делать?
Конфликт: #134, #135, #137 все вставляют строки в dict.ts после learnersUnit — при слиянии оставить все блоки.

Урок: проверять значение константы, а не догадываться — MAX_MASTERY = 6, а не 5; снимки с mastery 5 показывали «Білемін 0», и это было верно.
Урок: у вкладки со значком accessible name = «1Жаттығу» — в тестах искать по /Жаттығу$/.
Сработало: axe на изменённом экране сразу показал старую ошибку этапа 2 в том же переключателе — починил в рамках этапа 6, раз переключатель его.

## Файлы

- files/1110-103204-abil-truesco-otvet-etap-5-test-te/q6-review-390.png
- files/1110-103204-abil-truesco-otvet-etap-5-test-te/q6-overview-390.png
- files/1110-103204-abil-truesco-otvet-etap-5-test-te/q6-overview-360.png
- files/1110-103204-abil-truesco-otvet-etap-5-test-te/q6-overview-1440.png
