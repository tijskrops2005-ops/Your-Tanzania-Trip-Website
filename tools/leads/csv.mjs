// CSV read/write plus the master lead list with de-duplication.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const COLUMNS = [
  'status', 'type', 'market', 'name', 'email', 'phone', 'website', 'instagram', 'followers',
  'city', 'country', 'category', 'notes', 'source', 'source_url', 'found_at',
];

const BOM = '﻿'; // lets Excel detect UTF-8 (é, ü, å)

function cell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows) {
  return BOM + [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(','))].join('\n') + '\n';
}

export function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const sep = text.split('\n', 1)[0].includes(';') && !text.split('\n', 1)[0].includes(',') ? ';' : ',';
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((c) => c !== ''));
  return (body || []).map((r) => Object.fromEntries((head || []).map((h, i) => [h, r[i] ?? ''])));
}

export function domainOf(url) {
  try { return new URL(/^https?:/i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '').toLowerCase(); }
  catch { return ''; }
}

// A lead is the same as another when it shares an email, website domain or Instagram handle.
function keys(r) {
  const k = [];
  for (const e of String(r.email || '').split(/[;\s]+/)) if (e) k.push(`e:${e.toLowerCase()}`);
  if (r.website) k.push(`d:${domainOf(r.website)}`);
  const ig = String(r.instagram || '').match(/instagram\.com\/([^/?#]+)/i)?.[1];
  if (ig) k.push(`i:${ig.toLowerCase()}`);
  return k;
}

// Merges new leads into leads/leads.csv. Existing rows (and their status, e.g. "opt-out") are never
// overwritten or re-added. Returns only the leads that were really new.
export function mergeIntoMaster(dir, leads) {
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'leads.csv');
  const master = existsSync(file) ? parseCsv(readFileSync(file, 'utf8')) : [];
  const seen = new Set(master.flatMap(keys));
  const fresh = [];
  for (const lead of leads) {
    const k = keys(lead);
    if (!k.length || k.some((x) => seen.has(x))) continue;
    k.forEach((x) => seen.add(x));
    fresh.push(lead);
  }
  writeFileSync(file, toCsv([...master, ...fresh]));
  return { file, fresh, total: master.length + fresh.length };
}
