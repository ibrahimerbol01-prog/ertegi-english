# Журнал учебных событий (R2)

Дата: 04.11.2026. Задача R2 из `docs/research-evidence.md` (раздел 4).

## Что это

Журнал фактов об учёбе в духе xAPI: кто (ученик), что сделал (глагол), с чем (объект), с каким результатом, в каком контексте. Одна строка = одно событие в таблице `public.learning_events` (миграция `supabase/migrations/20261105000000_learning_events.sql`). Клиент: `src/utils/events.ts`, функция `track(verb, payload)`.

Сейчас это продуктовая аналитика обучения на текущем сайте под обычной политикой конфиденциальности (пункт о журнале добавлен в `src/components/PrivacyPolicy.tsx`). Исследовательского согласия здесь нет; исследовательский сайт позже возьмёт тот же журнал, но только для участников, давших согласие (`docs/research-evidence.md`, раздел 9.2).

## Правила

1. Только факты. Тексты ученика (аргумент и ответ в дебатах «Апта сөздері», утверждение и вопрос в «Ой ізі», сообщения Шоқану, распознанная речь) в журнал не пишутся: только длина или число слов. Сами тексты дебатов и «Ой ізі» лежат, как и раньше, в своих таблицах (`debate_entries`, `trail_entries`); переписка с Шоқаном не хранится нигде.
2. Никаких личных данных: ни имени, ни почты, ни класса по имени. `user_id` ставит сервер (RLS проверяет, что это сам ученик), `class_id` в контексте только если ученик состоит ровно в одном классе.
3. Пишем только за ученика с сессией. Гость и учитель (просмотр сказок) не пишутся.
4. `track` синхронный и не бросает исключений: событие кладётся в очередь `localStorage` (ключ `ertegi_events_queue_<user_id>`, не больше 500 событий, старые вытесняются) и уходит на сервер пакетами по 50: в простое браузера (через 15 с после события, через 1 с при полном пакете), при скрытии или закрытии страницы, при появлении сети. Повторная отправка безопасна: `client_id` уникален для пары (`user_id`, `client_id`), сервер хранит событие один раз.
5. Ошибка сети: очередь остаётся, повтор через 5 с, 10 с, 20 с… до 5 минут. Нет таблицы (миграция не применена: `PGRST205`, `42P01`, 404): отправка выключается до перезагрузки страницы, в консоли одна строка `console.debug`, интерфейс работает как раньше. Строка, которую таблица не принимает (ошибки `22…`, `23…`), выбрасывается одна, остальные уходят.
6. Время события (`occurred_at`) ставит устройство; сервер не пускает его в будущее и дальше 30 дней назад. `created_at` всегда серверное.
7. Удаление аккаунта удаляет журнал (`delete_my_account()` в той же миграции, плюс каскад от `auth.users`); очередь на устройстве удаляется вместе с остальными ключами `ertegi_*`.
8. Новый глагол добавляется в трёх местах сразу: `EVENT_VERBS` в `src/utils/events.ts`, `check (verb in (...))` в миграции (новой), таблица ниже. Тест `src/utils/events.test.ts` падает, если списки разошлись или глагол из списка нигде не вызывается.

## Поля строки

| Поле | Что | Пример |
|---|---|---|
| `client_id` | uuid, сделан на устройстве | `0b9c…` |
| `verb` | глагол из таблицы ниже | `quiz_answer` |
| `object_type`, `object_id` | с чем: слово, вопрос, сказка, фраза | `quiz_question`, `3` |
| `story_id`, `level` | сказка и уровень (`A1`…`C1`, `quiz` для сказки целиком) | `aldar_kose`, `A2` |
| `result` | маленький JSON (меньше 2000 байт): верно, попытка, время, счёт, длины | `{"correct":false,"attempt":1,"duration_ms":5400}` |
| `context` | `app_version` (версия из `package.json` и коммит Vercel), `content_version` (`src/data/contentVersion.ts`), `lang` (`kk`/`en`), `class_id`; в исследовательской сборке ещё `research: true`, `study_id` (переменная `VITE_STUDY_ID`) и `study_code` (код участника, когда он введён; `docs/research-build.md`) | `{"app_version":"0.0.0+94f5543","content_version":"2026-11-04","lang":"kk"}` |
| `occurred_at` | когда случилось на устройстве | |

`content_version` меняется вместе с текстами сказок, вопросами квизов и вопросами «Дала кеңесі»: тест `src/data/contentVersion.test.ts` сверяет хеш контента и падает, пока дату и хеш не обновили. Так анализ знает, какой именно текст читал ученик.

## Словарь событий

Ссылки «§» ведут на разделы `docs/research-evidence.md`.

