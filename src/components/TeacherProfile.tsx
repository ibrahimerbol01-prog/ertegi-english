import { useEffect, useState } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { IconBoard } from "./Icons";
import { OrnamentBand, Shanyraq } from "./Ornaments";
import { teacherClasses, type ClassRow } from "../utils/classes";

/* The teacher's own profile: who they are, their classes at a glance, and
   settings. No XP, streak or badges: those belong to learners. */
export function TeacherProfile({ lang, setLang, userName, email, onOpenClasses, roleSwitch, onSignOut }: {
  lang: string; setLang: (l: string) => void; userName: string; email: string;
  onOpenClasses: () => void; roleSwitch: React.ReactNode; onSignOut: () => void;
}) {
  const kk = lang === "kk";
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    teacherClasses().then((res) => {
      if (!live) return;
      if (res.ok) setClasses(res.data ?? []); else setFailed(true);
    });
    return () => { live = false; };
  }, []);

  const initial = (userName || "?").trim().charAt(0).toUpperCase();
  const open = (classes ?? []).filter((c) => !c.archived_at).length;
  const archived = (classes ?? []).length - open;

  return (
    <div className="space-y-6 animate-pop-in">
      <div className="card overflow-hidden">
        <div className="relative h-20 bg-night">
          <OrnamentBand className="absolute bottom-1 inset-x-0 h-4 w-full text-sun/30" />
        </div>
        <div className="px-5 pb-5 flex items-end gap-4">
          <div className="relative w-[88px] h-[88px] shrink-0 -mt-11">
            <Shanyraq className="absolute -inset-2 w-[104px] h-[104px] text-sun" strokeWidth={2.4} />
            <div className="absolute inset-0 rounded-full bg-sky-soft border-4 border-card flex items-center justify-center font-display font-black text-4xl text-sky-deep">
              {initial}
            </div>
          </div>
          <div className="min-w-0 pt-3">
            <h1 tabIndex={-1} className="font-display font-black text-2xl text-ink truncate outline-none">{userName}</h1>
            <p className="text-sm text-ink-2">{kk ? "Мұғалім" : "Teacher"}{email ? <> · <span className="break-all">{email}</span></> : null}</p>
          </div>
        </div>
      </div>

      <button onClick={onOpenClasses} className="card w-full text-left p-4 flex items-center gap-4 hover:bg-sand/40">
        <IconBoard size={44} className="shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block font-display font-extrabold text-ink text-[17px]">{kk ? "Менің сыныптарым" : "My classes"}</span>
          <span className="block text-sm text-ink-2">
            {failed
              ? (kk ? "Сыныптар кабинетте көрінеді" : "See them in the cabinet")
              : classes === null
                ? (kk ? "Жүктеліп жатыр…" : "Loading…")
                : open === 0 && archived === 0
                  ? (kk ? "Әзірге сынып жоқ. Біріншісін аш." : "No classes yet. Create your first.")
                  : (kk ? `Ашық: ${open}${archived ? ` · мұрағатта: ${archived}` : ""}` : `Open: ${open}${archived ? ` · archived: ${archived}` : ""}`)}
          </span>
        </span>
        <ChevronRight size={18} className="text-ink-3 shrink-0" />
      </button>

      <div className="card overflow-hidden divide-y divide-line">
        <div className="flex items-center justify-between gap-3 px-4 min-h-[56px]">
          <span className="text-[16px] text-ink">{kk ? "Тіл" : "Language"}</span>
          <div className="segmented w-[120px]" role="group" aria-label={kk ? "Тіл" : "Language"}>
            <button aria-pressed={kk} onClick={() => setLang("kk")}>ҚАЗ</button>
            <button aria-pressed={!kk} onClick={() => setLang("en")}>ENG</button>
          </div>
        </div>
        {roleSwitch}
        <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-sand/60">
          <span className="w-8 h-8 rounded-lg bg-felt flex items-center justify-center"><LogOut size={16} className="text-white" /></span>
          <span className="flex-1 text-[16px] text-felt font-medium">{kk ? "Шығу" : "Sign out"}</span>
        </button>
      </div>
    </div>
  );
}
