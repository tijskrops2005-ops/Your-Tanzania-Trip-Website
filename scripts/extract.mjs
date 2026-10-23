// Turns the raw WordPress HTML in .cache/raw into:
//   content/pages/<slug>.html   page body (between header and footer)
//   content/pages.json          per-page metadata (title, meta tags, body class, ...)
//   content/redirects.json      old URL -> new URL
//   src/partials/*.html         shared chrome taken from the homepage (header, footer, modals)
//   src/styles/head.css         inline <style> blocks WordPress printed in <head>
//   .cache/assets-needed.txt    every /wp-content file referenced, for download-assets.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const rawDir = path.join(root, '.cache/raw');
const outDir = path.join(root, 'content/pages');
const partialsDir = path.join(root, 'src/partials');
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(partialsDir, { recursive: true });

const redirects = JSON.parse(await fs.readFile(path.join(root, '.cache/redirects.json'), 'utf8'));

// Scripts we drop: tracking, chat, bot protection and the cache plugin's own helpers.
const DROP_SCRIPT = /ts_track_view|googletagmanager|gtm\.tanzaniaspecialist|gtm\.js|dataLayer|attributer|cheq|paradome|clicktrue|recaptcha|tawk\.to|Tawk_API|vitals\.min\.js|flying-press|speculationrules|hotjar|clarity\.ms|facebook\.net|fbq\(|__CF\$cv\$params/i;

const decodeAttr = s => s.replace(/&amp;/g, '&').replace(/&#038;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'");

function processScripts(html) {
  return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (all, attrs, body) => {
    if (/type=["']?(speculationrules|application\/ld\+json)/i.test(attrs)) return '';
    const dataSrc = attrs.match(/\sdata-src=("([^"]*)"|'([^']*)')/);
    let src = dataSrc ? decodeAttr(dataSrc[2] ?? dataSrc[3]) : (attrs.match(/\ssrc=["']([^"']*)["']/) || [])[1];
    let cleanAttrs = attrs
      .replace(/\sdata-src=("[^"]*"|'[^']*')/, '')
      .replace(/\sdata-loading-method=("[^"]*"|'[^']*')/, '')
      .replace(/\ssrc=("[^"]*"|'[^']*')/, '');
    if (src && src.startsWith('data:text/javascript,')) {
      body = decodeURIComponent(src.slice('data:text/javascript,'.length));
      src = null;
    }
    if (DROP_SCRIPT.test(src || '') || DROP_SCRIPT.test(body) || DROP_SCRIPT.test(cleanAttrs)) return '';
    if (src) return `<script${cleanAttrs} src="${src}"></script>`;
    return `<script${cleanAttrs}>${body}</script>`;
  });
}

function processLazy(html) {
  return html
    // Stylesheets deferred with media="print" + data-href.
    .replace(/<link\b([^>]*?)\sdata-href=("([^"]*)"|'([^']*)')([^>]*)>/gi, (all, a, _q, h1, h2, b) =>
      `<link${(a + b).replace(/\smedia=["']print["']/, '').replace(/\sonload=("[^"]*"|'[^']*')/, '')} href="${h1 ?? h2}">`)
    // The cache plugin lazy-loads iframes via data-lazy-src; the theme's own carousels use the
    // same attribute for images, so only iframes are converted.
    .replace(/<iframe\b[^>]*>/gi, tag => tag.replace(/\sdata-lazy-src=/, ' src='))
    .replace(/ flying-press-lazy-bg/g, '')
    .replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');
}

const KEEP_REMOTE = '(?!wp-json|wp-admin)';
function localizeUrls(html) {
  return html
    .replace(new RegExp(`https?:\\/\\/tanzania-specialist\\.com\\/${KEEP_REMOTE}`, 'g'), '/')
    .replace(new RegExp(`(["'(\\s])\\/\\/tanzania-specialist\\.com\\/${KEEP_REMOTE}`, 'g'), '$1/')
    .replace(new RegExp(`https?:\\\\\\/\\\\\\/tanzania-specialist\\.com\\\\\\/${KEEP_REMOTE}`, 'g'), '\\/')
    // Links to URLs that redirect go straight to their target.
    .replace(/href="(\/[^"#?]*)/g, (all, p) => {
      const to = redirects[p];
      return to ? `href="${to.startsWith('http') ? to : to}` : all;
    });
}

const transform = html => localizeUrls(processLazy(processScripts(html)));

const meta = (head, re) => { const m = head.match(re); return m ? decodeAttr(m[1]) : null; };
const metaName = (head, name) => meta(head, new RegExp(`<meta\\s+(?:name|property)=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'));

function split(html) {
  const bodyStart = html.indexOf('<body');
  const bodyTagEnd = html.indexOf('>', bodyStart) + 1;
  const hamburger = html.indexOf('js-hamburger-sticky', bodyTagEnd);
  const headerEnd = html.indexOf('</button>', hamburger) + '</button>'.length;
  const footerStart = html.indexOf('<footer', headerEnd);
  const bodyEnd = html.lastIndexOf('</body>');
  return {
    head: html.slice(0, bodyStart),
    bodyTag: html.slice(bodyStart, bodyTagEnd),
    header: html.slice(bodyTagEnd, headerEnd),
    content: html.slice(headerEnd, footerStart),
    footer: html.slice(footerStart, bodyEnd),
  };
}

const headStyles = new Map();
const pages = [];
const assets = new Set();
const collectAssets = html => {
  for (const m of html.matchAll(/\/wp-(?:content|includes)\/[^"'\s,)\\?]+/g)) assets.add(m[0]);
};

// Scripts after the footer that the homepage also has are part of the shared footer partial;
// anything else (e.g. FacetWP data on archive pages) is kept per page.
const scriptSig = tag => (tag.match(/\ssrc="([^"?]*)/) || [])[1] || tag.replace(/<script[^>]*>/, '').replace(/\s+/g, '').replace(/[A-Za-z0-9+\/=]{10,}/g, '#');
const homeFooterSigs = new Set(
  [...transform(split(await fs.readFile(path.join(rawDir, 'index.html'), 'utf8')).footer).matchAll(/<script\b[\s\S]*?<\/script>/g)]
    .map(m => scriptSig(m[0]))
);

const stylesheetLinks = head => [...head.matchAll(/<link\b[^>]*>/g)].map(m => m[0])
  .filter(l => /stylesheet|data-href/.test(l)).map(l => localizeUrls(processLazy(l)).replace(/ \/ href=/, ' href='));
// Same stylesheet can come from the cache plugin or the plugin folder; WordPress' handle id is stable.
const linkHref = l => (l.match(/\sid=["']([^"']+)["']/) || l.match(/href=["']([^"'?]*)/) || [])[1];
const homeLinkHrefs = new Set(stylesheetLinks(split(await fs.readFile(path.join(rawDir, 'index.html'), 'utf8')).head).map(linkHref));

const files = (await fs.readdir(rawDir)).filter(f => f.endsWith('.html')).sort();
for (const file of files) {
  const html = await fs.readFile(path.join(rawDir, file), 'utf8');
  if (!html.includes('<body')) continue;
  const parts = split(html);
  const slug = file.replace(/\.html$/, '');
  const urlPath = slug === 'index' ? '/' : '/' + slug.replace(/__/g, '/') + '/';

  for (const m of parts.head.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)) {
    if (/flying-press/.test(m[1])) continue;
    const id = (m[1].match(/id=["']([^"']+)["']/) || [])[1] || m[2].slice(0, 40);
    if (!headStyles.has(id)) headStyles.set(id, m[2]);
  }

  // The sticky "Make a request" button after the footer differs per page (trips link to their own form).
  const sticky = parts.footer.match(/<a href="([^"]*)"\s+class="hidden sticky-travel-proposal-btn">\s*([^<]*?)\s*<\/a>/);
  const ldJson = [...parts.head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);

  const content = transform(parts.content);
  const extraScripts = [...transform(parts.footer).matchAll(/<script\b[\s\S]*?<\/script>/g)]
    .map(m => m[0]).filter(tag => !homeFooterSigs.has(scriptSig(tag)));
  extraScripts.forEach(collectAssets);
  stylesheetLinks(parts.head).forEach(collectAssets);
  collectAssets(content);
  await fs.writeFile(path.join(outDir, slug + '.html'), content);

  pages.push({
    slug,
    path: urlPath,
    title: decodeAttr((parts.head.match(/<title>([^<]*)<\/title>/) || [])[1] || ''),
    description: metaName(parts.head, 'description'),
    robots: metaName(parts.head, 'robots'),
    ogType: metaName(parts.head, 'og:type'),
    ogTitle: metaName(parts.head, 'og:title'),
    ogDescription: metaName(parts.head, 'og:description'),
    ogImage: localizeUrls(metaName(parts.head, 'og:image') || '') || null,
    bodyClass: (parts.bodyTag.match(/class="([^"]*)"/) || [])[1]?.trim() || '',
    extraScripts,
    extraStyles: stylesheetLinks(parts.head).filter(l => !homeLinkHrefs.has(linkHref(l))),
    stickyCta: sticky ? { href: localizeUrls(sticky[1]), label: sticky[2] } : null,
    ldJson: ldJson.map(localizeUrls),
  });
}

// Shared chrome comes from the homepage; per-page differences are only "current menu" classes.
const home = split(await fs.readFile(path.join(rawDir, 'index.html'), 'utf8'));
const stripCurrent = html => html
  .replace(/\s?(current-menu-item|current-menu-ancestor|current-menu-parent|current_page_parent|current_page_ancestor|current_page_item|page_item|page-item-\d+)(?=[\s"])/g, '')
  .replace(/" aria-current="page/g, '');
const header = stripCurrent(transform(home.header));
let footer = stripCurrent(transform(home.footer));
footer = footer.replace(/<a href="[^"]*"\s+class="hidden sticky-travel-proposal-btn">\s*[^<]*?\s*<\/a>/, '<!--STICKY_CTA-->');
collectAssets(header); collectAssets(footer);
await fs.writeFile(path.join(partialsDir, 'header.html'), header);
await fs.writeFile(path.join(partialsDir, 'footer.html'), footer);

// Head: font preloads and the @font-face rules the cache plugin inlined (museo-sans via Typekit).
const fp = home.head.match(/<style id="flying-press-css">([\s\S]*?)<\/style>/)[1];
const fontFaces = (fp.match(/@font-face\{[^}]*\}/g) || []).map(localizeUrls);
await fs.mkdir(path.join(root, 'src/styles'), { recursive: true });
await fs.writeFile(path.join(root, 'src/styles/fonts.css'), fontFaces.join('\n') + '\n');
await fs.writeFile(path.join(root, 'src/styles/head.css'),
  [...headStyles].map(([id, css]) => `/* ${id} */\n${localizeUrls(css)}`).join('\n\n') + '\n');
const headLinks = [...home.head.matchAll(/<link\b[^>]*>/g)].map(m => m[0])
  .filter(l => /stylesheet|data-href/.test(l)).map(l => localizeUrls(processLazy(l)));
headLinks.forEach(collectAssets);
await fs.writeFile(path.join(partialsDir, 'head-links.html'), headLinks.join('\n') + '\n');
const headScripts = transform([...home.head.matchAll(/<script\b[\s\S]*?<\/script>/g)].map(m => m[0]).join('\n'));
collectAssets(headScripts);
await fs.writeFile(path.join(partialsDir, 'head-scripts.html'), headScripts + '\n');

await fs.writeFile(path.join(root, 'content/pages.json'), JSON.stringify(pages, null, 1));

// Data for the static wishlist (public/assets/js/static-ajax.js answers render_wishlist_items with it).
const TYPE_LABELS = { accommodations: 'Accommodation', excursions: 'Activity', islands: 'Island', national_parks: 'National park', trips: 'Itinerary', post: 'Blog' };
const wishlistPosts = {};
for (const page of pages) {
  const id = (page.bodyClass.match(/\bpostid-(\d+)/) || [])[1];
  const type = (page.bodyClass.match(/\bsingle-([a-z_]+)/) || [])[1];
  if (!id || !TYPE_LABELS[type] || /\/(itinerary|prices|activities|accommodations|practical-information|request-this-trip)\/$/.test(page.path)) continue;
  const body = await fs.readFile(path.join(outDir, page.slug + '.html'), 'utf8');
  const h1 = (body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  const heroImg = (body.match(/<img\b[^>]*\bwp-post-image\b[^>]*>/) || [])[0];
  const heroSrc = heroImg && (heroImg.match(/\ssrc="([^"]+)"/) || [])[1];
  const price = (body.match(/From\s*(?:<[^>]+>\s*)*\$\s*[\d,]+/) || [])[0];
  wishlistPosts[id] = {
    post_id: Number(id),
    post_type: type,
    post_title: h1 ? h1.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : page.ogTitle,
    post_content: page.description ? `<p>${page.description}</p>` : '',
    post_tag: TYPE_LABELS[type],
    post_price: price ? price.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ') : '',
    post_thumbnail: heroSrc || page.ogImage,
    post_permalink: page.path,
    post_button: 'Read more',
  };
}
await fs.mkdir(path.join(root, 'public/ajax'), { recursive: true });
await fs.writeFile(path.join(root, 'public/ajax/wishlist-posts.json'), JSON.stringify(wishlistPosts));
await fs.writeFile(path.join(root, 'content/redirects.json'), JSON.stringify(redirects, null, 1));
await fs.writeFile(path.join(root, '.cache/assets-needed.txt'),
  [...assets].map(a => 'https://tanzania-specialist.com' + a).join('\n') + '\n');
console.log(`pages ${pages.length}, head styles ${headStyles.size}, font faces ${fontFaces.length}, assets ${assets.size}`);
