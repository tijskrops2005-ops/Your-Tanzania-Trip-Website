import fs from 'node:fs/promises';
import path from 'node:path';

const contentDir = path.resolve('content');

export const pages = JSON.parse(await fs.readFile(path.join(contentDir, 'pages.json'), 'utf8'));

export const readPageBody = slug => fs.readFile(path.join(contentDir, 'pages', `${slug}.html`), 'utf8');

export const readPartial = name => fs.readFile(path.resolve('src/partials', name), 'utf8');

// Mark the menu entries that point at the current page, like WordPress does server-side.
export function markCurrentMenu(html, currentPath) {
  if (currentPath === '/') return html;
  const href = currentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(
    new RegExp(`(<li\\b[^>]*class=")([^"]*)("[^>]*>\\s*<a\\b[^>]*href="${href}")`, 'g'),
    (all, a, cls, b) => `${a}${cls} current-menu-item${b} aria-current="page"`
  );
}
