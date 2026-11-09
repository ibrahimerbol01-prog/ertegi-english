---
id: 1109-230804-Magzhanozens-otvet-t-m1-revyu-pr
from: Magzhanozenski
to: ibrahimerbol01-prog
status: new
created: 2026-11-09 23:08
reply_to: 1109-230649-ibrahimerbol-t-m1-revyu-pr-117-i
---

# Ответ: T-M1 ревью PR #117 и T-S4 вопросы юристу

Итог: ревью сделано (только чтение diff origin/main...feat/sign-video-card, код не менял)

1. WordbankScreen.tsx:150 → aria-label всегда «Жестті көрсету: word», а видимый текст в режиме меняется на «Жестті жасыру»: при открытом видео читалка говорит «показать», голосовое управление по видимой надписи не найдёт кнопку (WCAG 2.5.3). Исправление: `${signOpen ? st.hide : st.show}: ${word}`, aria-expanded оставить.
2. SignVideoCard.tsx:107 → при ошибке группа кнопок размонтируется, фокус с Play падает на body. Исправление: useEffect на failed → фокус на кнопку «Қайталау».
3. WordbankScreen.tsx:100/106 → role="switch" с состоянием в имени («Жест режимі: Қосулы» + aria-checked): состояние звучит дважды, имя меняется при переключении. Исправление: состояние в aria-hidden span или aria-label={st.mode}.
4. SignVideoCard.tsx:38 → playbackRate ставится эффектом; по спецификации загрузка источника сбрасывает его к defaultPlaybackRate, «Баяу» может остаться нажатой при скорости 1× (особенно после retry). Исправление: ставить и v.defaultPlaybackRate. Тест в jsdom это не ловит.
5. signs.test.ts:77 → при entries: [] тест «все записи валидны» проходит пусто. Не ошибка, но в отчёте не считать его проверкой данных.
6. signs.ts:43 → ref Supabase захардкожен второй раз (уже есть в vercel.json): при смене проекта все записи молча отбросятся. Низкий риск, хватит комментария.
7. signI18n.ts:23,29 → «Айна» понятно, но «Айналы көрініс» точнее; «Үлгі» (образец) для заглушки двусмысленно, лучше «Сынақ» (как в sampleNote). Регистр «тексер» (сен) совпадает с dict.ts. Английские строки ок.

Проверка ссылок на видео: дыр не нашёл (чужой хост, //, http, ..,%2e, регистр, data:, javascript:, чужой Supabase, приватный путь — всё отсекается и покрыто тестами).
Исследовательская сборка: signs.ts / SignVideoCard / signI18n импортируются только из WordbankScreen, который в research заменён alias на .off и lazy=null — утечки по коду нет.
CSP: media-src изменён только в Report-Only, на работу не влияет.

Не смог проверить без запуска (нет npm): lint/typecheck/test/build, grep dist при VITE_RESEARCH_MODE=1, реальное воспроизведение (iOS Safari, reduced motion, retry), вёрстка 360px.
Урок: в shallow-клоне diff ветки требует fetch main и ветки в refs/remotes, иначе merge-base не найдётся.
