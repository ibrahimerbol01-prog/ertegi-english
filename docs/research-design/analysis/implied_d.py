"""Implied standardized effect d for an assumed odds ratio (same students, same words, both conditions).
Averaged over 20 draws of the 25-word set. ASSUMED parameters from power_sim5.py.
Run: python3 -I implied_d.py
"""
import sys; sys.path.insert(0, "docs/research-design/analysis")
import numpy as np, power_sim5 as ps
rng = np.random.default_rng(1)
k, n = 5, 20000; W = ps.T * k
for b_pre, b_post, lab in [(-1.8, -0.7, "base"), (-0.9, 0.2, "pretest ~35%")]:
    for OR in (1.3, 1.5, 1.8):
        ds, r, m0, m1, mp = [], [], [], [], []
        for _ in range(20):
            u = rng.normal(0, ps.SD_STUDENT, (n, 1)); g = rng.normal(0, ps.SD_GAIN, (n, 1)); w = rng.normal(0, ps.SD_WORD, (1, W))
            pre = (rng.random((n, W)) < 1/(1+np.exp(-(b_pre+u+w)))).mean(1)
            lp = b_post + u + g + w
            p0 = (rng.random((n, W)) < 1/(1+np.exp(-lp))).mean(1)
            p1 = (rng.random((n, W)) < 1/(1+np.exp(-(lp+np.log(OR))))).mean(1)
            ds.append((p1.mean()-p0.mean())/p0.std()); r.append(np.corrcoef(pre, p0)[0, 1])
            m0.append(p0.mean()); m1.append(p1.mean()); mp.append(pre.mean())
        print(f"{lab:13s} OR={OR}: pretest {np.mean(mp):.0%}, delayed control {np.mean(m0):.0%} vs folklore {np.mean(m1):.0%}, "
              f"d={np.mean(ds):.2f} (range {min(ds):.2f}-{max(ds):.2f}), pre-post r={np.mean(r):.2f}")