| Глагол | Когда пишется | Поля (`object_type`/`object_id`, `story_id`, `level`, `result`) | Файл | Для какого вопроса |
|---|---|---|---|---|
| `session_start` | ученик вошёл и приложение открылось (один раз за загрузку страницы) | без объекта и результата | `src/utils/events.ts` (`setUser`) | удержание D7/D30, серия дней (§3.10, I6) |
| `story_open` | открыт текст сказки на уровне (также при каждом возврате на вкладку чтения и смене уровня: это повторное открытие, а не дубль) | `story`/id сказки, `story_id`, `level` | `src/components/screens/ReaderScreen.tsx` | сколько и какие уровни читают; связь чтения с тестом R5; фольклор против нейтральных текстов (R7) |
| `level_complete` | уровень или вся сказка засчитаны (квиз пройден) впервые | `level`/`<story>:<step>`, `story_id`, `level` | `src/KazakhTalesApp.tsx` (`markStep`) | путь по уровням; «готово» в заданиях учителя |
| `word_tap` | нажато слово в тексте | `word`/слово, `story_id`, `level`; `result.has_translation`, `during_audio` | `ReaderScreen.tsx` | трудные слова класса (R8); «попробуй уровень ниже» при многих нажатиях (N7, Yanagisawa et al. 2020); пользу глосс (I3) |
| `audio_play` | старт «Бірге оқу» или сцены легенды | `reading`/`<story>:<level>` или `scene`/id карточки; `result.speed`, `from_sentence`, `sentences` (чтение), `resume` (сцена) | `ReaderScreen.tsx`, `src/components/ScenePlayer.tsx`, `LegendCards.tsx` | чтение под озвучку и выбранная скорость (§3.9, Webb, Uchihara & Yanagisawa 2023); порядок «слушай и читай» (N3) |
| `quiz_answer` | ответ на вопрос квиза (каждая попытка) | `quiz_question`/номер вопроса, `story_id`, `level`; `result.correct`, `attempt`, `choice`, `duration_ms`, `practice`, `hint` (`none`/`evidence`/`sentence`/`reread`), `type` | `src/components/screens/QuizScreens.tsx` | корректирующая обратная связь и вторая попытка (§3.5, Wisniewski, Zierer & Hattie 2020; I1); польза предложения-доказательства (§3.7); трудные вопросы класса (R8) |
| `quiz_complete` | квиз или тренировка закончены | `quiz`/`<story>:<level>`; `result.score`, `total`, `first_try`, `practice` | `QuizScreens.tsx` | порог 60 % и его отмена (§3.5, I1); сравнение с тестом R5 |
| `srs_review` | ответ на карточке повторения («Білдім» / «Әлі жоқ») | `word`/слово; `result.correct`, `box_before`, `box_after`, `days_overdue` | `src/KazakhTalesApp.tsx` (`handleReview`) | кривая забывания и интервалы (§3.4, Cepeda et al. 2008); откат на одну коробку (I4); переход на FSRS (N9) |
| `word_save` | слово добавлено в словарь | `word`/слово, `story_id`/`level` (из читалки); `result.source` (`reader`/`daily`) | `src/KazakhTalesApp.tsx` (`handleSaveWord`) | откуда берутся слова; адаптивная лексика (§3.6) |
| `daily_words_seen` | «5 слов дня» выбраны и показаны впервые за день | `daily_words`/номер дня, `level` (уровень ученика); `result.words`, `stretch`, `known_total` | `src/components/WordCoach.tsx` | адаптивная лексика: уровень и уровень выше (§3.6) |
| `daily_word_known` | «Білемін» на слове дня | `word`/слово, `level` слова; `result.stretch` | `WordCoach.tsx` | самооценка против повторения: сверка с `srs_review` и тестом R5 (§3.6, R6) |
| `council_vote` | голос в «Дала кеңесі», раунд 1 или 2 | `council_question`/id, `story_id`; `result.round`, `choice`, `correct`, `confidence` (раунд 1), `reason_words` (длина причины, не текст), `first_correct`, `changed` (раунд 2), `repeat` | `src/components/Council.tsx` | нормализованный прирост и доля переходов «неверно → верно» (§3.2, Crouch & Mazur 2001; I7); «уверен, но ошибся» (I1). Нет второго раунда = ученик был прав при сильном классе |
| `trail_entry` | сохранена версия «Ой ізі» | `trail`/id сказки, `story_id`, `level`; `result.revision`, `choice`, `changed_choice`, `evidence_count`, `claim_words`, `wonder_words` | `src/components/ThinkingTrail.tsx` | смена мнения и число доказательств (§3.3, Project Zero; N2) |
| `debate_entry` | дебат дня отправлен | `debate`/дата; `result.words_used` (число слов недели), `side`, `final_side`, `changed`, `text_words`, `reply_words`, `prepared_objection` | `src/components/WeekWords.tsx` | употребление слов недели и смена стороны (§3.1, Word Generation, Snow; Lawrence et al. 2015) |
| `shoqan_open` | открыт чат Шоқана | `result.from` (`bubble` — кнопка, `prompt` — с готовым вопросом из квиза или подсказки, `event`) | `src/components/ShoqanChat.tsx` | когда ученик зовёт помощника: до или после своей попытки (§3.8, Bastani et al. 2025; I2) |
| `shoqan_message` | сообщение Шоқану отправлено | `result.chars`, `words`, `turn`, `prepared` (готовый вопрос отправлен без изменений); текст не пишется | `ShoqanChat.tsx` | нагрузка на помощника и лестница подсказок (§3.8, I2) |
| `pronunciation_attempt` | оценка произношения получена или фраза не распознана | `phrase`/`<level>:<номер>`, `level`; `result.score`, `accuracy`, `fluency`, `completeness`, `words`, `weak_words` или `misread` | `src/components/screens/SpeakScreen.tsx` | рост произношения за 5–8 недель (I5, Ngo, Chen & Lai 2024) |
| `test_answer` | ответ на пункт теста R5 (только исследовательская сборка), каждый пункт один раз | `test_item`/id пункта, `story_id` (сказка целевого слова или текста); `result.format` (`recognition`/`meaning`/`use`/`comprehension`), `form` (`A`/`B`), `timepoint` (`pre`/`post`/`delayed`), `set_version`, `sample`, `word`, `pseudo`, `position`, `choice` (вариант или `dont_know`), `correct` (0/1), `duration_ms` | `src/research/test/TestScreen.tsx` | основная мера H1: знание значения на отсроченном тесте (`docs/research-design/study-design.md`, 1.2 и 5.4); надёжность и равенство форм на этапе 0 (4.2) |
| `test_complete` | тестовая сессия закончена (все пункты отвечены) | `test`/`<set_version>\|<timepoint>`; `result.form`, `timepoint`, `set_version`, `sample`, `answered`, `total`, `meaning`/`meaning_n`, `use`/`use_n`, `comprehension`/`comprehension_n`, `rec_hits`/`rec_real`, `rec_false_alarms`/`rec_pseudo`, `rec_flag` (ложных тревог > 30 %), `duration_ms` | `TestScreen.tsx` | время теста и доля прошедших сессии (критерии этапа 0, 4.2); отметка учеников с ложными тревогами (5.4) |

