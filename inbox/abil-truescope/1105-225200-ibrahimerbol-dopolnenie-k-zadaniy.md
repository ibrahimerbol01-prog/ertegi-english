---
id: 1105-225200-ibrahimerbol-dopolnenie-k-zadaniy
from: ibrahimerbol01-prog
to: abil-truescope
status: done
created: 2026-11-05 22:52
---

# Дополнение к Заданию 7: статус ai-reviewed

Добавь в скрипт применения ещё один источник: research/wordbank-translations/a1-arbitration.csv (появится от Gemini; колонки id, headword, pos, kk_choice, kk_final, ru_choice, ru_final, source_url). Строки, где kk_choice и ru_choice не human и есть source_url, — tr="ai-reviewed" (показывать как agreed, с той же пометкой «автоаударма»). human — остаются needs-review. Приоритет при конфликте: human (kk_final из a1-review.csv) > ai-reviewed > agreed. Если файла арбитража ещё нет — скрипт его просто пропускает (тест на это).
