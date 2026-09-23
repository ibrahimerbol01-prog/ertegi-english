import React, { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";

export const ShoqanChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Sälem! I'm Shoqan 👋 Ask me about English, Kazakh, or how to use Ertegi English." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const BUBBLE_SIZE = 80;
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem("shoqan_bubble_pos");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      x: (typeof window !== "undefined" ? window.innerWidth : 400) - BUBBLE_SIZE - 16,
      y: (typeof window !== "undefined" ? window.innerHeight : 800) - BUBBLE_SIZE - 96,
    };
  });
  const dragRef = useRef({ dragging: false, moved: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const clampPos = (x: number, y: number) => {
    const margin = 8;
    const maxX = window.innerWidth - BUBBLE_SIZE - margin;
    const maxY = window.innerHeight - BUBBLE_SIZE - margin;
    return { x: Math.min(Math.max(margin, x), maxX), y: Math.min(Math.max(margin, y), maxY) };
  };

  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p.x, p.y));
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
      const res = await fetch("/api/shoqan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setChatError("Shoqan couldn't respond just now — try again in a moment.");
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
        className={`fixed z-[65] w-20 h-20 rounded-full overflow-hidden border-[3px] border-[#C5A059] gold-glow shadow-xl transition-transform touch-none cursor-grab active:cursor-grabbing ${
          open ? "scale-0" : "scale-100"
        }`}
        title="Ask Shoqan — drag to move, tap to open"
      >
        <img src="/shoqan-avatar.jpg" alt="Shoqan" className="w-full h-full object-cover pointer-events-none" draggable={false} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[75] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-[400px] sm:mb-0 mb-0 max-h-[80vh] h-[75vh] glass-luxury-card flex flex-col rounded-t-[26px] sm:rounded-[26px] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#C5A059]/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#C5A059]/50 shrink-0">
                  <img src="/shoqan-avatar.jpg" alt="Shoqan" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-editorial text-xs font-extrabold text-[#F8F5EE] uppercase tracking-wide">Shoqan</p>
                  <p className="font-body text-[9px] text-[#F8F5EE]/50">English & Kazakh helper</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#F8F5EE]/50 hover:text-[#F8F5EE]">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-2.5 text-[11px] font-body leading-relaxed rounded-[14px] ${
                      m.role === "user"
                        ? "bg-[#C5A059] text-[#09090D] font-medium"
                        : "bg-[#14141C] text-[#F8F5EE]/90 border border-[#C5A059]/15"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-[#14141C] border border-[#C5A059]/15 p-2.5 rounded-[14px] text-[11px] text-[#F8F5EE]/40 italic">
                    Shoqan is thinking...
                  </div>
                </div>
              )}
              {chatError && <p className="text-[10px] text-[#B2533E] text-center">{chatError}</p>}
            </div>

            <div className="p-3 border-t border-[#C5A059]/20 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Ask about English, Kazakh, or the app..."
                className="flex-1 p-2.5 bg-[#14141C] border border-[#C5A059]/20 rounded-full text-[11px] font-body text-[#F8F5EE] placeholder:text-[#F8F5EE]/30 outline-none focus:border-[#C5A059]/60"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-[#C5A059] to-[#9A7B38] disabled:opacity-40 text-[#09090D] flex items-center justify-center"
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
