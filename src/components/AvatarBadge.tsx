import { QoshqarMuyiz, Shanyraq, Tumar } from "./Ornaments";
import { StoryCover } from "./StoryCover";
import { parseAvatar } from "../utils/profileEdit";

const BG = { sky: "bg-sky", jade: "bg-jade", sun: "bg-sun", felt: "bg-felt", night: "bg-night" } as const;

/* The profile picture: a chosen avatar (src/utils/profileEdit.ts), or the first
   letter of the name when there is none. */
export function AvatarBadge({ id, initial, className = "" }: { id?: string | null; initial: string; className?: string }) {
  const a = parseAvatar(id);
  const base = `rounded-full overflow-hidden flex items-center justify-center ${className}`;
  if (!a) return <div className={`${base} bg-sun font-display font-black text-ink`}>{initial}</div>;
  if (a.kind === "tale") return <div className={base}><StoryCover id={a.tale} className="w-full h-full" /></div>;
  const Icon = a.ornament === "qoshqar" ? QoshqarMuyiz : a.ornament === "shanyraq" ? Shanyraq : Tumar;
  return <div className={`${base} ${BG[a.color]} text-white`}><Icon className="w-3/5 h-3/5" strokeWidth={3} /></div>;
}
