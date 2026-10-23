import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { TOOL_ROUTES } from './src/utils/toolCatalog'
import { getPageSeo, renderSeoTags } from './src/utils/seo'

// GitHub Pages serves the site from /<repo>/. Override with VITE_BASE for other hosts (e.g. VITE_BASE=/).
const PROD_BASE = process.env.VITE_BASE ?? '/pixavo/'
// Absolute public URL used for canonical links, Open Graph and the sitemap. Must end with "/".
const SITE_URL = process.env.VITE_SITE_URL ?? `https://sudhabnrj.github.io${PROD_BASE}`

const SEO_BLOCK = /<!--seo:start-->[\s\S]*?<!--seo:end-->/

const withSeo = (html: string, slug: string, siteUrl: string) =>
  html.replace(SEO_BLOCK, `<!--seo:start-->\n    ${renderSeoTags(getPageSeo(slug, siteUrl))}\n    <!--seo:end-->`)

/**
 * SEO for every page:
 * - fills the home page's <head> (also in dev, so it's never empty before JS runs)
 * - writes a real HTML page per tool (dist/raw-to-jpg/index.html) with its own title, description,
 *   canonical, Open Graph/Twitter tags and JSON-LD, so crawlers see them without running JavaScript
 * - writes 404.html (noindex), sitemap.xml and robots.txt
 */
function seoPages(): Plugin {
  let outDir = 'dist'
  let isBuild = false
  return {
    name: 'pixavo-seo-pages',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
      isBuild = config.command === 'build'
    },
    transformIndexHtml(html, ctx) {
      const devUrl = ctx.server ? `http://localhost:${ctx.server.config.server.port ?? 5173}/` : SITE_URL
      return withSeo(html, '', isBuild ? SITE_URL : devUrl)
    },
    closeBundle() {
      if (!isBuild) return
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      for (const route of TOOL_ROUTES) {
        fs.mkdirSync(path.join(outDir, route.slug), { recursive: true })
        fs.writeFileSync(path.join(outDir, route.slug, 'index.html'), withSeo(template, route.slug, SITE_URL))
      }
      fs.writeFileSync(path.join(outDir, '404.html'), withSeo(template, '__not-found__', SITE_URL))

      const today = new Date().toISOString().slice(0, 10)
      const urls = [
        { loc: SITE_URL, priority: '1.0' },
        ...TOOL_ROUTES.map((r) => ({ loc: `${SITE_URL}${r.slug}/`, priority: '0.8' })),
      ]
      const sitemap = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(
          (u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${u.priority}</priority></url>`,
        ),
        '</urlset>',
        '',
      ].join('\n')
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap)
      fs.writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // Absolute base so assets resolve from nested tool pages like /raw-to-jpg/. `vite preview` mirrors production.
  base: command === 'build' || isPreview ? PROD_BASE : '/',
  plugins: [
    react(),
    tailwindcss(),
    seoPages(),
  ],
}))
