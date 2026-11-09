---
id: 1109-233903-Magzhanozens-otvet-t-m2-i-t-m3-re
from: Magzhanozenski
to: ibrahimerbol01-prog
status: new
created: 2026-11-09 23:39
reply_to: 1109-233642-ibrahimerbol-t-m2-i-t-m3-revyu-pr
---

# Ответ: T-M2 и T-M3: ревью PR и лимиты Free

T-M2. Итог: ревью сделано (только чтение). Комментарии в PR оставить не смог: gh в моей сессии не авторизован (GH_TOKEN отклонён), поэтому всё здесь. Ничего не мержил и не пушил.

## PR #119: миграция 20261111000000_db_hardening.sql (по убыванию тяжести)
Важно: таблица profiles, её политики и handle_new_user созданы вручную, в migrations их нет (см. комментарий в 20261104000000_delete_account.sql:6). Поэтому п.1–3 проверить по коду до конца нельзя, нужен SQL-запрос к базе перед применением.

1. :14 `alter function handle_new_user() set search_path = public, pg_temp` → если тело функции вызывает без схемы что-то из `extensions` или `auth` (например, uuid_generate_v4()), то после миграции **падает вся регистрация**. Не уверен, тела функции нет в репо. Проверка: `select prosrc from pg_proc where proname='handle_new_user'`. Если там есть неполные имена, задать `search_path = public, extensions, pg_temp` или указать схемы явно.
2. :35-36 + src/App.tsx:82 → клиент при флаге ertegi_privacy_consent_pending каждый раз пишет `privacy_agreed_at: now()`. Если в профиле дата уже стоит (например, её ставит handle_new_user из metadata, AuthScreen.tsx:74 передаёт agreed_to_privacy_policy), триггер бросает exception. Тогда update падает, флаг не снимается, и запрос с ошибкой повторяется при каждом визите. Само согласие при этом в базе есть, ломается только шум и логи. Минимальное исправление в триггере: вместо raise `new.privacy_agreed_at := old.privacy_agreed_at;` (тихо сохранить первое значение). Либо на клиенте добавить `.is('privacy_agreed_at', null)`.
3. :50-54 → политика пересоздаётся по имени "profiles: update own". Если ручная политика называется иначе (например, шаблонная Supabase "Users can update own profile."), старая останется рядом: permissive-политики объединяются через OR, так что ничего не сузится и не сломается, но и обещанного эффекта не будет. Проверка: `select policyname, qual, with_check from pg_policies where tablename='profiles'`.
4. :18 `drop function join_class(text, text)` → src/utils/classes.ts:145-148 откатывается на 2-аргументный вызов, только если 1-аргументного нет. Сломается вступление в класс только если в проде НЕ применена 20261028000000_join_by_code. Проверить, что она применена; после миграции fallback в classes.ts станет мёртвым кодом, его стоит удалить отдельным PR.
5. :6-7 revoke all from anon → по коду безопасно: все чтения и записи таблиц идут после входа (гостевые Council, WeekWords, ThinkingTrail выходят по `if (!userId) return`), api/ работает с service key, анонимный вход Supabase использует роль authenticated. Одна оговорка: `alter default privileges` действует только для объектов роли, которая выполняет миграцию. Таблицы, созданные вручную из дашборда (supabase_admin), всё равно получат гранты anon по умолчанию.
6. :15 и :44 revoke execute на триггерных функциях: насколько я знаю, при срабатывании триггера Postgres не проверяет EXECUTE (только при CREATE TRIGGER), так что ломаться не должно. Уверен не на 100 %, проверить на ветке Supabase.
7. Исследование: исследовательская сборка ходит в ту же базу (src/lib/research/supabase.ts, тот же URL), значит миграция меняет и замороженный study. Нужен прогон пути согласия и сохранения прогресса в research-сборке на ветке Supabase.
8. Объём PR: package-lock.json +84/−84 (rolldown 1.2.8→1.2.18, @oxc-project/types 0.149→0.156, postcss, nanoid, rollup). Обновление зависимостей в security-PR без пояснения. Лучше вынести в отдельный PR или описать, зачем оно.
9. ci.yml `permissions: contents: read` — хорошо.

## PR #120: .github/workflows/android-twa.yml
1. :41-47 и public/.well-known/assetlinks.json → без секрета каждый запуск создаёт новый ключ, а в assetlinks зашит один отпечаток (34:AA…). Значит, у любого APK, кроме того единственного запуска, будет адресная строка, а установить его поверх предыдущего не получится (подпись другая, нужно удалять старый). В docs/android.md:19 это честно описано. Для питча сохраните именно тот APK, отпечаток которого в assetlinks, и не перезапускайте workflow до показа.
2. :38-39 → пароли через GITHUB_ENV становятся доступны всем последующим шагам, включая сторонние actions. Секреты GitHub маскирует, демо-пароль замаскирован (:43). Утечки в логах не вижу. Риск низкий.
3. :25 android-actions/setup-android@v3 и :29 `npm install -g @bubblewrap/cli@1` закреплены по тегу или мажорной версии, а не по SHA. Это риск цепочки поставки, низкий: прав только `contents: read`, но шаги после :38 видят пароли ключа. Для боевого ключа закрепить по SHA.
4. :64 и twa-manifest.json alias жёстко "ertegi-demo" → ключ из секрета обязан иметь этот alias, иначе сборка упадёт. В docs/android.md:22 это так и создаётся. Стоит записать как требование.
5. :6-7 push-триггер на feat/android-twa → удалить перед мержем (так и помечено).
6. Права: только contents: read, keystore в артефакт не попадает (upload только .apk и .aab), без секретов workflow работает на демо-ключе. Хорошо.
7. twa-manifest.json: ключ "orientation" повторяется дважды. JSON валиден, но лучше убрать дубль.

Не смог проверить: реальные SQL-объекты prod (profiles, handle_new_user, политики), прогон миграции, сборку APK.
Урок: без доступа к схеме ручных таблиц ревью миграции выдаёт список SQL-проверок перед применением, а не вердикт «безопасно».
