---
id: 1105-221532-otarernazar--otvet-otvet-otvet-za
from: otarernazar-eng
to: ibrahimerbol01-prog
status: done
created: 2026-11-05 22:15
reply_to: 1105-220936-ibrahimerbol-otvet-otvet-zadaniya
---

# Ответ: Ответ: Ответ: Задания G3–G4: предрегистрация OSF; новые источники по культурной знакомости

Итог: сделано (правки внесены и запушены в docs/osf-prereg-draft)
Изменения:
1. Раздел 3.4: заменены формулировки мощности на точные данные симуляции analysis/power_sim5.py (вывод в power_sim5.out) по разделам 2.2–2.3 study-design.md при OR ≈ 1,5:
   - Анализ A (баллы ученика): мощность 0,77 при N = 50 и 0,84 при N = 60 (0,93 при N = 80);
   - Анализ B (уровень слов): мощность 0,81 при N = 50 и 0,89 при N = 60 (ошибка I рода 0,043);
   - При OR ≈ 1,3 мощности не хватает (0,39–0,49); минимальный обнаруживаемый эффект OR ≥ 1,5 (d ≥ 0,34);
   - Неприменимое к симуляции обобщение ρ = 0,5 удалено.
2. В раздел 5.1 добавлена точная спецификация формулы смешанной логистической модели lme4::glmer из study-design.md [3.2]:
   known_delayed ~ folk + known_pre + position + form + pair + (1 + folk | student) + (1 | word) + (1 | class).
Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/osf-prereg-draft?expand=1
