# Чистка: мёртвый код и устаревшие ветки (список, ничего не удалено)

Дата: 06.11.2026, main @ `7157322`. Пункт бэклога «Код и качество → 5». Здесь только список; удаляет владелец.

## Ветки: 129 на origin (без main и team-relay)

Как считали: пробное слияние каждой ветки в main (`git merge-tree --write-tree`). Если дерево результата совпадает с main, в ветке нет ничего нового, даже если её влили squash-ом. Статус PR (открыт/закрыт) без gh не виден; номер PR взят из `refs/pull/*/head`.

| Группа | Веток | Что делать |
|---|---|---|
| А. Целиком в main | 36 | можно удалять |
| — `study` | 1 | **не трогать**: замороженная исследовательская ветка до 31.12 |
| Б. Старые (05.10–04.11), с конфликтом, отстают от main на 40–110 коммитов | 47 | почти наверняка заменены позже; глянуть PR и удалить |
| В. Свежие (05–06.11) с новым содержимым | 45 | не трогать: в работе или ждут PR |

### А. Можно удалять (36)

`chore/audit-cleanup`, `chore/gitattributes-lf`, `chore/lint-warnings`, `chore/vercel-agent-skills`, `claude/improve-site-quality`, `data/legend-glosses`, `data/wordbank-a1-ai-reviewed`, `data/wordbank-a1-arbitration`, `data/wordbank-a1-human-review`, `data/wordbank-a2-arbitration`, `design/depth`, `docs/ethics-package`, `docs/literature-verified`, `docs/market-ux`, `docs/motivation-instruments`, `docs/osf-prereg-draft`, `feat/email-auth-reset`, `feat/landing-b`, `feature/api-auth-v2`, `feature/i2-hint-ladder`, `feature/readability-calm-bg`, `feature/save-errors`, `fix/achievement-upsert`, `fix/contour-test-alias`, `fix/favicon`, `fix/levelquiz-deterministic`, `fix/shoqan-gemini-3`, `fix/visible-xp-texts`, `perf/self-host-fonts`, `research/assent-screen`, `research/data-pipeline`, `research/maqta-qyz-adaptation`, `research/test-items-draft`, `test/audit-gaps`, `test/dict-keys`, `test/wordbank-fast`

### Б. Старые с конфликтом (47) — дата · ветка · коммитов впереди / позади main · PR · автор

