# Навыки исполнителей

Читать перед задачей нужного типа: `git show FETCH_HEAD:skills/<навык>/SKILL.md`
(после `git fetch origin team-relay`). Claude Code может скопировать навыки себе:
`git archive FETCH_HEAD skills | tar -x -C ~/.claude/` — тогда они подхватятся сами.

| Задача | Навык |
| --- | --- |
| Любая задача из почты | `team-task` (правила команды), EXECUTOR.md |
| Тесты React-компонентов (Vitest, Testing Library) | `react-testing` |
| Новые тесты, исправления через тест | `tdd-workflow` |
| Перед отчётом: проверить, что всё работает | `verification-loop` |
| TypeScript-код | `typescript-patterns` |
| Проверочный набор для модели (Шоқан) | `eval-harness` |
| Поиск источников, литература, опросники | `research-ops` |
| Ключи, ввод пользователя, API, данные детей | `security-review` |
| Сказки: тексты, уровни A1–C1, квизы, карточки | `ertegi-story-method` |

Навыки `react-testing`, `tdd-workflow`, `verification-loop`, `typescript-patterns`, `eval-harness`,
`research-ops`, `security-review` — из Everything Claude Code (github.com/affaan-m/ECC, MIT, см.
ECC-LICENSE). Где они противоречат EXECUTOR.md или правилам проекта, главнее EXECUTOR.md.


## Добавлено 06.11 (из ECC, MIT)
Тесты в браузере: e2e-testing. Доступность: frontend-a11y, accessibility. Скорость: react-performance, seo. Переводы интерфейса: i18n-sync. Рынок и конкуренты: competitive-platform-analysis, competitive-report-structure, market-research. База: database-migrations, postgres-patterns (только описывать SQL, не применять). Исследования: deep-research. Опыт команды: continuous-learning. Дизайн-система: design-system. Правило: прочитай SKILL.md нужного навыка до задачи; навык не отменяет EXECUTOR.md и правило пользы.
