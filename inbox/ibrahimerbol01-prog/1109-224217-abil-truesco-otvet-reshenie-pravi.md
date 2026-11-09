---
id: 1109-224217-abil-truesco-otvet-reshenie-pravi
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-09 22:42
reply_to: 1106-213212-ibrahimerbol-reshenie-pravilo-stu
---

# Ответ: Решение: правило study и конфликты PR

Итог: сделано. BACKLOG «Профессионализм сайта» п.3, находки 1, 3, 4 из docs/error-states.md. Находка 2 (очередь для слов, сохранённых без сети) — отдельной задачей, объём средний.

Изменено (git diff --stat origin/main...HEAD, 6ba88c6):
 src/KazakhTalesApp.tsx                  | 36 ++++++++---
 src/components/screens/WordsScreens.tsx |  8 ++-
 src/dict.ts                             |  4 ++
 src/e2e/errors.dom.test.tsx             | 79 ++++++++++++ (новый)
 src/utils/useOnline.ts                  | 15 +++++ (новый)

Что сделано:
1. Нет сети или сбой при загрузке сохранённых слов: вместо «0 сөз сақталды» / «Әзірге сөз сақталмаған» — «Сақталған сөздер жүктелмеді. Желі қосылғанда қайта көреміз.» (на главной и в «Сөздер»). После 4 неудачных попыток загрузка повторяется при событии online, а раньше сдавалась навсегда.
3. Сбой записи достижения больше не показывает тост «Деректер сақталмады»: достижение заново открывается из статистики при следующем входе (его баннер покажется ещё раз — это нормально).
4. Полоса «Желі жоқ. Ертегі мен квиз ашылады, квиз нәтижесі желі қосылғанда жіберіледі.» под шапкой, когда navigator.onLine=false. Сначала была плавающей сверху, но легла бы на баннер достижений (тот же z-[70]), поэтому перенёс в раскладку.

Проверки (после git merge origin/main, ветка без чужих файлов):
- npm run lint ✓ (0 ошибок, 1 чужое предупреждение ShoqanMascot.tsx:18)
- npm run typecheck ✓
- npm test ✓ 44 файла / 564 теста (+2 новых)
- npm run build ✓; VITE_RESEARCH_MODE=1 npm run build ✓
- Мутации: убрал полосу / не передал loadFailed / вернул onSaveError для достижений → каждый раз падает 1 тест; вернул → зелёный.
- Руками: vite preview + Chrome headless, 360×740, Supabase отрезан, navigator.onLine=false: полоса видна, в «Сөздер» текст «...жүктелмеді», Tab ведёт по вкладкам; сеть вернулась → полоса исчезла, список загрузился, scrollWidth=360 (нет горизонтальной прокрутки). Вход/регистрацию не менял: экран входа открывается.

Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...fix/error-states?expand=1

Утверждение → URL → цитата:
| Достижение восстанавливается при входе | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/fix/error-states/src/KazakhTalesApp.tsx | «!unlockedAchievements.includes(a.id) && a.check(stats)» |
| Слова раньше сдавались после 4 попыток | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/KazakhTalesApp.tsx | «if (attempt >= 4) return;» |
| Результат квиза уходит при появлении сети | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/KazakhTalesApp.tsx | «Quiz scores saved offline go up on start and whenever the connection returns.» |
| Баннер достижений сверху, z-70 | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/components/UIHelpers.tsx | «role="status" className="fixed top-[max(env(safe-area-inset-top),12px)]» |

Вопросы/риски:
- Новые тексты есть и в исследовательской сборке (это исправление ошибки, не функция). По вашему решению сайт участников — из замороженной study, так что сейчас участники их не видят; при переносе в study сравнить поведение.
- Казахские тексты для детей — проверить учителю.
- ru в DICT по-прежнему нет: нужен ли ru (в бэклоге «kk/ru/en»)? Это РЕШЕНИЕ РУКОВОДИТЕЛЯ.
- Аудит по ролям: исследователь — тексты в обеих сборках (см. выше); UX — полоса съедает ~2 строки на 360px, зато ничего не перекрывает; EdTech — ребёнок больше не думает, что слова пропали; консультант — находка 2 (потеря слов без сети) остаётся главным риском, предлагаю следующей.

Урок: плавающая плашка «сверху по центру» конфликтует с баннером достижений — перед новым fixed-элементом grep «fixed top» и z-[ в UIHelpers.
Урок: в Playwright get_by_role(name=…) ищет подстроку без учёта регистра — «Сөздер» нашёл «Апта сөздері» и открыл не тот экран; ставить exact=True.
Сработало: тот же fake-fetch, что в e2e/flow, но с выборочным отказом таблиц — офлайн-сценарии тестируются без живой базы.
