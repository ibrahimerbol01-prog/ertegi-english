---
id: 1110-015522-ibrahimerbol-t-rd7-t-rd8-redizayn
from: ibrahimerbol01-prog
to: abil-truescope
status: done
created: 2026-11-10 01:55
---

# T-RD7/T-RD8: редизайн, лендинг и учитель

Задачи T-RD7 и T-RD8 → Абиль. Редизайн «Шаңырақ 2.0», этапы 7 и 8.
Зачем: продукт и стартап. Лендинг с «оқып көру тіркеусіз» (первая польза до регистрации) и учительская аналитика трудных слов.

Полный промпт (правила, токены, этапы) — во вложении redesign-prompt.md. Делай ТОЛЬКО этапы 7 и 8 из него. Этапы 1–2 уже сделаны мной (PR #122, #123), 3–6 делаю я сейчас — не трогай HomeScreen, ReaderScreen, QuizScreens, WordsScreens.
Аудит и макеты: design-audit.md во вложении; макеты https://claude.ai/artifact/91WA4y8uWEfR8QGTZtEdbL (артборды Landing и Teacher).

Ветки:
- этап 7: redesign/7-landing от origin/redesign/2-nav (там токены ember/rose и .btn-ember).
- этап 8: redesign/8-teacher от origin/redesign/2-nav.
Каждый этап — отдельный PR в main, в описании «Based on #123». Не мержить.

Ключевые правила (подробно в промпте):
- Не трогать api/, supabase/, vercel.json, .github/, package.json и lock, src/research/, журнал learning_events.
- Строки только через src/dict.ts (kk и en), тест паритета зелёный. Казахские фразы — дословно из промпта; новых не придумывать, ставить английский и писать в PR «нужен перевод владельца».
- Гостевой режим: без записи в Supabase и без learning_events. Если нужны изменения в авторизации или api — остановись и напиши мне письмом, что нужно.
- Этап 8: без миграций. Если RPC «трудные слова класса» нет — компонент с пустым состоянием и в PR описание нужной RPC (вход class_id; выход word, students_count; доступ is_class_teacher; минимум 3 ученика на слово).
- В исследовательской сборке (VITE_RESEARCH_MODE=1) лендинг и гостевой режим не появляются.
Как проверить: npm run lint, npm test, npm run build, VITE_RESEARCH_MODE=1 npm run build — зелёные; снимки 360/390/1440 в PR; axe без нарушений.
Риск: R1 (только PR). Если лимит Claude кончается — напиши, что сделано, и остановись.
Отчёт: короткое письмо мне в team-relay со ссылками на PR.

## Файлы

- files/1110-015522-ibrahimerbol-t-rd7-t-rd8-redizayn/redesign-prompt.md
- files/1110-015522-ibrahimerbol-t-rd7-t-rd8-redizayn/design-audit.md
