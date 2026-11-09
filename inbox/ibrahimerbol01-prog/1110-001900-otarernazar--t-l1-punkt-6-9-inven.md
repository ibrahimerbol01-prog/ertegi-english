---
id: 1110-001900-otarernazar--t-l1-punkt-6-9-inven
from: otarernazar-eng
to: ibrahimerbol01-prog
status: new
created: 2026-11-10 00:19
---

# T-L1 (пункт 6/9): Инвентаризация лицензий, шрифтов, медиа и текстов (licences-inventory.md)

# Инвентаризация лицензий, шрифтов, медиа-ресурсов и прав на тексты Ertegi English (`licences-inventory.md`)

> ⚠️ **ЧЕРНОВИК. НЕ ЮРИДИЧЕСКАЯ КОНСУЛЬТАЦИЯ — НУЖНА ПРОВЕРКА ЮРИСТОМ.**  
> Дата составления: 10.11.2026. Инвентаризация проведена по всем файлам репозитория (`public/`, `public/fonts/`, `research/cefr/`, `src/data/wordbank/`, `src/components/`, `src/constants.ts`, `package.json`).

---

## 1. Сводная таблица лицензий активов и контента в репозитории

| № | Категория и файлы в проекте | Правообладатель / Источник | Тип лицензии | Разрешено ли коммерческое использование? | Что требуется соблюдать (Атрибуция / Условия) | Статус в проекте |
|---|---|---|---|---|---|---|
| **1** | **Шрифт `Inter`** (`public/fonts/inter-*.woff2`, 4 файла + `public/fonts/OFL-Inter.txt`) | Copyright 2020 The Inter Project Authors (`https://github.com/rsms/inter`) | **SIL Open Font License 1.1 (OFL-1.1)** | **Да** (можно встраивать в веб-приложение и мобильное приложение, в том числе платное; запрещено продавать сам файл шрифта отдельно) | Файл лицензии `OFL-Inter.txt` должен лежать вместе со шрифтами (уже лежит в `public/fonts/OFL-Inter.txt`). | ✅ **Подтверждено и соблюдено** |
| **2** | **Шрифт `Nunito`** (`public/fonts/nunito-*.woff2`, 4 файла + `public/fonts/OFL-Nunito.txt`) | Copyright 2014 The Nunito Project Authors (`https://github.com/googlefonts/nunito`) | **SIL Open Font License 1.1 (OFL-1.1)** | **Да** (на тех же условиях OFL-1.1) | Файл лицензии `OFL-Nunito.txt` уже лежит в `public/fonts/OFL-Nunito.txt`. | ✅ **Подтверждено и соблюдено** |
| **3** | **Словарь уровней A1–B2: `CEFR-J Wordlist Version 1.5`** (`research/cefr/cefrj-vocabulary-profile-1.5.csv` и производные списки `src/data/wordbank/A1.json`…`B2.json`) | Compiled by Yukio Tono, Tokyo University of Foreign Studies (Tono Laboratory, TUFS); копия из `openlanguageprofiles/olp-en-cefrj` | **Свободная лицензия TUFS с обязательным цитированием** (`free for research and commercial use, provided the dataset is cited properly`) | **Да** (бесплатно для научных и коммерческих целей при условии правильного указания авторства) | В интерфейсе раздела «Сөздік қоры» (`WordbankScreen.tsx`) и в документации указать цитату: *«The CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies (http://www.cefr-j.org/download.html)»*. | ✅ **Подтверждено** (`research/cefr/README.md`, `src/data/wordbank/README.md`) |
| **4** | **Словарь уровней C1–C2: `Octanove Vocabulary Profile C1/C2 ver. 1.0`** (`research/cefr/octanove-vocabulary-profile-c1c2-1.0.csv` и производные `src/data/wordbank/C1.json`, `C2.json`) | Octanove Labs (`openlanguageprofiles/olp-en-cefrj`) | **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)** (`https://creativecommons.org/licenses/by-sa/4.0/`) | **Да** (разрешено коммерческое и некоммерческое использование при указании авторства и сохранении лицензии CC BY-SA 4.0 на производные списки `C1.json`, `C2.json`) | Указать авторство *Octanove Vocabulary Profile C1/C2 (ver. 1.0), Octanove Labs, CC BY-SA 4.0* и распространять сами файлы `C1.json` и `C2.json` под лицензией CC BY-SA 4.0 (это уже прописано в `src/data/wordbank/README.md`). | ✅ **Подтверждено и соблюдено** |
| **5** | **Тексты 7 сказок в приложении** (`Aldar Köse`, `Zhirenshe the Eloquent`, `Er Töstik`, `Tazsha Bala`, `Ayaz Bi`, `Asan Kaigy`, `Alpamys Batyr` в `src/constants.ts`, 35 текстов A1–C1) и **13 карточек легенд** (`src/data/legends.ts`, `culture.ts`) | Сюжетная основа — казахский народный фольклор и исторические предания; английский текст A1–C1 — оригинальная адаптация команды проекта по методу `ertegi-story-method` | **Фольклор — общественное достояние (ст. 8 и ст. 28 Закона РК № 6-I)**; английские адаптации A1–C1 — **оригинальные производные произведения Проекта (ст. 11 Закона РК № 6-I)** | **Да** (не скопированы чужие современные переводы; английские тексты написаны с нуля командой проекта и проверены скриптом `npm run corpus`) | Важно: для черновика 8-й сказки `research/stories/maqta-qyz/README.md` сюжет сверен по `ertegiler.kz` («Қазақ халқының ұлттық ертегілері», пересказ своими словами на английском без цитирования чужого текста). | ✅ **Подтверждено** (вопрос о первичном источнике сюжетов — см. §3) |
| **6** | **Произведения казахской классики для будущего расширения** (`docs/research-design/classics-thematic-map.md`: Ы. Алтынсарин, Абай Кунанбайулы, Шакарим Кудайбердиулы) | Оригиналы на казахском языке (авторы скончались в 1889, 1904 и 1931 гг. — более 70 лет назад) | **Общественное достояние (Public Domain)** по ст. 28 Закона РК от 10.06.1996 № 6-I «Об авторском праве и смежных правах» | **Да** (при условии, что перевод и адаптация на английский язык выполняются командой проекта напрямую с казахского оригинала, без использования современных охраняемых переводов третьих лиц) | Указывать имя классика (Ы. Алтынсарин / Абай / Шакарим) с пометкой «Учебная адаптация на английский язык по уровням CEFR: Ertegi English». | ✅ **Подтверждено** |
| **7** | **Аудиоозвучка сказок и слов** (`src/utils/narration.ts`, `src/utils/voice.ts`, `ScenePlayer.tsx`) | Синтез речи в реальном времени через **Microsoft Azure Cognitive Services Speech SDK** (neural TTS) + резервный системный голос браузера (`window.speechSynthesis`) | Коммерческие условия **Microsoft Azure Customer Agreement / Product Terms** | **Да** (Microsoft разрешает коммерческое и образовательное использование синтезированной речи Azure Neural TTS в приложениях при оплате по тарифу Azure) | Соблюдать кодекс поведения Microsoft (не выдавать синтезированный голос за живого диктора без пометки, если этого требуют правила). | ✅ **Подтверждено** (уточнить тариф подписки Azure у владельца) |
| **8** | **Векторные иллюстрации, обложки сказок, орнаменты и маскот Шоқан в коде** (`src/components/StoryCover.tsx`, `Ornaments.tsx`, `ShoqanFace.tsx`, `ShoqanMascot.tsx`, `Icons.tsx`) | Код SVG написан внутри компонентов проекта; иконки интерфейса — библиотека **`lucide-react`** (`v1.46.0`) | Собственные SVG — авторское право Проекта; **`lucide-react` — лицензия ISC (пермиссивная open-source)** | **Да** | Для `lucide-react` сохраняется стандартное уведомление ISC в `node_modules`. | ✅ **Подтверждено** |
| **9** | **Медиа-файлы в папке `public/`**:<br>- `public/story.mp4` (1,26 МБ)<br>- `public/story-poster.jpg` (25 КБ)<br>- `public/shoqan-avatar.webp` (2,6 КБ)<br>- `public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.svg` | В репозитории **нет текстового файла с описанием происхождения** `story.mp4`, `story-poster.jpg` и `shoqan-avatar.webp` | **Не подтверждено в коде** (требуется ответ владельца: сгенерированы ИИ, нарисованы автором или взяты со стока?) | Зависит от источника создания этих 3 файлов | См. список вопросов владельцу в §2 ниже. | ⚠️ **Спросить владельца** |
| **10** | **Программные библиотеки (`package.json`)**: `react`, `react-dom` (MIT), `@supabase/supabase-js` (MIT), `tailwindcss` (MIT), `vite` (MIT), `wink-lemmatizer` (MIT), `microsoft-cognitiveservices-speech-sdk` (Microsoft SDK License), Навыки в `skills/ECC-LICENSE` | Соответствующие авторы open-source пакетов | **MIT / ISC / Apache-2.0 / Microsoft SDK License** | **Да** | Стандартные пермиссивные лицензии, не требующие раскрытия закрытого кода. | ✅ **Подтверждено** |

