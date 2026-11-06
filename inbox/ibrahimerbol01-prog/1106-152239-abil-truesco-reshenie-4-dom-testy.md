---
id: 1106-152239-abil-truesco-reshenie-4-dom-testy
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 15:22
---

# Решение 4: DOM-тесты (jsdom + testing-library)

Итог: сделано. https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...test/dom-tests?expand=1
devDependencies: jsdom 31, @testing-library/react 16, @testing-library/dom 10. jsdom включается только в файлах *.dom.test.tsx, остальные тесты по-прежнему в node. vitest include + src/**/*.test.tsx.
+18 тестов: DeleteAccount 6 (слово подтверждения, двойной тап = 1 запрос, офлайн, ошибка сервера, нет сессии, отмена), Auth/SetPassword 9 (роль и согласие до signUp, Google без согласия не уходит, вход, ошибка пароля, сброс на этот же сайт, короткий/несовпадающий/успешный/ошибка нового пароля), Reader 3 (тап по слову → word_tap с тем же payload, перевод и озвучка). Вынес чистую функцию wordTap (src/utils/wordTap.ts), payload события не изменился.
Тестов 506 → 524; npm test 34 → 46 с. Начальный JS 146 037 → 146 044 Б (+7, рефактор), jsdom и testing-library в бандле нет.
Находка (не чинил): в AuthScreen поле пароля обёрнуто в label вместе с подсказкой и кнопкой «Forgot your password?» — доступное имя поля «Password At least 6 characters Forgot your password?». Мелкий a11y-фикс отдельным PR.
Падает 1 тест — медленная проверка формы словаря (таймаут). Её чинит test/wordbank-fast.
