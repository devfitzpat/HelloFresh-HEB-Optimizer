#!/usr/bin/env node
/**
 * Enrich the meal catalog with metadata from hellofresh.com.
 *
 * For every meal in src/data/meals.js this script fetches the recipe page,
 * extracts the og:image and JSON-LD Recipe data (total time, tags, canonical
 * name), downloads a reduced-size image to public/meal-images/<mealId>.jpg,
 * and writes src/data/mealMeta.json. It also prints a reconciliation report
 * flagging meals whose catalog name/protein disagrees with the live page.
 *
 * The app never fetches at runtime — run this manually and commit the output:
 *   node scripts/enrich-meals.mjs           # fetch everything
 *   node scripts/enrich-meals.mjs --init    # write a skeleton mealMeta.json without fetching
 *   node scripts/enrich-meals.mjs --only <mealId>   # refresh a single meal
 *
 * HelloFresh rotates recipes, so 404s are expected over time; affected meals
 * keep status '404' and the UI falls back to a category-colored card.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const META_PATH = join(ROOT, 'src/data/mealMeta.json');
const IMAGE_DIR = join(ROOT, 'public/meal-images');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const DELAY_MS = 500;
const RETRIES = 2;
const PROTEIN_TERMS = ['turkey', 'beef', 'chicken', 'pork', 'shrimp', 'salmon', 'steak'];

const args = process.argv.slice(2);
const initOnly = args.includes('--init');
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const { meals } = await import(join(ROOT, 'src/data/meals.js'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, options = {}) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(DELAY_MS * 2 ** attempt);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: options.accept ?? 'text/html' },
        redirect: 'follow',
      });
      if (res.status === 404) return { status: 404 };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { status: 200, res };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

// ISO-8601 duration (PT35M, PT1H10M) -> minutes
function parseDuration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?/.exec(iso ?? '');
  if (!m || (!m[1] && !m[2])) return null;
  return (Number(m[1] ?? 0) * 60) + Number(m[2] ?? 0);
}

function extractOgImage(html) {
  const m =
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/.exec(html) ??
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/.exec(html);
  return m ? m[1] : null;
}

function extractRecipeJsonLd(html) {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g
  );
  for (const [, raw] of blocks) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      continue;
    }
    const candidates = Array.isArray(data) ? data : data['@graph'] ?? [data];
    for (const node of candidates) {
      const type = node?.['@type'];
      if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) return node;
    }
  }
  return null;
}

function extractTags(recipe) {
  const tags = [];
  const push = (v) => {
    for (const t of Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : []) {
      const tag = String(t).trim();
      if (tag && !tags.some((x) => x.toLowerCase() === tag.toLowerCase())) tags.push(tag);
    }
  };
  push(recipe.recipeCuisine);
  push(recipe.keywords);
  return tags.slice(0, 3);
}

// Shrink HelloFresh CDN images by rewriting the Cloudinary transform segment.
function reducedImageUrl(url) {
  const rewritten = url.replace(/\/([a-z]+_[^/]*,[^/]*)\//, '/w_600,q_auto,f_auto/');
  return rewritten !== url ? rewritten : url;
}

async function downloadImage(url, mealId) {
  for (const candidate of [reducedImageUrl(url), url]) {
    try {
      const { status, res } = await fetchWithRetry(candidate, { accept: 'image/*' });
      if (status !== 200) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) continue; // placeholder/error body, not a real image
      await writeFile(join(IMAGE_DIR, `${mealId}.jpg`), buf);
      return `meal-images/${mealId}.jpg`;
    } catch {
      // fall through to the un-rewritten URL, then give up
    }
  }
  return null;
}

function slugProteins(meal) {
  const slug = meal.recipeUrl.split('/').pop().toLowerCase();
  return PROTEIN_TERMS.filter((p) => slug.includes(p));
}

function catalogProteins(meal) {
  const haystack = (meal.name + ' ' + meal.ingredients.map((i) => i.name).join(' ')).toLowerCase();
  return PROTEIN_TERMS.filter((p) => haystack.includes(p));
}

function reconcile(meal, canonicalName) {
  const issues = [];
  const fromSlug = slugProteins(meal);
  const inCatalog = catalogProteins(meal);
  for (const p of fromSlug) {
    if (!inCatalog.includes(p)) {
      issues.push(`URL says "${p}" but neither the name nor any ingredient mentions it`);
    }
  }
  if (canonicalName) {
    const canon = canonicalName.toLowerCase();
    for (const p of PROTEIN_TERMS) {
      if (canon.includes(p) && !inCatalog.includes(p)) {
        issues.push(`Live page is named "${canonicalName}" but catalog has no ${p}`);
      }
    }
  }
  return issues;
}

async function loadExistingMeta() {
  try {
    return JSON.parse(await readFile(META_PATH, 'utf8'));
  } catch {
    return {};
  }
}

const existing = await loadExistingMeta();
const meta = {};
const report = [];
await mkdir(IMAGE_DIR, { recursive: true });

for (const meal of meals) {
  if (onlyId && meal.id !== onlyId) {
    if (existing[meal.id]) meta[meal.id] = existing[meal.id];
    continue;
  }

  if (initOnly) {
    meta[meal.id] = existing[meal.id] ?? {
      image: null,
      totalTimeMinutes: null,
      tags: [],
      status: 'unfetched',
      canonicalName: null,
      fetchedAt: null,
    };
    const issues = reconcile(meal, null);
    if (issues.length) report.push({ id: meal.id, issues });
    continue;
  }

  process.stdout.write(`${meal.id} ... `);
  let entry = {
    image: null,
    totalTimeMinutes: null,
    tags: [],
    status: 'ok',
    canonicalName: null,
    fetchedAt: new Date().toISOString(),
  };
  try {
    const { status, res } = await fetchWithRetry(meal.recipeUrl);
    if (status === 404) {
      entry.status = '404';
      console.log('404 (recipe retired)');
    } else {
      const html = await res.text();
      const recipe = extractRecipeJsonLd(html);
      entry.canonicalName = recipe?.name ?? null;
      entry.totalTimeMinutes = parseDuration(recipe?.totalTime);
      entry.tags = recipe ? extractTags(recipe) : [];
      const imageUrl = extractOgImage(html) ?? (Array.isArray(recipe?.image) ? recipe.image[0] : recipe?.image);
      if (imageUrl) entry.image = await downloadImage(imageUrl, meal.id);
      console.log(`ok${entry.image ? ' +image' : ''}${entry.totalTimeMinutes ? ` ${entry.totalTimeMinutes}min` : ''}`);
    }
  } catch (err) {
    entry.status = 'error';
    console.log(`error (${err.message})`);
  }
  meta[meal.id] = entry;

  const issues = reconcile(meal, entry.canonicalName);
  if (issues.length) report.push({ id: meal.id, issues });
  await sleep(DELAY_MS);
}

await writeFile(META_PATH, JSON.stringify(meta, null, 2) + '\n');
console.log(`\nWrote ${META_PATH} (${Object.keys(meta).length} meals)`);

if (report.length) {
  console.log('\n=== RECONCILIATION REPORT — review these against the live pages ===');
  for (const { id, issues } of report) {
    console.log(`\n${id}`);
    for (const issue of issues) console.log(`  - ${issue}`);
  }
  console.log('\nFix src/data/meals.js by hand where the live page disagrees, then re-run.');
} else {
  console.log('\nReconciliation: no name/protein disagreements found.');
}
