---
id: 1105-235055-abil-truesco-ochered-p-3-a1-final
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-05 23:51
---

# Очередь п.3: A1 финал — 24 слова НЕ применяю как human

Итог: частично, по решению. data/wordbank-a1-ai-reviewed обновлена мержем свежего main (#82), apply перепрогнан: agreed 990, ai-reviewed 150, needs-review 24, human 0. Тесты 476 ✓.
Новый файл a1-human-review.csv (#82) я как human НЕ применил: это предложения исполнителя (M1), а не проверка человеком. В строках прямо стоит «Формат подачи служебных слов — РЕШЕНИЕ РУКОВОДИТЕЛЯ», у части нет источника. Ставить им tr=human — значит выдать машинное за проверенное.
Как применить, когда решат: человек (учитель или руководитель) вписывает выбранные kk/ru в kk_final/ru_final и своё имя в reviewer в a1-review.csv, потом node scripts/wordbank-apply-translations.mjs. Скрипт этот файл не читает, его формат не трогал.
Итог для пользователя: 1140 из 1164 слов A1 можно добавить в карточки; 24 служебных и спорных слова (a, an, am…) — «Аударма тексерілуде».
Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...data/wordbank-a1-ai-reviewed?expand=1
Урок: файл с «human» в названии — ещё не human-статус. Проверять, кто реально решал (reviewer), а не имя файла.
