# Чистка: мёртвый код и устаревшие ветки (список, ничего не удалено)

Обновлено 10.11.2026, main @ `ba2c7f9` (прошлая версия — 06.11.2026, main @ `7157322`). Пункт бэклога «Код и качество → 5». Здесь только список; удаляет владелец.
Повторить: `scripts/branch-status.py` (нужна полная история веток, см. строку 1 скрипта).

## Ветки: 155 на origin (без main и team-relay); 06.11 было 129

Как считали: пробное слияние каждой ветки в main (`git merge-tree --write-tree`). Если дерево результата совпадает с main, в ветке нет ничего нового, даже если её влили squash-ом. Номер PR — из `refs/pull/*/head` (открыт/закрыт без gh не виден).

**Все 36 веток из прошлого списка «можно удалять» всё ещё на origin**, к ним добавилось 9.

| Группа | Веток | Что делать |
|---|---|---|
| А. Целиком в main | 45 | можно удалять |
| — `study` | 1 | **не трогать**: замороженная исследовательская ветка до 31.12 |
| Б. Старые (до 04.11), с конфликтом | 48 | почти наверняка заменены позже; глянуть PR и удалить |
| В. С 05.11, с новым содержимым или конфликтом | 61 | не трогать без автора: в работе или ждут PR |

### А. Можно удалять (45)

`brand/orange-icons`, `chore/audit-cleanup`, `chore/gitattributes-lf`, `chore/lint-warnings`, `chore/vercel-agent-skills`, `claude/improve-site-quality`, `data/legend-glosses`, `data/wordbank-a1-ai-reviewed`, `data/wordbank-a1-arbitration`, `data/wordbank-a1-human-review`, `data/wordbank-a2-agreed`, `data/wordbank-a2-arbitration`, `design/depth`, `docs/a11y-wordbank-reader`, `docs/cleanup-list`, `docs/ethics-package`, `docs/landing-audit`, `docs/literature-verified`, `docs/market-ux`, `docs/motion-audit`, `docs/motivation-instruments`, `docs/personal-data-map`, `feat/android-twa`, `feat/hide-home-mascot`, `feat/landing-b`, `feature/api-auth-v2`, `feature/i2-hint-ladder`, `feature/readability-calm-bg`, `feature/save-errors`, `fix/achievement-upsert`, `fix/contour-test-alias`, `fix/levelquiz-deterministic`, `fix/shoqan-gemini-3`, `fix/shoqan-look`, `fix/visible-xp-texts`, `perf/initial-chunk`, `perf/self-host-fonts`, `research/assent-screen`, `research/data-pipeline`, `research/maqta-qyz-adaptation`, `research/test-items-draft`, `test/audit-gaps`, `test/dict-keys`, `test/dom-tests`, `test/e2e-flow`

### Б. Старые с конфликтом (48) — дата · ветка · коммитов впереди / позади main · PR · автор

