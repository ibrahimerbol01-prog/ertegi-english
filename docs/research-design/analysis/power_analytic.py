"""Ertegi English, stage 1: analytic sample-size calculations.
All inputs except alpha/power/d are ASSUMPTIONS (see study-design.md, section 3).
Run: python3 -I power_analytic.py
"""
import math
from statsmodels.stats.power import TTestIndPower, TTestPower

ALPHA, POWER = 0.05, 0.80
DS = [0.3, 0.4, 0.5]
RS = [0.0, 0.5, 0.7]          # pretest-posttest correlation (0.0 = no covariate)
ICCS = [0.05, 0.10, 0.20]     # class ICC (assumption)
M = 25                        # students per class (assumption)
ind = TTestIndPower()
one = TTestPower()

def n_ind(d, r=0.0):
    """Per-group n, two-sample t, ANCOVA approximation: residual var = (1-r^2)."""
    d_eff = d / math.sqrt(1 - r**2)
    return math.ceil(ind.solve_power(effect_size=d_eff, alpha=ALPHA, power=POWER, ratio=1.0)) + (1 if r > 0 else 0)  # +1 df for covariate

print("A. Individual randomization (between-subjects), per group / total")
print(f"{'d':>4} " + " ".join(f"{'r='+str(r):>14}" for r in RS))
for d in DS:
    print(f"{d:>4} " + " ".join(f"{n_ind(d,r):>6} / {2*n_ind(d,r):>5}" for r in RS))

print("\nB. Same, randomized WITHIN class, class as fixed effect:")
print("   residual var ~ (1-r^2)(1-ICC); clustering does not inflate, it slightly helps")
for icc in ICCS:
    row = []
    for d in DS:
        for r in (0.5, 0.7):
            d_eff = d / math.sqrt((1 - r**2) * (1 - icc))
            n = math.ceil(ind.solve_power(effect_size=d_eff, alpha=ALPHA, power=POWER)) + 1
            row.append(f"d={d},r={r}: {2*n}")
    print(f"   ICC={icc}: " + "; ".join(row))

print(f"\nC. For contrast: classes randomized whole (cluster RCT), m={M}, DE = 1+(m-1)ICC")
for icc in ICCS:
    de = 1 + (M - 1) * icc
    cells = []
    for d in DS:
        n = n_ind(d, 0.7) * de
        cells.append(f"d={d}: {math.ceil(2*n)} students = {math.ceil(2*n/M)} classes")
    print(f"   ICC={icc} DE={de:.2f}: " + "; ".join(cells))

print("\nD. Within-subject (each student both conditions), paired t on condition difference")
print("   d is on the between-student SD scale; d_z = d / sqrt(2(1-rho)); rho = corr of a student's two condition scores")
for rho in (0.5, 0.7):
    cells = []
    for d in DS:
        dz = d / math.sqrt(2 * (1 - rho))
        n = math.ceil(one.solve_power(effect_size=dz, alpha=ALPHA, power=POWER))
        cells.append(f"d={d} (d_z={dz:.2f}): N={n}")
    print(f"   rho={rho}: " + "; ".join(cells))

print("\nE. What 2-4 classes give: enrolled -> analysable (consent x completion, assumption)")
for classes in (2, 3, 4):
    for m in (20, 25):
        for keep in (0.6, 0.7, 0.8):
            pass
rows = []
for classes in (2, 3, 4):
    for m in (20, 25):
        enrolled = classes * m
        rows.append((classes, m, enrolled, [math.floor(enrolled * k) for k in (0.6, 0.7, 0.8)]))
for c, m, e, a in rows:
    print(f"   {c} classes x {m} = {e} enrolled -> analysable at 60/70/80%: {a}")

print("\nF. Power actually achieved with N analysable (between, ANCOVA, total N split 1:1)")
for N in (34, 50, 70, 80):
    cells = []
    for d in DS:
        for r in (0.5, 0.7):
            d_eff = d / math.sqrt(1 - r**2)
            p = ind.power(effect_size=d_eff, nobs1=N / 2, alpha=ALPHA, ratio=1.0)
            cells.append(f"d={d},r={r}:{p:.2f}")
    print(f"   N={N}: " + " ".join(cells))

print("\nG. Power achieved, within-subject, N analysable")
for N in (34, 50, 70):
    cells = []
    for d in DS:
        for rho in (0.5, 0.7):
            dz = d / math.sqrt(2 * (1 - rho))
            cells.append(f"d={d},rho={rho}:{one.power(effect_size=dz, nobs=N, alpha=ALPHA):.2f}")
    print(f"   N={N}: " + " ".join(cells))

print("\nH. Minimal detectable effect (80% power) for N analysable")
for N in (34, 50, 70):
    mde_b = {r: ind.solve_power(nobs1=N/2, alpha=ALPHA, power=POWER) * math.sqrt(1 - r**2) for r in (0.5, 0.7)}
    mde_w = {rho: one.solve_power(nobs=N, alpha=ALPHA, power=POWER) * math.sqrt(2 * (1 - rho)) for rho in (0.5, 0.7)}
    print(f"   N={N}: between r=.5 d={mde_b[0.5]:.2f}, r=.7 d={mde_b[0.7]:.2f} | within rho=.5 d={mde_w[0.5]:.2f}, rho=.7 d={mde_w[0.7]:.2f}")
