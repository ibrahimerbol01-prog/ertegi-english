"""Статус веток для docs/cleanup-list.md. Нужна полная история: git fetch origin "+refs/heads/*:refs/remotes/origin/*" "refs/pull/*/head:refs/pull/*".
Запуск из клона: python3 scripts/branch-status.py → /tmp/branches.json. Ничего не удаляет."""
import subprocess,collections
def g(*a): return subprocess.run(["git",*a],capture_output=True,text=True)
main=g("rev-parse","origin/main").stdout.strip(); mtree=g("rev-parse","origin/main^{tree}").stdout.strip()
prs=collections.defaultdict(list)
for l in g("for-each-ref","--format=%(objectname) %(refname)","refs/pull").stdout.split("\n"):
    if l: sha,ref=l.split(); prs[sha].append("#"+ref.split("/")[2])
rows=[]
for l in g("for-each-ref","--format=%(refname:short)\t%(committerdate:short)\t%(authorname)\t%(objectname)","refs/remotes/origin").stdout.strip().split("\n"):
    b,d,a,sha=l.split("\t"); b=b.replace("origin/","",1)
    if b in("main","HEAD","team-relay","origin"): continue
    ahead=int(g("rev-list","--count",f"origin/main..{sha}").stdout or 0)
    behind=int(g("rev-list","--count",f"{sha}..origin/main").stdout or 0)
    r=g("merge-tree","--write-tree",main,sha)
    tree=r.stdout.split("\n")[0].strip()
    if b=="study": st="study"
    elif ahead==0 or (r.returncode==0 and tree==mtree): st="A"
    elif r.returncode!=0: st="conflict"
    else: st="new"
    rows.append((st,d,b,ahead,behind,",".join(sorted(prs.get(sha,[]))) or "без PR",a))
c=collections.Counter(r[0] for r in rows); print(c, len(rows))
import json; json.dump(rows,open("/tmp/branches.json","w"),ensure_ascii=False)
