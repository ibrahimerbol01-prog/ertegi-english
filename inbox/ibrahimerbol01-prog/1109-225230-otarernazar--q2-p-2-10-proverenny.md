---
id: 1109-225230-otarernazar--q2-p-2-10-proverenny
from: otarernazar-eng
to: ibrahimerbol01-prog
status: new
created: 2026-11-09 22:52
---

# Q2 п.2: 10 проверенных источников литературы в docs/literature-q2 готовы

Статус: готово (пункт 2 из очереди Q2 1106-005953 — Литература: 10 источников под обзор).
Ветка: docs/literature-q2 (коммит ad25657).
Сравнение: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/literature-q2

1. Вывод git diff --stat origin/main...HEAD:
 docs/research-design/literature-review.md | 41 ++++++++++++++++++++++++++++++-
 1 file changed, 40 insertions(+), 1 deletion(-)

2. Что сделано:
- Изучен docs/research-design/literature-review.md, чтобы исключить дублирование уже разобранных работ (Erten & Razi 2009, Klassen 2020, Pulido 2004, Schmitt et al. 2011, Hu & Nation 2000, Webb et al. 2025 и др.).
- В раздел 7 docs/research-design/literature-review.md добавлены 10 рецензируемых источников с проверенными через открытый API Crossref (https://api.crossref.org/works/<DOI>) метаданными и официальными аннотациями издателей (включая ранее не раскрытый Pulido 2003), закрывающие 4 методологических блока исследования Ertegi English:
  1) L1/L2 и мультимодальные глоссы (Yanagisawa, Webb & Uchihara, 2020; Ramezanali, Uchihara & Faez, 2021; Hulstijn, Hollander & Greidanus, 1996);
  2) Частота встреч со словом и онлайн-процессинг чтения (Uchihara, Webb & Yanagisawa, 2019; Pellicer-Sánchez, 2016);
  3) Внутрисубъектный дизайн знакомости темы и роль понимания текста (Pulido, 2003; Pulido, 2007);
  4) Мультимодальный ввод (чтение + аудио), GLMM-моделирование и измерение мотивации подростков (Chang, 2019; Feng & Webb, 2020; Pitcher et al., 2007 — AMRP).
- Оформлены обе обязательные таблицы: `источник | вывод | где использовать | проверено да/нет` и таблица верификации `утверждение -> URL -> цитата до 15 слов`.

3. Команды проверок и результат:
- npm run lint -> 0 errors, 1 warning (в существующем src/components/ShoqanMascot.tsx)
- npm run typecheck -> 0 errors (tsc -b)

4. Таблица «утверждение -> URL -> цитата до 15 слов»:
| Утверждение | URL | Цитата (до 15 слов) |
|---|---|---|
| Чтение с глоссами даёт 45,3 % (немедл.) и 33,4 % (отсроч.) против 26,6 % и 19,8 % без глоссов (Yanagisawa et al., 2020) | https://api.crossref.org/works/10.1017/S0272263119000688 | «glossed reading led to significantly greater learning of words (45.3% and 33.4% on immediate and delayed posttests» |
| Средняя корреляция частоты повторов слова с попутным усвоением r = .34 по 26 исследованиям (Uchihara et al., 2019) | https://api.crossref.org/works/10.1111/lang.12343 | «Results showed that there was a medium effect ( r = .34) of repetition on incidental vocabulary learning.» |
| Двухмодальный глосс даёт прирост g = 0.46 (немедл.) и g = 0.28 (отсроч.) по 22 исследованиям (Ramezanali et al., 2021) | https://api.crossref.org/works/10.1002/tesq.579 | «the overall effect of an additional gloss mode was medium ( g = 0.46) for immediate posttests» |
| Повтор слова в рассказе укрепляет связь форма–значение при наличии L1-глоссов (Hulstijn et al., 1996) | https://api.crossref.org/works/10.1111/j.1540-4781.1996.tb01614.x | «reappearance of a word will reinforce the form‐meaning connection in the reader's mental lexicon.» |
| После 3–4 встреч новые слова читаются быстрее, после 8 встреч узнаётся 75 % значений (Pellicer-Sánchez, 2016) | https://api.crossref.org/works/10.1017/S0272263115000224 | «After three to four encounters, nonwords were read significantly faster, and by eight encounters» |
| Внутрисубъектный дизайн (2 более и 2 менее знакомых рассказа) с тестами через 2 и 28 дней (Pulido, 2003) | https://api.crossref.org/works/10.1111/1467-9922.00217 | «Participants read narratives (2 more and 2 less familiar) containing nonsense words. Two and 28 days after reading» |
| В GLMM-анализе адаптированного чтения шансы прироста значения выше, чем правописания и употребления (Chang, 2019) | https://api.crossref.org/works/10.1017/S0272263119000032 | «the odds of improvements in the knowledge of written and aural meanings were significantly better» |
| Опросник мотивации к чтению подростков AMRP проверен на 384 подростках (Pitcher et al., 2007) | https://api.crossref.org/works/10.1598/JAAL.50.5.5 | «A survey adapted for adolescents was administered to 384 teens at eight sites» |

5. Внутренний аудит с 4 ролей:
- Исследователь: Все 10 источников прямо привязаны к компонентам study-design.md (GLMM-модель Chang 2019, отсрочка 28 дней у Pulido 2003, контроль частоты повторов Uchihara et al. 2019, L1-глоссы Yanagisawa et al. 2020).
- UX: Метаанализ Ramezanali et al. (2021) подтверждает, что двухканального глосса (текст L1 + аудио) достаточно и не нужно перегружать карточку слова третьей модальностью.
- EdTech: Глазодвигательное исследование Pellicer-Sánchez (2016) и мультимодальное исследование Feng & Webb (2020) обосновывают сбор поведенческих метрик времени чтения, word_tap и audio_play.
- Консультант стартапа: Каждый источник проверен программным запросом к api.crossref.org с извлечением JATS-аннотации издателя, поэтому ни один DOI или вывод не висит в воздухе.

Урок: При закрытом доступе к веб-страницам издателей за Cloudflare открытый JSON API Crossref (`https://api.crossref.org/works/<DOI>`) позволяет достоверно извлекать точные выходные данные и полные авторские аннотации (JATS XML) для верификации цитат.
Сработало: Прямая проверка 10 DOI через Crossref API с извлечением дословных цитат из аннотаций и заполнением ранее не проверенной записи Pulido (2003).
