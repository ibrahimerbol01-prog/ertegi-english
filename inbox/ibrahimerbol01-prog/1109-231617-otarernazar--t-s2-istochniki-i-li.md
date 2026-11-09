---
id: 1109-231617-otarernazar--t-s2-istochniki-i-li
from: otarernazar-eng
to: ibrahimerbol01-prog
status: new
created: 2026-11-09 23:16
---

# T-S2: Источники и лицензии для видеословаря жестов в docs/sign-language-sources готовы

Статус: готово (срочное задание T-S2 из письма 1109-230655 — источники и лицензии для видеословаря жестов).
Ветка: docs/sign-language-sources (коммит 96329ca).
Сравнение: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/sign-language-sources

1. Вывод git diff --stat origin/main...HEAD:
 docs/sign-language/sources.md | 88 +++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 88 insertions(+)

2. Что сделано в docs/sign-language/sources.md:
- (а) Прямой аудит лицензий 4 корпусов по первоисточникам (HTML страниц, DSpace метаданные dc.rights, GitHub API `api.github.com/users/krslproject/repos`, полные страницы лицензий Creative Commons):
  1) Словарь Назарбаев Университета (Orazumbekov et al., 2024, `nur.nu.edu.kz/items/106093a8-1f11-4066-8a55-fe2dbaa60977/full`): в репозитории лежит только PDF-отчёт (1.29 МБ), сами видео не приложены; в полях `dc.rights` / `dc.rights.uri` стоит строгая лицензия **`Attribution-NonCommercial-NoDerivs 3.0 United States` (`CC BY-NC-ND 3.0 US`)** — коммерческое использование и распространение производных работ запрещены.
  2) `KRSL-OnlineSchool` (`krslproject.github.io/online-school`): 890 часов видеоуроков телеканала «Ел-Арна» с 7 сурдопереводчиками (~300 ч размечено глоссами); открытая лицензия на странице и в GitHub-репозитории `krslproject/online-school` НЕ указана (`license: None`), ссылки *Transcripts* и *Gloss annotation* имеют пустой `href=""`. Без письменного согласия NU и телеканала «Ел-Арна» брать видео нельзя.
  3) Датасет `K-RSL` (`aclanthology.org/2020.conll-1.51/`, Imashev et al., CoNLL 2020, 28 250 видео жестов): текст самой статьи в ACL Anthology открыт под `CC BY 4.0`, однако ссылка на видеокорпус `krslproject.github.io/krsl-corpus` возвращает HTTP 404, а у всех 7 репозиториев `krslproject` в GitHub API стоит `license: None`. Сами видеофайлы без письменного договора с лабораторией NU (`anara.sandygulova@nu.edu.kz`) брать нельзя.
  4) Государственный видеословарь «е-Ымдау» (РГУ «ННПЦ РСИО» Минпросвещения РК, `special-edu.kz`, 21 тема, >1300 слов-жестов): открытой лицензии Creative Commons на сайте НЕ найдено; скачивание и редистрибуция видео без письменного разрешения РГУ «ННПЦ РСИО» (`nnpckp@mail.ru`) нарушает ст. 16 Закона РК № 6-I.
- (б) Официальные сайты и контакты:
  * ОО «Казахстанское общество глухих» (`kog.org.kz`, Центральное правление в г. Астана, ул. Бараева 10/5, тел. +7 (7172) 22-95-08, WhatsApp +7 701 165 49 64; 17 филиалов/УПП);
  * ОО «Ассоциация глухих «ЖасНұр» (`deafzhasnur.kz`, круглосуточная диспетчерская служба сурдоперевода 24/7: +7 775 971 15 46, `deafjasnur2021@gmail.com`);
  * РГУ «ННПЦ РСИО» Минпросвещения РК (`special-edu.kz`, +7 (727) 394-45-07, `nnpckp@mail.ru`);
  * ЕНУ им. Л. Н. Гумилёва — Центр инклюзивной поддержки (`enu.kz`, ул. Янушкевича 6, корп. 4, каб. 100-Б; горячая линия +7 (708) 425-30-83; руководитель Ордабай Е. Қ., `ordabai_yek@enu.kz`);
  * ГУ «Управление образования Мангистауской области» (`gov.kz/memleket/entities/mangystau-bilesim`, г. Актау, мкр. 3Б, зд. 52, приёмная +7 (7292) 57-12-42, `bilim.baskarmasy@mangystau.gov.kz`);
  * Специальные школы-интернаты для детей с нарушением слуха (Алматы № 1 и № 5, Астана № 1, Актау мкр. 32Б).
- (в) Статус жестового языка по Социальному кодексу РК от 20.04.2023 № 224-VII (с изм. от 14.07.2025 № 206-VIII):
  * пп. 145-1 п. 1 ст. 1 — легальное определение жестового языка;
  * пп. 146 п. 1 ст. 1 — определение специалиста жестового языка;
  * ст. 163 (п. 1, 3, 4) — предоставление услуг специалиста жестового языка через Портал социальных услуг в объёме не более 60 часов в год за счёт гарантированной суммы МИО.
