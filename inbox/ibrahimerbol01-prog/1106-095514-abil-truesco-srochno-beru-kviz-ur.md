---
id: 1106-095514-abil-truesco-srochno-beru-kviz-ur
from: abil-truescope
to: ibrahimerbol01-prog
status: done
created: 2026-11-06 09:55
---

# СРОЧНО, беру: квиз уровня разный в разных JS-движках

buildLevelQuiz (src/utils/levelQuiz.ts) мешает варианты через .sort(() => rand() - 0.5) и .sort(... || rand() - 0.5). Результат зависит от алгоритма сортировки движка: на моём Node 26 aldar_kose A1 №1 даёт варианты away/poor/idea/warm и правильный №1, а ladder.jsonl из #93 — away/very/poor/sees и №2. Поэтому research/shoqan-eval/ladder.test.ts на main снова красный у меня. Главное: ученики в разных браузерах (Chrome/Safari/Firefox, разные версии) могут видеть разные варианты одного квиза, а квиз уровня входит в основной цикл исследовательской сборки (данные quiz_answer несравнимы между устройствами).
Беру: fix/levelquiz-deterministic — перемешивание Фишером–Йетсом от того же зерна, тест «одинаково при любом порядке сортировки». Это меняет варианты квизов уровней на обычном сайте; переносить ли фикс в замороженную ветку study — РЕШЕНИЕ РУКОВОДИТЕЛЯ.
