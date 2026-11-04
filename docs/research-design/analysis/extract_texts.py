"""Extract A2/B1 texts of the 5 study tales from src/constants.ts and count candidate words (simple surface forms)."""
import re, json, sys
src = open('/home/claude/ertegi-english/src/constants.ts', encoding='utf-8').read()
TALES = ['er_tostik','tazsha_bala','ayaz_bi','asan_kaigy','alpamys']
out = {}
for t in TALES:
    i = src.index(f'id: "{t}"')
    block = src[i:i+40000]
    lv = {}
    for L in ['A1','A2','B1','B2','C1']:
        m = re.search(rf'\n\s+{L}: "((?:[^"\\]|\\.)*)"', block)
        lv[L] = m.group(1).replace('\\"','"')
    out[t] = lv
json.dump(out, open('docs/research-design/analysis/texts_5tales.json','w'), ensure_ascii=False, indent=1)
prof = json.load(open('docs/corpus-profile.json'))
def forms(w):
    irr = {'fall':['fell','fallen'],'beat':['beaten'],'tie':['tied','ties','tying'],'take':['took','taken'],
           'protect':[], 'escape':['escaped','escapes'],'whisper':['whispered']}
    base=[w,w+'s',w+'es',w+'ed',w+'d',w+'ing',w+'ly']
    if w.endswith('y'): base += [w[:-1]+'ies', w[:-1]+'ied']
    if w.endswith('e'): base += [w[:-1]+'ing']
    base += [w+w[-1]+'ed', w+w[-1]+'ing', w+'r', w+'st', w+'er', w+'est']
    return set(base+irr.get(w,[]))
def count(text,w):
    toks = re.findall(r"[A-Za-z]+", text.lower())
    f=forms(w); return sum(1 for x in toks if x in f)
for t in TALES:
    cands = []
    for p in prof['texts']:
        if p['story']==t and p['label'] in ('A2','B1','B2'):
            for c in p['targetCandidates']: cands.append((c['lemma'],c['level']))
    seen=[]
    for c in cands:
        if c[0] not in [s[0] for s in seen]: seen.append(c)
    print(f"\n{t}: words A2={len(re.findall('[A-Za-z]+',out[t]['A2']))} B1={len(re.findall('[A-Za-z]+',out[t]['B1']))}")
    print(f"  {'lemma':10s} CEFR-J  A1 A2 B1 B2")
    for w,lvl in seen:
        print(f"  {w:10s} {lvl:5s} "+' '.join(f'{count(out[t][L],w):2d}' for L in ['A1','A2','B1','B2']))
