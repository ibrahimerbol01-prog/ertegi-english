import { useState } from "react";
import { Sheet } from "./UIHelpers";

/* The privacy policy, loaded only when someone opens it (sign-in form or
   profile), so its three texts are not in the first screen's bundle.
   The text follows the code: if a feature starts collecting something new or
   sends data to a new service, this file changes in the same PR. */

export const POLICY_UPDATED = "04.11.2026";
type PolicyLang = "kk" | "ru" | "en";

const KK = `
Соңғы жаңарту: ${POLICY_UPDATED}

Бұл мәтін Ertegi English сен туралы қандай дерек сақтайтынын, оны не үшін және қайда сақтайтынын қарапайым тілмен түсіндіреді.

1. НЕ САҚТАЙМЫЗ
Аккаунт:
- электрондық поштаң, құпиясөзің (тек шифрланған түрде), өзің жазған атың;
- Google арқылы кірсең: Google берген атың, поштаң және профиль суретінің сілтемесі;
- рөлің (оқушы немесе мұғалім) және құпиялылық саясатына келіскен күнің.
Оқу деректері:
- XP, күн қатары, соңғы белсенді күнің, ертегі деңгейлері мен сынақ нәтижелері (ұпай, уақыты), белгілер;
- сақтаған сөздерің және оларды қайталау кестесі;
- өзің жазған мәтіндер: «Ой ізі» жауаптары, апта дебатының мәтіні, «Дала кеңесі» дауысы мен себебі;
- оқу әрекеттерінің журналы: ертегіні ашу, сөзді басу, тыңдау, сынақ сұрағына жауап (дұрыс па, нешінші әрекет, қанша уақыт), сөзді қайталау, дауыс беру, айтылым бағасы, әрекеттің уақыты, қосымшаның нұсқасы мен тілі. Өзің жазған мәтіндер мен Шоқанға жазғандарың журналға түспейді, тек олардың ұзындығы (сөз саны). Журнал сабақты жақсарту үшін керек (қай сөз, қай сұрақ қиын). Мұғалім одан тек жиынтық сандарды ала алады: 30 күндегі әрекеттер саны және сыныптың қиын сөздері мен сұрақтары.
Сынып (егер қосылсаң):
- сыныптағы лақап атың (әдепкіде профильдегі атың немесе поштаңның @ белгісіне дейінгі бөлігі), қосылған және шыққан күнің.
Сыныпта тұрғанда сол сыныптың мұғалімі көреді: лақап атыңды, XP мен күн қатарыңды, соңғы белсенді күніңді, сақтаған сөздеріңді (аудармасымен және қаншалықты меңгергеніңмен), өткен ертегі деңгейлерің мен соңғы сынақ нәтижелеріңді. Сыныптан шықсаң, мұғалім тек лақап атың мен күндерді көреді.
Мұғалім үшін: ашқан сыныптарың, кодтары мен тапсырмалары.
Есептегіштер: Шоқанға және дыбыс қызметіне күніне неше рет жүгінгенің (тек сан, күнделікті шекті сақтау үшін).

Сақтамаймыз: Шоқанмен чатыңды, дауыс жазбаларыңды, орныңды (геолокация), телефон нөміріңді. Жарнама жоқ, деректеріңді ешкімге сатпаймыз.

2. НЕ ҮШІН
Тек сайт жұмыс істеуі үшін: кіру, прогресіңді сақтау, сөздерді қайталауды жоспарлау, мұғаліміңе сынып нәтижесін көрсету, тегін қызметтердің күнделікті шегін ұстау. Оқу журналы бойынша қай тапсырмалар көмектесетінін, қайсысы қиын екенін көріп, сайтты жақсартамыз.

3. ҚАЙДА САҚТАЛАДЫ
Барлық аккаунт және оқу деректері Supabase дерекқорында. Әр оқушы тек өз жазбаларын оқи және өзгерте алады, бұл дерекқор деңгейінде тексеріледі. Мұғалім тек өз сыныбындағы оқушылардың прогресін көреді (1-бөлімде жазылғандай). «Дала кеңесіне» жазған себебің тексерілген соң басқа оқушыларға атыңсыз көрсетілуі мүмкін.
Кейбір нәрселер тек осы құрылғыда (браузерде) сақталады: тіл таңдауы, жазба жобалары, карталар, сынып тізімінің көшірмесі.

4. БАСҚА ҚЫЗМЕТТЕР
- Supabase: дерекқор және кіру жүйесі.
- Vercel: сайт осында орналасқан. Әдеттегі сайттар сияқты, сұраныс жасағанда IP мекенжайың серверде уақытша тіркелуі мүмкін.
- Google (кіру): «Google арқылы кіру» таңдасаң, кіруді Google жүргізеді.
- Google Gemini (Шоқан): Шоқанға жазған хабарламаларың мен «Ой ізі», дебат мәтіндеріне кері байланыс алу үшін мәтін Google-ға жіберіледі. Атың мен поштаң жіберілмейді. Тегін нұсқада Google бұл мәтіндерді өз қызметтерін жақсарту үшін пайдалануы мүмкін. Сондықтан Шоқанға аты-жөніңді, мекенжайыңды, телефоныңды немесе басқа жеке мәліметті жазба.
- Anthropic Claude: Шоқанның қосалқы нұсқасы. Әкімші қосқан кезде ғана іске қосылады, сонда жоғарыдағы мәтіндер Anthropic-қа жіберіледі.
- Microsoft Azure Speech: ертегіні дауыстап оқу (ертегі мәтіні жіберіледі) және «Дыбыс» бөлімінде айтылымды бағалау. Бағалау кезінде микрофондағы дауысың тікелей Microsoft-қа жіберіледі, бағаланады; біз дауысты сақтамаймыз.
- Google Fonts: сайттың қаріптері Google серверінен жүктеледі.
Жоғарыда жазылғаннан басқа, оқу деректеріңді Google-ға, Meta-ға немесе жарнамашыларға бермейміз.

5. 18 ЖАСҚА ТОЛМАСАҢ
Ertegi English мектеп оқушыларына арналған. Қосымшаны ата-анаң немесе мұғалімің біліп отырсын, басқа мектеп бағдарламалары сияқты.

6. ҚҰҚЫҚТАРЫҢ
- Аккаунтты өзің толық өшіре аласың: Профиль → «Аккаунтты өшіру». Аккаунт, прогресс, сөздер, жазбалар, дауыстар, дебаттар, оқу журналы, сыныптар мен сыныпқа мүшелік бірден дерекқордан өшеді, осы құрылғыдағы деректер де тазаланады. Мұны қайтару мүмкін емес. Дерекқордың резервтік көшірмелерінде деректер біраз уақыт қалуы мүмкін, кейін олар да жойылады.
- Шыққан сәтте сессия бірден аяқталады.

7. БАЙЛАНЫС
Саясат немесе деректер туралы сұрақтарыңды жобаның өтінім бетіндегі байланыс арқылы Ertegi English командасына жаз.
`.trim();

