import { lazy, Suspense, useState } from "react";
import { ChevronRight, ShieldCheck, Trash2 } from "lucide-react";
import { orChunkError } from "../utils/lazyChunk";

/* Profile rows for the privacy policy and account deletion, shared by the
   learner's and the teacher's profile. Both windows load on first tap. */
const PrivacyPolicySheet = lazy(() => orChunkError(import("./PrivacyPolicy").then((m) => m.PrivacyPolicySheet)));
const DeleteAccountSheet = lazy(() => orChunkError(import("./DeleteAccount").then((m) => m.DeleteAccountSheet)));

export function PolicyRow({ lang }: { lang: string }) {
  const [open, setOpen] = useState(false);
  const kk = lang !== "en";
  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-sand/60">
        <span className="w-8 h-8 rounded-lg bg-sky flex items-center justify-center"><ShieldCheck size={16} className="text-white" aria-hidden="true" /></span>
        <span className="flex-1 text-[16px] text-ink">{kk ? "Құпиялылық саясаты" : "Privacy Policy"}</span>
        <ChevronRight size={18} className="text-ink-3" aria-hidden="true" />
      </button>
      {open && <Suspense fallback={null}><PrivacyPolicySheet lang={lang} onClose={() => setOpen(false)} /></Suspense>}
    </>
  );
}

export function DeleteAccountCard({ lang, teacher = false }: { lang: string; teacher?: boolean }) {
  const [open, setOpen] = useState(false);
  const kk = lang !== "en";
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(true)} aria-haspopup="dialog" className="w-full flex items-center gap-3 px-4 min-h-[56px] text-left hover:bg-sand/60">
        <span className="w-8 h-8 rounded-lg bg-felt-soft flex items-center justify-center"><Trash2 size={16} className="text-felt-deep" aria-hidden="true" /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-[16px] text-felt-deep font-medium">{kk ? "Аккаунтты өшіру" : "Delete account"}</span>
          <span className="block text-[13px] text-ink-2">{kk ? "Барлық деректер біржола өшеді" : "All your data is removed for good"}</span>
        </span>
        <ChevronRight size={18} className="text-ink-3" aria-hidden="true" />
      </button>
      {open && <Suspense fallback={null}><DeleteAccountSheet lang={lang} teacher={teacher} onClose={() => setOpen(false)} /></Suspense>}
    </div>
  );
}
