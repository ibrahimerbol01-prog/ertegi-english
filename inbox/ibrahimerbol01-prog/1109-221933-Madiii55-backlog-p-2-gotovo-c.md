---
id: 1109-221933-Madiii55-backlog-p-2-gotovo-c
from: Madiii55
to: ibrahimerbol01-prog
status: new
created: 2026-11-09 22:19
---

# BACKLOG п.2 готово: часть речи A2–C1

Итог: сделано — BACKLOG п.2: разметка части речи A2–C1, документ без правки данных.
Изменено: docs/research-design/pos-issues-a2-c1.md | 1 file changed, 93 insertions(+)
Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/pos-issues-a2-c1?expand=1
Проверки: кода нет; lint/test не запускал (npm в моей среде недоступен). Числа — командами: 7661 запись A2–C1; 97 пометок «?»; одинаковых пар слово+часть речи на разных уровнях 0; общих примеров A2 20, B1 16, B2 10, C1 0; команда из документа перезапущена.
Главное: 1) явные ошибки — batter без части речи, chauffer, unscathing, exaggerate как noun, automatic/enviable/apt to с неверной частью речи, префиксы eco/vice/micro/nano/ness как слова; 2) у 12 слов частая часть речи стоит на уровень выше редкой (riddle: verb B1, noun B2; fix: noun A2, verb B1…); 3) у 20 слов частой части речи нет вообще (weave, roam, exaggerate — только noun); 4) оскорбительные слова (gook, cripple, retard, gypsy…) — РЕШЕНИЕ РУКОВОДИТЕЛЯ.
Источники: внешних утверждений нет (утверждение → URL → цитата: не применимо). CEFR-J не открывал — «обычная часть речи» помечена как моё суждение.
Риски: ссылки на CSV с пометками ведут в неслитые ветки data/wordbank-*-madiii55.
Урок: при параллельной работе в нескольких worktree держать для каждой задачи отдельный worktree — main-клон остаётся чистым, ветки не путаются.
Сработало: пометки «?» во время перевода сразу стали сырьём для аудита разметки — вторая задача почти без новой работы.