const RU = `
Последнее обновление: ${POLICY_UPDATED}

Этот текст простыми словами объясняет, какие данные о тебе хранит Ertegi English, зачем и где.

1. ЧТО МЫ ХРАНИМ
Аккаунт:
- электронная почта, пароль (только в зашифрованном виде), имя, которое ты указал;
- если входишь через Google: имя, почта и ссылка на фото профиля, которые передаёт Google;
- твоя роль (ученик или учитель) и дата согласия с политикой конфиденциальности.
Учёба:
- XP, серия дней, последний активный день, пройденные уровни сказок и результаты тестов (баллы, время), значки;
- сохранённые слова и расписание их повторения;
- твои тексты: ответы «Ой ізі», текст дебата недели, голос и причина в «Дала кеңесі»;
- журнал учебных действий: открытие сказки, нажатие на слово, прослушивание, ответ на вопрос теста (верно ли, с какой попытки, сколько времени), повторение слова, голосование, оценка произношения, время действия, версия приложения и язык. Твои тексты и сообщения Шоқану в журнал не попадают, только их длина (число слов). Журнал нужен, чтобы улучшать уроки (какие слова и вопросы трудные). Учитель может получить из него только общие числа: сколько действий за 30 дней и трудные слова и вопросы класса.
Класс (если ты вступил):
- твой ник в классе (по умолчанию имя из профиля или часть почты до знака @), даты вступления и выхода.
Пока ты в классе, учитель этого класса видит: ник, XP и серию дней, последний активный день, сохранённые слова (с переводом и тем, насколько ты их выучил), пройденные уровни сказок и последние результаты тестов. Если ты вышел из класса, учитель видит только ник и даты.
Для учителя: созданные классы, их коды и задания.
Счётчики: сколько раз за день ты обращался к Шоқану и к голосовому сервису (только число, чтобы соблюдать дневной лимит).

Мы не храним: переписку с Шоқаном, записи голоса, геолокацию, номер телефона. Рекламы нет, данные никому не продаём.

2. ЗАЧЕМ
Только для работы сайта: вход, сохранение прогресса, расписание повторения слов, показ результатов класса учителю, соблюдение дневных лимитов бесплатных сервисов. По журналу учебных действий мы видим, какие задания помогают и какие трудные, и улучшаем сайт.

3. ГДЕ ХРАНИТСЯ
Все данные аккаунта и учёбы хранятся в базе данных Supabase. Каждый ученик может читать и менять только свои записи, это проверяет сама база данных. Учитель видит прогресс только учеников своего класса (как описано в разделе 1). Причина, которую ты написал в «Дала кеңесі», после проверки может показываться другим ученикам без твоего имени.
Некоторые вещи хранятся только на этом устройстве (в браузере): выбор языка, черновики, карточки, копия списка классов.

4. ДРУГИЕ СЕРВИСЫ
- Supabase: база данных и система входа.
- Vercel: здесь размещён сайт. Как у любого сайта, при запросе твой IP-адрес может временно записываться на сервере.
- Google (вход): если выбираешь «Войти через Google», вход проводит Google.
- Google Gemini (Шоқан): твои сообщения Шоқану и тексты «Ой ізі» и дебата для отзыва отправляются в Google. Имя и почта не отправляются. В бесплатной версии Google может использовать эти тексты для улучшения своих сервисов. Поэтому не пиши Шоқану своё имя и фамилию, адрес, телефон и другие личные данные.
- Anthropic Claude: запасной вариант Шоқана. Работает, только если его включил администратор; тогда эти тексты отправляются в Anthropic.
- Microsoft Azure Speech: озвучка сказок (отправляется текст сказки) и оценка произношения в разделе «Дыбыс». Во время оценки звук с микрофона идёт напрямую в Microsoft и оценивается; мы запись не храним.
- Google Fonts: шрифты сайта загружаются с серверов Google.
Кроме того, что написано выше, твои учебные данные мы не передаём Google, Meta или рекламодателям.

5. ЕСЛИ ТЕБЕ НЕТ 18 ЛЕТ
Ertegi English создан для школьников. Пусть родители или учитель знают, что ты пользуешься приложением, как и любой другой школьной программой.

6. ТВОИ ПРАВА
- Аккаунт можно удалить самому: Профиль → «Аккаунтты өшіру» (в английском интерфейсе «Delete account»). Аккаунт, прогресс, слова, записи, голоса, дебаты, журнал учебных действий, классы и членство в классах сразу удаляются из базы данных, данные на этом устройстве тоже очищаются. Отменить это нельзя. В резервных копиях базы данные могут оставаться ещё некоторое время, потом удаляются и там.
- При выходе из аккаунта сессия сразу завершается.

7. КОНТАКТ
Вопросы о политике или данных пиши команде Ertegi English через контакт на странице заявки проекта.
`.trim();

