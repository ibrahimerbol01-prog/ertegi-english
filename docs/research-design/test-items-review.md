# Банк пунктов теста: черновик на проверку

Статус: ЧЕРНОВИК от 05.11.2026. Утверждает руководитель; казахские варианты проверяет учитель казахского. Файл `test-items-draft.json` (`sample: true` до утверждения). Генератор: `analysis/build_test_items.py`.

## Что проверить

1. **Слова.** 20 слов, по 4 на сказку, повторы в текстах B1 уже есть (правки сказок не нужны). Слова уровня A2 (brave, hero, village, wise, land, journey), вероятно, часть учеников знает: если на претесте этапа 0 их знают более 70 %, заменяем из резерва (wing, bald/finger, chest, boot, shepherd, escape, rope, tie).
2. **Казахский правильный ответ** взят из глоссария приложения (то, что ученик видит по нажатию). Проверить: подходит ли он как единственный верный; для hero («батыр») и brave («батыл») ответы близки по написанию, поэтому они не стоят в одном пункте как варианты.
3. **Дистракторы** подобраны по той же части речи; нужно подтвердить, что **ни один не является верным переводом** слова.
4. **Предложения «употребление»**: подходит ровно один вариант. В прилагательных (brave, humble, wise, loyal) разницу по смыслу ловит только носитель, проверить особенно.
5. **Псевдослова** (20 штук): проверить, что это не слова английского, казахского и русского.
6. **Понимание**: вопросов нет; они пишутся вместе с контрольными текстами (R7).

## Слова, переводы, дистракторы

| Слово | Сказка | Верно (kk) | Дистракторы A | Дистракторы B |
|---|---|---|---|---|
| brave | er_tostik | батыл | жалқау, сабырлы, сараң | жомарт, ұялшақ, ашкөз |
| hero | er_tostik | батыр | саудагер, шаруа, құл | жылқышы, ұры, әнші |
| nest | er_tostik | ұя | тау, өзен, көше | тас, ағаш, бақ |
| witch | er_tostik | мыстан | әнші, жылқышы, құл | ұры, саудагер, шаруа |
| giant | tazsha_bala | алып | ергежейлі, ұры, тау | бала, шаруа, әнші |
| squeeze | tazsha_bala | сығу | жүгіру, жазу, күлу | секіру, ұйықтау, ойнау |
| beat | tazsha_bala | жеңу | қашу, іздеу, күту | жасыру, сату, айту |
| village | tazsha_bala | ауыл | қала, тау, өзен | көше, бақ, дала |
| humble | ayaz_bi | қарапайым | тәкаппар, күшті, сараң | қу, жомарт, ашушаң |
| adviser | ayaz_bi | кеңесші | сарбаз, әнші, құл | ұры, саудагер, жылқышы |
| jealous | ayaz_bi | қызғаншақ | жомарт, қорқақ, жалқау | сабырлы, ұялшақ, күшті |
| courtier | ayaz_bi | сарай адамы | шаруа, жылқышы, саудагер | әнші, құл, ұры |
| camel | asan_kaigy | түйе | жылқы, қой, сиыр | есек, ешкі, ит |
| journey | asan_kaigy | сапар | мереке, ойын, дауыс | жұмыс, ән, ұйқы |
| wise | asan_kaigy | дана | қу, ашушаң, күшті | ақымақ, жалқау, тәкаппар |
| land | asan_kaigy | жер | аспан, ауа, су | от, жел, күн |
| pit | alpamys | ор | тау, қабырға, төбе | бұлақ, көпір, қақпа |
| loyal | alpamys | адал | қу, ашкөз, сараң | ашушаң, қорқақ, ақымақ |
| protect | alpamys | қорғау | тастау, жою, ұрлау | жасау, табу, шақыру |
| prison | alpamys | түрме | мектеп, базар, мешіт | сарай, дүкен, аурухана |

## Предложения «употребление»

