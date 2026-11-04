"""Sensitivity of the within-subject simulation to effect heterogeneity (ASSUMPTIONS):
SD_SLOPE: folklore effect varies between students (logit SD);
SD_TALE: folklore effect varies between tales (e.g. Alpamys more familiar than Asan Kaigy).
Run: python3 -I power_sim_sensitivity.py
"""
import numpy as np
from scipy import stats
import power_sim as ps

rng = np.random.default_rng(7)

def sim_within(n, k, log_or, sd_slope, sd_tale):
    T = ps.TALES; W = T * k
    tale_of_word = np.repeat(np.arange(T), k)
    u = rng.normal(0, ps.SD_STUDENT, n)[:, None]; g = rng.normal(0, ps.SD_GAIN, n)[:, None]
    w = rng.normal(0, ps.SD_WORD, W)[None, :]
    s = rng.normal(0, sd_slope, n)[:, None]
    te = rng.normal(0, sd_tale, T)[tale_of_word][None, :]
    lists = np.array([ps.COMBOS[i % 6] for i in rng.permutation(n)])
    folk = np.zeros((n, W), int)
    for t in range(T):
        folk[:, tale_of_word == t] = (lists == t).any(axis=1)[:, None]
    pre = rng.random((n, W)) < 1 / (1 + np.exp(-(ps.B_PRE + u + w)))
    post = rng.random((n, W)) < 1 / (1 + np.exp(-(ps.B_POST + u + g + w + (log_or + s + te) * folk)))
    f = folk.astype(bool)
    dy = np.array([post[i, f[i]].mean() - post[i, ~f[i]].mean() for i in range(n)])
    dx = np.array([pre[i, f[i]].mean() - pre[i, ~f[i]].mean() for i in range(n)])
    X = np.column_stack([np.ones(n), dx - dx.mean()])
    beta, *_ = np.linalg.lstsq(X, dy, rcond=None)
    s2 = ((dy - X @ beta) ** 2).sum() / (n - 2)
    t = beta[0] / np.sqrt(s2 * np.linalg.inv(X.T @ X)[0, 0])
    return 2 * stats.t.sf(abs(t), n - 2)

print("within design, k=5 words/tale, 4 tales, OR=1.5 (d~0.33): power by heterogeneity")
for sd_slope, sd_tale in [(0, 0), (0.3, 0), (0, 0.3), (0.3, 0.3), (0.5, 0.5)]:
    row = [np.mean([sim_within(n, 5, np.log(1.5), sd_slope, sd_tale) < .05 for _ in range(1000)]) for n in (40, 50, 60, 80)]
    print(f"  SD_student_slope={sd_slope}, SD_tale_effect={sd_tale}: N=40/50/60/80 -> " + " / ".join(f"{p:.2f}" for p in row))
print("type I error with tale heterogeneity, mean effect 0 (SD_tale=0.5), N=50:",
      np.mean([sim_within(50, 5, 0.0, 0, 0.5) < .05 for _ in range(2000)]))
