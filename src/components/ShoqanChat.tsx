import React, { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useLang } from "../lang";

export const ShoqanChat = () => {
  const kk = useLang() === "kk";
  const tr = (kkText: string, enText: string) => (kk ? kkText : enText);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>(() => [
    { role: "assistant", content: kk
      ? "Сәлем! Мен Шоқанмын 👋 Ағылшын тілі, қазақ тілі немесе Ertegi English туралы сұра."
      : "Sälem! I'm Shoqan 👋 Ask me about English, Kazakh, or how to use Ertegi English." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const BUBBLE_SIZE = 64;
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem("shoqan_bubble_pos");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      x: (typeof window !== "undefined" ? window.innerWidth : 400) - BUBBLE_SIZE - 16,
      y: (typeof window !== "undefined" ? window.innerHeight : 800) - BUBBLE_SIZE - 110,
    };
  });
  const dragRef = useRef({ dragging: false, moved: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const clampPos = (x: number, y: number) => {
    const margin = 8;
    const maxX = window.innerWidth - BUBBLE_SIZE - margin;
    const maxY = window.innerHeight - BUBBLE_SIZE - margin;
    return { x: Math.min(Math.max(margin, x), maxX), y: Math.min(Math.max(margin, y), maxY) };
  };

  // Other screens open the chat with a "shoqan:open" event, optionally with a draft question.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const draft = (e as CustomEvent<string | undefined>).detail;
      if (draft) setInput(draft);
      setOpen(true);
    };
    window.addEventListener("shoqan:open", onOpen);
    return () => window.removeEventListener("shoqan:open", onOpen);
  }, []);

  useEffect(() => {
    const onResize = () => setPos((p: { x: number; y: number }) => clampPos(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragRef.current = { dragging: true, moved: false, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true;
    setPos(clampPos(dragRef.current.origX + dx, dragRef.current.origY + dy));
  };

  const handlePointerUp = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (dragRef.current.moved) {
      try {
        localStorage.setItem("shoqan_bubble_pos", JSON.stringify(pos));
      } catch {}
    } else {
      setOpen(true);
    }
  };

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setChatError(null);
    setSending(true);

    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch("/api/shoqan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${s?.access_token ?? ""}`,
        },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setChatError(tr("Шоқан қазір жауап бере алмады. Біраздан соң қайта байқап көр.", "Shoqan couldn't respond just now — try again in a moment."));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ left: pos.x, top: pos.y }}
        className={`fixed z-[65] w-16 h-16 rounded-full overflow-hidden border-[3px] border-card ring-2 ring-sun shadow-[0_4px_0_var(--color-sun-deep),0_10px_24px_-8px_rgba(28,35,51,0.35)] transition-transform touch-none cursor-grab active:cursor-grabbing ${
          open ? "scale-0" : "scale-100"
        }`}
        title={tr("Шоқаннан сұра: жылжыту үшін сүйре, ашу үшін бас", "Ask Shoqan — drag to move, tap to open")}
      >
        <img src="/shoqan-avatar.jpg" alt={tr("Шоқан", "Shoqan")} className="w-full h-full object-cover pointer-events-none" draggable={false} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[75] bg-ink/35 backdrop-blur-[2px] flex items-end sm:items-center justify-center">
          <div className="w-full max-w-[480px] mb-0 max-h-[85dvh] h-[75dvh] bg-sand flex flex-col rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl animate-sheet-up sm:animate-pop-in">
            <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-line">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-sun shrink-0">
                  <img src="/shoqan-avatar.jpg" alt={tr("Шоқан", "Shoqan")} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-display text-[17px] font-black text-ink leading-tight">{tr("Шоқан", "Shoqan")}</p>
                  <p className="text-xs text-ink-2">{tr("Ағылшын және қазақ тілі көмекшісі", "English & Kazakh helper")}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label={tr("Жабу", "Close")} className="w-9 h-9 rounded-full bg-sand-2 text-ink-2 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 text-[15px] leading-relaxed rounded-[20px] ${
                      m.role === "user"
                        ? "bg-sky text-white rounded-br-md"
                        : "bg-card text-ink border border-line rounded-bl-md"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-card border border-line px-3.5 py-2.5 rounded-[20px] text-sm text-ink-2 italic">
                    {tr("Шоқан ойланып жатыр...", "Shoqan is thinking...")}
                  </div>
                </div>
              )}
              {chatError && <p className="text-sm text-felt-deep text-center">{chatError}</p>}
            </div>

            <div className="p-3 bg-card border-t border-line flex items-center gap-2 pb-[max(env(safe-area-inset-bottom),12px)]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder={tr("Ағылшын, қазақ тілі немесе қосымша туралы сұра...", "Ask about English, Kazakh, or the app...")}
                className="field !min-h-[44px] !rounded-full"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                aria-label={tr("Жіберу", "Send")}
                className="w-11 h-11 shrink-0 rounded-full bg-sky disabled:bg-sand-3 disabled:text-ink-3 text-white flex items-center justify-center"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
