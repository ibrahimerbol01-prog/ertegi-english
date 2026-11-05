"""Draft item bank of the stage-0 vocabulary test (study-design.md, 5.2-5.4). DRAFT for approval.
Writes docs/research-design/test-items-draft.json (format of src/research/test/types.ts) and
docs/research-design/test-items-review.md (checklist for the supervisor and the Kazakh teacher).
Run from the repo root:  python3 -I docs/research-design/analysis/build_test_items.py
Content is authored here (translations come from the app glossary src/utils/gloss.ts); nothing is a measured result.
The draft is written with "sample": true on purpose: the real test must not start from an unapproved file.
"""
import json, random, collections

# word: (tale, POS, correct Kazakh answer = the app's gloss, distractors form A, distractors form B)
W = {
 "brave":   ("er_tostik","adj","батыл",["жалқау","сабырлы","сараң"],["жомарт","ұялшақ","ашкөз"]),
 "hero":    ("er_tostik","noun","батыр",["саудагер","шаруа","құл"],["жылқышы","ұры","әнші"]),
 "nest":    ("er_tostik","noun","ұя",["тау","өзен","көше"],["тас","ағаш","бақ"]),
 "witch":   ("er_tostik","noun","мыстан",["әнші","жылқышы","құл"],["ұры","саудагер","шаруа"]),
 "giant":   ("tazsha_bala","noun","алып",["ергежейлі","ұры","тау"],["бала","шаруа","әнші"]),
 "squeeze": ("tazsha_bala","verb","сығу",["жүгіру","жазу","күлу"],["секіру","ұйықтау","ойнау"]),
 "beat":    ("tazsha_bala","verb","жеңу",["қашу","іздеу","күту"],["жасыру","сату","айту"]),
 "village": ("tazsha_bala","noun","ауыл",["қала","тау","өзен"],["көше","бақ","дала"]),
 "humble":  ("ayaz_bi","adj","қарапайым",["тәкаппар","күшті","сараң"],["қу","жомарт","ашушаң"]),
 "adviser": ("ayaz_bi","noun","кеңесші",["сарбаз","әнші","құл"],["ұры","саудагер","жылқышы"]),
 "jealous": ("ayaz_bi","adj","қызғаншақ",["жомарт","қорқақ","жалқау"],["сабырлы","ұялшақ","күшті"]),
 "courtier":("ayaz_bi","noun","сарай адамы",["шаруа","жылқышы","саудагер"],["әнші","құл","ұры"]),
 "camel":   ("asan_kaigy","noun","түйе",["жылқы","қой","сиыр"],["есек","ешкі","ит"]),
 "journey": ("asan_kaigy","noun","сапар",["мереке","ойын","дауыс"],["жұмыс","ән","ұйқы"]),
 "wise":    ("asan_kaigy","adj","дана",["қу","ашушаң","күшті"],["ақымақ","жалқау","тәкаппар"]),
 "land":    ("asan_kaigy","noun","жер",["аспан","ауа","су"],["от","жел","күн"]),
 "pit":     ("alpamys","noun","ор",["тау","қабырға","төбе"],["бұлақ","көпір","қақпа"]),
 "loyal":   ("alpamys","adj","адал",["қу","ашкөз","сараң"],["ашушаң","қорқақ","ақымақ"]),
 "protect": ("alpamys","verb","қорғау",["тастау","жою","ұрлау"],["жасау","табу","шақыру"]),
 "prison":  ("alpamys","noun","түрме",["мектеп","базар","мешіт"],["сарай","дүкен","аурухана"]),
}
# word: (sentence A, options A, sentence B, options B); the gap is ___ ; options are English, the target is one of them.
U = {
 "brave":   ("The firefighter was very ___ and ran into the burning house.",["wise","brave","jealous","humble"],
             "Only a ___ child would walk alone into a dark cave at night.",["loyal","humble","brave","jealous"]),
 "humble":  ("Although she won the prize, she stayed ___ and thanked everyone.",["humble","jealous","brave","loyal"],
             "Even after becoming famous, the singer stayed ___ and did not think she was better than others.",["jealous","brave","humble","wise"]),
 "jealous": ("She felt ___ when her friend got a new bicycle and she did not.",["jealous","brave","loyal","wise"],
             "The brothers were ___ of their sister because everyone praised her.",["humble","wise","jealous","brave"]),
 "wise":    ("The old teacher gave ___ advice, and everyone listened to her.",["jealous","wise","brave","humble"],
             "A ___ person thinks carefully before making a big decision.",["loyal","jealous","wise","brave"]),
 "loyal":   ("The dog stayed ___ to its owner for fifteen years.",["brave","loyal","humble","jealous"],
             "A ___ friend never leaves you when you are in trouble.",["jealous","humble","wise","loyal"]),
 "hero":    ("The boy saved three children from the river, and the town called him a ___.",["hero","camel","village","nest"],
             "In the story, the ___ fights the dragon and saves the people.",["camel","nest","hero","village"]),
 "nest":    ("The bird built a ___ in the tall tree and laid three eggs.",["camel","nest","prison","journey"],
             "We saw a small ___ with two baby birds on the branch.",["village","nest","adviser","giant"]),
 "witch":   ("In the old story, an evil ___ lived in the forest and cooked magic soup.",["courtier","witch","camel","pit"],
             "The children were afraid of the ___ who could turn people into frogs.",["adviser","village","witch","prison"]),
 "giant":   ("The ___ was so tall that he could touch the clouds.",["giant","nest","village","camel"],
             "The ground shook when the huge ___ walked past the houses.",["nest","giant","prison","adviser"]),
 "village": ("My grandmother lives in a small ___ with only fifty houses.",["prison","village","camel","journey"],
             "All the people in the ___ came to the wedding feast.",["nest","giant","village","pit"]),
 "adviser": ("The king asked his ___ for advice about the war.",["camel","adviser","nest","hero"],
             "The president listens to her ___ before she makes big decisions.",["giant","village","adviser","nest"]),
 "courtier":("Every ___ at the palace bowed when the queen entered the hall.",["pit","courtier","nest","camel"],
             "The king's ___ whispered about the strange visitor at the royal dinner.",["camel","journey","courtier","prison"]),
 "camel":   ("The desert traveller drank water and then rode his ___ across the sand.",["camel","nest","witch","prison"],
             "A ___ can walk for days in the desert without drinking.",["hero","witch","camel","giant"]),
 "journey": ("The ___ from Almaty to Aktau takes more than a day by train.",["witch","journey","nest","pit"],
             "After a long ___ across the mountains, the travellers were very tired.",["giant","journey","village","nest"]),
 "land":    ("The farmers planted wheat on the rich, flat ___ near the river.",["land","prison","camel","hero"],
             "Birds flew over the sea for days before they finally saw dry ___.",["land","witch","adviser","pit"]),
 "pit":     ("The explorer fell into a deep dark ___ and could not climb out.",["pit","nest","village","courtier"],
             "A deep ___ in the road stopped the car.",["hero","pit","journey","adviser"]),
 "prison":  ("The thief was sent to ___ for stealing.",["nest","camel","prison","village"],
             "The guards locked the door of the ___ and went home.",["pit","prison","nest","giant"]),
 "squeeze": ("Please ___ the lemon so that we can make some juice.",["protect","squeeze","escape","beat"],
             "He had to ___ through the narrow gap between the two rocks.",["protect","beat","tie","squeeze"]),
 "beat":    ("Our school team hopes to ___ the other team in the final match.",["squeeze","protect","beat","escape"],
             "She can ___ everyone at chess, even her teacher.",["tie","protect","squeeze","beat"]),
 "protect": ("Wearing a helmet can ___ your head if you fall off the bike.",["protect","squeeze","beat","escape"],
             "The dog will ___ the house from thieves.",["beat","tie","squeeze","protect"]),
}
PSEUDO = {"A":["drunsel","plimmet","skorvin","blenthy","tavrick","glondish","fremple","quorbit","snelter","wuddick"],
          "B":["brantle","crimsel","dolvent","flempit","gorlish","hanvick","mintrul","prellow","sondrick","trumble"]}