- 2026-10-05 · `feature/api-auth` · +1/−110 · #1 · Ibrahim
- 2026-10-07 · `feature/home-fixes` · +1/−86 · без PR · Ibrahim
- 2026-10-22 · `design/ethno-redesign` · +1/−85 · #8 · Claude
- 2026-10-22 · `design/nomad-modern` · +2/−85 · #9 · Claude
- 2026-10-22 · `design/path-levels` · +1/−84 · #10 · Claude
- 2026-10-22 · `feature/level-quiz` · +1/−81 · #14 · Claude
- 2026-10-22 · `feature/nomad-features` · +4/−78 · без PR · Claude
- 2026-10-22 · `feature/nomad-games` · +6/−77 · #18 · Claude
- 2026-10-22 · `feature/reader-highlights` · +5/−82 · #13 · Claude
- 2026-10-22 · `feature/shoqan-path` · +1/−79 · #16 · Claude
- 2026-10-22 · `feature/signup-speak` · +1/−80 · #15 · Claude
- 2026-10-23 · `feature/cyrillic-ui` · +1/−76 · #19 · Claude
- 2026-10-23 · `feature/progress-srs` · +4/−83 · без PR · Ibrahim
- 2026-10-25 · `feature/popups-voice-cards` · +2/−74 · #21 · Claude
- 2026-10-25 · `feature/words-intervals` · +1/−73 · #23 · Claude
- 2026-10-25 · `fix/qa-mini-bugs` · +4/−75 · без PR · Claude
- 2026-10-26 · `design/icons` · +6/−68 · #27 · Claude
- 2026-10-26 · `feature/cards-player-daily-debate` · +4/−65 · без PR · Claude
- 2026-10-26 · `feature/daily-debate-questions` · +1/−64 · #31 · Claude
- 2026-10-26 · `feature/gemini-shoqan` · +1/−66 · #29 · Claude
- 2026-10-26 · `feature/quiz-feedback` · +3/−73 · #22 · Claude
- 2026-10-26 · `feature/steppe-council` · +4/−70 · #25 · Claude
- 2026-10-26 · `feature/teacher-cabinet` · +1/−62 · #33 · Claude
- 2026-10-26 · `feature/thinking-trail` · +3/−69 · #26 · Claude
- 2026-10-26 · `feature/word-week-debate` · +2/−73 · #24 · Claude
- 2026-10-26 · `fix/pilot-blockers` · +4/−67 · #28 · Claude
- 2026-10-26 · `fix/teacher-cabinet-qa` · +2/−60 · #35 · Claude
- 2026-10-27 · `feature/roles` · +6/−59 · #36 · Claude
- 2026-10-28 · `fix/join-by-code-shoqan` · +1/−58 · #37 · Claude
- 2026-10-28 · `fix/shoqan-400` · +1/−53 · #42 · Claude
- 2026-10-28 · `fix/shoqan-503` · +1/−56 · #39 · Claude
- 2026-10-28 · `fix/shoqan-duration` · +1/−55 · #40 · Claude
- 2026-10-28 · `fix/shoqan-timeouts` · +1/−57 · #38 · Claude
- 2026-11-03 · `a11y/keyboard-and-shoqan` · +1/−52 · #45 · Claude
- 2026-11-03 · `chore/tests-pwa-to-main` · +1/−49 · #48 · Claude
- 2026-11-03 · `feat/pwa-capacitor-prep` · +3/−52 · #47 · Claude
- 2026-11-03 · `fix/data-and-api` · +2/−52 · без PR · Ibrahim
- 2026-11-03 · `perf/lazy-and-video` · +1/−52 · #44 · Claude
- 2026-11-03 · `refactor/split-screens` · +2/−48 · без PR · Claude
- 2026-11-03 · `test/vitest-ci` · +3/−52 · без PR · Ibrahim
- 2026-11-04 · `research/r0-evidence-docs` · +1/−46 · #51 · Claude
- 2026-11-04 · `research/r1-account-privacy` · +2/−45 · #52 · Claude
- 2026-11-04 · `research/r2-event-log` · +3/−44 · #53 · Claude
- 2026-11-04 · `research/r3-progress-sync` · +2/−43 · #54 · Claude
- 2026-11-04 · `research/r6-corpus-metadata` · +4/−42 · #55 · Claude
- 2026-11-04 · `research/r8-teacher-panel` · +3/−41 · #56 · Claude
- 2026-11-04 · `research/study-design-draft` · +2/−40 · #57 · Claude

### В. Свежие с новым содержимым (45)