## Для учителя

`public.class_events_summary(p_class uuid)` (только учитель этого класса, `is_class_teacher`): за последние 30 дней, с момента вступления, только ученики, которые сейчас в классе:

- по каждому ученику: число событий, число по глаголам, число активных дней (по времени Алматы), последнее событие;
- «трудные слова класса»: топ-10 слов по числу учеников, затем по сумме нажатий (`word_tap`) и ошибок в повторении (`srs_review` с `correct = false`);
- «трудные вопросы»: топ-10 вопросов квизов по числу неверных ответов (без тренировок).

Сырых событий и текстов функция не возвращает. С R8 она используется во вкладке «Белсенділік» / «Activity» кабинета учителя (`src/components/Teacher.tsx`, клиент `classEvents` в `src/utils/classWork.ts`): активные дни и последнее действие по ученикам, «Қиын сөздер», «Қиын сұрақтар» (текст вопроса восстанавливается из `story_id`, `level` и номера вопроса `object_id`), и CSV класса с этими суммами и прогрессом по никам (`docs/research-evidence.md`, раздел 9.4). С миграции `20261107000000_teacher_panel.sql` повторное вступление в класс переносит `joined_at`, поэтому события, сделанные вне класса, в суммы не попадают. Проверка на локальном Postgres: `supabase/tests/learning_events.sql` (порядок запуска в шапке файла).

## Примеры запросов

Доля верных со второй попытки после показа предложения (I1, §3.7):

```sql
select result->>'hint' as hint, avg((result->>'correct')::boolean::int) as share, count(*)
from learning_events where verb = 'quiz_answer' and (result->>'attempt')::int = 2
group by 1;
```

Переходы «неверно → верно» в «Дала кеңесі» (I7):

```sql
select object_id, count(*) filter (where not (result->>'first_correct')::boolean and (result->>'correct')::boolean) as wrong_to_right,
       count(*) as round2
from learning_events where verb = 'council_vote' and (result->>'round')::int = 2
group by 1;
```
