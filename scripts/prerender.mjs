import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build as viteBuild } from 'vite';
import react from '@vitejs/plugin-react';
import { generateSW } from 'workbox-build';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SSR_OUT_DIR = path.join(ROOT_DIR, '.ssr-tmp');

function escapeHtmlText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/<\//g, '<\\/');
}

const VALID_NAVIGATION_ALLOWLIST = [
  /^\/$/,
  /^\/home\/?$/,
  /^\/tools\/?$/,
  /^\/merge-pdf\/?$/,
  /^\/split-pdf\/?$/,
  /^\/compress-pdf\/?$/,
  /^\/images-to-pdf\/?$/,
  /^\/pdf-to-images\/?$/,
  /^\/rotate-pdf\/?$/,
  /^\/delete-pdf-pages\/?$/,
  /^\/reorder-pdf-pages\/?$/,
  /^\/add-page-numbers\/?$/,
  /^\/watermark-pdf\/?$/,
  /^\/ocr-pdf\/?$/,
  /^\/edit-pdf-metadata\/?$/,
  /^\/unlock-pdf\/?$/,
  /^\/banking-finance\/?$/,
  /^\/banking\/us-banks\/?$/,
  /^\/banking\/us-banks\/(chase|bank-of-america|wells-fargo|citi|us-bank)\/?$/,
  /^\/banking\/financial-templates\/?$/,
  /^\/banking\/financial-pdf-form-filler\/?$/,
  /^\/banking\/financial-document-privacy\/?$/,
  /^\/about\/?$/,
  /^\/contact\/?$/,
  /^\/privacy\/?$/,
  /^\/terms\/?$/,
  /^\/dmca\/?$/,
];

/**
 * Vite SSR plugin that replaces browser-only PDF viewer packages (react-pdf / pdfjs_viewer)
 * with tiny SSR-safe no-ops. Real PdfPreview only mounts after a user selects a file in browser.
 */
function ssrBrowserLibStubPlugin() {
  const virtualWorkerId = '\0ssr-stub:pdf-worker-url';
  const virtualReactPdfId = '\0ssr-stub:react-pdf';

  return {
    name: 'pdfquick-ssr-browser-stub',
    enforce: 'pre',
    resolveId(id) {
      if (id.includes('pdf.worker') && id.includes('?url')) {
        return virtualWorkerId;
      }
      if (id === 'react-pdf') {
        return virtualReactPdfId;
      }
      return null;
    },
    load(id) {
      if (id === virtualWorkerId) {
        return `export default '/assets/pdf.worker.min.mjs';`;
      }
      if (id === virtualReactPdfId) {
        return [
          `export const pdfjs = { GlobalWorkerOptions: {} };`,
          `export const Document = () => null;`,
          `export const Page = () => null;`,
          `export default { pdfjs, Document, Page };`,
        ].join('\n');
      }
      return null;
    },
  };
}

