// Regenerates public/sitemap.xml from the lesson list in src/lib/lessons-data.tsx.
// Parses the source as text rather than importing it, since that file also
// pulls in lucide icons and lazy() component imports that don't need to run
// for this. Re-run this (npm run generate:sitemap) whenever lessons change —
// it also runs automatically as part of `npm run build`.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

const siteConfigSource = readFileSync(path.join(root, "src/lib/site-config.ts"), "utf-8")
const siteConfigUrl = siteConfigSource.match(/SITE_URL\s*=\s*"([^"]+)"/)?.[1]
if (!siteConfigUrl) {
  throw new Error("generate-sitemap: couldn't find SITE_URL in src/lib/site-config.ts")
}
const SITE_URL = process.env.SITE_URL || siteConfigUrl

const source = readFileSync(path.join(root, "src/lib/lessons-data.tsx"), "utf-8")
const slugs = [...source.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1])

if (slugs.length === 0) {
  throw new Error("generate-sitemap: found no lesson slugs — check the regex against lessons-data.tsx")
}

const today = new Date().toISOString().slice(0, 10)

const urls = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/interview-questions", changefreq: "monthly", priority: "0.9" },
  ...slugs.map((slug) => ({ loc: `/lessons/${slug}`, changefreq: "monthly", priority: "0.8" })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${SITE_URL}${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`

writeFileSync(path.join(root, "public/sitemap.xml"), xml)
console.log(`generate-sitemap: wrote public/sitemap.xml with ${urls.length} URLs`)
