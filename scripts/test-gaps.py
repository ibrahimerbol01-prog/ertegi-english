"""Карта покрытия тестами по импортам (без npm и без запуска тестов).

Запуск из корня репозитория:  python3 scripts/test-gaps.py
Для каждого модуля src/ и api/ (.ts/.tsx, кроме тестов и .d.ts) считает:
  прямо     — модуль импортирует хотя бы один тестовый файл;
  косвенно  — модуль подгружается из теста только через другие модули
              (не замоканные vi.mock); загружен ≠ проверен;
  нет       — ни один тест его не подгружает.
Это статическая оценка по импортам, не построчное покрытие (для него нужен vitest --coverage).
"""
import os
import re

TEST = re.compile(r"\.test\.(ts|tsx|mjs|js)$")
IMPORT = re.compile(r"""(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']""")
MOCK = re.compile(r"""vi\.mock\(\s*["']([^"']+)["']""")


def walk(dirs, pred):
    for d in dirs:
        for dp, _, fs in os.walk(d):
            if "node_modules" in dp:
                continue
            for f in fs:
                p = os.path.normpath(os.path.join(dp, f))
                if pred(p):
                    yield p


def resolve(base, spec):
    if not spec.startswith("."):
        return None
    p = os.path.normpath(os.path.join(os.path.dirname(base), spec))
    for c in (p, p + ".ts", p + ".tsx", os.path.join(p, "index.ts"), os.path.join(p, "index.tsx")):
        if os.path.isfile(c):
            return c
    return None


def deps(path):
    text = open(path, encoding="utf-8").read()
    return {r for r in (resolve(path, s) for s in IMPORT.findall(text)) if r}, \
           {r for r in (resolve(path, s) for s in MOCK.findall(text)) if r}


src = sorted(walk(["src", "api"], lambda p: p.endswith((".ts", ".tsx")) and not TEST.search(p) and not p.endswith(".d.ts")))
tests = sorted(walk(["src", "api", "test", "research"], lambda p: bool(TEST.search(p))))
loc = {p: sum(1 for _ in open(p, encoding="utf-8")) for p in src}
graph = {p: deps(p)[0] for p in src}

direct, reach = set(), set()
for t in tests:
    imports, mocked = deps(t)
    direct |= imports & loc.keys()
    stack = [m for m in imports if m not in mocked]
    while stack:
        f = stack.pop()
        if f in reach or f in mocked:
            continue
        reach.add(f)
        stack += [g for g in graph.get(f, ()) if g not in mocked]

indirect = sorted((p for p in src if p in reach and p not in direct), key=lambda p: -loc[p])
none = sorted((p for p in src if p not in reach), key=lambda p: -loc[p])
total = sum(loc.values())
share = lambda ps: f"{len(ps)} модулей, {sum(loc[p] for p in ps)} строк ({100 * sum(loc[p] for p in ps) / total:.1f} %)"

print(f"Модулей: {len(src)} ({total} строк); тестовых файлов: {len(tests)}")
print(f"прямо:    {share(direct)}")
print(f"косвенно: {share(indirect)}")
print(f"нет:      {share(none)}")
for title, ps in (("Только косвенно", indirect), ("Ни одного теста", none)):
    print(f"\n{title}:")
    for p in ps:
        print(f"{loc[p]:6d}  {p}")