- 2026-10-05 · `feature/api-auth` · +1/−127 · #1 · Ibrahim · конфликт с main
- 2026-10-07 · `feature/home-fixes` · +1/−103 · без PR · Ibrahim · конфликт с main
- 2026-10-22 · `design/ethno-redesign` · +1/−102 · #8 · Claude · конфликт с main
- 2026-10-22 · `design/nomad-modern` · +2/−102 · #9 · Claude · конфликт с main
- 2026-10-22 · `design/path-levels` · +1/−101 · #10 · Claude · конфликт с main
- 2026-10-22 · `feature/level-quiz` · +1/−98 · #14 · Claude · конфликт с main
- 2026-10-22 · `feature/nomad-features` · +4/−95 · без PR · Claude · конфликт с main
- 2026-10-22 · `feature/nomad-games` · +6/−94 · #18 · Claude · конфликт с main
- 2026-10-22 · `feature/reader-highlights` · +5/−99 · #13 · Claude · конфликт с main
- 2026-10-22 · `feature/shoqan-path` · +1/−96 · #16 · Claude · конфликт с main
- 2026-10-22 · `feature/signup-speak` · +1/−97 · #15 · Claude · конфликт с main
- 2026-10-23 · `feature/cyrillic-ui` · +1/−93 · #19 · Claude · конфликт с main
- 2026-10-23 · `feature/progress-srs` · +4/−100 · без PR · Ibrahim · конфликт с main
- 2026-10-25 · `feature/popups-voice-cards` · +2/−91 · #21 · Claude · конфликт с main
- 2026-10-25 · `feature/words-intervals` · +1/−90 · #23 · Claude · конфликт с main
- 2026-10-25 · `fix/qa-mini-bugs` · +4/−92 · без PR · Claude · конфликт с main
- 2026-10-26 · `design/icons` · +6/−85 · #27 · Claude · конфликт с main
- 2026-10-26 · `feature/cards-player-daily-debate` · +4/−82 · без PR · Claude · конфликт с main
- 2026-10-26 · `feature/daily-debate-questions` · +1/−81 · #31 · Claude · конфликт с main
- 2026-10-26 · `feature/gemini-shoqan` · +1/−83 · #29 · Claude · конфликт с main
- 2026-10-26 · `feature/quiz-feedback` · +3/−90 · #22 · Claude · конфликт с main
- 2026-10-26 · `feature/steppe-council` · +4/−87 · #25 · Claude · конфликт с main
- 2026-10-26 · `feature/teacher-cabinet` · +1/−79 · #33 · Claude · конфликт с main
- 2026-10-26 · `feature/thinking-trail` · +3/−86 · #26 · Claude · конфликт с main
- 2026-10-26 · `feature/word-week-debate` · +2/−90 · #24 · Claude · конфликт с main
- 2026-10-26 · `fix/favicon` · +1/−80 · #32 · Claude · конфликт с main
- 2026-10-26 · `fix/pilot-blockers` · +4/−84 · #28 · Claude · конфликт с main
- 2026-10-26 · `fix/teacher-cabinet-qa` · +2/−77 · #35 · Claude · конфликт с main
- 2026-10-27 · `feature/roles` · +6/−76 · #36 · Claude · конфликт с main
- 2026-10-28 · `fix/join-by-code-shoqan` · +1/−75 · #37 · Claude · конфликт с main
- 2026-10-28 · `fix/shoqan-400` · +1/−70 · #42 · Claude · конфликт с main
- 2026-10-28 · `fix/shoqan-503` · +1/−73 · #39 · Claude · конфликт с main
- 2026-10-28 · `fix/shoqan-duration` · +1/−72 · #40 · Claude · конфликт с main
- 2026-10-28 · `fix/shoqan-timeouts` · +1/−74 · #38 · Claude · конфликт с main
- 2026-11-03 · `a11y/keyboard-and-shoqan` · +1/−69 · #45 · Claude · конфликт с main
- 2026-11-03 · `chore/tests-pwa-to-main` · +1/−66 · #48 · Claude · конфликт с main
- 2026-11-03 · `feat/pwa-capacitor-prep` · +3/−69 · #47 · Claude · конфликт с main
- 2026-11-03 · `fix/data-and-api` · +2/−69 · без PR · Ibrahim · конфликт с main
- 2026-11-03 · `perf/lazy-and-video` · +1/−69 · #44 · Claude · конфликт с main
- 2026-11-03 · `refactor/split-screens` · +2/−65 · без PR · Claude · конфликт с main
- 2026-11-03 · `test/vitest-ci` · +3/−69 · без PR · Ibrahim · конфликт с main
- 2026-11-04 · `research/r0-evidence-docs` · +1/−63 · #51 · Claude · конфликт с main
- 2026-11-04 · `research/r1-account-privacy` · +2/−62 · #52 · Claude · конфликт с main
- 2026-11-04 · `research/r2-event-log` · +3/−61 · #53 · Claude · конфликт с main
- 2026-11-04 · `research/r3-progress-sync` · +2/−60 · #54 · Claude · конфликт с main
- 2026-11-04 · `research/r6-corpus-metadata` · +4/−59 · #55 · Claude · конфликт с main
- 2026-11-04 · `research/r8-teacher-panel` · +3/−58 · #56 · Claude · конфликт с main
- 2026-11-04 · `research/study-design-draft` · +2/−57 · #57 · Claude · конфликт с main

### В. С 05.11 (61)