const EN = `
Last updated: ${POLICY_UPDATED}

This text explains in plain words what Ertegi English keeps about you, why, and where.

1. WHAT WE KEEP
Account:
- your email, your password (only in encrypted form), the name you gave;
- if you sign in with Google: the name, email and profile picture link Google sends;
- your role (learner or teacher) and the date you agreed to this policy.
Learning:
- XP, streak, last active day, tale levels and quiz results (score, time), badges;
- your saved words and their review schedule;
- texts you write: Thinking trail answers, the debate-of-the-week text, your Steppe council vote and reason;
- a log of learning actions: opening a tale, tapping a word, listening, answering a quiz question (right or not, which try, how long it took), reviewing a word, voting, pronunciation scores, when each happened, the app version and language. Your own texts and messages to Shoqan are not in the log, only their length (word count). The log is there to improve the lessons (which words and questions are hard). A teacher can get only totals from it: how many actions in 30 days, and the class's hard words and questions.
Class (if you join one):
- your nickname in the class (by default your profile name or the part of your email before @), the dates you joined and left.
While you are in the class, its teacher sees: your nickname, XP and streak, last active day, saved words (with translation and how well you know them), the tale levels you finished and your recent quiz results. After you leave, the teacher sees only your nickname and the dates.
For teachers: the classes you create, their codes and assignments.
Counters: how many times a day you used Shoqan and the voice service (just a number, to keep the daily limit).

We do not keep: your chat with Shoqan, voice recordings, your location, your phone number. No ads, and we never sell your data.

2. WHY
Only to run the site: sign-in, saving progress, planning word reviews, showing class results to your teacher, keeping the daily limits of free services.

3. WHERE IT IS STORED
All account and learning data is stored in a Supabase database. Each learner can read and change only their own records, and the database itself enforces this. A teacher sees the progress of learners in their own class only (as listed in part 1). The reason you write in the Steppe council may be shown to other learners without your name, after it is checked.
Some things stay only on this device (in the browser): language choice, drafts, cards, a copy of your class list.

4. OTHER SERVICES
- Supabase: database and sign-in.
- Vercel: hosts the site. Like any website, your IP address may be logged on the server for a short time.
- Google (sign-in): if you choose "Continue with Google", Google handles the sign-in.
- Google Gemini (Shoqan): messages you write to Shoqan, and Thinking trail and debate texts sent for feedback, go to Google. Your name and email are not sent. On the free tier Google may use these texts to improve its services, so do not tell Shoqan your full name, address, phone or other personal details.
- Anthropic Claude: Shoqan's backup. Used only if the admin switches it on; then these texts go to Anthropic.
- Microsoft Azure Speech: reading tales aloud (the tale text is sent) and scoring pronunciation in Speak. While scoring, the sound from your microphone goes straight to Microsoft to be scored; we do not keep the recording.
- Google Fonts: the site's fonts load from Google's servers.
Apart from what is listed above, we do not share your learning data with Google, Meta or any advertiser.

5. IF YOU ARE UNDER 18
Ertegi English is built for school students. Use it with a parent's or teacher's awareness, like any other school software.

6. YOUR RIGHTS
- You can delete your whole account yourself: Profile → "Delete account". Your account, progress, words, entries, votes, debates, classes and class memberships are removed from the database at once, and the app's data on this device is cleared. This cannot be undone. Database backups may keep the data for a while longer before it is removed there too.
- Signing out ends your session immediately.

7. CONTACT
Questions about this policy or your data: reach the Ertegi English team through the contact listed on the project's submission page.
`.trim();

