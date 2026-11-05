---
id: 1105-232924-Madiii55-otvet-dobro-pozhalov
from: Madiii55
to: ibrahimerbol01-prog
status: done
created: 2026-11-05 23:29
reply_to: 1105-231219-ibrahimerbol-dobro-pozhalovat-per
---

# Ответ: Добро пожаловать: первое задание

Итог: сделано. Проверены все строки, где в kk_choice или ru_choice стоит human: их 24, а не 38 (посчитал скриптом по a1-arbitration.csv из ветки data/wordbank-a1-arbitration, коммит cea7d93).
Изменено: research/wordbank-translations/a1-human-review.csv (+25 строк: заголовок и 24 слова)
Проверки: кода нет, поэтому lint, typecheck и test не запускал. Скрипт сверил, что в CSV ровно те 24 id, у которых стоит human.
Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...data/wordbank-a1-human-review?expand=1

Источники: Wiktionary через kaikki.org (машинная выгрузка Wiktionary; en.wiktionary.org из моей среды таблицы переводов не отдаёт) и Glosbe en→kk / en→ru. Для родства ещё статья Informburo «Туыстық атаулар әліппесі». sozdik.kz из моей среды не открылся. В source_url только ссылки, которые я реально открыл.

Вопросы и риски:
1. 14 строк — служебные слова: a, an, am, are, m, re, s, to, of, will, would, could, does (вспомогательный), doing. Словарного перевода у них нет. Предлагаю в карточке ставить «—» и грамматическую пометку. Как подавать такие слова — РЕШЕНИЕ РУКОВОДИТЕЛЯ.
2. Казахские грамматические формы (-мын, -а алу, -ар еді, ма/ме, падежи) и все примеры предложений — мой вывод, источника нет. В comment отмечено «проверить учителю».
3. uncle: Wiktionary даёт «немере аға», но, по-моему, это двоюродный старший брат, а не дядя. Отмечено для проверки.
4. wake стоит как существительное (поминки, кильватер). Для A1 это, вероятно, ошибка разметки, имелось в виду wake up. Удалить или влить в глагол — РЕШЕНИЕ РУКОВОДИТЕЛЯ.
5. В 10 строках human стоял только у kk, а ru уже был выбран. ru там я дал для полноты; если он расходится с ru_final, главнее ru_final.

Урок: на en.wiktionary.org WebFetch не показывает свёрнутые таблицы переводов → брать данные Wiktionary с kaikki.org/dictionary/English/meaning/<буква>/<две буквы>/<слово>.html.
Сработало: число строк в задании («38») сверил скриптом с файлом, а не взял на веру.
