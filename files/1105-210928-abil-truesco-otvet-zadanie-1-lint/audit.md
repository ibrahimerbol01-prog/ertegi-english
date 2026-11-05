# npm audit — разбор (ветка chore/lint-warnings, lockfile не менялся)

`npm audit`: 8 уязвимостей — 2 low, 4 moderate, 2 high, 0 critical.
Node v26.13.0, npm 11.20.0, Windows 11.

**Главное:** ни один уязвимый пакет не попадает в браузерный бандл. Все они — инструменты
сборки и dev-сервера (vite, postcss, tailwind, генератор service worker). В бандл идут только
react, react-dom, @supabase/supabase-js, lucide-react, microsoft-cognitiveservices-speech-sdk.

## High и moderate

| Пакет (версия) | Уровень | Через что приходит | Прод или dev | Исправление без мажорного обновления |
|---|---|---|---|---|
| vite 8.3.0 | high | прямая devDependency (`^8.3.0`); также через @vitejs/plugin-react, vitest, @tailwindcss/vite | dev: dev-сервер и сборка. Уязвимости в launch-editor (открытие файла в редакторе из оверлея ошибок, high на Windows) и в `server.fs` dev-сервера | **Да:** vite 8.3.6 (патч, в рамках `^8.3.0`): `npm update vite` |
| source-map-js 1.2.1 | high | postcss 8.5.28 (← vite) и @tailwindcss/node 4.3.3 (← @tailwindcss/vite) | сборка: DoS при разборе вредоносной source map; наши source maps собираем мы сами | **Да:** 1.2.2 (патч): `npm update source-map-js` |
| vite-plugin-pwa 2.0.0 | moderate | прямая devDependency (`^2.0.0`), сама по себе не уязвима, тянет workbox-build | сборка (генерация service worker) | Нет. npm предлагает *откат* до 1.1.0 (мажорный, назад) — не делать. 2.0.0 и так последняя |
| workbox-build 7.4.1 | moderate | ← vite-plugin-pwa | сборка; в сам service worker идут другие пакеты workbox-*, их это не касается | Нет, ждать новой версии workbox-build |
| glob 11.1.0 | moderate | ← workbox-build | сборка: обход AbortSignal-таймаута; glob-шаблоны задаём мы сами | Нет: исправление в glob ≥ 14.0.2, это мажорное обновление внутри workbox-build |
| minimatch 10.2.6 | moderate | ← glob ← workbox-build | сборка: DoS на специально составленных шаблонах; шаблоны наши | Нет, исправляется вместе с glob |

## Low (для полноты)

| Пакет | Через что | Прод/dev | Исправление |
|---|---|---|---|
| deepmerge 4.3.1 | @rollup/plugin-node-resolve 16.0.3 ← workbox-build | сборка | нет без мажорного; вместе с workbox-build |
| @rollup/plugin-node-resolve 16.0.3 | ← workbox-build | сборка | там же |

## Рекомендация

1. **Обновить безопасно (патчи, отдельным заданием с правкой lockfile):**
   `npm update vite source-map-js` → vite 8.3.6, source-map-js 1.2.2. Это закрывает оба high.
   После обновления: lint, typecheck, test, `npm run build`.
2. **Можно игнорировать до выхода новой версии workbox-build:** цепочка vite-plugin-pwa →
   workbox-build → glob/minimatch/deepmerge. Работает только при сборке, на наших файлах и
   шаблонах, в прод не попадает. Совет npm откатить vite-plugin-pwa до 1.1.0 — не применять.
3. Пока vite не обновлён: не открывать dev-сервер наружу (`--host`) и не открывать
   чужие ссылки на localhost-порт dev-сервера.