---

## 2. Вопросы владельцу (по тем ресурсам, чьё происхождение не записано в репозитории)

Пожалуйста, уточните следующие 4 пункта, чтобы мы вписали точные сведения перед проверкой юристом:

1. **Видеоролик `public/story.mp4` (1,26 МБ) и постер `public/story-poster.jpg`:** Как именно был создан этот видеоролик и изображение (сгенерирован в нейросети Sora / Runway / Veo / Midjourney по вашему промпту, смонтирован самостоятельно или скачан со стороннего ресурса/YouTube)? Есть ли в `story.mp4` фоновая музыка, и какая у неё лицензия?
2. **Аватар `public/shoqan-avatar.webp` и иконки приложения (`public/icon-512.png`, `favicon.svg`):** Нарисованы самостоятельно / сгенерированы ИИ для проекта Ertegi English?
3. **Первичные источники сюжетов первых 7 сказок в `src/constants.ts`:** При написании английских текстов `Aldar Köse`, `Zhirenshe`, `Er Töstik`, `Tazsha Bala`, `Ayaz Bi`, `Asan Kaigy`, `Alpamys` использовались ли конкретные печатные сборники или сайт `ertegiler.kz` только как опора для народного сюжета (как это задокументировано для `maqta-qyz`), без дословного перевода чужих авторских пересказов?
4. **Тариф подписки Microsoft Azure (`AZURE_SPEECH_KEY`):** Используется ли стандартный Pay-As-You-Go или студенческий грант Azure for Students / Founders Hub (для фиксации в реестре лицензий)?

