/* Story titles in constants are written in caps; show them in title case so
   headings read like Apple titles, not banners. Mixed-case input is kept. */
const SMALL_WORDS = new Set(["a", "an", "and", "the", "of", "to", "in", "on"]);

export const displayTitle = (s: string) =>
  s !== s.toUpperCase()
    ? s
    : s.split(" ").map((w, i) => {
        if (/^[IVXLC]+$/.test(w)) return w;
        const lower = w.toLowerCase();
        if (i > 0 && SMALL_WORDS.has(lower)) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }).join(" ");
