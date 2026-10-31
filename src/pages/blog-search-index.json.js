// /blog-search-index.json: search entries for posts from the blog-publish API. The rest of the site
// is in public/search-index.json (built by scripts/rebrand.mjs); site-search.js loads both.
import { blogPostPages } from '../lib/blog-posts.js';

export function GET() {
  return new Response(JSON.stringify(blogPostPages.map((p) => p.searchEntry)), { headers: { 'Content-Type': 'application/json' } });
}
