"""Expanded draft pool of target words for B1 (and A2) texts of the 5 study tales.
Rule (draft, for supervisor approval): content word, CEFR-J level A2..B2 or off-list, >=2 tokens in the text.
Lemmatisation is crude (suffix rules) - counts must be re-checked by `npm run corpus`.
Run: python3 -I target_pool.py
"""
import csv, json, re, collections
T = json.load(open('docs/research-design/analysis/texts_5tales.json'))
prof = json.load(open('docs/corpus-profile.json'))
names = set(prof['names'])
lv = {}
order = {'A1':1,'A2':2,'B1':3,'B2':4,'C1':5,'C2':6}
for f in ['cefrj-vocabulary-profile-1.5.csv','octanove-vocabulary-profile-c1c2-1.0.csv']:
    for r in csv.DictReader(open('/home/claude/ertegi-english/research/cefr/'+f, encoding='utf-8')):
        if r['pos'] in ('determiner','preposition','pronoun','conjunction','auxiliary verb','modal verb','number','be-verb','do-verb','have-verb','infinitive-to','interjection'): continue
        for h in r['headword'].lower().split('/'):
            h=h.strip()
            if h and (h not in lv or order[r['CEFR']]<order[lv[h]]): lv[h]=r['CEFR']
IRR={'fell':'fall','took':'take','went':'go','saw':'see','came':'come','said':'say','thought':'think','knew':'know','gave':'give','made':'make','found':'find','told':'tell','left':'leave','ran':'run','held':'hold','threw':'throw','began':'begin','stood':'stand','felt':'feel','brought':'bring','caught':'catch','fought':'fight','won':'win','rode':'ride','hid':'hide','beat':'beat','men':'man','children':'child','sons':'son','feet':'foot','wolves':'wolf'}
def lem(w):
    if w in IRR: return IRR[w]
    for suf,rep in [('ies','y'),('ied','y'),('ing',''),('ing','e'),('ed',''),('ed','e'),('es',''),('s',''),('er',''),('est',''),('ly','')]:
        if w.endswith(suf) and len(w)>len(suf)+2:
            b=w[:-len(suf)]+rep
            if b in lv: return b
            if len(b)>2 and b[-1]==b[-2] and b[:-1] in lv: return b[:-1]
    return w
STOP=set('the a an and or but if of to in on at by for with from is was were be been are am he she it they we you i his her its their our my me him them us this that these there then so not no very one two three all some what who when where how said say go come get see look know want tell ask'.split())
for L in ('A2','B1'):
    print(f'\n=== {L} texts: draft pool (lemma count CEFR) ===')
    for t,lvls in T.items():
        txt=lvls[L]
        toks=[w.lower() for w in re.findall(r"[A-Za-z]+", txt)]
        c=collections.Counter(lem(w) for w in toks if w not in names)
        pool=[(w,n,lv.get(w,'off')) for w,n in c.items() if n>=2 and w not in STOP and w not in names and lv.get(w,'off') in ('A2','B1','B2','off')]
        pool.sort(key=lambda x:(-order.get(x[2],7) if x[2]!='off' else -3.5, -x[1]))
        print(f'{t:12s}', ', '.join(f'{w} {n} {l}' for w,n,l in pool))
