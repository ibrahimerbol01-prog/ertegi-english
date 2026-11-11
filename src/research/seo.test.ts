import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_URL, seoPlugin } from "../../vite-seo.ts";

// The frozen study site must never be found through search; the ordinary site must be (docs/seo.md).
const page = '<html><head><meta name="description" content="x" /><title>old</title></head><body><div id="root"></div></body></html>';
const run = (opts: Parameters<typeof seoPlugin>[0]) => {
  const hook = seoPlugin(opts).transformIndexHtml as (h: string) => string;
  return hook(page);
};

describe("seo plugin", () => {
  it("keeps the research build out of search", () => {
    const html = run({ research: true, google: "tok" });
    expect(html).toContain('name="robots" content="noindex, nofollow, noarchive"');
    expect(html).not.toContain("canonical");
    expect(html).not.toContain("og:title");
    expect(html).not.toContain("google-site-verification");
  });
  it("gives the ordinary build a canonical link, social tags, structured data and a no-script text", () => {
    const html = run({ research: false });
    expect(html).toContain(`rel="canonical" href="${DEFAULT_SITE_URL}/"`);
    expect(html).toContain('property="og:title"');
    expect(html).toContain("application/ld+json");
    expect(html).toContain("<noscript>");
    expect(html).not.toContain("noindex");
    expect(html).toContain("<title>Ertegi English");
  });
  it("takes the address and the verification tags from settings, without a double slash", () => {
    const html = run({ research: false, siteUrl: "https://example.kz/", google: "g1", yandex: "y1" });
    expect(html).toContain('rel="canonical" href="https://example.kz/"');
    expect(html).toContain('name="google-site-verification" content="g1"');
    expect(html).toContain('name="yandex-verification" content="y1"');
  });
});
