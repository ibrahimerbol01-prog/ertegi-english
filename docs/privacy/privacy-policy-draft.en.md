# Ertegi English Privacy Policy — DRAFT

> Draft based on the inventory in `docs/privacy/data-inventory.md` (06.11.2026). **Not legal advice**: it must be checked by the project lead or a lawyer and matched with the research consent form. "[ASK OWNER]" means the code does not decide it.
> For the ordinary site. The research site has its own text in the consent package.

---

## For students (short)

**What we keep.** Your email and name, so you can sign in. Your learning: XP, streak, tales, tests, words and cards. Your writing in "Oi izi", the debates and "Dala kenesi". We also keep a log of what you opened and tapped, and whether your answer was right. Your texts are not in the log, only how long they are.

**Who sees it.** You do. If you are in a class, your teacher does too: your nickname, XP, words, results, and the work you did after you joined. Classmates see only class totals. They see your reason in "Dala kenesi" without your name, and only if your teacher allows it.

**Where it goes.** When you write to Shoqan, your message goes to Google (Gemini), sometimes to Anthropic (Claude). We do not send your name or email. **Do not tell Shoqan your name, address, phone number or other personal details.** When you check your pronunciation in "Dybys", the sound from your microphone goes to Microsoft. We do not keep the recording.

**What we don't do.** No ads. We don't sell data. We don't use your location. We don't keep recordings of your voice.

**Your rights.** You can delete your account yourself: Profile → "Delete account". Everything is deleted. If something is unclear, ask a parent or your teacher.

---

## For parents and teachers (full)

Last updated: [DATE]. Data controller: [ASK OWNER: who is responsible, contact].

### 1. What is collected

**Account:** email, password (stored only encrypted), display name. With Google sign-in: name, email and profile photo link provided by Google. Role (student or teacher). Whether and when the user agreed to this policy.

**Learning:** XP, streak, last active day; tale levels completed and test results (score, time); badges; saved words and their review schedule; legend cards, proverbs, words marked "I know".

**Student writing:** "Oi izi" answers and drafts, weekly debate texts, the vote and reason in "Dala kenesi", Shoqan's replies to "Oi izi" and the debate.

**Learning log:** opening the app and a tale, tapping a word, listening, answering a question (right or wrong, which attempt, time), reviewing a word, voting, pronunciation score. Each entry also records the time, the app version, the interface language, and the internal class number if the student is in exactly one class. Texts and messages to Shoqan are not written to the log, only their length.

**Class (if the student joined):** nickname in the class (by default the name or the part of the email before "@"), join and leave dates.

**For teachers:** classes, their codes and assignments; the teacher-role request, its status and dates, an admin note.

**Counters:** how many times a day the user used Shoqan and the voice service. Only the number is kept, to enforce the daily limit.

**Not collected:** the Shoqan chat (except his replies to "Oi izi" and the debate), voice recordings, location, phone number. The site sets no cookies and uses no analytics or ad trackers.

### 2. Why

To sign in, save progress, schedule word reviews, show a teacher their class's results and keep daily limits. The learning log shows us which tasks are hard, so we can improve the lessons.

### 3. Who sees the data

The user. While a student is in a class, that class's teacher sees: nickname, XP, streak, last active day, saved words (with translation and how well they are learned), tale levels, latest test results. The teacher also sees work done after the student joined: debates, the reply to Shoqan, "Oi izi" entries with all versions, votes and reasons in "Dala kenesi". From the log the teacher only gets 30-day totals and the class's hard words and questions, and can download them as a CSV file. After a student leaves, the teacher sees only the nickname and dates. Classmates see class totals in "Dala kenesi". They see a student's reason without the name, and only after the teacher approves it.

### 4. Where it is stored

**On the server:** the Supabase database and sign-in system, server region [ASK OWNER]. Each user can read and change only their own records, and the database itself enforces this.

**On the device (in the browser):**
- a copy of learning data and a queue of unsent changes, so the app works offline;
- the sign-in session;
- interface language, "words of the day", a copy of the class list, the role;
- the class code and the chosen role while signing in (the role for up to 15 minutes);
- the position of the Shoqan button.

The browser also keeps the site's files and fonts for offline use. They contain no personal data.

### 5. Other services

- **Supabase** — database and sign-in.
- **Vercel** — hosting of the site and server functions. As on any website, the IP address and browser details may be written to server logs. Function logs may also contain error messages from services. Log retention: [ASK OWNER].
- **Google** — Google sign-in, if the user chooses it.
- **Google Gemini** — Shoqan. Receives the student's messages, "Oi izi" and debate texts for feedback, the level and the hint step. Name and email are not sent. [ASK OWNER: the key's plan; on a free plan Google may use the texts to improve its services.]
- **Anthropic Claude** — Shoqan's fallback, only if Gemini is not set up. Receives the same.
- **Microsoft Azure Speech** — reading tales aloud (the tale text is sent) and the pronunciation check in "Dybys". During the check, microphone audio goes from the browser directly to Microsoft. We do not keep the recording.
- **Google Fonts** — the site's fonts load from Google's servers, so Google receives the IP address and browser details.

Data is not sold and not shared with advertisers.

### 6. How long

Account and learning data are kept until the account is deleted. Retention of database backups, server logs and counters: [ASK OWNER]. Whether the learning log needs a time limit: [ASK OWNER].

### 7. Children

Ertegi English is made for school students. [ASK OWNER / LAWYER: whether separate parental consent is needed, from what age, and how it is collected.] A parent can ask to delete a child's account: [ASK OWNER: contact and procedure].

### 8. User rights

- **Deletion.** Profile → "Delete account". The account, progress, words, texts, votes, debates, learning log, classes, class memberships, teacher request and counters are deleted at once, and data on the device is cleared. This cannot be undone. Database backups may keep data for another [ASK OWNER].
- **Sign-out.** Signing out ends the session at once.
- Questions about data: [ASK OWNER: address].

### 9. Changes

If the site starts collecting something new or sending data to a new service, this policy changes before the change goes live.