function buildRouteHtmlDocument(templateHtml, routePath, appHtml, head) {
  const canonical = head.canonicalHref;
  const escapedTitle = escapeHtmlText(head.title);
  const escapedTitleAttr = escapeHtmlAttr(head.title);
  const escapedDescAttr = escapeHtmlAttr(head.description);

  let html = templateHtml;

  // Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapedTitle}</title>`);

  // Replace or insert robots meta
  if (/<meta\s+name="robots"[^>]*>/i.test(html)) {
    html = html.replace(
      /<meta\s+name="robots"[^>]*>/i,
      `<meta name="robots" content="${head.noindex ? 'noindex, nofollow' : 'index, follow'}" />`
    );
  }

  // Replace meta description (multiline-safe)
  html = html.replace(
    /<meta\s+name="description"[\s\S]*?\/>/i,
    `<meta name="description" content="${escapedDescAttr}" />`
  );

  // Replace canonical link
  if (canonical) {
    html = html.replace(
      /<link\s+rel="canonical"[^>]*\/?>/i,
      `<link rel="canonical" href="${escapeHtmlAttr(canonical)}" />`
    );
  } else {
    html = html.replace(/<link\s+rel="canonical"[^>]*\/?>\s*/gi, '');
  }

  // Replace existing hreflang tags cleanly (ONLY valid en + x-default)
  html = html.replace(/<link[^>]*rel="alternate"[^>]*hreflang="[^"]*"[^>]*\/?>\s*/gi, '');
  if (canonical && !head.noindex) {
    const hreflangTags = [
      `<link id="pdfquick-hreflang-en" rel="alternate" hreflang="en" href="${escapeHtmlAttr(canonical)}" />`,
      `<link id="pdfquick-hreflang-x-default" rel="alternate" hreflang="x-default" href="${escapeHtmlAttr(canonical)}" />`,
    ].join('\n    ');
    html = html.replace(
      /(<link\s+rel="canonical"[^>]*\/?>)/i,
      `$1\n    ${hreflangTags}`
    );
  }

  // Replace OpenGraph & Twitter Card tags
  html = html.replace(
    /<meta\s+property="og:title"[^>]*\/?>/i,
    `<meta property="og:title" content="${escapedTitleAttr}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[\s\S]*?\/>/i,
    `<meta property="og:description" content="${escapedDescAttr}" />`
  );
  if (canonical) {
    html = html.replace(
      /<meta\s+property="og:url"[^>]*\/?>/i,
      `<meta property="og:url" content="${escapeHtmlAttr(canonical)}" />`
    );
  } else {
    html = html.replace(/<meta\s+property="og:url"[^>]*\/?>\s*/gi, '');
  }

  html = html.replace(
    /<meta\s+name="twitter:title"[^>]*\/?>/i,
    `<meta name="twitter:title" content="${escapedTitleAttr}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[\s\S]*?\/>/i,
    `<meta name="twitter:description" content="${escapedDescAttr}" />`
  );

  // Inject JSON-LD structured data cleanly before </head>
  const jsonLdScripts = [];
  if (!head.noindex && head.schema) {
    jsonLdScripts.push(
      `<script id="pdfquick-seo-structured-data" type="application/ld+json">${safeJsonLd(head.schema)}</script>`
    );
  }
  if (!head.noindex && head.faqSchema) {
    const toolAttr = routePath === '/' ? 'home' : routePath.replace(/^\//, '');
    jsonLdScripts.push(
      `<script id="pdfquick-faq-jsonld" type="application/ld+json" data-tool="${escapeHtmlAttr(toolAttr)}">${safeJsonLd(head.faqSchema)}</script>`
    );
  }

  if (jsonLdScripts.length > 0) {
    html = html.replace('</head>', `    ${jsonLdScripts.join('\n    ')}\n  </head>`);
  }

  // Inject rendered React HTML & data-ssr-route marker into #root
  html = html.replace(
    /<div\s+id="root"\s+class="([^"]*)"\s*><\/div>/i,
    `<div id="root" class="$1" data-ssr-route="${escapeHtmlAttr(routePath)}">${appHtml}</div>`
  );

  return html;
}

async function verifySitemapParity(routes) {
  const sitemapXml = await fs.readFile(path.join(ROOT_DIR, 'public', 'sitemap.xml'), 'utf8');
  const locMatches = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
  const sitemapPaths = locMatches.map((loc) => {
    const url = new URL(loc);
    return url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
  });

  const routeSet = new Set(routes);
  const sitemapSet = new Set(sitemapPaths);

  const missingFromPrerender = sitemapPaths.filter((p) => !routeSet.has(p));
  const missingFromSitemap = routes.filter((p) => !sitemapSet.has(p));

  if (missingFromPrerender.length > 0 || missingFromSitemap.length > 0) {
    throw new Error(
      `Sitemap/prerender route mismatch. Missing from prerender: [${missingFromPrerender.join(', ')}], missing from sitemap: [${missingFromSitemap.join(', ')}]`
    );
  }
}

