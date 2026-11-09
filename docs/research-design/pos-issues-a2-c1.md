# A2–C1: ошибки и спорные места в разметке части речи

Черновик, 09.11.2026. Исполнитель: Madiii55 (Claude), BACKLOG «Данные и переводы», п. 2. Продолжение `a1-pos-issues.md`.
Файлы: `src/data/wordbank/{A2,B1,B2,C1}.json` из `main`. **Данные не правились.** Решения принимает руководитель.

## Что проверялось и как

1. **Вручную, при слепом переводе A2–C1 (7661 слово).** Строки, где часть речи выглядела ошибкой или словоформа была необычной, я помечал «?». Сюда перенесены 97 таких пометок.
2. **Скриптом по всем пяти уровням:**
   - для каждого помеченного слова — на каких уровнях и с какой частью речи оно встречается;
   - пустая часть речи;
   - одинаковая пара «слово + часть речи» на разных уровнях: **0**;
   - один пример на несколько частей речи: A2 — 20, B1 — 16, B2 — 10, C1 — 0.

Первоисточник CEFR-J я не открывал. «Обычно» в таблицах — моё суждение носителя знаний о языке, а не цитата из словаря. Перед правкой сверить с CEFR-J.

## 1. Явные ошибки данных (приоритет: высокий)

| Уровень | Слово | pos в данных | Проблема |
|---|---|---|---|
| C1 | batter | (пусто) | Часть речи не указана. Рядом есть batter/noun и batter/verb, так что запись — лишняя |
| C1 | chauffer | noun, verb | Опечатка: правильно chauffeur |
| C1 | unscathing | adjective | Такого слова нет, вероятно unscathed |
| C1 | apt to | verb | Это сочетание adjective + to; apt/adjective уже есть |
| C1 | automatic | verb | Глагола automatic нет; adjective есть в A2 |
| C1 | enviable | adverb | Это прилагательное |
| B2 | exaggerate | noun | Это глагол. Как глагол слова нигде нет |
| B2 | ow | noun | Междометие |
| A2 | latter | adverb | Наречия latter нет; pronoun в A2, adjective в B2 |
| B1 | ness | noun | Суффикс -ness, выделенный как слово |
| B1 | hearted | adjective | Встречается только в составе: kind-hearted |
| B1/B2 | eco, vice, micro, nano | noun/adjective | Это префиксы, а не слова |
| B2 | glacis | noun | Узкий фортификационный термин; возможно, имелось в виду glacier |

## 2. Частая часть речи на уровне выше редкой (приоритет: средний)

Похоже на систематический сдвиг: редкое значение стоит раньше частого.

| Слово | Редкая часть речи и уровень | Частая часть речи и уровень |
|---|---|---|
| riddle | verb — B1 (изрешетить) | noun — B2 (загадка) |
| soil | verb — B1 (пачкать) | noun — B2 (почва) |
| thirst | verb — B1 | noun — B2 (жажда) |
| slight | noun — B1 | adjective — B2 (небольшой) |
| fix | noun — A2 | verb — B1 (чинить) |
| float | noun — A2 | verb — B1 |
| fry | noun — A2 | verb — B1 |
| split | adjective — A2 | verb — B2 |
| unlike | adjective — A2 | preposition — B2 (в отличие от) |
| stagger | noun — B2 | verb — C1 |
| refresh | noun — B2 | verb — C1 |
| assistant | adjective — A2 | noun — B1 |

## 3. Частой части речи нет ни на одном уровне (приоритет: средний)

Слово есть только в редкой роли.

| Уровень | Слово | pos в данных | Ожидаемая часть речи |
|---|---|---|---|
| A2 | weep | noun | verb |
| B1 | wizard | adjective | noun |
| B2 | blurt, bombard, brag, droop, hone, prance, ravage, repaint, roam, sag, trample, traverse, weave | noun | verb |
| B2 | bankrupt | verb | adjective |
| B2 | paramedic | adjective | noun |
| B2 | predicate | verb | noun (грамматика) |
| B2 | tatter | noun | обычно мн. ч. tatters |
| B2 | undreamed | adjective | обычно undreamed-of |

## 4. Слова для решения руководителя (не часть речи)

- **Оскорбительные или некорректные значения**: gook (B2), cripple (B2), retard (B2), queer (B2), gypsy (C1), aborigine (B1), handicapped (A2). Предлагаю убрать их из словаря для детей или заменить нейтральными словами.
- **Неприличное второе значение**: exhibitionist (C1).
- **Редкие и устаревшие** (польза для ученика сомнительна): balky, cyberaddict, cyberpet, cyberschool, glocal, habitant, iceman, ling, mortify, outdistance, polity, prehuman, referent, scholasticism, wallboard, netsurfer (B2); gall, haunt (noun) (B1); maternalistic, bald (verb) (C1).

Полный список 97 пометок с причиной лежит в колонке `source_note` файлов `research/wordbank-translations/{a2,b1,b2,c1}-madiii55.csv` (строки, где `source_note` начинается с «?»).

## Как перепроверить

```bash
python3 -I -c "
import json,collections
idx=collections.defaultdict(list)
for L in ['A1','A2','B1','B2','C1']:
    for x in json.load(open(f'src/data/wordbank/{L}.json')): idx[x['word']].append(L+':'+x['pos'])
for w in ['riddle','soil','thirst','weave','exaggerate','batter']: print(w, idx[w])"
```

## Аудит по ролям

- **Исследователь.** «Обычная часть речи» не сверена с CEFR-J. Поэтому раздел 1 даёт как ошибки данных только то, что видно без словаря (опечатки, пустое поле, префиксы), а разделы 2–3 — как вопросы.
- **UX.** Ученик увидит weep как существительное — на карточке это выглядит ошибкой. Раздел 3 важнее для интерфейса, чем раздел 2.
- **EdTech.** Сдвиг уровней (раздел 2) влияет на порядок изучения. Правка уровней может задеть тест исследования — до 31.12.2026 только с решением руководителя.
- **Консультант.** Оскорбительные слова в детском продукте — репутационный риск. Это самый дешёвый и самый важный пункт.
