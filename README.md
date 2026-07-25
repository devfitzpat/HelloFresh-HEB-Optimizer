# Grocery Optimizer

A meal-planning app that turns a week of HelloFresh recipes into one clean HEB shopping list.

Pick up to 4 recipes from the catalog, set your household size, and the app:

- scales every ingredient to your serving counts,
- merges duplicate ingredients across recipes (unit-aware: tsp/tbsp/cups and oz/lb convert correctly),
- suggests recipe swaps that increase ingredient overlap so you buy fewer distinct groceries,
- groups the final list by HEB department in a typical store-walk order, and
- sets aside small amounts and common staples in a "Check your pantry" section instead of deleting them.

Everything runs in the browser — no backend, no accounts. State is saved to `localStorage`.

## Running locally

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
npm run lint       # ESLint
npm test           # Vitest
```

## Deployment

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`:
<https://devfitzpat.github.io/HelloFresh-HEB-Optimizer/>

The Vite `base` is `/HelloFresh-HEB-Optimizer/`, so the production build only works when served from that subpath.

## Project layout

```
src/
  components/       UI components (meal grid, plan, swaps, shopping list, history)
  context/          AppContext — all app state + localStorage persistence
  data/
    meals.js        hand-maintained recipe catalog (47 HelloFresh recipes)
    mealMeta.json   generated recipe metadata (images, cook times, tags)
    hebDepartments.js  HEB department order, category mapping, pantry staples
  utils/
    optimizer.js    list generation, consolidation, swap suggestions
    units.js        unit families and conversions
scripts/
  enrich-meals.mjs  fetches images + metadata from hellofresh.com (dev-run only)
```

## Refreshing recipe metadata

Recipe images, cook times, and tags in `src/data/mealMeta.json` are generated — the app itself never fetches anything at runtime. To refresh after editing `src/data/meals.js`:

```bash
node scripts/enrich-meals.mjs
```

No machine handy? The **Refresh recipe metadata** workflow (Actions tab → Run workflow) runs the same script on a GitHub-hosted runner and commits the results. Afterwards, dispatch **Deploy to GitHub Pages** to publish — bot commits don't retrigger it automatically.

The script fetches each recipe's HelloFresh page, extracts the image and metadata, downloads images to `public/meal-images/`, and prints a reconciliation report flagging any recipe whose name/protein disagrees with the linked page. HelloFresh rotates recipes, so 404s are expected over time; affected meals keep working with a fallback card design. Commit the regenerated `mealMeta.json` and images.
