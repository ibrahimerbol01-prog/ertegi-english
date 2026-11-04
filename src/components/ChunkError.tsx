import { Sheet } from "./UIHelpers";

/* Stands in for a lazily loaded window whose code could not be downloaded
   (offline before the service worker cached it, or a deploy replaced the
   files). Without it React would drop the whole screen. */
export function ChunkError({ lang, onClose }: { lang: string; onClose: () => void }) {
  const kk = lang !== "en";
  return (
    <Sheet open onClose={onClose} label={kk ? "Жүктелмеді" : "Could not load"}>
      <div className="p-6 pt-4">
        <h3 className="font-display text-xl font-black text-ink mb-2">{kk ? "Жүктелмеді" : "Could not load"}</h3>
        <p role="alert" className="text-sm text-ink-2 leading-relaxed">
          {kk ? "Интернетті тексеріп, бетті жаңарт." : "Check the connection and reload the page."}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button onClick={onClose} className="btn btn-ghost">{kk ? "Жабу" : "Close"}</button>
          <button onClick={() => window.location.reload()} className="btn">{kk ? "Жаңарту" : "Reload"}</button>
        </div>
      </div>
    </Sheet>
  );
}
