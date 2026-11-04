# Ertegi English

Учит английскому казахских школьников через фольклор: ертегі на пяти уровнях (A1–C1), сохранение слов, карточки с интервальным повторением, квизы, произношение, помощник Шоқан, кабинет учителя.

Прод: https://ertegi-english.vercel.app

## Стек

React 19, Vite, TypeScript, Tailwind CSS v4, Supabase (вход, данные, RLS), Vercel (статика и функции в `api/`), PWA через `vite-plugin-pwa`.

## Запуск

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build      # tsc -b + vite build в dist/
npm run preview    # собранная версия
```

Проверки (их же запускает GitHub Actions на каждый PR):

```bash
npm run lint       # oxlint src api
npm run typecheck  # tsc -b
npm test           # vitest
```

После правки текста сказки или словаря `WORD_TRANSLATIONS`: `npm run corpus` пересобирает профиль корпуса (иначе тест падает).

## Переменные окружения

Клиент (`.env.local`, необязательные):

- `VITE_API_BASE` — адрес API, если фронтенд открыт не с того же домена (нужно для Capacitor).
- `VITE_PUBLIC_URL` — публичный адрес сайта для ссылок и OAuth-редиректов.

Сервер (Vercel → Settings → Environment Variables):

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — счётчик лимитов и проверка токена.
- `GEMINI_API_KEY`, `GEMINI_MODEL` — Шоқан (запасной вариант: `ANTHROPIC_API_KEY`).
- `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` — нейронные голоса и оценка произношения.
- `CORS_ORIGINS` — дополнительные разрешённые origin через запятую.

## Структура

- `src/KazakhTalesApp.tsx` — оболочка приложения: состояние, навигация, сохранение прогресса.
- `src/components/screens/` — экраны вкладок (Главная и Чтение грузятся сразу, остальные лениво).
- `src/constants.ts` — тексты сказок, квизы, достижения.
- `src/dict.ts`, `src/lang.ts` — интерфейс на казахском (кириллица) и английском.
- `src/utils/` — прогресс, повторение, голос, квизы по уровням.
- `api/` — серверные функции Vercel: `shoqan.js` (ИИ-помощник), `azure-token.js` (токен речи), лимиты в `_usage.js`.
- `supabase/migrations/` — SQL-миграции, применяются вручную в Supabase SQL Editor.
- `docs/` — дизайн-система и план мобильных приложений.
- `docs/research-evidence.md` — научная база: какие исследования внедрены, где в коде и как измерять (обновляется в каждом PR с методикой).
- `docs/corpus.md`, `docs/corpus-profile.json` — профиль 35 текстов по внешней шкале CEFR-J (R6); списки слов и их лицензии в `research/cefr/`.
- `docs/performance-baseline.md` — базовые замеры скорости и бюджет для каждого PR; повторный замер: `npm run build && npm run preview -- --port 4173`, затем `npm run perf`.
