# Обзор открытых словарей, списков частотности и баз переводов (~10 000 слов)

> **Статус документа:** ЧЕРНОВИК.  
> **Дата проверки первоисточников и лицензий:** 2026-11-05.  
> **Цель:** Выбор открытых лексических баз английского языка для формирования словаря приложения (~10 000 слов: существительные, глаголы, прилагательные с уровнями CEFR, частями речи и частотностью) с возможностью законного коммерческого использования и распространения в составе веб-сайта Ertegi English.

---

## 1. Сравнительный анализ источников лексики английского языка

| Источник | Версия и авторы | Что содержит (POS, CEFR, частота, примеры) | Объем (слов) | Лицензия (дословно со ссылкой) | Можно встраивать в коммерческий сайт? | Ссылка на скачивание |
|---|---|---|---|---|---|---|
| **NGSL / NGSL-Spoken / NAWL** | v1.2 / 1.01 (2013–2023), Charles Browne, Brent Culligan, Joseph Phillips | Леммы, части речи (POS), ранг частотности, SFI-частота, покрытие текстов. Уровней CEFR нет (деление на зоны частотности 1k, 2k, 3k). | NGSL: ~2 809 слов; NGSL-Spoken: ~721; NAWL: ~960; общая база ~4 500 слов | **CC BY-SA 4.0 International** («Creative Commons Attribution-ShareAlike 4.0 International License», [newgeneralservicelist.com](https://www.newgeneralservicelist.com)) | **ДА** (с указанием авторства и распространением производного списка под CC BY-SA 4.0) | [newgeneralservicelist.com/downloads](https://www.newgeneralservicelist.com) |
| **SUBTLEX-US** | 2009, Marc Brysbaert & Boris New (Ghent University) | Частотность по субтитрам американских фильмов (51 млн токенов), метрики SUBTLWF, Lg10WF, PoS (Dominant POS, процент использования). Уровней CEFR нет. | 74 286 словоформ (в лемматизированном виде ~30 000+ лемм) | **CC BY-SA** (через OpenLexicon / Lexique; в оригинале свободное академическое использование, [openlexicon.fr](https://openlexicon.fr)) | **ДА** (как источник частотности и популярности слов среди носителей; цитирование Brysbaert & New 2009) | [openlexicon.fr/datasets-info/subtlex-us](https://openlexicon.fr) |
| **CEFR-J 1.5 + Octanove C1/C2** *(уже в проекте `research/cefr/`)* | CEFR-J v1.5 (Yukio Tono, TUFS) + Octanove v1.0 (Octanove Labs) | Headword, Part of Speech (POS), уровень CEFR (A1, A2, B1, B2 у CEFR-J; C1, C2 у Octanove). Примеров и точной частоты нет. | CEFR-J: 7 799 записей (A1–B2); Octanove: 4 685 (C1–C2). Суммарно: ~12 484 слова | **CEFR-J:** «Free for research and commercial use, provided the dataset is cited properly» (Attribution). **Octanove:** **CC BY-SA 4.0** ([creativecommons.org/licenses/by-sa/4.0/](https://creativecommons.org/licenses/by-sa/4.0/)) | **ДА** (идеально по правам: CEFR-J прямо разрешает коммерческое использование, Octanove — CC BY-SA) | [cefr-j.org/download.html](http://www.cefr-j.org/download.html) и [github.com/openlanguageprofiles/olp-en-cefrj](https://github.com/openlanguageprofiles/olp-en-cefrj) |
| **Wiktionary Frequency Lists** | Регулярно обновляется сообществом Wikimedia | Списки частотности на основе дампов Wikipedia, Project Gutenberg, TV-субтитров. Часть списков с POS; уровни CEFR отсутствуют. | От списков топ-1 000 до 40 000+ слов | **CC BY-SA 4.0 / CC BY-SA 3.0** ([en.wiktionary.org/wiki/Wiktionary:Frequency_lists](https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists)) | **ДА** (с условием атрибуции и ShareAlike для производного набора) | [en.wiktionary.org/wiki/Wiktionary:Frequency_lists](https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists) |
| **COCA Frequency Lists** | Mark Davies (English-Corpora.org) | Леммы, части речи, точные сырые частоты и ранги по жанрам (Spoken, Fiction, Academic и др.). Уровней CEFR нет. | Топ-5 000 / 20 000 / 60 000 слов | **Проприетарная закрытая** ([english-corpora.org/coca/](https://www.english-corpora.org/coca/)). «You cannot use data to create software, applications, or commercial products... No redistribution of raw frequencies» | **НЕТ (КАТЕГОРИЧЕСКИ НЕЛЬЗЯ)**. Прямой запрет на встраивание списков в коммерческие программы и сайты без индивидуального платного контракта с Davies. | [wordfrequency.info](https://www.wordfrequency.info) |
| **Oxford 3000 / Oxford 5000** | Oxford University Press (OUP) | Леммы, часть речи, уровни CEFR (A1–B2 для 3000, B2–C1 для 5000), образцовые британские/американские значения. | 3 000 и 5 000 ключевых слов | **All rights reserved (OUP)** ([oxfordlearnersdictionaries.com](https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000)). Торговая марка и компилятивная база данных защищены авторским правом. | **НЕТ (КАТЕГОРИЧЕСКИ НЕЛЬЗЯ)**. Парсинг, прямое копирование структуры и распространение в коммерческом приложении нарушает авторские права OUP. | Публичный просмотр на сайте OUP (официального открытого скачивания базы нет) |
| **English Vocabulary Profile (EVP)** | Cambridge University Press & Assessment | Леммы, конкретные значения (senses), части речи, уровни CEFR (A1–C2), примеры из Cambridge Learner Corpus. | ~7 000 лемм (~14 000 значений) | **Проприетарная, Non-Commercial** ([englishprofile.org/wordlists/text-inspector](https://www.englishprofile.org)). «Terms of Use do not permit the use of the EVP for commercial purposes without prior written consent». | **НЕТ (КАТЕГОРИЧЕСКИ НЕЛЬЗЯ)**. Разрешено только для личного преподавания и некоммерческих академических диссертаций. | Доступ через веб-интерфейс (выгрузка сырой базы запрещена) |

---

## 2. Словари переводов английский→казахский и английский→русский с открытой лицензией

| База / Проект | Языковые пары | Что содержит | Объем | Лицензия | Качество и применимость для Ertegi English |
|---|---|---|---|---|---|
| **Wikidata Lexemes** | `en` $\rightarrow$ `kk`, `en` $\rightarrow$ `ru` | Леммы, части речи, грамматические формы, смысловые значения (senses), глоссы на казахском и русском. | ~10 000+ лексем для казахского, сотни тысяч для русского и английского | **CC0 1.0 Universal (Public Domain Dedication)** ([wikidata.org/wiki/Wikidata:Licensing](https://www.wikidata.org/wiki/Wikidata:Licensing)) | **НАИЛУЧШАЯ ЮРИДИЧЕСКАЯ ЧИСТОТА.** Данные находятся в общественном достоянии (CC0): можно свободно использовать, модифицировать и встраивать в коммерческий продукт без требований ShareAlike. Качество: для базовых слов A1–B1 покрытие хорошее; для редких терминов требуется ручная верификация. |
| **Kaikki.org (машиночитаемый Wiktionary)** | `en` $\rightarrow$ `kk`, `en` $\rightarrow$ `ru` (автор: Tatu Ylonen) | Готовые JSONL-дампы: слово, POS, IPA-транскрипция, определения, синонимы, переводные соответствия на казахский и русский языки. | Английский словарь: >1 000 000 статей, переводы на русский: >150 000, переводы на казахский: ~15 000–25 000 пар. | **CC BY-SA 4.0 / CC BY-SA 3.0** ([kaikki.org/dictionary/](https://kaikki.org/dictionary/)) | **ОТЛИЧНАЯ СТРУКТУРИРОВАННОСТЬ.** Самый чистый и удобный машиночитаемый экстрактор Wiktionary. Высокое качество для русского, среднее для казахского (некоторые многозначные слова имеют устаревшие или книжные варианты). Требует ShareAlike для результирующего переводного датасета. |
| **Apertium (`apertium-kaz-eng`, `apertium-eng-kaz`)** | `en` $\leftrightarrow$ `kk` | Морфологические словари, двуязычный переводной лексикон (transducers), части речи. | ~15 000–20 000 стеммов/пар | **GNU GPL v3.0** ([github.com/apertium/apertium-kaz-eng](https://github.com/apertium/apertium-kaz-eng)) | **ВЫСОКАЯ ЛИНГВИСТИЧЕСКАЯ ТОЧНОСТЬ, НО ЮРИДИЧЕСКИЙ РИСК COPYLEFT.** Словари Apertium для казахского языка созданы профессиональными тюркологами. Однако лицензия GPLv3 является вирусной (copyleft): прямое встраивание данных внутрь клиентского JavaScript-кода сайта может потребовать открытия исходного кода всего фронтенда под GPLv3. Допустимо только через изолированный бэкенд API или для сверки. |
| **FreeDict (`eng-rus`, `rus-eng`)** | `en` $\leftrightarrow$ `ru` | Традиционные словарные статьи TEI/XML, перевод, грамматические метки. | ~30 000–50 000 статей | **GNU GPL v2+** ([freedict.org](https://freedict.org)) | **ХОРОШО ДЛЯ РУССКОГО ЯЗЫКА.** Классический словарь Mueller / Королев. Для казахского языка в FreeDict пары нет. Те же ограничения лицензии GPL, что и у Apertium. |

---

## 3. Правовой вердикт по встраиванию в приложение

1. **Категорически запрещено использовать (коммерческие риски):**
   - **Oxford 3000 / 5000** и **Cambridge EVP** — защищены копирайтом OUP и CUP. Копирование и публикация их списков в вебе под своим именем влечет претензии DMCA и иски о нарушении исключительных прав.
   - **COCA (Mark Davies)** — прямо запрещает распространение списков слов и частот в любых приложениях и открытых репозиториях.
2. **Разрешено с обязательной лицензией ShareAlike (CC BY-SA 4.0):**
   - **NGSL / NAWL** и **Kaikki.org / Wiktionary** — отличные открытые данные. Если мы публикуем производный объединенный датасет слов, он должен иметь пометку CC BY-SA 4.0 и атрибуцию авторов (Browne et al. и Ylonen / Wiktionary). Это не накладывает ограничений на закрытый код UI приложения, но сам файл словаря остается открытым.
3. **Идеально и без ограничений (Public Domain / Attribution):**
   - **CEFR-J 1.5** (уже в репозитории: Tono Lab прямо разрешает коммерческое использование с цитированием).
   - **Wikidata Lexemes** (лицензия CC0, полная свобода встраивания).
   - **SUBTLEX-US** (Brysbaert & New — открытая академическая лицензия с цитированием).

---

## 4. Рекомендация для базы ~10 000 слов (5 строк)

1. **Основа сетки уровней (CEFR + POS):** взять уже имеющиеся в репозитории списки **CEFR-J 1.5** (A1–B2, 7 799 слов, коммерческое использование разрешено автором) и дополнить до 10 000 слов верхними уровнями из **Octanove C1/C2** (CC BY-SA 4.0).
2. **Частотность и приоритизация:** обогатить рангами и объективной частотностью из открытой базы **SUBTLEX-US** (Brysbaert & New) и сопоставить с ядром **NGSL** (Browne et al., CC BY-SA 4.0).
3. **Переводы на казахский и русский:** извлечь соответствия из **Wikidata Lexemes** (CC0) и **Kaikki.org / Wiktionary** (CC BY-SA), а для специфических нестыковок использовать валидированный экспертный перевод.
4. **Закрытые базы:** полностью отказаться от прямого копирования Oxford 3000/5000, Cambridge EVP и COCA во избежание юридических претензий.
5. **Атрибуция:** в разделе «О проекте / Лицензии» разместить стандартный блок благодарностей с цитированием Yukio Tono (CEFR-J), Octanove Labs, Browne et al. (NGSL), Brysbaert & New (SUBTLEX-US) и Wiktionary contributors.
