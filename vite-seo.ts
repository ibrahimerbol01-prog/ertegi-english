import type { Plugin } from 'vite'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/* Search discoverability (docs/seo.md). One plugin, so the address of the site is set in one place:
   VITE_SITE_URL (default: the vercel.app address). The ordinary site gets a canonical link, Open Graph
   tags, JSON-LD, sitemap.xml and robots.txt; the frozen research site (VITE_RESEARCH_MODE=1) must stay
   out of search: noindex in the page and Disallow in robots.txt, no sitemap.
   Verification tags for Google Search Console / Yandex Webmaster come from env, not from the code. */
export const DEFAULT_SITE_URL = 'https://ertegi-english.vercel.app'

export function seoPlugin(opts: { research: boolean; siteUrl?: string; google?: string; yandex?: string; bing?: string }): Plugin {
  const site = (opts.siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, '')
  const title = 'Ertegi English — қазақ ертегілері арқылы ағылшын тілін үйрен | Learn English through Kazakh folklore'
  const description =
    'Ertegi English: қазақ ертегілері мен аңыздары арқылы ағылшын тілін үйрен. A1–C1 деңгейіндегі әңгімелер, сөздік, квиз және айтылым жаттығулары. Learn English through Kazakh folk tales at five levels: words, quizzes, pronunciation.'
  const meta = (name: string, content: string) => `<meta name="${name}" content="${content}" />`
  const verification = [
    opts.google && meta('google-site-verification', opts.google),
    opts.yandex && meta('yandex-verification', opts.yandex),
    opts.bing && meta('msvalidate.01', opts.bing),
  ].filter(Boolean)

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Ertegi English',
    url: `${site}/`,
    description,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    inLanguage: ['kk', 'en'],
    audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
    teaches: 'English language',
  })

  const searchTags = [
    ...verification,
    `<link rel="canonical" href="${site}/" />`,
    meta('robots', 'index, follow'),
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Ertegi English" />',
    '<meta property="og:locale" content="kk_KZ" />',
    '<meta property="og:locale:alternate" content="en_US" />',
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${site}/" />`,
    `<meta property="og:image" content="${site}/story-poster.jpg" />`,
    '<meta property="og:image:width" content="640" />',
    '<meta property="og:image:height" content="360" />',
    meta('twitter:card', 'summary_large_image'),
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${site}/story-poster.jpg" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ]
  // A crawler that does not run scripts still finds what the site is.
  const noscript =
    '<noscript><main><h1>Ertegi English</h1>' +
    '<p>Қазақ ертегілері мен аңыздары арқылы ағылшын тілін үйрен: A1-ден C1-ге дейінгі бес деңгейдегі әңгімелер, сөздік, квиздер және айтылым жаттығулары. Қосымша жұмыс істеуі үшін JavaScript қосу керек.</p>' +
    '<p>Learn English through Kazakh folk tales: stories at five levels (A1–C1), vocabulary, quizzes and pronunciation practice. Please enable JavaScript to use the app.</p></main></noscript>'

  return {
    name: 'ertegi-seo',
    transformIndexHtml(html) {
      let out = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta\s+name="description"[\s\S]*?\/>/, meta('description', description))
      if (opts.research) {
        return out.replace('</head>', `    ${meta('robots', 'noindex, nofollow, noarchive')}\n  </head>`)
      }
      out = out.replace('</head>', `    ${searchTags.join('\n    ')}\n  </head>`)
      return out.replace('<div id="root"></div>', `<div id="root"></div>\n    ${noscript}`)
    },
    closeBundle() {
      // Written after Vite copied public/: this is the only robots.txt and sitemap.xml of the build.
      const dir = join(process.cwd(), 'dist')
      mkdirSync(dir, { recursive: true })
      writeFileSync(
        join(dir, 'robots.txt'),
        opts.research
          ? 'User-agent: *\nDisallow: /\n'
          : `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site}/sitemap.xml\n`,
      )
      if (!opts.research) {
        writeFileSync(
          join(dir, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>\n`,
        )
      }
    },
  }
}
