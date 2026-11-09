---
id: 1110-021701-abil-truesco-otvet-t-rd7-t-rd8-re
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-10 02:17
reply_to: 1110-015522-ibrahimerbol-t-rd7-t-rd8-redizayn
---

# Ответ: T-RD7/T-RD8: редизайн, лендинг и учитель

Итог: сделано, оба этапа — PR открыты, не слиты.
- Этап 7: https://github.com/ibrahimerbol01-prog/ertegi-english/pull/126 (redesign/7-landing)
- Этап 8: https://github.com/ibrahimerbol01-prog/ertegi-english/pull/127 (redesign/8-teacher)
Оба от origin/redesign/2-nav, «Based on #123». HomeScreen/ReaderScreen/QuizScreens/WordsScreens, api/, supabase/, vercel.json, .github/, package.json/lock, src/research/ не трогал.

git diff --stat (от redesign/2-nav):
7: App.tsx 26, IntroScreen.tsx 139, dict.ts 40, flow.dom.test.tsx 3; новые GuestReader.tsx 112, LandingSample.tsx 35, TapWords.tsx 33, utils/tapText.ts 27, e2e/landing.dom.test.tsx 75 — 9 файлов, +447/−43
8: Teacher.tsx 5, dict.ts 9; новые ClassTopWords.tsx 34, utils/classTopWords.ts 19 + 2 теста — 6 файлов, +114

Проверки (каждая ветка): npm run lint ✓ (1 старое предупреждение ShoqanMascot), typecheck ✓, npm test ✓ (7: 564/564; 8: 568/568), npm run build ✓, VITE_RESEARCH_MODE=1 npm run build ✓. Мутации на новых тестах — каждая роняет тест. Playwright 360/390/1440 + axe-core 4 (WCAG AA + best practice): 0 нарушений, текста <12 px и целей <44 px нет, горизонтальной прокрутки нет. Снимки во вложении.

Главное по 7:
- Гость: свой маленький ридер первой сказки A1, а не ReaderScreen (в нём «Ойлау соқпағы»/Шоқан → /api/shoqan, 401 для гостя; и его переделываешь ты). Ноль запросов к /rest/v1 (тест). track() без ученика ничего не пишет. Изменений в авторизации/api не понадобилось.
- Окно «Прогресті сақтау…» сначала открывалось сразу на высоком экране — исправил: после того как первый абзац уехал за экран, или по «Сөздігіме».
- Исследовательская сборка: ClassicIntro как был; чанков GuestReader/LandingSample в ней нет (свёрнуто по __ERTEGI_RESEARCH__).

Главное по 8:
- RPC есть: class_events_summary.hard_words. Миграций нет. На клиенте: taps>0, learners≥3, топ-5. В PR описано, что нужно в RPC: tap_learners (сейчас learners = нажал ИЛИ забыл) и порог ≥3 на сервере.

Утверждение → URL → цитата:
| learners в RPC считает нажатия и забывания | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/supabase/migrations/20261105000000_learning_events.sql | «and (verb = 'word_tap' or (verb = 'srs_review'» |
| RPC доступна только учителю класса | там же | «if not is_class_teacher(p_class) then raise exception 'not_teacher'» |
| Гость не пишет события: без ученика track выходит | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/utils/events.ts | «const user = uid; if (!user) return;» |
| Ридер вызывает ИИ-сервис в «Ойлау соқпағы» | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/src/components/ThinkingTrail.tsx | «await fetch(apiUrl("/api/shoqan")» |
| Год/место РКНП не подтверждены в документах | https://github.com/ibrahimerbol01-prog/ertegi-english/blob/main/docs/research-design/ethics-consent-package.md | «Проект стал победителем РКНП [год, уточнить]» |

Вопросы / РЕШЕНИЕ РУКОВОДИТЕЛЯ:
1. «РКНП 2026 · 1 орын» на лендинге — взято из промпта, но в документах год/место «уточнить». Подтверди источник или убрать.
2. Нужен перевод владельца: teachersText (лендинг, «Мұғалімдерге»). «Шынайы айтамыз» в промпте обрезан «…» — взял до «жүргіземіз.».
3. «Пайдалану шарттары» и «Байланыс» в подвале не сделал: в проекте нет ни условий, ни контакта. Дай текст/адрес.
4. RPC для этапа 8 (tap_learners + порог на сервере) и оставлять ли в «Қиын сөздер» слова 1–2 учеников.
5. #126 и #127 оба добавляют строки в dict.ts рядом с tapWordHint — при слиянии второго будет простой конфликт (оба блока оставить).
Прочее: регистрация по почте у учеников сейчас не работает — письмо не приходит (у Абиля 20 мин). По docs/auth-email.md нужен Custom SMTP в Supabase; вход через Google работает как обход.

Урок: IntersectionObserver «второй абзац виден» срабатывает сразу на высоком экране — для «после первого абзаца» смотреть, что первый ушёл вверх (bottom ≤ rootBounds.top).
Урок: lazy(import) на уровне модуля попадает в исследовательскую сборку даже при if (RESEARCH_MODE); свернуть можно только тернарником по литералу __ERTEGI_RESEARCH__.
Урок: axe target-size ловит короткие слова-кнопки в тексте (a, is ~15 px) — min-w-6 на слове.
Сработало: замер axe + «текст <12 px / цели <44 px» одним Playwright-скриптом на 3 ширинах; axe поставлен во /tmp, не в зависимости проекта.

## Файлы

- files/1110-021701-abil-truesco-otvet-t-rd7-t-rd8-re/teacher-data-1440.png
- files/1110-021701-abil-truesco-otvet-t-rd7-t-rd8-re/landing-1440.png
- files/1110-021701-abil-truesco-otvet-t-rd7-t-rd8-re/teacher-empty-360.png
- files/1110-021701-abil-truesco-otvet-t-rd7-t-rd8-re/landing-390.png
- files/1110-021701-abil-truesco-otvet-t-rd7-t-rd8-re/guest-signup-360.png
- files/1110-021701-abil-truesco-otvet-t-rd7-t-rd8-re/teacher-data-390.png
- files/1110-021701-abil-truesco-otvet-t-rd7-t-rd8-re/guest-390.png
- files/1110-021701-abil-truesco-otvet-t-rd7-t-rd8-re/landing-360.png
