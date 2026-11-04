"""Ertegi English, stage 1: simulation of power at the word (item) level.
Compares (1) between-subjects: student reads all 4 study tales in one condition,
and (2) within-subject: student reads 2 tales as folklore and 2 as control texts,
counterbalanced (6 assignments of which 2 of 4 tales are folklore).
Data are SIMULATED from assumed parameters, not observed. All parameters below are ASSUMPTIONS.
Run: python3 -I power_sim.py
"""
import numpy as np
from scipy import stats
from itertools import combinations

rng = np.random.default_rng(20261104)
SIMS = 1000
TALES = 4

# ---- assumptions (logit scale) ----
SD_STUDENT = 1.0      # between-student ability
SD_GAIN = 0.5         # between-student variation in learning from reading
SD_WORD = 1.0         # word difficulty
B_PRE = -1.8          # pretest: ~20% of target words known (mean over students/words)
B_POST = -0.7         # delayed test, control condition: ~35% known
COMBOS = list(combinations(range(TALES), 2))   # 6 counterbalancing lists


def simulate(n, k, log_or, design):
    """Return p-value for one simulated study. k = words per tale."""
    W = TALES * k
    tale_of_word = np.repeat(np.arange(TALES), k)
    u = rng.normal(0, SD_STUDENT, n)[:, None]
    g = rng.normal(0, SD_GAIN, n)[:, None]
    w = rng.normal(0, SD_WORD, W)[None, :]
    if design == "between":
        arm = np.zeros(n, int); arm[rng.permutation(n)[: n // 2]] = 1
        folk = np.repeat(arm[:, None], W, axis=1)
    else:
        lists = np.array([COMBOS[i % 6] for i in rng.permutation(n)])   # balanced lists
        folk = np.zeros((n, W), int)
        for t in range(TALES):
            folk[:, tale_of_word == t] = (lists == t).any(axis=1)[:, None]
    pre = rng.random((n, W)) < 1 / (1 + np.exp(-(B_PRE + u + w)))
    post = rng.random((n, W)) < 1 / (1 + np.exp(-(B_POST + u + g + w + log_or * folk)))
    if design == "between":
        y, x = post.mean(1), pre.mean(1)
        X = np.column_stack([np.ones(n), arm, x - x.mean()])
        beta, res, *_ = np.linalg.lstsq(X, y, rcond=None)
        df = n - 3
        s2 = ((y - X @ beta) ** 2).sum() / df
        se = np.sqrt(s2 * np.linalg.inv(X.T @ X)[1, 1])
        t = beta[1] / se
    else:
        f = folk.astype(bool)
        dy = np.array([post[i, f[i]].mean() - post[i, ~f[i]].mean() for i in range(n)])
        dx = np.array([pre[i, f[i]].mean() - pre[i, ~f[i]].mean() for i in range(n)])
        X = np.column_stack([np.ones(n), dx - dx.mean()])
        beta, *_ = np.linalg.lstsq(X, dy, rcond=None)
        df = n - 2
        s2 = ((dy - X @ beta) ** 2).sum() / df
        se = np.sqrt(s2 * np.linalg.inv(X.T @ X)[0, 0])
        t = beta[0] / se
    return 2 * stats.t.sf(abs(t), df)


def implied_d(k, log_or, n=200000):
    """Standardized difference on the student-level proportion score (between design) + pre-post r."""
    W = TALES * k
    u = rng.normal(0, SD_STUDENT, (n, 1)); g = rng.normal(0, SD_GAIN, (n, 1))
    w = rng.normal(0, SD_WORD, (1, W))
    pre = (rng.random((n, W)) < 1 / (1 + np.exp(-(B_PRE + u + w)))).mean(1)
    p0 = (rng.random((n, W)) < 1 / (1 + np.exp(-(B_POST + u + g + w)))).mean(1)
    p1 = (rng.random((n, W)) < 1 / (1 + np.exp(-(B_POST + u + g + w + log_or)))).mean(1)
    return (p1.mean() - p0.mean()) / p0.std(), pre.mean(), p0.mean(), p1.mean(), np.corrcoef(pre, p0)[0, 1]


if __name__ == "__main__":
    ORS = [1.3, 1.5, 1.8]
    for k in (5, 6):
        print(f"\n=== {k} target words per tale, 4 tales ({TALES*k} words; within-design: {2*k} per condition) ===")
        for OR in ORS:
            d, pre, p0, p1, r = implied_d(k, np.log(OR))
            print(f"OR={OR}: implied d={d:.2f}; pretest {pre:.0%}, delayed control {p0:.0%} vs folklore {p1:.0%}; pre-post r={r:.2f}")
        print(f"{'N':>4} " + " ".join(f"{'between OR'+str(o):>15}{'within OR'+str(o):>14}" for o in ORS))
        for n in (30, 40, 50, 60, 80, 100):
            cells = []
            for OR in ORS:
                for des in ("between", "within"):
                    p = np.mean([simulate(n, k, np.log(OR), des) < 0.05 for _ in range(SIMS)])
                    cells.append(f"{p:>14.2f}")
            print(f"{n:>4} " + " ".join(cells))
    # type I error check
    print("\nType I error (OR=1, k=5, N=50):",
          {des: float(np.mean([simulate(50, 5, 0.0, des) < 0.05 for _ in range(SIMS)])) for des in ("between", "within")})
