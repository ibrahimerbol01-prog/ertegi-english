# Android-приложение (TWA)

Приложение — это сайт `https://ertegi-english.vercel.app/` в оболочке Trusted Web Activity (Bubblewrap). Код сайта не меняется, обновления приходят вместе с деплоем сайта.

## Скачать демо-APK
1. GitHub → репозиторий → **Actions** → **android-twa** → последний зелёный запуск.
2. Внизу страницы раздел **Artifacts** → `ertegi-android` (zip). Нужен вход в GitHub.
3. Внутри: `app-release-signed.apk` (для телефона) и `app-release-bundle.aab` (для Google Play).
4. Новый запуск: **Run workflow** (кнопка работает после слияния ветки в `main`).

## Поставить на телефон
Перешлите APK на телефон (Telegram, USB, облако) и откройте. Разрешите установку из этого источника. Play Protect может показать «неизвестный разработчик» — «Всё равно установить»: ключ демонстрационный.

## Адресная строка и assetlinks
Без `https://ertegi-english.vercel.app/.well-known/assetlinks.json` с отпечатком подписи приложение откроется с адресной строкой Chrome. В репозитории лежит файл для демо-ключа запуска 42675007302:

- SHA-256: `34:AA:30:30:46:BA:E7:E7:FD:47:36:06:77:4B:81:11:90:61:B3:7E:D2:65:53:50:50:BE:9B:A4:ED:BE:17:A3`

**Честное ограничение.** Без секрета `KEYSTORE_B64` каждый запуск создаёт новый демо-ключ, и отпечаток меняется. Полноэкранный режим работает только для APK из запуска, чей отпечаток лежит в `assetlinks.json` на сайте (после слияния и деплоя). Чтобы отпечаток был постоянным, создайте ключ один раз и положите в Secrets (`KEYSTORE_B64`, `KS_PASS`, при отдельном пароле ключа `KEY_PASS`):

```
keytool -genkeypair -v -keystore ertegi-upload.jks -alias ertegi-demo -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 ertegi-upload.jks
keytool -list -v -keystore ertegi-upload.jks -alias ertegi-demo | grep SHA256
```
Храните копию ключа вне GitHub. Потерянный ключ означает невозможность обновлять приложение.

Шаблон `assetlinks.json`:
```
[{"relation":["delegate_permission/common.handle_all_urls"],
  "target":{"namespace":"android_app","package_name":"kz.ertegi.app",
  "sha256_cert_fingerprints":["AA:BB:..."]}}]
```

## Что проверить на телефоне до показа
- Вход через Google: в TWA вход идёт в Chrome. Не проверено на устройстве.
- Микрофон и проверка произношения (Azure): запрос разрешения должен появиться. Не проверено.
- Офлайн: открыть приложение без сети после первого запуска (service worker сайта).
- Кнопка «Назад» и открытие ссылки `/?class=КОД`.
- Есть ли адресная строка сверху (признак незавершённого assetlinks).

## Переход на Google Play
Демо-ключ для Play не подходит. Нужно: аккаунт Play Console ($25), постоянный ключ загрузки в Secrets, отпечаток **ключа подписи Google** (Play Console → Setup → App integrity) в `assetlinks.json`, политика конфиденциальности по URL, форма Data safety, возрастная аудитория. Для новых личных аккаунтов нужно закрытое тестирование: 12 тестеров, 14 дней подряд. Вход через Google для детей и Families policy требуют решения до выбора аудитории.

## Что сделано в workflow
`.github/workflows/android-twa.yml` (права `contents: read`), `twa-manifest.json` (minSdk 24, пакет `kz.ertegi.app`). Строку `push:` в workflow уберите после слияния.