TP = ["pre","post","delayed"]

def meaning_options(word, form):
    tale,pos,ans,dA,dB = W[word]
    return [ans] + (dA if form=="A" else dB)

def arrange(opts, answer, pos):
    """Put the answer at index pos, the others in a fixed order."""
    rest = [o for o in opts if o != answer]
    return rest[:pos] + [answer] + rest[pos:]

items = []
for form, seed in (("A", 11), ("B", 29)):
    rnd = random.Random(seed)
    words = list(W)
    # 1 recognition: 20 real words + 10 pseudowords, mixed
    rec = [(w, False) for w in words] + [(p, True) for p in PSEUDO[form]]
    rnd.shuffle(rec)
    for n, (w, ps) in enumerate(rec, 1):
        it = {"id": f"{form}-rec-{n:02d}", "word": w, "format": "recognition", "prompt": None, "options": ["yes","no"],
              "answer": "no" if ps else "yes", "form": form, "timepoints": TP}
        if ps: it["pseudo"] = True
        else: it["story_id"] = W[w][0]
        items.append(it)
    # 2 meaning (main measure): correct option position balanced 0..3
    order = words[:]; rnd.shuffle(order)
    for n, w in enumerate(order, 1):
        tale,pos,ans,_,_ = W[w]
        items.append({"id": f"{form}-mean-{n:02d}", "word": w, "format": "meaning", "prompt": None,
                      "options": arrange(meaning_options(w, form), ans, n % 4), "answer": ans, "dont_know": True,
                      "form": form, "timepoints": TP, "story_id": tale})
    # 3 use
    order = words[:]; rnd.shuffle(order)
    for n, w in enumerate(order, 1):
        s = U[w][0:2] if form=="A" else U[w][2:4]
        items.append({"id": f"{form}-use-{n:02d}", "word": w, "format": "use", "prompt": s[0],
                      "options": arrange(s[1], w, n % 4), "answer": w, "form": form, "timepoints": TP, "story_id": W[w][0]})

