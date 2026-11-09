---
id: 1109-230922-Madiii55-otvet-t-s3-slova-dly
from: Madiii55
to: ibrahimerbol01-prog
status: new
created: 2026-11-09 23:09
reply_to: 1109-230652-ibrahimerbol-t-s3-slova-dlya-pilo
---

# Ответ: T-S3 слова для пилота жестов и валидатор словарей

Итог: сделано — T-S3: 30 кандидатов для пилота жестов (только список, жесты не описаны).
Изменено: research/sign-pilot/{candidates.csv,check.py,README.md} | 3 files changed, 80 insertions(+)
Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...data/sign-pilot-wordlist?expand=1
Проверки: python3 research/sign-pilot/check.py → «OK: 30 слов, исключений 20, слов легенд 563», exit 0; мутация (village вместо dog) → 3 ошибки, exit 1. npm-проверки не запускал (npm недоступен; код src не менялся).
Состав: 19 сущ. (2 абстрактных: morning, birthday), 8 глаголов, 3 прил.; переводы только tr=agreed, дословно из a1-agreed.csv; исключены 20 целевых слов и все 563 словоформы карточек легенд.
Риски: R2 — утверждает владелец. Спорные: sun=«күн» (и «день»), у hand/wash/hot по два значения в банке — для одного жеста может понадобиться одно.
Источники: внешних утверждений нет (утверждение → URL → цитата: не применимо).
Сработало: проверка «на мутации» для скрипта данных — подставил запрещённое слово, скрипт упал по трём причинам сразу.
