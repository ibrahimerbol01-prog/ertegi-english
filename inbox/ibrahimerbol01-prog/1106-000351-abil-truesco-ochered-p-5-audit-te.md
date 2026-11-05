---
id: 1106-000351-abil-truesco-ochered-p-5-audit-te
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 00:03
---

# Очередь п.5: аудит тестов

Итог: сделано (очередь п.5, аудит тестов). Мелкие дыры закрыты тестами, крупные — списком ниже. Код приложения не менял.

Ветка (поверх data/wordbank-a1-ai-reviewed, сливать после неё): https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...test/audit-gaps?expand=1
Коммит 15255ca: 2 новых файла тестов, 18 тестов.
- src/data/content.test.ts (10): карточки легенд — уникальные id, rarity и ornament, 6 вопросов, PASS ≤ 6, индекс ответа в пределах вариантов, варианты различны, слово-ответ пропуска звучит в сцене; пословицы — кириллица, без дублей, пословица дня даёт 3 разных варианта с верным среди них (проверено на 42 днях); BATAS и STORY_HISTORY есть для каждой сказки и только для существующих; OYU, TURKIC_WORDS; CLAIMS (Ой ізі) — для каждой сказки; splitSentences собирает текст обратно, поэтому id доказательств стабильны.
- src/utils/smallUtils.test.ts (8): gloss.ts (ключи и поиск в глоссарии), evidence.ts (пропуск, опора, NOT и слабое совпадение дают null, на реальных сказках опора — предложение сказки), maqals.ts (по пользователю, без дублей, noteChange, гость, битое хранилище).
Проверки: lint ✓, typecheck ✓, test ✓ (29 файлов, 494 теста).

Как искал: скрипт-карта — какие модули src/ и api/ не упоминаются ни в одном тесте. Нашлось 40 из 98.

## Находки

1. **Целевые слова исследования в карточках легенд (обычный сайт).** Из словаря они убраны «до отсроченного теста», а в LEGENDS есть в 11 из 13 карточек: zhirenshe — village; tostik — journey, wise; qobylandy — brave, land, wise; alpamys — beat, hero, pit (**pit — ответ задания с пропуском**); qyzzhibek — jealous; qorqyt — wise; asan — camel, land, wise; tomiris — land; khanate — land; abylai — brave, wise; shoqan — journey. В исследовательской сборке карточек нет. Риск только для участника, который пользуется ещё и обычным сайтом. Надо ли и тут исключать до отсроченного теста — РЕШЕНИЕ РУКОВОДИТЕЛЯ. Контент я не трогал.
2. 11 из 26 заданий с пропуском в карточках перефразируют сцену, а не повторяют её строку (например, «The rich man was wearing a warm ___ coat» при сцене «a rich man in a warm fur coat»). Слово-ответ во всех 26 есть в сцене — тест проверяет именно это. Ошибкой не считаю, сообщаю для сведения.

## Крупные дыры (не чинил, нужен DOM: jsdom/@testing-library — новая зависимость, решение владельца)

Экраны и компоненты без тестов, по размеру: Teacher.tsx (1381 строка), ReaderScreen.tsx (589), Council.tsx (383), LegendCards.tsx (378), SpeakScreen.tsx (317), AuthScreen.tsx (309), StudentClasses.tsx (260), UIHelpers.tsx (244), Culture.tsx (241), ScenePlayer.tsx (233), DeleteAccount.tsx (193), WordCoach.tsx (178), ProfileScreen.tsx (172), App.tsx (164), RolePicker, TeacherProfile, SetPassword, IntroScreen, StoryCover, Icons, Ornaments, AccountRows, ChunkError.
Из них важнее всего: DeleteAccount (удаление аккаунта), AuthScreen, SetPassword (вход), Teacher.tsx (данные класса), ReaderScreen (основной цикл исследования: тап по слову → word_tap). Без DOM можно частично: вынести чистые функции из этих файлов и тестировать их — так я сделал со словарём.
Модули без тестов, не UI: utils/lexicon.ts (178: wordBank, dailyWords, analyseLearner — слова дня), utils/narration.ts (164, озвучка, сеть), utils/role.ts (87, роль), utils/useMyClasses.ts, utils/supabase-save.ts, utils/lazyChunk.ts, utils/voice.ts. Следующим кандидатом считаю lexicon.ts: чистые функции, влияет на слова дня.

Урок: аудит начинать с карты «модуль ↔ тест» скриптом, а не на глаз. И любую проверку контента прогонять сначала как пробу со списком всех случаев: правило «дословно» оказалось неверным для 11 заданий, правильное правило — «слово-ответ есть в сцене».
Сработало: проба на реальных данных до того, как писать утверждение теста — нашлись и правильное правило, и настоящая находка (pit в легендах).
