// Blog posts published through the blog-publish API (api/blog-publish.js). Each post is a JSON
// file in content/blog-posts/ with a Markdown body; this turns the published ones into pages at
// /blog/<slug>/ in the same layout as the existing blog posts (the "Tipping in Tanzania" post is
// the template: hero, breadcrumbs, date, content, share buttons, sidebar, related posts, CTAs).
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { Marked } from 'marked';
import { pages } from './site.js';

const dir = path.resolve('content/blog-posts');
const site = 'https://yourtanzaniatrip.com';
const TEMPLATE_SLUG = 'blog__tipping-tanzania';
const DEFAULT_COVER = '/wp-content/uploads/2023/08/lion-tanzania.jpg';

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Markdown -> HTML. Raw HTML in the Markdown is left out (never run), and an H1 in the body
// becomes an H2 (the page title is already the H1).
const marked = new Marked({
  gfm: true,
  renderer: {
    html: () => "",
    heading({ tokens, depth }) {
      const level = Math.max(2, depth);
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
    },
    image({ href, title, text }) {
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy" decoding="async">`;
    },
    link({ href, title, tokens }) {
      const external = /^https?:\/\//.test(href) && !/^https?:\/\/(www\.)?yourtanzaniatrip\.com/.test(href);
      const attrs = external ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''}${attrs}>${this.parser.parseInline(tokens)}</a>`;
    },
  },
});

// Same-site URLs (https://www.yourtanzaniatrip.com/blog-images/...) become site-relative.
const localUrl = (u) => (u || '').replace(/^https?:\/\/(www\.)?yourtanzaniatrip\.com(?=\/)/, '');
const longDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' });
const shortDate = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${String(d.getUTCFullYear()).slice(2)}`;
};

/** All published posts, newest first. */
export const blogPosts = (fs.existsSync(dir) ? fs.readdirSync(dir) : [])
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
  .filter((p) => p.published && p.published_at)
  .sort((a, b) => b.published_at.localeCompare(a.published_at));

const template = pages.find((p) => p.slug === TEMPLATE_SLUG);
const templateBody = template ? fs.readFileSync(path.resolve('content/pages', `${TEMPLATE_SLUG}.html`), 'utf8') : '';

function pageBody(post) {
  const $ = cheerio.load(templateBody, null, false);
  const url = `/blog/${post.slug}/`;
  const cover = localUrl(post.cover_url) || DEFAULT_COVER;

  $('.ts-jumbotron-image').attr('src', cover).attr('alt', '').removeAttr('srcset').removeAttr('sizes');
  $('.ts-jumbotron h1').text(post.title);
  $('#breadcrumbs li.active a').attr('href', url).text(post.title);
  $('.post-date p').text(longDate(post.published_at));
  $('.ts-content-area').html(`\n${marked.parse(post.body)}\n`);
  $('.ts-content-area img').first().attr('loading', 'eager');
  $('.social-share [data-url]').attr('data-url', url);
  $('.social-share [data-title]').attr('data-title', post.title);

  // Related posts: the newest other API posts first, then the template's own picks.
  const others = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const grid = $('.related-posts .grid');
  if (others.length) {
    const keep = grid.find('article').slice(0, Math.max(0, 3 - others.length)).toArray().map((a) => $.html(a));
    grid.html(`\n<!--fwp-loop-->\n${others.map(cardHtml).join('\n')}${keep.join('\n')}\n`);
  }
  return $.html();
}

/** A post card in the theme's markup (blog overview, related posts). */
export function cardHtml(post) {
  const cover = localUrl(post.cover_url) || DEFAULT_COVER;
  return `<article class="post-item flex flex-col post type-post status-publish format-standard has-post-thumbnail hentry category-blog">
    <div class="relative w-full select-none">
        <img width="1024" height="682" src="${escapeHtml(cover)}" class="attachment-large size-large wp-post-image" alt="" decoding="async" loading="lazy" fetchpriority="low" style="aspect-ratio:3/2;object-fit:cover"/>
        <time datetime="${post.published_at.slice(0, 10)}" class="post-card-date">${shortDate(post.published_at)}</time>
    </div>
    <div class="h-full">
        <a href="/blog/${post.slug}/" class="post-card-link group">
            <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
            <div class="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow">
                <svg height="13" viewBox="0 0 17 13" width="17" xmlns="http://www.w3.org/2000/svg">
                    <path d="m.37594783 7.25057551 5.24313819 5.14389299c.48318803.474042 1.28841621.474042 1.77160427 0 .48318802-.4740419.48318802-1.2640283 0-1.7380703l-3.09587373-3.05467239h11.45258854c.6978921 0 1.2525949-.54420303 1.2525949-1.22888504 0-.684682-.5547028-1.22888506-1.2525949-1.22888506h-11.45258854l3.09574587-3.0371478c.48318803-.47404197.48318803-1.26402831 0-1.73807028-.25051894-.24577702-.57269333-.36873763-.89473346-.36873763-.32204015 0-.64420811.1229512-.89473348.36873763l-5.22524352 5.12633705c-.23266905.22826496-.37585197.54420307-.37585197.87779744 0 .33359438.1253234.64953876.37585197.87779746z" fill="#20281B" transform="matrix(-1 0 0 1 17 0)" />
                </svg>
            </div>
        </a>
    </div>
</article>`;
}

/** Page objects for [...slug].astro and BaseLayout (same shape as content/pages.json). */
export const blogPostPages = template
  ? blogPosts.map((post) => {
      const url = `/blog/${post.slug}/`;
      const image = new URL(localUrl(post.cover_url) || DEFAULT_COVER, site).href;
      const description = post.excerpt || post.body.replace(/[#>*_`[\]()!-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 155);
      const ld = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BlogPosting',
            '@id': `${site}${url}#article`,
            headline: post.title,
            description,
            image,
            datePublished: post.published_at,
            dateModified: post.updated_at || post.published_at,
            author: post.author ? { '@type': 'Person', name: post.author } : { '@id': `${site}/#organization` },
            publisher: { '@id': `${site}/#organization` },
            mainEntityOfPage: `${site}${url}`,
            keywords: (post.tags || []).join(', ') || undefined,
            inLanguage: 'en-US',
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${site}/` },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: `${site}/blog/` },
              { '@type': 'ListItem', position: 3, name: post.title },
            ],
          },
        ],
      };
      return {
        ...template,
        slug: `blog__${post.slug}`,
        path: url,
        title: post.title,
        description,
        ogType: 'article',
        ogTitle: post.title,
        ogDescription: description,
        ogImage: image,
        bodyClass: template.bodyClass.replace(/\bpostid-\d+\s*/, ''),
        ldJson: [JSON.stringify(ld)],
        lastmod: (post.updated_at || post.published_at).slice(0, 10),
        searchEntry: { u: url, t: post.title, d: description, k: 'Blog' },
        html: pageBody(post),
      };
    })
  : [];

/** /blog/ overview: a "Latest articles" grid above the existing list, when there are API posts. */
export function withLatestPosts(html) {
  if (!blogPosts.length) return html;
  const section = `<div class="px-5 pt-5 mx-auto max-w-7xl md:pt-12 container-2xl latest-posts">
    <h2 class="mb-8 font-black uppercase tracking-wide text-green text-[25px] lg:text-[34px] lg:mb-12" style="text-wrap: balance;">Latest articles</h2>
    <div class="grid grid-cols-1 gap-y-8 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-14">
${blogPosts.map(cardHtml).join('\n')}
    </div>
</div>
`;
  return html.replace(/(<div class="p-5 mx-auto max-w-7xl md:py-12 container-2xl">)/, `${section}$1`);
}

/** Old addresses of renamed posts -> new address (used in astro.config.mjs). */
export function blogPostRedirects() {
  return Object.fromEntries(blogPosts.flatMap((p) => (p.previous_slugs || []).map((s) => [`/blog/${s}/`, `/blog/${p.slug}/`])));
}