- 2026-10-26 · `fix/maqal-next` · +1/−61 · #34 · Claude
- 2026-11-05 · `data/wordbank-a1-claude` · +1/−21 · без PR · abil-truescope
- 2026-11-05 · `data/wordbank-a1-gemini` · +1/−23 · без PR · otarernazar-eng
- 2026-11-05 · `data/wordbank-a2-madiii55` · +5/−16 · без PR · Madiii55
- 2026-11-05 · `data/wordbank-b1-madiii55` · +8/−15 · без PR · Madiii55
- 2026-11-05 · `docs/a1-pos-issues` · +1/−15 · без PR · Madiii55
- 2026-11-05 · `docs/literature-additions` · +2/−25 · без PR · otarernazar-eng
- 2026-11-05 · `docs/new-tales-candidates` · +2/−20 · без PR · otarernazar-eng
- 2026-11-05 · `docs/regional-and-heritage-texts` · +3/−18 · без PR · otarernazar-eng
- 2026-11-05 · `docs/vocabulary-sources` · +2/−23 · без PR · otarernazar-eng
- 2026-11-05 · `feat/wordbank` · +1/−25 · #77 · abil-truescope · конфликт с main
- 2026-11-05 · `feat/wordbank-a1-translations` · +1/−18 · #81 · abil-truescope · конфликт с main
- 2026-11-05 · `feat/wordbank-a2-pipeline` · +3/−15 · без PR · abil-truescope · конфликт с main
- 2026-11-05 · `feat/wordbank-level-progress` · +1/−16 · без PR · abil-truescope
- 2026-11-05 · `feat/wordbank-search` · +1/−16 · без PR · abil-truescope
- 2026-11-05 · `feature/i1-i3-evidence` · +1/−38 · #60 · Claude · конфликт с main
- 2026-11-05 · `fix/contour-alias-test` · +1/−20 · без PR · abil-truescope · конфликт с main
- 2026-11-05 · `integration/night-2026-11-05` · +14/−38 · #65 · Claude · конфликт с main
- 2026-11-05 · `research/r4-r5-foundation` · +2/−34 · #63 · Claude · конфликт с main
- 2026-11-05 · `research/shoqan-eval` · +1/−20 · #79 · abil-truescope · конфликт с main
- 2026-11-05 · `security/teacher-role` · +1/−38 · #62 · Claude · конфликт с main
- 2026-11-05 · `test/research-contour` · +1/−27 · #74 · abil-truescope · конфликт с main
- 2026-11-06 · `a11y/password-label` · +8/−0 · #107 · abil-truescope
- 2026-11-06 · `data/wordbank-a2-agreed` · +1/−0 · без PR · abil-truescope
- 2026-11-06 · `data/wordbank-a2-gemini` · +5/−15 · без PR · otarernazar-eng
- 2026-11-06 · `data/wordbank-b2-madiii55` · +9/−15 · без PR · Madiii55
- 2026-11-06 · `data/wordbank-c1-madiii55` · +3/−13 · без PR · Madiii55
- 2026-11-06 · `docs/a11y-wordbank-reader` · +1/−0 · без PR · abil-truescope
- 2026-11-06 · `docs/abai-shortlist` · +1/−15 · без PR · otarernazar-eng
- 2026-11-06 · `docs/landing-audit` · +1/−1 · #104 · abil-truescope
- 2026-11-06 · `docs/motion-audit` · +1/−0 · #106 · abil-truescope
- 2026-11-06 · `docs/personal-data-map` · +1/−0 · #105 · abil-truescope
- 2026-11-06 · `docs/privacy-inventory` · +2/−9 · #90 · Ibrahim · конфликт с main
- 2026-11-06 · `docs/privacy-kz` · +1/−15 · без PR · otarernazar-eng
- 2026-11-06 · `docs/profile-and-placement` · +1/−1 · без PR · abil-truescope
- 2026-11-06 · `feat/landing-a` · +8/−1 · без PR · abil-truescope
- 2026-11-06 · `feat/landing-b-tale` · +9/−1 · без PR · abil-truescope
- 2026-11-06 · `feat/placement-test` · +10/−0 · #103 · Ibrahim
- 2026-11-06 · `feat/profile-nick-avatar` · +8/−0 · #102 · Ibrahim
- 2026-11-06 · `fix/ladder-test-stable` · +1/−10 · #93 · Ibrahim Erbol · конфликт с main
- 2026-11-06 · `perf/initial-chunk` · +1/−0 · #108 · abil-truescope
- 2026-11-06 · `perf/smooth-and-fast` · +4/−14 · #94 · abil-truescope
- 2026-11-06 · `research/ur-tokpak-adaptation` · +1/−15 · без PR · abil-truescope
- 2026-11-06 · `test/dom-tests` · +5/−0 · #101 · Ibrahim
- 2026-11-06 · `test/e2e-flow` · +6/−0 · без PR · abil-truescope

Замечание: `feat/landing-a` и `feat/landing-b-tale` (мои) диспетчер закрывает, главная уже в #100. Их можно удалить после закрытия PR.

## Мёртвый код

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