| Слово | Форма A (варианты) | Форма B (варианты) |
|---|---|---|
| brave | The firefighter was very ___ and ran into the burning house. (wise / brave / jealous / humble) | Only a ___ child would walk alone into a dark cave at night. (loyal / humble / brave / jealous) |
| humble | Although she won the prize, she stayed ___ and thanked everyone. (humble / jealous / brave / loyal) | Even after becoming famous, the singer stayed ___ and did not think she was better than others. (jealous / brave / humble / wise) |
| jealous | She felt ___ when her friend got a new bicycle and she did not. (jealous / brave / loyal / wise) | The brothers were ___ of their sister because everyone praised her. (humble / wise / jealous / brave) |
| wise | The old teacher gave ___ advice, and everyone listened to her. (jealous / wise / brave / humble) | A ___ person thinks carefully before making a big decision. (loyal / jealous / wise / brave) |
| loyal | The dog stayed ___ to its owner for fifteen years. (brave / loyal / humble / jealous) | A ___ friend never leaves you when you are in trouble. (jealous / humble / wise / loyal) |
| hero | The boy saved three children from the river, and the town called him a ___. (hero / camel / village / nest) | In the story, the ___ fights the dragon and saves the people. (camel / nest / hero / village) |
| nest | The bird built a ___ in the tall tree and laid three eggs. (camel / nest / prison / journey) | We saw a small ___ with two baby birds on the branch. (village / nest / adviser / giant) |
| witch | In the old story, an evil ___ lived in the forest and cooked magic soup. (courtier / witch / camel / pit) | The children were afraid of the ___ who could turn people into frogs. (adviser / village / witch / prison) |
| giant | The ___ was so tall that he could touch the clouds. (giant / nest / village / camel) | The ground shook when the huge ___ walked past the houses. (nest / giant / prison / adviser) |
| village | My grandmother lives in a small ___ with only fifty houses. (prison / village / camel / journey) | All the people in the ___ came to the wedding feast. (nest / giant / village / pit) |
| adviser | The king asked his ___ for advice about the war. (camel / adviser / nest / hero) | The president listens to her ___ before she makes big decisions. (giant / village / adviser / nest) |
| courtier | Every ___ at the palace bowed when the queen entered the hall. (pit / courtier / nest / camel) | The king's ___ whispered about the strange visitor at the royal dinner. (camel / journey / courtier / prison) |
| camel | The desert traveller drank water and then rode his ___ across the sand. (camel / nest / witch / prison) | A ___ can walk for days in the desert without drinking. (hero / witch / camel / giant) |
| journey | The ___ from Almaty to Aktau takes more than a day by train. (witch / journey / nest / pit) | After a long ___ across the mountains, the travellers were very tired. (giant / journey / village / nest) |
| land | The farmers planted wheat on the rich, flat ___ near the river. (land / prison / camel / hero) | Birds flew over the sea for days before they finally saw dry ___. (land / witch / adviser / pit) |
| pit | The explorer fell into a deep dark ___ and could not climb out. (pit / nest / village / courtier) | A deep ___ in the road stopped the car. (hero / pit / journey / adviser) |
| prison | The thief was sent to ___ for stealing. (nest / camel / prison / village) | The guards locked the door of the ___ and went home. (pit / prison / nest / giant) |
| squeeze | Please ___ the lemon so that we can make some juice. (protect / squeeze / escape / beat) | He had to ___ through the narrow gap between the two rocks. (protect / beat / tie / squeeze) |
| beat | Our school team hopes to ___ the other team in the final match. (squeeze / protect / beat / escape) | She can ___ everyone at chess, even her teacher. (tie / protect / squeeze / beat) |
| protect | Wearing a helmet can ___ your head if you fall off the bike. (protect / squeeze / beat / escape) | The dog will ___ the house from thieves. (beat / tie / squeeze / protect) |

## Псевдослова

Форма A: drunsel, plimmet, skorvin, blenthy, tavrick, glondish, fremple, quorbit, snelter, wuddick.

Форма B: brantle, crimsel, dolvent, flempit, gorlish, hanvick, mintrul, prellow, sondrick, trumble.

## Размер форм

На форму: 30 пунктов узнавания (20 слов + 10 псевдослов), 20 пунктов «значение», 20 пунктов «употребление», всего 70. Время по blueprint около 15 минут; пункты понимания добавятся к 21 минуте только после контрольных текстов. Позиция верного ответа в «значении» выровнена по четырём местам; в «употреблении» тоже.