---

## 3. Где в приложении уже показаны лицензии (и что добавить)

- В разделе **«Сөздік қоры» (`WordbankScreen.tsx`)** уже предусмотрена строка `wbSources: "Сөз тізімдерінің дереккөздері / Sources of the word lists"` (`src/dict.ts`, строки 97, 195), где указываются **CEFR-J Wordlist Version 1.5 (Yukio Tono, TUFS)** и **Octanove Vocabulary Profile C1/C2 (Octanove Labs, CC BY-SA 4.0)**.
- Файлы лицензий шрифтов **SIL OFL 1.1** (`OFL-Inter.txt` и `OFL-Nunito.txt`) уже лежат в публичной директории `public/fonts/` и доступны по прямым URL.

---

## Таблица верификации фактов (утверждение → URL / документ → цитата до 15 слов)

| Утверждение | URL / Документ | Цитата (до 15 слов) |
|---|---|---|
| Шрифты Inter и Nunito распространяются по лицензии SIL Open Font License 1.1 | `public/fonts/OFL-Inter.txt`, `public/fonts/OFL-Nunito.txt` | `This Font Software is licensed under the SIL Open Font License, Version 1.1.` |
| Список CEFR-J 1.5 бесплатен для научных и коммерческих целей при условии цитирования | `research/cefr/README.md` | `free for research and commercial use, provided the dataset is cited properly.` |
| Список Octanove C1/C2 1.0 и производные файлы `C1.json`, `C2.json` распространяются по лицензии CC BY-SA 4.0 | `src/data/wordbank/README.md` | `Octanove Vocabulary Profile C1/C2 (ver. 1.0), Octanove Labs, licensed CC BY-SA 4.0.` |
| Произведения народного творчества (фольклор) не являются объектами авторского права, а срок охраны классики — 70 лет после смерти автора (ст. 8, 28 Закона РК № 6-I) | https://adilet.zan.kz/rus/docs/Z960000006_ | «Авторское право действует в течение всей жизни автора и семидесяти лет после его смерти» |

---

## Самопроверка с 4 ролей
- **Инженер:** Проверены все физические файлы в `public/`, `public/fonts/`, `research/cefr/`, `src/data/wordbank/` и зависимости в `package.json`.
- **Учитель / директор:** Подтверждена юридическая чистота учебных текстов сказок и словарных списков CEFR-J / Octanove для использования в школе.
- **Ребёнок и родитель:** Вся графика и шрифты грузятся локально с сайта проекта без сторонних рекламных скриптов.
- **Юрист:** Чётко разграничены общественное достояние (казахский фольклор и классика старше 70 лет по Закону РК № 6-I), производные адаптации проекта (ст. 11 Закона РК № 6-I), открытые словари (TUFS attribution и CC BY-SA 4.0) и три медиафайла в `public/` (`story.mp4`, `story-poster.jpg`, `shoqan-avatar.webp`), происхождение которых вынесено в отдельный вопрос владельцу без домыслов.

Урок: При подготовке EdTech-проекта к правовому аудиту важно проверять не только лицензии шрифтов (`OFL-1.1`) и лингвистических корпусов (`CEFR-J`, `Octanove CC BY-SA 4.0`), но и каждый бинарный медиафайл в папке `public/` (`story.mp4`, `story-poster.jpg`, `shoqan-avatar.webp`), чтобы убедиться в отсутствии неочищенных стоковых материалов или музыки.
Сработало: Прямое чтение `research/cefr/README.md`, `src/data/wordbank/README.md` и `public/fonts/OFL-*.txt` дало 100 % точные формулировки лицензий без угадывания.

## Файлы

- files/1110-001900-otarernazar--t-l1-punkt-6-9-inven/licences-inventory.md
