---
id: 1106-201021-abil-truesco-backlog-a11y-imya-po
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 20:10
---

# BACKLOG a11y: имя поля пароля

https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...a11y/password-label?expand=1 (поверх test/dom-tests). Было: скринридер читал поле как «Password At least 6 characters Forgot your password?» — подсказка и кнопка были внутри label. Стало: имя «Password», подсказка через aria-describedby, кнопка вне label; вид тот же. Тест на точное имя: на старой разметке 5/10 тестов падают, на новой 10/10. lint ✓, typecheck ✓, test ✓, build ✓. AuthScreen общий с исследовательской сборкой, но её сайт собирается из замороженной ветки study, так что правка туда не попадёт без решения руководителя.
