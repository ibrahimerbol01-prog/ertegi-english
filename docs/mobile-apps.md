# Путь к мобильным приложениям (PWA и Capacitor)

План из аудита 03.11.2026. Отмечено, что уже сделано в коде.

## Этап 0. Общие правки
- [x] `src/lib/api.ts`: `apiUrl()` с `VITE_API_BASE`; все вызовы `/api/...` идут через него.
- [x] `api/_cors.js`: CORS только для `capacitor://localhost`, `https://localhost`, `http://localhost` и самого сайта; 204 на OPTIONS. Дополнительные origin можно задать в Vercel переменной `CORS_ORIGINS` (через запятую).
- [x] `PUBLIC_URL` для ссылок-приглашений в класс и «Поделиться».
- [x] Кнопка Шоқана не перекрывает карточки (PR #45).
- [x] Видео сжато, есть постер (PR #44).
- [ ] Шрифты хранить у себя (`@fontsource-variable/inter`, `nunito`) вместо Google Fonts.
- [ ] `overscroll-behavior`, hover только для `@media (hover: hover)`.

## Этап 1. PWA
- [x] Иконки 192, 512, maskable 512; `manifest.webmanifest`; мета-теги `apple-mobile-web-app-*`.
- [x] `vite-plugin-pwa`: код и тексты сказок кешируются, перезагрузка без сети открывает приложение. Новая версия подхватывается сама при следующем открытии.
- [ ] Проверить установку на Android Chrome и iOS Safari, Lighthouse.

## Этап 2. Каркас Capacitor
1. `npm i @capacitor/core @capacitor/cli`, `npx cap init "Ertegi English" kz.ertegi.app --web-dir dist`, `npx cap add ios android`.
2. Сборка для приложения: `VITE_API_BASE=https://ertegi-english.vercel.app VITE_PUBLIC_URL=https://ertegi-english.vercel.app npm run build && npx cap sync`.
3. В нативе не регистрировать service worker (`Capacitor.isNativePlatform()`).
4. Плагины: `@capacitor/app` (deep links, кнопка «Назад» Android), `@capacitor/browser` (вход через Google), `@capacitor/preferences`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/keyboard`, `@capacitor/share`, TTS-плагин как запасной голос.
5. Иконки и заставки: `@capacitor/assets generate`.

## Этап 3. Вход в приложении
- Supabase: `flowType: 'pkce'`, хранилище Preferences, `detectSessionInUrl` только в вебе.
- Google: `skipBrowserRedirect` → `Browser.open` → `appUrlOpen` → `exchangeCodeForSession`. Google не пускает вход во встроенном WebView, поэтому только через системный браузер.
- URL-схема `kz.ertegi.app://` в Info.plist, AndroidManifest и в Redirect URLs Supabase; `emailRedirectTo` при регистрации.
- iOS: Sign in with Apple (требование App Store, правило 4.8), раз есть вход через Google.

## Этап 4. Разрешения и медиа
- iOS `NSMicrophoneUsageDescription` (kk/en); Android `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`.
- Проверить на устройствах: произношение (Azure + микрофон), озвучку, пауза аудио при сворачивании.

## Этап 5. Навигация и ссылки
- Android «Назад»: закрыть окно → закрыть сказку → «Басты» → выход.
- Universal Links / App Links для `/?class=CODE` (`apple-app-site-association`, `assetlinks.json`).

## Этап 6. Хранилище и выпуск
- Перенести прогресс, роль и очередь результатов квизов на Preferences с переносом из localStorage.
- TestFlight и Google Play Internal testing; ручная проверка на iPhone SE (375) и Android 360dp.

Что нужно от владельца до этапа 2: аккаунт Apple Developer ($99/год), Google Play Console ($25 один раз), Mac с Xcode для сборки iOS (или облачная сборка), решение по bundle id (`kz.ertegi.app`).
