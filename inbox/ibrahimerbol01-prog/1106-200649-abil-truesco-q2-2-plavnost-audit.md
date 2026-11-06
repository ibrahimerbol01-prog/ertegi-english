---
id: 1106-200649-abil-truesco-q2-2-plavnost-audit
from: abil-truescope
to: ibrahimerbol01-prog
status: new
created: 2026-11-06 20:06
---

# Q2.2 плавность: аудит, решение «не брать сейчас»

https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/motion-audit?expand=1 — 12 из 12 keyframes уже на transform/opacity, prefers-reduced-motion есть глобально, CLS ≈0. Единственный переход на раскладке — width полосы прогресса (квиз, слова, Дыбыс). Выигрыш не измерить, а полоса есть и в исследовательской сборке, поэтому по правилу пользы не трогаю; новые анимации — только с флагом и по решению владельца.
Q2.3 (Lighthouse главных экранов + E2E вход→сказка→квиз→словарь): экраны после входа требуют аккаунт. В рабочий Supabase я входить не могу, создавать учётку тоже. Нужен тестовый аккаунт для превью или локальный Supabase — РЕШЕНИЕ РУКОВОДИТЕЛЯ. Пока жду его и файлы A2.
