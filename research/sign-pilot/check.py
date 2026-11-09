"""Проверка списка кандидатов для пилота жестов. Запуск из корня репозитория:
    python3 research/sign-pilot/check.py
Проверяет: 30 строк, нет дублей, ни одно слово не из EXCLUDED_UNTIL_DELAYED_TEST
и не из текста карточек легенд, слово есть в A1 с tr == "agreed",
kk/ru дословно совпадают с research/wordbank-translations/a1-agreed.csv."""
import csv, json, re, sys, unicodedata

def fold(t):
    return "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")

rows = list(csv.DictReader(open("research/sign-pilot/candidates.csv", encoding="utf-8")))
cfg = open("src/data/wordbank/config.ts", encoding="utf-8").read()
excl = set(re.findall(r'"([a-z]+)"', cfg[cfg.index("EXCLUDED_UNTIL_DELAYED_TEST"):].split("];")[0]))
legends = open("src/data/legends.ts", encoding="utf-8").read()
legend_words = {w.lower() for w in re.findall(r"[A-Za-z]+", fold(legends[legends.index("export const LEGENDS"):]))}
a1 = {(x["word"], x["pos"]): x for x in json.load(open("src/data/wordbank/A1.json", encoding="utf-8"))}
agreed = {(r["headword"].lower(), r["pos"]): r for r in csv.DictReader(open("research/wordbank-translations/a1-agreed.csv", encoding="utf-8"))}

errors = []
if len(rows) != 30: errors.append(f"строк {len(rows)}, нужно 30")
keys = [(r["word"], r["pos"]) for r in rows]
if len(set(keys)) != len(keys) or len({r["word"] for r in rows}) != len(rows): errors.append("есть дубли")
if len(excl) != 20: errors.append(f"в списке исключений найдено {len(excl)} слов, ожидалось 20")
for r in rows:
    w, p = r["word"], r["pos"]
    if w in excl: errors.append(f"{w}: целевое слово исследования")
    if w in legend_words: errors.append(f"{w}: есть в карточках легенд")
    e = a1.get((w, p))
    if not e: errors.append(f"{w}/{p}: нет в A1"); continue
    if e["tr"] != "agreed": errors.append(f"{w}: перевод не agreed ({e['tr']})")
    g = agreed.get((w, p))
    if not g or (g["kk"], g["ru"]) != (r["kk"], r["ru"]): errors.append(f"{w}: kk/ru не совпадают с a1-agreed.csv")
    if not r["type"] or not r["why"]: errors.append(f"{w}: пустые type/why")
print("\n".join(errors) if errors else f"OK: {len(rows)} слов, исключений {len(excl)}, слов легенд {len(legend_words)}")
sys.exit(1 if errors else 0)