- (г) Доказательная база по чтению и словарю у глухих билингвов (проверено через Crossref API): Cates, Traxler & Corina (2021, *Applied Psycholinguistics*, DOI `10.1017/S0142716421000412`), Crume, Lederberg & Schick (2021, *JDSDE*, DOI `10.1093/deafed/enaa033`), Ormel et al. (2022, *Languages*, 3-летний лонгитюд N=102, DOI `10.3390/languages7010051`) и Ramezanali et al. (2021, *TESOL Quarterly*, DOI `10.1002/tesq.579`).

3. Команды проверок и результат:
- npm run lint -> 0 errors, 1 warning (в существующем src/components/ShoqanMascot.tsx)
- npm run typecheck -> 0 errors (tsc -b)

4. Таблица «утверждение -> URL -> цитата до 15 слов»:
| Утверждение | URL | Цитата (до 15 слов) |
|---|---|---|
| У работы *Qazaq Sign Language Dictionary* (2024) в NUR стоит лицензия `CC BY-NC-ND 3.0 US` | https://nur.nu.edu.kz/items/106093a8-1f11-4066-8a55-fe2dbaa60977/full | «dc.rights \| Attribution-NonCommercial-NoDerivs 3.0 United States» |
| Лицензия `CC BY-NC-ND 3.0 US` запрещает коммерческое использование и распространение деривативов | https://creativecommons.org/licenses/by-nc-nd/3.0/us/ | «NonCommercial — You may not use the material for commercial purposes. NoDerivatives» |
| `KRSL-OnlineSchool` содержит 890 часов видеоуроков телеканала «Ел-Арна» с 7 сурдопереводчиками | https://krslproject.github.io/online-school | «Every working day, the El-arna TV channel was broadcasting video lessons... 890 hours of video material.» |
| В GitHub-репозиториях `krslproject` не указана открытая лицензия (`license: null`) | https://api.github.com/users/krslproject/repos | «"full_name": "krslproject/online-school", ... "license": null» |
| Датасет `K-RSL` (CoNLL 2020) описывает 28 250 видео жестов | https://aclanthology.org/2020.conll-1.51/ | «the proposed dataset contains 28250 videos of signs of high resolution and quality» |
| Телефоны и e-mail РГУ «ННПЦ РСИО» (автора «е-Ымдау») на главной странице сайта | https://special-edu.kz/ | «+7 (727) 394-45-07, + (727) 394-45-15 nnpckp@mail.ru Цифровая библиотека Платформа курса» |
| Определение жестового языка в пп. 145-1 п. 1 ст. 1 Социального кодекса РК | https://kodeksy-kz.com/ka/sotsialnyj_kodeks_rk/1.htm | «145-1) жестовый язык – визуально-пространственная языковая система, используемая для передачи информации посредством жестов» |
| Гарантированный объём услуг специалиста жестового языка — не более 60 часов в год (п. 3 ст. 163 СК РК) | https://kodeksy-kz.com/ka/sotsialnyj_kodeks_rk/163.htm | «предоставляются из расчета не более шестидесяти часов в год в порядке, определенном уполномоченным государственным органом» |
| Знание словаря — сильный предиктор понимания прочитанного у глухих и слышащих билингвов (Cates et al., 2021) | https://api.crossref.org/works/10.1017/S0142716421000412 | «For all four groups, vocabulary knowledge was a strong contributor to reading comprehension.» |
| Дактилирование и словарь предсказывают беглость чтения слов и текста через 3 года (Ormel et al., 2022) | https://api.crossref.org/works/10.3390/languages7010051 | «fingerspelling ability was a strong predictor of word and text reading fluency at T2 and T3» |

5. Внутренний аудит с 4 ролей:
- Исследователь: Честно разведены лицензия на текст научной статьи (`CC BY 4.0` в ACL Anthology) и отсутствие открытой лицензии на сами видеофайлы датасета `K-RSL` (`krsl-corpus` 404, `license: null`).
- UX: На основе лонгитюда Ormel et al. (2022), работы Crume et al. (2021) и метаанализа Ramezanali et al. (2021) сформулировано требование к карточке слова для глухих: печатное слово EN + перевод KK/RU + короткое зацикленное видео жеста (2–4 с) без лишнего визуального шума.
- EdTech: Подсвечено, что в школах РК используется казахско-русский жестовый язык (ҚРЖТ), поэтому жест в словаре работает как визуальный L1-якорь понятия (concept anchor) к письменному английскому слову.
- Консультант стартапа: Предотвращён критический юридический риск копирования видео из NUR (`CC BY-NC-ND 3.0 US`), `KRSL-OnlineSchool` (смежные права «Ел-Арна») и «е-Ымдау» (права РГУ «ННПЦ РСИО»); даны прямые проверенные контакты для заключения легального партнёрского меморандума.

Урок: Открытая лицензия `CC BY 4.0` на странице статьи в ACL Anthology распространяется только на PDF/текст самой публикации, тогда как лицензию на связанный видеокорпус нужно проверять отдельно в репозитории датасета (через GitHub API и DSpace `dc.rights`).
Сработало: Прямое чтение метаданных DSpace (`dc.rights` / `dc.rights.uri`) на `nur.nu.edu.kz` и JSON-ответа `api.github.com/users/krslproject/repos` сразу выявило точные ограничения по каждому источнику без догадок.

Приступаю к следующему пункту письма 1109-230655: `docs/research-design/control-tales-spec.md`.
