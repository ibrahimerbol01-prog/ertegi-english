/* Words of the week (Word Generation, Snow & Lawrence): five words that come
   back in several tales, and a question from the tales to argue each day.
   Every word here appears in two or more tales (most in three or more), so a learner meets it
   again across days, not only inside one story. */

export interface WeekWord {
  word: string;
  kk: string;
  // Forms that count as using the word; matched as whole words, so "fair" never matches "fairy".
  forms: string[];
  // Word family shown in the reader: how the word grows.
  family: string;
}

export interface Week {
  theme: { kk: string; en: string };
  words: WeekWord[];
  dilemmas: Dilemma[];
}

export interface Dilemma {
  en: string;
  kk: string;
  // Shoqan's counter-argument when he can't be reached, one per side the learner takes.
  counter: { yes: { en: string; kk: string }; no: { en: string; kk: string } };
}

const w = (word: string, kk: string, forms: string[], family: string): WeekWord => ({ word, kk, forms: [word, ...forms], family });

export const WEEKS: Week[] = [
  {
    theme: { kk: "Айла мен әділдік", en: "Tricks and fairness" },
    words: [
      w("clever", "ақылды, айлалы", ["cleverer", "cleverest", "cleverly", "cleverness"], "clever → cleverness"),
      w("trick", "айла", ["tricks", "tricked", "tricking", "tricky"], "trick → tricky"),
      w("poor", "кедей", ["poorer", "poorest", "poorly", "poverty"], "poor → poverty"),
      w("rich", "бай", ["richer", "richest", "riches"], "rich → riches"),
      w("decide", "шешу", ["decides", "decided", "deciding", "decision", "decisions"], "decide → decision"),
    ],
    // One question a day, Monday to Sunday.
    dilemmas: [
      {
        en: "Aldar Köse took the rich man's coat with a trick. He was poor. Does that make it fair?",
        kk: "Алдар Көсе бай адамның шапанын айламен алды. Ол кедей болғандықтан, бұл әділ ме?",
        counter: {
          yes: { en: "But a trick is still a lie. The rich man was scared and lost his coat. Is it fair to frighten people, even rich ones?", kk: "Бірақ айла бәрібір өтірік. Бай адам қорқып, шапанынан айырылды. Адамды қорқыту әділ ме, тіпті ол бай болса да?" },
          no: { en: "But Aldar Köse was poor and cold, and nobody was hurt. Can a clever trick be a kind of justice?", kk: "Бірақ Алдар Көсе кедей әрі тоңып жүрді, ешкім зардап шеккен жоқ. Ақылды айла әділдіктің бір түрі бола ала ма?" },
        },
      },
      {
        en: "The rich man gave away his fur coat because he was greedy. Was it his own fault that he lost it?",
        kk: "Бай адам шапанын ашкөздігінен берді. Шапанынан айырылғанына өзі кінәлі ме?",
        counter: {
          yes: { en: "But Aldar Köse told him a lie on purpose. If someone tricks you, is it really only your fault?", kk: "Бірақ Алдар Көсе оны әдейі алдады. Біреу сені алдаса, бәріне тек сен кінәлі боласың ба?" },
          no: { en: "But nobody made the rich man give his coat. He decided himself, because he wanted more. Isn't greed a choice?", kk: "Бірақ бай адамды ешкім мәжбүрлеген жоқ. Ол көбірек алғысы келіп, өзі шешті. Ашкөздік те таңдау емес пе?" },
        },
      },
      {
        en: "Tazsha tricked the giant to save his village. Is a lie OK if it helps poor people?",
        kk: "Тазша ауылын құтқару үшін дәуді алдады. Кедей адамдарға көмектессе, өтірік айтуға бола ма?",
        counter: {
          yes: { en: "But if everyone lies when they think it helps, how can people trust each other?", kk: "Бірақ әркім өзінше пайдалы деп өтірік айта берсе, адамдар бір-біріне қалай сенеді?" },
          no: { en: "But the giant was taking sheep and horses from poor families. Should Tazsha tell the truth to a thief?", kk: "Бірақ дәу кедей отбасылардың қойы мен жылқысын алып жатты. Тазша ұрыға шындықты айтуы керек пе еді?" },
        },
      },
      {
        en: "Is it better to be clever than to be rich?",
        kk: "Бай болғаннан гөрі ақылды болған жақсы ма?",
        counter: {
          yes: { en: "But a clever poor man can still be cold and hungry. Can a clever mind keep you warm in winter?", kk: "Бірақ ақылды кедей де тоңып, аш жүруі мүмкін. Ақыл қыста жылытар ма?" },
          no: { en: "But the rich man lost his coat in one minute, and Aldar Köse won it with his mind. Which one lasts longer?", kk: "Бірақ бай адам шапанынан бір минутта айырылды, ал Алдар Көсе оны ақылымен тапты. Қайсысы ұзаққа жетеді?" },
        },
      },
      {
        en: "Zhirenshe won with clever words, not with a sword. Can words decide an argument better than weapons?",
        kk: "Жиренше қылышпен емес, ақылды сөзбен жеңді. Сөз дауды қарудан жақсы шеше ала ма?",
        counter: {
          yes: { en: "But some people don't listen to words at all. What can clever words do against an army?", kk: "Бірақ кейбір адамдар сөзге мүлде құлақ аспайды. Ақылды сөз әскерге қарсы не істей алады?" },
          no: { en: "But weapons hurt people, and a clever answer hurts nobody. Isn't it wise to try words first?", kk: "Бірақ қару адамдарға зиян келтіреді, ал ақылды жауап ешкімге зиян келтірмейді. Алдымен сөзбен көру ақылдылық емес пе?" },
        },
      },
      {
        en: "Aldar Köse only tricks rich and greedy people. Does that make him a hero?",
        kk: "Алдар Көсе тек бай әрі ашкөз адамдарды алдайды. Бұл оны батыр ете ме?",
        counter: {
          yes: { en: "But a hero usually helps others, and Aldar Köse often takes things for himself. Is a clever trickster the same as a hero?", kk: "Бірақ батыр әдетте басқаларға көмектеседі, ал Алдар Көсе көбіне өзіне алады. Айлакер мен батыр бір нәрсе ме?" },
          no: { en: "But Aldar Köse shows poor people that the rich are not always clever. Doesn't that give poor people hope?", kk: "Бірақ Алдар Көсе кедейлерге байлардың әрқашан ақылды емес екенін көрсетеді. Бұл кедейлерге үміт бермей ме?" },
        },
      },
      {
        en: "Your friend is poor and has no book. Is it fair to let him copy your homework?",
        kk: "Досың кедей, оның кітабы жоқ. Оған үй тапсырмаңды көшіртуге бола ма?",
        counter: {
          yes: { en: "But if he only copies, he will not learn anything. Is that really helping your friend?", kk: "Бірақ ол тек көшірсе, ештеңе үйренбейді. Бұл досыңа шынымен көмек пе?" },
          no: { en: "But your friend can't change being poor. Is it fair if he gets bad marks only because he has no book?", kk: "Бірақ досың кедейлігін өзгерте алмайды. Кітабы жоқ болғаны үшін ғана жаман баға алса, әділ ме?" },
        },
      },
    ],
  },
  {
    theme: { kk: "Батылдық", en: "Courage" },
    words: [
      w("brave", "батыл", ["braver", "bravest", "bravely", "bravery"], "brave → bravery"),
      w("courage", "ерлік, батылдық", ["courageous"], "courage → courageous"),
      w("fear", "қорқыныш", ["fears", "feared", "fearless", "fearful"], "fear → fearless"),
      w("defeat", "жеңу", ["defeats", "defeated", "defeating"], "defeat → defeated"),
      w("save", "құтқару", ["saves", "saved", "saving"], "save → saved"),
    ],
    // One question a day, Monday to Sunday.
    dilemmas: [
      {
        en: "Tazsha beat the giant with a trick, and Er Tostik fought the dragon. Is a clever trick as brave as a fight?",
        kk: "Тазша дәуді айламен жеңді, ал Ер Төстік айдаһармен соғысты. Айла соғыс сияқты батылдық па?",
        counter: {
          yes: { en: "But Er Tostik put his life in danger with a sword. Tazsha only used cheese. Is that really the same courage?", kk: "Бірақ Ер Төстік қылышпен өмірін қатерге тікті. Тазша тек ірімшік қолданды. Бұл шынымен бірдей ерлік пе?" },
          no: { en: "But Tazsha stood in front of a huge giant when his legs were shaking. Isn't it brave to stay when you are afraid?", kk: "Бірақ Тазша аяғы дірілдеп тұрса да, алып дәудің алдында қалды. Қорқып тұрып қалу батылдық емес пе?" },
        },
      },
      {
        en: "Er Tostik rode out alone to find his brothers. Is going alone braver than asking friends for help?",
        kk: "Ер Төстік ағаларын іздеп жалғыз аттанды. Жалғыз бару достардан көмек сұраудан батылырақ па?",
        counter: {
          yes: { en: "But even Er Tostik needed his wise horse Shalkuiryk. Can anyone really win alone?", kk: "Бірақ Ер Төстікке де ақылды аты Шалқұйрық керек болды. Жалғыз біреу шынымен жеңе ала ма?" },
          no: { en: "But nobody else wanted to go. If Er Tostik waited for help, his brothers could be lost forever. Isn't that brave?", kk: "Бірақ басқа ешкім барғысы келмеді. Ер Төстік көмек күтсе, ағалары мәңгі жоғалуы мүмкін еді. Бұл батылдық емес пе?" },
        },
      },
      {
        en: "Is a person who feels fear but goes on braver than a person who feels no fear?",
        kk: "Қорқып тұрса да алға баратын адам ештеңеден қорықпайтын адамнан батылырақ па?",
        counter: {
          yes: { en: "But a fearless person can act fast and save people quickly. Isn't having no fear better in a battle?", kk: "Бірақ қорықпайтын адам тез әрекет етіп, адамдарды жылдам құтқара алады. Соғыста қорықпау жақсырақ емес пе?" },
          no: { en: "But Tazsha's legs were shaking, and he still stayed. Isn't courage only real when there is fear?", kk: "Бірақ Тазшаның аяғы дірілдеп тұрды, сонда да ол қалды. Ерлік қорқыныш болғанда ғана шын емес пе?" },
        },
      },
      {
        en: "Tomiris fought the great king Cyrus to save her land. Should a small people fight a strong army?",
        kk: "Томирис жерін сақтап қалу үшін ұлы патша Кирмен соғысты. Шағын халық күшті әскермен соғысуы керек пе?",
        counter: {
          yes: { en: "But a war with a strong army can kill many people. Could peace save more lives?", kk: "Бірақ күшті әскермен соғыс көп адамның өмірін қиюы мүмкін. Бейбітшілік көбірек адамды құтқармас па еді?" },
          no: { en: "But Cyrus captured her son and wanted all her land. If she did nothing, would her people be safe?", kk: "Бірақ Кир оның ұлын тұтқынға алып, бүкіл жерін алғысы келді. Ол ештеңе істемесе, халқы аман болар ма еді?" },
        },
      },
      {
        en: "Alpamys did not give up for seven years in the pit. Is never giving up always brave?",
        kk: "Алпамыс шұңқырда жеті жыл берілмеді. Ешқашан берілмеу әрқашан батылдық па?",
        counter: {
          yes: { en: "But sometimes it is wise to stop and try another way. Is it brave to keep doing something that doesn't work?", kk: "Бірақ кейде тоқтап, басқа жол іздеу ақылдылық. Нәтиже бермейтін нәрсені жалғастыра беру батылдық па?" },
          no: { en: "But Alpamys kept his hope, and in the end he saved Gulbarshyn. Wasn't his patience his bravest act?", kk: "Бірақ Алпамыс үмітін үзбеді, ақырында Гүлбаршынды құтқарды. Оның шыдамдылығы ең үлкен ерлігі емес пе?" },
        },
      },
      {
        en: "Someone is bullying your classmate. Is it brave to tell the teacher?",
        kk: "Біреу сыныптасыңды қорлап жүр. Мұғалімге айту батылдық па?",
        counter: {
          yes: { en: "But the other students may laugh at you for telling. Isn't it braver to stop the bully yourself?", kk: "Бірақ басқа оқушылар айтқаның үшін саған күлуі мүмкін. Қорлаушыны өзің тоқтату батылырақ емес пе?" },
          no: { en: "But you can't always defeat a bully alone. If you tell a teacher, you save your classmate. Isn't that brave too?", kk: "Бірақ қорлаушыны жалғыз жеңе алмауың мүмкін. Мұғалімге айтсаң, сыныптасыңды құтқарасың. Бұл да батылдық емес пе?" },
        },
      },
      {
        en: "Kurtka raised the horse Taiburyl, and Qobylandy won the battle on it. Was Kurtka as important for the victory as Qobylandy?",
        kk: "Құртқа Тайбурылды баптап өсірді, ал Қобыланды онымен шайқаста жеңді. Жеңіске Құртқа Қобыландыдай маңызды ма еді?",
        counter: {
          yes: { en: "But Kurtka was at home, and Qobylandy faced the enemies with his sword. Who really defeated them?", kk: "Бірақ Құртқа үйде болды, ал Қобыланды жауға қылышпен қарсы шықты. Жауды шын мәнінде кім жеңді?" },
          no: { en: "But without fast Taiburyl, Qobylandy could not win. Doesn't the person who prepares the hero also save the land?", kk: "Бірақ жүйрік Тайбурылсыз Қобыланды жеңе алмас еді. Батырды дайындаған адам да елді құтқармай ма?" },
        },
      },
    ],
  },
  {
    theme: { kk: "Даналық", en: "Wisdom" },
    words: [
      w("wise", "дана", ["wiser", "wisest", "wisely", "wisdom"], "wise → wisdom"),
      w("answer", "жауап", ["answers", "answered", "answering"], "answer → answered"),
      w("respect", "құрмет", ["respects", "respected", "respectful"], "respect → respectful"),
      w("judge", "би, төреші", ["judges", "judged", "judging"], "judge → judging"),
      w("trust", "сену", ["trusts", "trusted", "trusting"], "trust → trusted"),
    ],
    // One question a day, Monday to Sunday.
    dilemmas: [
      {
        en: "Ayaz Bi could shout at the bad men, but he quietly gave the key. Is staying calm better than fighting back?",
        kk: "Аяз би жаман адамдарға айғайлай алатын еді, бірақ кілтті үнсіз берді. Сабыр ету қарсы тұрудан дұрыс па?",
        counter: {
          yes: { en: "But the bad men told lies about him. If a judge says nothing, will people respect him or think he is weak?", kk: "Бірақ ол жаман адамдар ол туралы өтірік айтты. Би үндемесе, адамдар оны құрметтей ме, әлде әлсіз деп ойлай ма?" },
          no: { en: "But Ayaz Bi showed the truth without one angry word, and the khan trusted him more. Isn't that wise?", kk: "Бірақ Аяз би бір ашулы сөз айтпай-ақ шындықты көрсетті, хан оған бұрынғыдан да көп сенді. Бұл даналық емес пе?" },
        },
      },
      {
        en: "Korkyt ran from death, but everywhere he went people were digging his grave. Is it wise to run from something you fear?",
        kk: "Қорқыт ажалдан қашты, бірақ қайда барса да оның көрін қазып жатты. Қорқатын нәрседен қашу ақылдылық па?",
        counter: {
          yes: { en: "But Korkyt could not escape. Wouldn't it be wiser to face the problem at home?", kk: "Бірақ Қорқыт құтыла алмады. Мәселеге үйде қарсы тұру ақылдырақ болмас па еді?" },
          no: { en: "But on his way Korkyt made the first kobyz, and his music still lives. Can running away teach you something wise?", kk: "Бірақ жолда Қорқыт алғашқы қобызды жасады, оның күйі әлі тірі. Қашу да саған даналық үйрете ала ма?" },
        },
      },
      {
        en: "Karashash was a young girl, but she answered every riddle. Should we respect young people's answers as much as old people's?",
        kk: "Қарашаш жас қыз еді, бірақ әр жұмбаққа жауап берді. Жастардың жауабын үлкендердікіндей құрметтеу керек пе?",
        counter: {
          yes: { en: "But old people have lived longer and seen more. Isn't experience a kind of wisdom too?", kk: "Бірақ үлкендер ұзақ өмір сүріп, көп нәрсе көрді. Тәжірибе де даналықтың бір түрі емес пе?" },
          no: { en: "But Zhirenshe, a famous wise man, was amazed by Karashash. If her answer is right, does her age matter?", kk: "Бірақ атақты шешен Жиренше Қарашашқа таң қалды. Оның жауабы дұрыс болса, жасы маңызды ма?" },
        },
      },
      {
        en: "Ayaz Bi was once poor, but he became a judge. Should a judge be someone who knows how poor people live?",
        kk: "Аяз би бір кезде кедей еді, кейін би болды. Би кедейлердің тұрмысын білетін адам болуы керек пе?",
        counter: {
          yes: { en: "But a judge must follow the law, not feelings. Could a judge who was poor be too soft with the poor?", kk: "Бірақ би сезімге емес, заңға сүйенуі керек. Кедей болған би кедейлерге тым жұмсақ болып кетпей ме?" },
          no: { en: "But Ayaz Bi kept his old clothes to remember who he was. Doesn't that help a judge stay fair?", kk: "Бірақ Аяз би кім болғанын ұмытпау үшін ескі киімін сақтады. Бұл биге әділ болуға көмектеспей ме?" },
        },
      },
      {
        en: "Should you trust a person who is clever with words?",
        kk: "Сөзге шебер адамға сену керек пе?",
        counter: {
          yes: { en: "But Aldar Köse was clever with words too, and he tricked people. How do you know if clever words are true?", kk: "Бірақ Алдар Көсе де сөзге шебер еді, ол адамдарды алдады. Ақылды сөздің шын екенін қайдан білесің?" },
          no: { en: "But the khan trusted Zhirenshe's words, and they helped the people. Isn't a wise speaker worth trusting?", kk: "Бірақ хан Жиреншенің сөзіне сенді, ол сөздер халыққа көмектесті. Дана шешенге сенуге болмай ма?" },
        },
      },
      {
        en: "You don't know the answer in class. Is it wise to say \"I don't know\"?",
        kk: "Сабақта жауабын білмейсің. «Білмеймін» деу ақылдылық па?",
        counter: {
          yes: { en: "But the other students may laugh. Isn't it better to guess an answer and try?", kk: "Бірақ басқа оқушылар күлуі мүмкін. Жауапты болжап, байқап көру жақсырақ емес пе?" },
          no: { en: "But a wise person is not afraid to ask. If you pretend to know, how will you ever learn?", kk: "Бірақ дана адам сұраудан қорықпайды. Білетін болып көрінсең, қалай үйренесің?" },
        },
      },
      {
        en: "Asan Kaigy gave advice about every place he saw. Should young people always listen to old people's advice?",
        kk: "Асан Қайғы көрген әр жері туралы кеңес берді. Жастар үлкендердің кеңесін әрқашан тыңдауы керек пе?",
        counter: {
          yes: { en: "But the world changes, and old advice is not always right today. Shouldn't young people also think for themselves?", kk: "Бірақ дүние өзгереді, ескі кеңес бүгін әрқашан дұрыс бола бермейді. Жастар өзі де ойлануы керек емес пе?" },
          no: { en: "But Asan Kaigy's words about water and grass helped people for hundreds of years. Isn't old wisdom worth respect?", kk: "Бірақ Асан Қайғының су мен шөп туралы сөздері халыққа ғасырлар бойы пайдалы болды. Ескі даналық құрметке лайық емес пе?" },
        },
      },
    ],
  },
  {
    theme: { kk: "Адалдық", en: "Loyalty" },
    words: [
      w("promise", "уәде", ["promises", "promised"], "promise → promised"),
      w("loyal", "адал", ["loyalty"], "loyal → loyalty"),
      w("kind", "мейірімді", ["kinder", "kindest", "kindly", "kindness"], "kind → kindness"),
      w("help", "көмек", ["helps", "helped", "helping", "helpful"], "help → helpful"),
      w("believe", "сену", ["believes", "believed", "belief"], "believe → belief"),
    ],
    // One question a day, Monday to Sunday.
    dilemmas: [
      {
        en: "Karlyga helped Alpamys out of the pit, but he was her father's enemy. Was she right to help him?",
        kk: "Қарлыға әкесінің жауы Алпамысқа шұңқырдан шығуға көмектесті. Ол дұрыс істеді ме?",
        counter: {
          yes: { en: "But Karlyga went against her own father and her people. Is it loyal to help your family's enemy?", kk: "Бірақ Қарлыға өз әкесі мен еліне қарсы шықты. Отбасыңның жауына көмектесу адалдық па?" },
          no: { en: "But Alpamys was in a dark pit for seven years. Isn't kindness to a person in pain more important than a family fight?", kk: "Бірақ Алпамыс қараңғы шұңқырда жеті жыл отырды. Қиналған адамға мейірім көрсету отбасы дауынан маңыздырақ емес пе?" },
        },
      },
      {
        en: "Karabai promised that Bayan would marry Kozy, but later he broke his promise. Is it ever right to break a promise?",
        kk: "Қарабай Баянды Қозыға беремін деп уәде берді, бірақ кейін уәдесін бұзды. Уәдені бұзу қашан да болса дұрыс бола ма?",
        counter: {
          yes: { en: "But Kozy and Bayan suffered because of that broken promise. If promises can be broken, who can we believe?", kk: "Бірақ сол бұзылған уәде үшін Қозы мен Баян қиналды. Уәдені бұзуға болса, кімге сенеміз?" },
          no: { en: "But what if keeping a promise hurts someone? Is a promise more important than a person?", kk: "Бірақ уәдені орындау біреуге зиян келтірсе ше? Уәде адамнан маңыздырақ па?" },
        },
      },
      {
        en: "Zhibek chose Tolegen, not the rich men. Should you follow your heart even if your family wants something else?",
        kk: "Жібек бай жігіттерді емес, Төлегенді таңдады. Отбасың басқаны қаласа да, жүрегіңнің айтқанымен жүру керек пе?",
        counter: {
          yes: { en: "But your family loves you and wants to help. Shouldn't you believe they know some things better?", kk: "Бірақ отбасың сені жақсы көреді, көмектескісі келеді. Олар кейбір нәрсені жақсырақ біледі деп сену керек емес пе?" },
          no: { en: "But it is your life, not your family's. Will you be happy if someone else chooses for you?", kk: "Бірақ бұл отбасыңның емес, сенің өмірің. Басқа біреу сен үшін таңдаса, бақытты боласың ба?" },
        },
      },
      {
        en: "Shalkuiryk helped Er Tostik through every trial. Can an animal be as loyal as a friend?",
        kk: "Шалқұйрық Ер Төстікке әр сынақта көмектесті. Жануар дос сияқты адал бола ала ма?",
        counter: {
          yes: { en: "But an animal helps you because you feed it. Isn't a friend's loyalty a choice, and an animal's only a habit?", kk: "Бірақ жануар сені тамақтандырғаның үшін көмектеседі. Достың адалдығы таңдау, ал жануардікі тек әдет емес пе?" },
          no: { en: "But a horse never lies and never leaves you in danger. Aren't some animals more loyal than people?", kk: "Бірақ ат ешқашан өтірік айтпайды, сені қауіпте тастап кетпейді. Кейбір жануарлар адамнан да адал емес пе?" },
        },
      },
      {
        en: "Your best friend did something wrong at school. Should you help hide it because you are loyal?",
        kk: "Ең жақын досың мектепте жаман іс істеді. Адал дос болғандықтан, оны жасыруға көмектесу керек пе?",
        counter: {
          yes: { en: "But if you hide it, your friend will not learn from the mistake. Is that really kind?", kk: "Бірақ жасырсаң, досың қатесінен сабақ алмайды. Бұл шынымен мейірімділік пе?" },
          no: { en: "But your friend believes in you. If you tell, will your friend ever trust you again?", kk: "Бірақ досың саған сенеді. Айтып қойсаң, досың саған қайта сене ме?" },
        },
      },
      {
        en: "Should you help someone who was unkind to you before?",
        kk: "Бұрын саған мейірімсіз болған адамға көмектесу керек пе?",
        counter: {
          yes: { en: "But that person may be unkind to you again. Shouldn't you help kind people first?", kk: "Бірақ ол адам саған тағы мейірімсіз болуы мүмкін. Алдымен мейірімді адамдарға көмектесу керек емес пе?" },
          no: { en: "But Karlyga helped Alpamys, and he was her father's enemy. Can kindness turn an enemy into a friend?", kk: "Бірақ Қарлыға әкесінің жауы Алпамысқа көмектесті. Мейірім жауды досқа айналдыра ала ма?" },
        },
      },
      {
        en: "Gulbarshyn waited seven years for Alpamys and believed he would come back. Was she right to wait so long?",
        kk: "Гүлбаршын Алпамысты жеті жыл күтті, ол оралады деп сенді. Сонша ұзақ күтуі дұрыс па еді?",
        counter: {
          yes: { en: "But seven years is a very long time, and nobody knew if Alpamys was alive. Isn't starting a new life wise too?", kk: "Бірақ жеті жыл өте ұзақ уақыт, Алпамыстың тірі екенін ешкім білмеді. Жаңа өмір бастау да ақылдылық емес пе?" },
          no: { en: "But Alpamys came home just in time because she waited. Isn't believing in someone a kind of loyalty?", kk: "Бірақ ол күткендіктен Алпамыс дәл уақытында оралды. Біреуге сену де адалдықтың бір түрі емес пе?" },
        },
      },
    ],
  },
  {
    theme: { kk: "Ел үшін", en: "For your people" },
    words: [
      w("hungry", "аш", ["hunger"], "hungry → hunger"),
      w("choice", "таңдау", ["choices", "choose", "chooses", "chose", "chosen"], "choose → choice"),
      w("strong", "күшті", ["stronger", "strongest", "strength"], "strong → strength"),
      w("wise", "дана", ["wiser", "wisest", "wisely", "wisdom"], "wise → wisdom"),
      w("poor", "кедей", ["poorer", "poorest", "poorly", "poverty"], "poor → poverty"),
    ],
    // One question a day, Monday to Sunday.
    dilemmas: [
      {
        en: "Asan Kaigy left his warm home at the khan's side to find land for hungry people. Should a leader give up comfort for others?",
        kk: "Асан Қайғы хан қасындағы жылы үйін тастап, аш халқына жер іздеуге кетті. Басшы басқалар үшін жайлылығынан бас тартуы керек пе?",
        counter: {
          yes: { en: "But Asan Kaigy travelled for years and never found Zheruiyk. Could he help his people more by staying near the khan?", kk: "Бірақ Асан Қайғы көп жыл жүріп, Жерұйықты таппады. Хан қасында қалса, халқына көбірек көмектесе алар ма еді?" },
          no: { en: "But a leader who never leaves a warm home cannot see how poor families live. Isn't that a weak choice?", kk: "Бірақ жылы үйден шықпаған басшы кедей отбасылардың тұрмысын көрмейді. Бұл әлсіз таңдау емес пе?" },
        },
      },
      {
        en: "Kerey and Zhanibek left Abulkhair Khan and moved to Zhetysu. Is it right to leave a leader you don't agree with?",
        kk: "Керей мен Жәнібек Әбілқайыр ханнан бөлініп, Жетісуға көшті. Келіспейтін басшыны тастап кету дұрыс па?",
        counter: {
          yes: { en: "But when people leave, the country becomes weaker. Isn't it better to stay and try to change things?", kk: "Бірақ адамдар кетсе, ел әлсірейді. Қалып, жағдайды өзгертуге тырысу жақсырақ емес пе?" },
          no: { en: "But because they left, the Kazakh Khanate began and their people grew strong. Can leaving be a strong choice?", kk: "Бірақ олар көшкендіктен Қазақ хандығы құрылып, халқы күшейді. Көшу де күшті таңдау бола ала ма?" },
        },
      },
      {
        en: "Abylai united many Kazakh clans against the Dzungars. Is a people stronger together, even when the clans don't agree?",
        kk: "Абылай жоңғарларға қарсы көп қазақ руын біріктірді. Рулар келіспесе де, халық бірге күштірек пе?",
        counter: {
          yes: { en: "But if the clans don't agree, they will argue all the time. Can people be strong when they argue?", kk: "Бірақ рулар келіспесе, үнемі дауласады. Дауласып жүрген халық күшті бола ала ма?" },
          no: { en: "But alone, each clan was too weak to stop the Dzungars. Isn't unity the only way for a small people?", kk: "Бірақ жеке-жеке әр ру жоңғарларды тоқтатуға тым әлсіз еді. Шағын халық үшін бірлік жалғыз жол емес пе?" },
        },
      },
      {
        en: "Shokan went on a dangerous journey to Kashgar to learn about other peoples. Is learning worth a big risk?",
        kk: "Шоқан басқа халықтарды тану үшін Қашқарға қауіпті сапарға аттанды. Білім үлкен тәуекелге тұрады ма?",
        counter: {
          yes: { en: "But Shokan's life was in danger. If he died on the road, who would share what he learned?", kk: "Бірақ Шоқанның өмірі қауіпте болды. Жолда қаза тапса, үйренгенін кім жеткізер еді?" },
          no: { en: "But without Shokan's journey, we would not know many songs and stories of those peoples. Wasn't his choice good for everyone?", kk: "Бірақ Шоқанның сапарынсыз біз сол халықтардың көп әні мен әңгімесін білмес едік. Оның таңдауы бәріне пайдалы болмады ма?" },
        },
      },
      {
        en: "Should a strong student help weaker students, even if it takes time from their own study?",
        kk: "Күшті оқушы өз оқуының уақытын жұмсап болса да, нашар оқитындарға көмектесуі керек пе?",
        counter: {
          yes: { en: "But the strong student also needs time to learn and grow. Is it fair to always give that time away?", kk: "Бірақ күшті оқушыға да үйреніп, өсу үшін уақыт керек. Сол уақытты үнемі басқаларға беру әділ ме?" },
          no: { en: "But when you explain something to others, you understand it better yourself. Isn't helping also a way to learn?", kk: "Бірақ біреуге түсіндірсең, өзің де жақсырақ түсінесің. Көмектесу де үйренудің бір жолы емес пе?" },
        },
      },
      {
        en: "If your people are hungry, is it right to take food from a rich neighbour without asking?",
        kk: "Халқың аш болса, бай көршіден сұрамай азық алу дұрыс па?",
        counter: {
          yes: { en: "But taking food without asking is stealing. If everyone does that, who will be safe?", kk: "Бірақ сұрамай алу ұрлық. Бәрі солай істесе, кім аман қалады?" },
          no: { en: "But a hungry child cannot wait. Is a rule more important than a life?", kk: "Бірақ аш бала күте алмайды. Ереже өмірден маңыздырақ па?" },
        },
      },
      {
        en: "Asan Kaigy never found Zheruiyk. Was his journey a failure?",
        kk: "Асан Қайғы Жерұйықты таппады. Оның сапары сәтсіз болды ма?",
        counter: {
          yes: { en: "But on his way he found good water and rich grass for his people. Is a journey a failure if it helps others?", kk: "Бірақ жолда ол халқына жақсы су мен шүйгін шөп тапты. Басқаларға көмектескен сапар сәтсіз бола ма?" },
          no: { en: "But he wanted to find a land without hunger, and he didn't. If you don't reach your goal, did you really win?", kk: "Бірақ ол аштық жоқ жерді тапқысы келді, бірақ таппады. Мақсатыңа жетпесең, шынымен жеңдің бе?" },
        },
      },
    ],
  },
];

