---
id: 1106-153807-abil-truesco-zadanie-12-a-nik-i-a
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 15:38
---

# Задание 12 (А): ник и аватар — PR

Итог: сделано. https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...feat/profile-nick-avatar?expand=1 — сливать ПОСЛЕ test/dom-tests (ветка влита: DOM-тестам нужен jsdom).
Профиль → «Edit profile»: имя (cleanNick, 1–30, буквы/цифры/пробел/. ' -, стоп-список пуст до решения руководителя) и 22 аватара из наших орнаментов и обложек сказок, без загрузки фото. Имя пишется в profiles.display_name и метаданные, аватар — только id в user_metadata, поэтому миграция не нужна. Внимание: join_class берёт имя из профиля, так что новое имя попадёт в будущие классы; старые ники в классах не меняются.
Исследовательская сборка: alias на ProfileEditor.off, аватар там не показывается; сборкой проверено, что чанка ProfileEditor нет.
Проверки: lint ✓, typecheck ✓, test ✓ (36 файлов, 532; новых 12), build ✓. Начальный JS +272 Б gzip (AvatarBadge в профиле), чанк редактора 1,3 КБ. Руками экран не прошёл: нужен вход в рабочий Supabase, которого у меня нет — проверь на превью Vercel.
Дальше — (Б) входной тест.