const TEXTS: Record<PolicyLang, { title: string; close: string; body: string }> = {
  kk: { title: "Құпиялылық саясаты", close: "Жабу", body: KK },
  ru: { title: "Политика конфиденциальности", close: "Закрыть", body: RU },
  en: { title: "Privacy Policy", close: "Close", body: EN },
};

export function PrivacyPolicySheet({ lang, onClose }: { lang: string; onClose: () => void }) {
  // Opens in the interface language; Russian is offered for parents.
  const [l, setL] = useState<PolicyLang>(lang === "en" ? "en" : "kk");
  const T = TEXTS[l];
  return (
    <Sheet open onClose={onClose} label={T.title}>
      <div className="p-6 pt-4 flex flex-col">
        <h3 className="font-display text-xl font-black text-ink mb-3 pr-8">{T.title}</h3>
        <div className="segmented w-[168px] mb-3" role="group" aria-label={l === "kk" ? "Тіл" : l === "ru" ? "Язык" : "Language"}>
          <button aria-pressed={l === "kk"} onClick={() => setL("kk")} lang="kk">ҚАЗ</button>
          <button aria-pressed={l === "ru"} onClick={() => setL("ru")} lang="ru">РУС</button>
          <button aria-pressed={l === "en"} onClick={() => setL("en")} lang="en">ENG</button>
        </div>
        <div lang={l} tabIndex={0} aria-label={T.title} className="max-h-[55dvh] overflow-y-auto text-sm text-ink-2 leading-relaxed whitespace-pre-wrap pr-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sky">
          {T.body}
        </div>
        <button onClick={onClose} className="btn w-full mt-5">{T.close}</button>
      </div>
    </Sheet>
  );
}