async function run() {
  const templatePath = path.join(DIST_DIR, 'index.html');
  const templateHtml = await fs.readFile(templatePath, 'utf8');

  await fs.rm(SSR_OUT_DIR, { recursive: true, force: true });

  try {
    console.log('[prerender] Compiling SSR bundle for static route generation...');
    await viteBuild({
      configFile: false,
      root: ROOT_DIR,
      logLevel: 'warn',
      plugins: [ssrBrowserLibStubPlugin(), react()],
      resolve: {
        alias: {
          '@': ROOT_DIR,
        },
      },
      ssr: {
        // Ensure workspace dependencies are resolved smoothly in Node SSR
        noExternal: ['lucide-react', 'bidi-js', 'arabic-reshaper'],
      },
      build: {
        ssr: 'src/entry-server.tsx',
        outDir: SSR_OUT_DIR,
        emptyOutDir: true,
        rollupOptions: {
          output: {
            format: 'es',
            entryFileNames: 'entry-server.mjs',
          },
        },
      },
    });

    const serverModuleUrl = pathToFileURL(path.join(SSR_OUT_DIR, 'entry-server.mjs')).href;
    const { CANONICAL_PRERENDER_ROUTES, renderRouteToHtml } = await import(serverModuleUrl);

    await verifySitemapParity(CANONICAL_PRERENDER_ROUTES);

    const seenTitles = new Map();
    const seenDescs = new Map();

    for (const routePath of CANONICAL_PRERENDER_ROUTES) {
      const { appHtml, head } = renderRouteToHtml(routePath);

      const h1Count = (appHtml.match(/<h1[\s>]/gi) || []).length;
      if (h1Count !== 1) {
        throw new Error(`Expected exactly 1 <h1> on route ${routePath}, found ${h1Count}`);
      }
      if (!head.title || !head.description || !head.canonicalHref) {
        throw new Error(`Missing SEO title/description/canonical on route ${routePath}`);
      }
      if (seenTitles.has(head.title)) {
        throw new Error(`Duplicate <title> "${head.title}" on ${routePath} and ${seenTitles.get(head.title)}`);
      }
      if (seenDescs.has(head.description)) {
        throw new Error(
          `Duplicate <meta description> on ${routePath} and ${seenDescs.get(head.description)}`
        );
      }
      seenTitles.set(head.title, routePath);
      seenDescs.set(head.description, routePath);

      const finalHtml = buildRouteHtmlDocument(templateHtml, routePath, appHtml, head);

      const outFile =
        routePath === '/'
          ? path.join(DIST_DIR, 'index.html')
          : path.join(DIST_DIR, routePath.replace(/^\//, ''), 'index.html');

      await fs.mkdir(path.dirname(outFile), { recursive: true });
      await fs.writeFile(outFile, finalHtml, 'utf8');
    }

    console.log(`[prerender] Successfully pre-rendered ${CANONICAL_PRERENDER_ROUTES.length} static routes.`);

    // Regenerate Workbox sw.js after writing prerendered HTML files so precache revisions match 100%
    // and nonexistent routes are NEVER rewritten to cached /index.html by the service worker.
    const swDest = path.join(DIST_DIR, 'sw.js');
    const { count, size } = await generateSW({
      swDest,
      globDirectory: DIST_DIR,
      globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,woff,woff2,ttf}'],
      globIgnores: ['tesseract/**', '404.html', 'google*.html'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
      navigateFallback: '/index.html',
      navigateFallbackAllowlist: VALID_NAVIGATION_ALLOWLIST,
      navigateFallbackDenylist: [/^\/api\//, /^\/google[a-z0-9]+\.html$/i],
      runtimeCaching: [
        {
          urlPattern: /^\/tesseract\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'local-tesseract-ocr-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 180,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    });

    console.log(`[prerender] Regenerated sw.js precache manifest (${count} entries, ${(size / 1024 / 1024).toFixed(2)} MB).`);
  } finally {
    await fs.rm(SSR_OUT_DIR, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error('[prerender] Failed:', err);
  process.exit(1);
});