out = {"version": "stage0-draft-1", "sample": True,
       "note": "ЧЕРНОВИК, не утверждён руководителем и учителем казахского. sample=true оставлен намеренно: утверждённый набор получает sample=false и версию без слова draft. Нет вопросов на понимание: они ждут контрольных текстов (R7).",
       "items": items}
json.dump(out, open("docs/research-design/test-items-draft.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)

# ---- self-checks (the rules a human reviewer would otherwise have to do by eye) ----
errs = []
for it in items:
    if it["answer"] not in it["options"]: errs.append((it["id"], "answer not in options"))
    if len(set(it["options"])) != len(it["options"]): errs.append((it["id"], "duplicate options"))
for form in "AB":
    ms = [i for i in items if i["form"]==form and i["format"]=="meaning"]
    pos = collections.Counter(i["options"].index(i["answer"]) for i in ms)
    us = [i for i in items if i["form"]==form and i["format"]=="use"]
    upos = collections.Counter(i["options"].index(i["answer"]) for i in us)
    print(form, "meaning answer positions", dict(sorted(pos.items())), "| use", dict(sorted(upos.items())),
          "| items", sum(1 for i in items if i["form"]==form))
for w,(t,p,a,dA,dB) in W.items():
    if a in dA or a in dB: errs.append((w, "answer among its own distractors"))
    if set(dA) & set(dB): errs.append((w, "A and B distractors overlap"))
for w,u in U.items():
    for o,s in ((u[1],u[0]),(u[3],u[2])):
        if w not in o: errs.append((w,"target not among use options"))
        if w in s.lower().split(): errs.append((w,"target word inside its own sentence"))
        if "___" not in s: errs.append((w,"no gap"))
    if w not in W: errs.append((w,"no W entry"))
# use options must be the same POS group (rough): adjectives with adjectives etc. (reserve verbs escape/tie count as verbs)
pos_of = {w:v[1] for w,v in W.items()}; pos_of.update({"escape":"verb","tie":"verb"})
for w,u in U.items():
    for o in (u[1],u[3]):
        if {pos_of[x] for x in o} != {pos_of[w]}: errs.append((w,"mixed POS in use options "+",".join(o)))
print("ERRORS:", errs if errs else "none")

# ---- review checklist (markdown) ----
L = ["# Банк пунктов теста: черновик на проверку", "",
     "Статус: ЧЕРНОВИК от 05.11.2026. Утверждает руководитель; казахские варианты проверяет учитель казахского. Файл `test-items-draft.json` (`sample: true` до утверждения). Генератор: `analysis/build_test_items.py`.", "",
     "## Что проверить", "",
     "1. **Слова.** 20 слов, по 4 на сказку, повторы в текстах B1 уже есть (правки сказок не нужны). Слова уровня A2 (brave, hero, village, wise, land, journey), вероятно, часть учеников знает: если на претесте этапа 0 их знают более 70 %, заменяем из резерва (wing, bald/finger, chest, boot, shepherd, escape, rope, tie).",
     "2. **Казахский правильный ответ** взят из глоссария приложения (то, что ученик видит по нажатию). Проверить: подходит ли он как единственный верный; для hero («батыр») и brave («батыл») ответы близки по написанию, поэтому они не стоят в одном пункте как варианты.",
     "3. **Дистракторы** подобраны по той же части речи; нужно подтвердить, что **ни один не является верным переводом** слова.",
     "4. **Предложения «употребление»**: подходит ровно один вариант. В прилагательных (brave, humble, wise, loyal) разницу по смыслу ловит только носитель, проверить особенно.",
     "5. **Псевдослова** (20 штук): проверить, что это не слова английского, казахского и русского.",
     "6. **Понимание**: вопросов нет; они пишутся вместе с контрольными текстами (R7).", "",
     "## Слова, переводы, дистракторы", "",
     "| Слово | Сказка | Верно (kk) | Дистракторы A | Дистракторы B |", "|---|---|---|---|---|"]
for w,(t,p,a,dA,dB) in W.items():
    L.append(f"| {w} | {t} | {a} | {', '.join(dA)} | {', '.join(dB)} |")
L += ["", "## Предложения «употребление»", "", "| Слово | Форма A (варианты) | Форма B (варианты) |", "|---|---|---|"]
for w,u in U.items():
    L.append(f"| {w} | {u[0]} ({' / '.join(u[1])}) | {u[2]} ({' / '.join(u[3])}) |")
L += ["", "## Псевдослова", "", f"Форма A: {', '.join(PSEUDO['A'])}.", "", f"Форма B: {', '.join(PSEUDO['B'])}.", "",
      "## Размер форм", "", "На форму: 30 пунктов узнавания (20 слов + 10 псевдослов), 20 пунктов «значение», 20 пунктов «употребление», всего 70. Время по blueprint около 15 минут; пункты понимания добавятся к 21 минуте только после контрольных текстов. Позиция верного ответа в «значении» выровнена по четырём местам; в «употреблении» тоже.",""]
open("docs/research-design/test-items-review.md","w",encoding="utf-8").write("\n".join(L))
