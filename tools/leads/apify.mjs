// Minimal Apify REST client: start an actor run with a hard cost cap, wait for it, return its dataset.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const API = 'https://api.apify.com/v2';
const DONE = ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'];

function loadToken() {
  if (process.env.APIFY_TOKEN) return process.env.APIFY_TOKEN;
  try {
    const m = readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^APIFY_TOKEN=(.+)$/m);
    if (m) return m[1].trim();
  } catch {}
  throw new Error('APIFY_TOKEN missing: put APIFY_TOKEN=... in .env in the project root');
}
const TOKEN = loadToken();

async function api(pathname, opts = {}) {
  const res = await fetch(API + pathname, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Apify ${res.status} on ${pathname.split('?')[0]}: ${body?.error?.message || res.statusText}`);
  return body.data ?? body;
}

// Pay-per-event actors bill per event; sum the events this run was charged for.
function runCost(run) {
  const events = run.pricingInfo?.pricingPerEvent?.actorChargeEvents || {};
  let usd = 0;
  for (const [name, count] of Object.entries(run.chargedEventCounts || {})) {
    const ev = events[name] || {};
    const tiers = ev.eventTieredPricingUsd || {};
    const price = ev.eventPriceUsd ?? (tiers.FREE || Object.values(tiers)[0])?.tieredEventPriceUsd ?? 0;
    usd += price * count;
  }
  return usd;
}

export const spent = { usd: 0 };

export async function runActor(actorId, input, { maxCostUsd = 0.5, label = actorId, timeoutSecs } = {}) {
  // Apify refuses caps below $0.50; the actor's own limits (results per search, profiles) keep real cost far lower.
  const q = new URLSearchParams({ maxTotalChargeUsd: String(Math.max(0.5, maxCostUsd)) });
  if (timeoutSecs) q.set('timeout', String(timeoutSecs));
  let run = await api(`/acts/${actorId.replace('/', '~')}/runs?${q}`, { method: 'POST', body: JSON.stringify(input) });
  process.stdout.write(`  ▸ ${label} `);
  while (!DONE.includes(run.status)) {
    run = await api(`/actor-runs/${run.id}?waitForFinish=60`);
    process.stdout.write('.');
  }
  const cost = runCost(run);
  spent.usd += cost;
  console.log(` ${run.status.toLowerCase()} · $${cost.toFixed(3)} · https://console.apify.com/view/runs/${run.id}`);
  if (run.status !== 'SUCCEEDED') console.warn(`    ! run ended as ${run.status}; using whatever it collected`);
  return api(`/datasets/${run.defaultDatasetId}/items?clean=true&format=json`);
}

export async function monthlyCredit() {
  const d = await api('/users/me/limits');
  return { used: d.current?.monthlyUsageUsd ?? 0, max: d.limits?.maxMonthlyUsageUsd ?? 0 };
}
