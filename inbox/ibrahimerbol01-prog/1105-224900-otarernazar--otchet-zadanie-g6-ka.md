---
id: 1105-224900-otarernazar--otchet-zadanie-g6-ka
from: otarernazar-eng
to: ibrahimerbol01-prog
status: done
created: 2026-11-05 22:49
---

# Otchet: Zadanie G6 - kandidaty novykh skazok

Итог: сделано — подготовлен реестр из 8 аутентичных казахских народных сказок для расширения корпуса (G6)

Изменено:
 docs/research-design/new-tales-candidates.md | 131 +++++++++++++++++++++++++++
 1 file changed, 131 insertions(+)

Содержание документа `docs/research-design/new-tales-candidates.md`:
1. Зафиксированы 7 текущих сказок приложения (35 текстов A1–C1): aldar_kose, zhirenshe, er_tostik, tazsha_bala, ayaz_bi, asan_kaigy, alpamys.
2. Отобраны 8 НАСТОЯЩИХ казахских народных сказок (названия на каз./рус./англ., жанр, краткий сюжет своими словами, первоисточники с точными выходными данными академических изданий 1957–1988 гг. и «Бабалар сөзі», открытые ссылки на adebiportal/bilim-all, статус Public Domain, педагогическая пригодность для подростков 12–16 лет, перечень целевых слов):
   - «Керқұла атты Кендебай» (Kendebay on the Steed Kerkula)
   - «Алтын сақа» (The Golden Asyk)
   - «Мақта қыз бен мысық» (Little Girl Makta and the Cat)
   - «Қырық өтірік» (Forty Tall Tales)
   - «Ұр, тоқпақ!» (Strike, Club!)
   - «Күн астындағы Күнекей қыз» (Kunekei, the Sun Maiden)
   - «Жезтырнақ пен мерген» (The Copper-Claw Witch and the Hunter)
   - «Үш ағайынды мен алып» (Three Brothers and the Giant)

Топ-3 сказки для первой адаптации:
1. **«Мақта қыз бен мысық» (A1 – A2):** кумулятивная цепочка фраз с естественным повторением («give me milk so I can give...») закрывает дефицит доступных текстов на начальных уровнях A1–A2.
2. **«Керқұла атты Кендебай» (B1 – B2):** вершина казахской волшебной сказки, динамичный сюжет спасения животных и сироты, богатейшая лексика степного эпоса, высокая мотивация для 7–9 классов.
3. **«Алтын сақа» (A2 – B1):** захватывающий саспенс, культурные архетипы (асык, бәйтерек, верные псы), идеальна для поддержания интереса и вовлеченности (H3b).

Проверки:
- lint ✓ (0 warnings, 0 errors)
- typecheck ✓
- test: 24 passed, 1 failed — в `main` (коммит 35e673e, PR #77) упал `src/research/contour.screens.test.ts:200` из-за того, что `cfg.match(/find: \/(.+?)\/, replacement: '(.+?)'/)` стал матчить добавленный `WordbankScreen` вместо `testEntry`. В ветке `docs/new-tales-candidates` трогался исключительно markdown-файл.

Ветка: https://github.com/ibrahimerbol01-prog/ertegi-english/compare/main...docs/new-tales-candidates?expand=1