- 2026-10-26 · `fix/maqal-next` · +1/−78 · #34 · Claude
- 2026-11-05 · `data/wordbank-a1-claude` · +1/−38 · без PR · abil-truescope
- 2026-11-05 · `data/wordbank-a1-gemini` · +1/−40 · без PR · otarernazar-eng
- 2026-11-05 · `data/wordbank-a2-madiii55` · +5/−33 · без PR · Madiii55
- 2026-11-05 · `data/wordbank-b1-madiii55` · +8/−32 · без PR · Madiii55
- 2026-11-05 · `docs/a1-pos-issues` · +1/−32 · без PR · Madiii55
- 2026-11-05 · `docs/literature-additions` · +2/−42 · без PR · otarernazar-eng
- 2026-11-05 · `docs/new-tales-candidates` · +2/−37 · без PR · otarernazar-eng
- 2026-11-05 · `docs/regional-and-heritage-texts` · +3/−35 · без PR · otarernazar-eng
- 2026-11-05 · `docs/vocabulary-sources` · +2/−40 · без PR · otarernazar-eng
- 2026-11-05 · `feat/email-auth-reset` · +1/−46 · #70 · Claude · конфликт с main
- 2026-11-05 · `feat/wordbank` · +1/−42 · #77 · abil-truescope · конфликт с main
- 2026-11-05 · `feat/wordbank-a1-translations` · +1/−35 · #81 · abil-truescope · конфликт с main
- 2026-11-05 · `feat/wordbank-a2-pipeline` · +3/−32 · без PR · abil-truescope · конфликт с main
- 2026-11-05 · `feat/wordbank-level-progress` · +1/−33 · без PR · abil-truescope
- 2026-11-05 · `feat/wordbank-search` · +1/−33 · без PR · abil-truescope
- 2026-11-05 · `feature/i1-i3-evidence` · +1/−55 · #60 · Claude · конфликт с main
- 2026-11-05 · `fix/contour-alias-test` · +1/−37 · без PR · abil-truescope · конфликт с main
- 2026-11-05 · `integration/night-2026-11-05` · +14/−55 · #65 · Claude · конфликт с main
- 2026-11-05 · `research/r4-r5-foundation` · +2/−51 · #63 · Claude · конфликт с main
- 2026-11-05 · `research/shoqan-eval` · +1/−37 · #79 · abil-truescope · конфликт с main
- 2026-11-05 · `security/teacher-role` · +1/−55 · #62 · Claude · конфликт с main
- 2026-11-05 · `test/research-contour` · +1/−44 · #74 · abil-truescope · конфликт с main
- 2026-11-06 · `a11y/password-label` · +9/−14 · #107 · Ibrahim Erbol
- 2026-11-06 · `data/wordbank-a2-gemini` · +5/−32 · без PR · otarernazar-eng
- 2026-11-06 · `data/wordbank-b2-madiii55` · +9/−32 · без PR · Madiii55
- 2026-11-06 · `data/wordbank-c1-madiii55` · +3/−30 · без PR · Madiii55
- 2026-11-06 · `docs/abai-shortlist` · +1/−32 · без PR · otarernazar-eng
- 2026-11-06 · `docs/error-states` · +1/−17 · без PR · abil-truescope
- 2026-11-06 · `docs/privacy-inventory` · +2/−26 · #90 · Ibrahim · конфликт с main
- 2026-11-06 · `docs/profile-and-placement` · +1/−18 · без PR · abil-truescope
- 2026-11-06 · `feat/landing-a` · +8/−18 · без PR · abil-truescope · конфликт с main
- 2026-11-06 · `feat/landing-b-tale` · +9/−18 · без PR · abil-truescope · конфликт с main
- 2026-11-06 · `feat/placement-test` · +11/−15 · #103 · Ibrahim Erbol · конфликт с main
- 2026-11-06 · `feat/profile-nick-avatar` · +8/−17 · #102 · Ibrahim · конфликт с main
- 2026-11-06 · `fix/ladder-test-stable` · +1/−27 · #93 · Ibrahim Erbol · конфликт с main
- 2026-11-06 · `perf/smooth-and-fast` · +4/−31 · #94 · abil-truescope
- 2026-11-06 · `research/ur-tokpak-adaptation` · +1/−32 · без PR · abil-truescope
- 2026-11-06 · `test/wordbank-fast` · +2/−20 · #99 · Ibrahim · конфликт с main
- 2026-11-07 · `feat/ru-ui` · +1/−5 · #115 · Ibrahim Erbol
- 2026-11-07 · `feat/shoqan-mascot` · +1/−6 · #113 · Ibrahim Erbol · конфликт с main
- 2026-11-09 · `data/a1-examples` · +1/−2 · без PR · Madiii55
- 2026-11-09 · `data/sign-pilot-wordlist` · +1/−2 · без PR · Madiii55
- 2026-11-09 · `docs/classics-map` · +1/−2 · без PR · otarernazar-eng
- 2026-11-09 · `docs/control-tales-spec` · +1/−2 · без PR · otarernazar-eng
- 2026-11-09 · `docs/field-pack` · +1/−2 · без PR · otarernazar-eng
- 2026-11-09 · `docs/literature-q2` · +1/−2 · без PR · otarernazar-eng
- 2026-11-09 · `docs/osf-prereg-draft` · +4/−2 · без PR · otarernazar-eng
- 2026-11-09 · `docs/pos-issues-a2-c1` · +1/−2 · без PR · Madiii55
- 2026-11-09 · `docs/privacy-kz` · +3/−2 · без PR · otarernazar-eng
- 2026-11-09 · `docs/sign-language-legal` · +1/−2 · без PR · Claude
- 2026-11-09 · `docs/sign-language-sources` · +1/−2 · без PR · otarernazar-eng
- 2026-11-09 · `docs/student-questionnaires` · +1/−2 · без PR · otarernazar-eng
- 2026-11-09 · `docs/test-gaps` · +1/−2 · без PR · Claude
- 2026-11-09 · `feat/sign-video-card` · +1/−2 · #117 · Claude
- 2026-11-09 · `fix/db-hardening` · +1/−2 · #119 · Ibrahim Erbol
- 2026-11-09 · `fix/error-states` · +2/−2 · без PR · Claude
- 2026-11-09 · `fix/security-hardening-2026-11-10` · +1/−2 · #118 · Ibrahim Erbol
- 2026-11-09 · `test/wordbank-validator` · +1/−2 · без PR · Madiii55
- 2026-11-10 · `docs/checklist-audit` · +1/−1 · без PR · Claude
- 2026-11-10 · `fix/kk-strings-review` · +1/−0 · без PR · Claude

