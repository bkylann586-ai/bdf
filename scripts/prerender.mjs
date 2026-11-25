import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build as viteBuild } from 'vite';
import react from '@vitejs/plugin-react';
import { build as esbuildBuild } from 'esbuild';
import { injectManifest } from 'workbox-build';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SSR_OUT_DIR = path.join(ROOT_DIR, '.ssr-tmp');
const DEFAULT_PRODUCTION_URL = 'https://bdf-mufv.vercel.app';

function cleanEnvValue(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed || /^(MY_|YOUR_|example|placeholder|changeme)/i.test(trimmed)) {
    return '';
  }
  return trimmed;
}

function resolveProductionBaseUrl() {
  const candidates = [process.env.VITE_SITE_URL, process.env.VITE_PUBLIC_SITE_URL];
  for (const raw of candidates) {
    const cleaned = cleanEnvValue(raw);
    if (!cleaned) continue;
    try {
      const parsed = new URL(cleaned);
      const host = parsed.hostname.toLowerCase();
      if (
        (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
        host !== 'localhost' &&
        host !== '127.0.0.1' &&
        !host.includes('ais-dev-') &&
        !host.endsWith('.run.app')
      ) {
        return parsed.origin.replace(/\/+$/, '');
      }
    } catch {
      // ignore invalid URL
    }
  }
  return DEFAULT_PRODUCTION_URL;
}

function resolveAdSenseIds() {
  const rawPub = cleanEnvValue(process.env.VITE_ADSENSE_PUBLISHER_ID);
  const match = rawPub.match(/^(?:ca-)?(pub-\d{16})$/i);
  if (!match) return { enabled: false, clientId: null, publisherId: null };
  const publisherId = match[1].toLowerCase();
  return {
    enabled: process.env.VITE_ADSENSE_ENABLED === 'true',
    clientId: `ca-${publisherId}`,
    publisherId,
  };
}

function resolveCmpScriptUrl(adsense) {
  const explicit = cleanEnvValue(process.env.VITE_CMP_SCRIPT_URL);
  if (explicit) {
    try {
      const parsed = new URL(explicit);
      if (parsed.protocol === 'https:') return parsed.toString();
    } catch {
      return null;
    }
  }
  const provider = cleanEnvValue(process.env.VITE_CMP_PROVIDER).toLowerCase();
  if (provider === 'funding-choices' && adsense.clientId && adsense.enabled) {
    return `https://fundingchoicesmessages.google.com/i/${adsense.clientId}?ers=1`;
  }
  return null;
}

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

const SW_SRC_PATH = path.join(ROOT_DIR, 'src', 'sw.ts');

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

function buildRouteHtmlDocument(templateHtml, routePath, appHtml, head, options) {
  const { baseUrl, adsense, cmpScriptUrl } = options;
  const canonical = head.canonicalHref;
  const ogImageUrl = `${baseUrl}/og-image.png`;
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

  // Replace OpenGraph & Twitter Card tags (including 1200x630 social image bound to baseUrl)
  html = html.replace(
    /<meta\s+property="og:title"[^>]*\/?>/i,
    `<meta property="og:title" content="${escapedTitleAttr}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[\s\S]*?\/>/i,
    `<meta property="og:description" content="${escapedDescAttr}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"[^>]*\/?>/i,
    `<meta property="og:image" content="${escapeHtmlAttr(ogImageUrl)}" />`
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
  html = html.replace(
    /<meta\s+name="twitter:image"[^>]*\/?>/i,
    `<meta name="twitter:image" content="${escapeHtmlAttr(ogImageUrl)}" />`
  );

  // Inject JSON-LD structured data cleanly before </head>
  const headInjections = [];
  if (!head.noindex && head.schema) {
    headInjections.push(
      `<script id="pdfquick-seo-structured-data" type="application/ld+json">${safeJsonLd(head.schema)}</script>`
    );
  }
  if (!head.noindex && head.faqSchema) {
    const toolAttr = routePath === '/' ? 'home' : routePath.replace(/^\//, '');
    headInjections.push(
      `<script id="pdfquick-faq-jsonld" type="application/ld+json" data-tool="${escapeHtmlAttr(toolAttr)}">${safeJsonLd(head.faqSchema)}</script>`
    );
  }

  // Only inject CMP / AdSense tags when explicitly enabled & configured by the site owner
  if (cmpScriptUrl) {
    headInjections.push(`<script async src="${escapeHtmlAttr(cmpScriptUrl)}"></script>`);
  }
  if (adsense.enabled && adsense.clientId) {
    headInjections.push(
      `<meta name="google-adsense-account" content="${escapeHtmlAttr(adsense.clientId)}" />`
    );
    headInjections.push(
      `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsense.clientId)}" crossorigin="anonymous"></script>`
    );
  }

  if (headInjections.length > 0) {
    html = html.replace('</head>', `    ${headInjections.join('\n    ')}\n  </head>`);
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
  return sitemapXml;
}

async function emitDomainAwareDistArtifacts(sitemapTemplateXml, baseUrl, adsense) {
  // 1. Emit dist/robots.txt matched to active baseUrl
  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');
  await fs.writeFile(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf8');

  // 2. Emit dist/sitemap.xml matched to active baseUrl
  const updatedSitemap = sitemapTemplateXml.replaceAll(DEFAULT_PRODUCTION_URL, baseUrl);
  await fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), updatedSitemap, 'utf8');

  // 3. Emit dist/ads.txt ONLY with real publisher ID if configured; otherwise retain safe comment template
  if (adsense.publisherId) {
    const adsTxt = [
      '# PDFQuick Authorized Digital Sellers (IAB ads.txt)',
      `google.com, ${adsense.publisherId}, DIRECT, f08c47fec0942fa0`,
      '',
    ].join('\n');
    await fs.writeFile(path.join(DIST_DIR, 'ads.txt'), adsTxt, 'utf8');
  }
}

async function run() {
  const baseUrl = resolveProductionBaseUrl();
  const adsense = resolveAdSenseIds();
  const cmpScriptUrl = resolveCmpScriptUrl(adsense);

  const templatePath = path.join(DIST_DIR, 'index.html');
  const templateHtml = await fs.readFile(templatePath, 'utf8');

  await fs.rm(SSR_OUT_DIR, { recursive: true, force: true });

  try {
    console.log(`[prerender] Compiling SSR bundle for static route generation (baseUrl=${baseUrl})...`);
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

    const sitemapTemplateXml = await verifySitemapParity(CANONICAL_PRERENDER_ROUTES);

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

      const finalHtml = buildRouteHtmlDocument(templateHtml, routePath, appHtml, head, {
        baseUrl,
        adsense,
        cmpScriptUrl,
      });

      const outFile =
        routePath === '/'
          ? path.join(DIST_DIR, 'index.html')
          : path.join(DIST_DIR, routePath.replace(/^\//, ''), 'index.html');

      await fs.mkdir(path.dirname(outFile), { recursive: true });
      await fs.writeFile(outFile, finalHtml, 'utf8');
    }

    await emitDomainAwareDistArtifacts(sitemapTemplateXml, baseUrl, adsense);

    console.log(`[prerender] Successfully pre-rendered ${CANONICAL_PRERENDER_ROUTES.length} static routes.`);

    // Rebuild custom sw.ts and inject Workbox precache manifest after writing prerendered HTML files
    // so precache revisions match 100%, each canonical route resolves to its own SSR HTML,
    // and verification files / crawler-only assets / nonexistent routes are never precached.
    const swTemplatePath = path.join(SSR_OUT_DIR, 'sw-template.js');
    await esbuildBuild({
      entryPoints: [SW_SRC_PATH],
      outfile: swTemplatePath,
      bundle: true,
      minify: true,
      format: 'iife',
      platform: 'browser',
      target: ['es2020'],
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });

    const swDest = path.join(DIST_DIR, 'sw.js');
    const { count, size } = await injectManifest({
      swSrc: swTemplatePath,
      swDest,
      globDirectory: DIST_DIR,
      globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,woff2}'],
      globIgnores: [
        'tesseract/**',
        'fonts/**',
        '404.html',
        'og-image.png',
        'google*.html',
        '**/google*.html',
        'assets/aistudio/**',
        '**/*.map',
      ],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    });

    console.log(`[prerender] Injected sw.js precache manifest (${count} entries, ${(size / 1024 / 1024).toFixed(2)} MB).`);
  } finally {
    await fs.rm(SSR_OUT_DIR, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error('[prerender] Failed:', err);
  process.exit(1);
});