/* The week runs Monday to Sunday on the learner's own calendar. */
const EPOCH = new Date(2026, 9, 19); // a Monday

export function currentWeek(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today.getTime() - EPOCH.getTime()) / 86400000);
  const index = Math.floor(days / 7);
  // Calendar arithmetic, not milliseconds, so a DST change cannot shift the week start.
  const start = new Date(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate() + index * 7);
  const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  // 0 = Monday … 6 = Sunday.
  const weekday = ((days % 7) + 7) % 7;
  const week = WEEKS[((index % WEEKS.length) + WEEKS.length) % WEEKS.length];
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return { week, startKey, weekday, dayKey, dilemma: week.dilemmas[weekday] };
}

const formIndex = (week: Week) => {
  const map = new Map<string, string>();
  for (const ww of week.words) for (const f of ww.forms) map.set(f, ww.word);
  return map;
};

// Which of the week's words a text uses, by whole-word form.
export function wordsUsed(week: Week, text: string): string[] {
  const forms = formIndex(week);
  const used = new Set<string>();
  for (const tok of text.toLowerCase().match(/[a-z]+/g) ?? []) {
    const base = forms.get(tok);
    if (base) used.add(base);
  }
  return [...used];
}

// The week's word a reader token belongs to, if any.
export function weekWordOf(week: Week, token: string): WeekWord | null {
  const base = formIndex(week).get(token.toLowerCase().replace(/[^a-z]/g, ""));
  return base ? week.words.find((ww) => ww.word === base) ?? null : null;
}