## Мёртвый код

**10.11.2026:** повторная проверка — те же 3 экспорта, не удалены. Ещё проверено: файлы, недостижимые из `src/main.tsx` (6: `research/corpus*.ts`, `lemmatize.ts`, `params.meta.ts`, `utils/wordbankBuild.ts`, `wordbankTranslations.ts`), используются скриптами `scripts/corpus-report.mjs`, `wordbank-build.mjs`, `wordbank-apply-translations.mjs` и тестами — не мёртвые. Зависимости, которые не импортируются из кода (`tailwindcss`, `typescript`, `oxlint`, `jsdom`, `@types/*`, `@testing-library/dom`), — инструменты и окружение тестов, не лишние.

Как считали: граф импортов по `src/`, `scripts/`, `api/` и `vite.config.ts` (включая alias и `import()`), затем поиск каждого `export` по всем файлам, тесты тоже.

**Файлов без импорта: 0.** `src/research/params.meta.ts` импортируют только тесты — так задумано: это паспорт параметров исследования, его проверяет тест.

**Экспорты, которые не используются нигде: 3** — все декоративные компоненты:

| Что | Где |
|---|---|
| `OrnamentDivider` | `src/components/Ornaments.tsx:75` |
| `OrnamentFrame` | `src/components/Ornaments.tsx:98` |
| `KazakhOrnament` | `src/components/UIHelpers.tsx:11` |

В сборку они не попадают (tree-shaking), так что выигрыша в размере нет, только чистота кода. Решение: удалить можно одним мелким PR; срочности нет.

**Лишний `export`: 53.** Это типы и константы, которые используются только внутри своего файла, например `corpus.ts` (17), `account.ts` (5), `classWork.ts` (4). На сборку не влияет. Решение: не брать, правка ради правки.

## Не проверено

Дубликаты кода (одинаковые функции в разных файлах) инструментом не искались: нужен jscpd, это новая загрузка.
