import { defineConfig } from 'astro/config';
import fs from 'node:fs';

// Old WordPress URLs that the live site redirects, plus the pages removed by the rebrand.
const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {});
const redirects = Object.fromEntries(
  Object.entries({ ...readJson('./content/redirects.json'), ...readJson('./content/redirects-brand.json') })
    .filter(([from, to]) => !to.startsWith('http') && from !== to)
);

export default defineConfig({
  site: 'https://yourtanzaniatrip.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: false,
  redirects,
  devToolbar: { enabled: false },
});
