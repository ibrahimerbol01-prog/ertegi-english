"""Ertegi English, stage 1: word-level simulation for 5 tale-pairs (each pair = folklore text + matched
control text sharing the SAME target words). Data are SIMULATED from ASSUMED parameters, not observed.
between: student reads all 5 pairs in one condition (randomised 1:1 within class).
within : student reads every pair once, 2 or 3 of 5 in folklore version; 20 lists (10 two-sets + complements),
         so each word is folklore for half the students.
Analysis A (primary in sims): student-level ANCOVA / paired difference with pretest covariate.
Analysis B (check): word-level logistic GLM with student + word fixed effects (conditional approx. of GLMM).
Run: python3 -I power_sim5.py
"""
import numpy as np, warnings
from scipy import stats
from itertools import combinations
import statsmodels.api as sm
warnings.filterwarnings("ignore")
rng = np.random.default_rng(20261104)
T = 5
SD_STUDENT, SD_GAIN, SD_WORD = 1.0, 0.5, 1.0     # ASSUMPTIONS (logit scale)
LISTS = [set(c) for c in combinations(range(T), 2)]
LISTS += [set(range(T)) - s for s in LISTS]       # 20 lists, balanced per tale

def gen(n, k, log_or, design, b_pre=-1.8, b_post=-0.7, sd_slope=0.0, sd_tale=0.0):
    W = T * k; tw = np.repeat(np.arange(T), k)
    u = rng.normal(0, SD_STUDENT, (n, 1)); g = rng.normal(0, SD_GAIN, (n, 1))
    w = rng.normal(0, SD_WORD, (1, W)); s = rng.normal(0, sd_slope, (n, 1))
    te = rng.normal(0, sd_tale, T)[tw][None, :]
    if design == "between":
        arm = np.zeros(n, int); arm[rng.permutation(n)[: n // 2]] = 1
        folk = np.repeat(arm[:, None], W, 1)
    else:
        idx = np.resize(rng.permutation(len(LISTS)), n); rng.shuffle(idx)
        folk = np.array([[int(tw[j] in LISTS[i]) for j in range(W)] for i in idx])
    pre = rng.random((n, W)) < 1 / (1 + np.exp(-(b_pre + u + w)))
    post = rng.random((n, W)) < 1 / (1 + np.exp(-(b_post + u + g + w + (log_or + s + te) * folk)))
    return pre, post, folk

def test_agg(pre, post, folk, design):
    n = pre.shape[0]
    if design == "between":
        arm = folk[:, 0]; y, x = post.mean(1), pre.mean(1)
        X = np.column_stack([np.ones(n), arm, x - x.mean()]); j = 1
    else:
        f = folk.astype(bool)
        y = np.array([post[i, f[i]].mean() - post[i, ~f[i]].mean() for i in range(n)])
        x = np.array([pre[i, f[i]].mean() - pre[i, ~f[i]].mean() for i in range(n)])
        X = np.column_stack([np.ones(n), x - x.mean()]); j = 0
    b, *_ = np.linalg.lstsq(X, y, rcond=None); df = n - X.shape[1]
    s2 = ((y - X @ b) ** 2).sum() / df
    t = b[j] / np.sqrt(s2 * np.linalg.inv(X.T @ X)[j, j])
    return 2 * stats.t.sf(abs(t), df)

def test_glm(pre, post, folk):
    """within design only: logit(post) ~ folk + pre + student FE + word FE."""
    n, W = pre.shape
    st = np.repeat(np.arange(n), W); wd = np.tile(np.arange(W), n)
    X = np.column_stack([folk.ravel(), pre.ravel().astype(float),
                         (st[:, None] == np.arange(1, n)).astype(float),
                         (wd[:, None] == np.arange(1, W)).astype(float), np.ones(n * W)])
    try:
        r = sm.GLM(post.ravel().astype(float), X, family=sm.families.Binomial()).fit(method="newton", maxiter=50)
        return r.pvalues[0]
    except Exception:
        return np.nan

def power(n, k, OR, design, sims=1000, **kw):
    return np.mean([test_agg(*gen(n, k, np.log(OR), design, **kw), design) < .05 for _ in range(sims)])


if __name__ == "__main__":
    k = 5
    print(f"T={T} tale-pairs x k={k} target words = {T*k} words; pretest ~20% known, delayed control ~35% (ASSUMED)")
    # implied d for each OR: see implied_d.py (OR 1.3/1.5/1.8 ~ d 0.22/0.34/0.49)
    print("\nPower, analysis A (1000 sims each)")
    print("   N  " + "  ".join(f"btw{o} wth{o}" for o in (1.3, 1.5, 1.8)))
    for n in (30, 40, 50, 60, 80, 100):
        cells = []
        for OR in (1.3, 1.5, 1.8):
            cells += [f"{power(n,k,OR,'between'):.2f}", f"{power(n,k,OR,'within'):.2f}"]
        print(f"{n:>4}  " + "    ".join(cells))
    print("\nType I error (OR=1, N=50):", {d: round(power(50, k, 1.0, d, 2000), 3) for d in ("between", "within")})
    print("\nSensitivity, within, OR=1.5, N=50/60/80 (1000 sims):")
    for lab, kw in [("base", {}), ("k=4 words/pair", {"k": 4}), ("k=6", {"k": 6}),
                    ("pretest 35% known (b_pre=-0.9,b_post=0.2)", {"b_pre": -0.9, "b_post": 0.2}),
                    ("SD student slope 0.3", {"sd_slope": 0.3}), ("SD tale effect 0.3", {"sd_tale": 0.3}),
                    ("SD slope 0.5 + tale 0.5", {"sd_slope": 0.5, "sd_tale": 0.5})]:
        kk = kw.pop("k", k)
        print(f"  {lab:45s}: " + " / ".join(f"{power(n, kk, 1.5, 'within', **kw):.2f}" for n in (50, 60, 80)))
    print("\nCheck: analysis B (word-level logistic, student+word FE), within, 300 sims")
    for n, OR in [(50, 1.0), (50, 1.5), (60, 1.5)]:
        ps = [test_glm(*gen(n, k, np.log(OR), "within")) for _ in range(300)]
        print(f"  N={n}, OR={OR}: rejection rate {np.nanmean(np.array(ps) < .05):.3f}")
