import { describe, it, expect } from 'vitest';
import { meals } from '../data/meals';
import {
  getScaledIngredients,
  consolidateIngredients,
  splitPantryStaples,
  generateShoppingList,
  planOverlapScore,
  suggestSwaps,
  formatAmount,
} from './optimizer';

const ing = (name, amount, unit, extra = {}) => ({
  id: 'x',
  name,
  amount,
  unit,
  category: 'Produce',
  mealName: 'Test Meal',
  mealId: 'test',
  ...extra,
});

describe('consolidateIngredients', () => {
  it('sums the same product across compatible volume units', () => {
    // The real-data collision: Parmesan appears as tbsp in some recipes and cup in others.
    const result = consolidateIngredients([
      ing('Parmesan Cheese', 3, 'tbsp'),
      ing('Parmesan Cheese', 0.25, 'cup'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(7);
    expect(result[0].unit).toBe('tbsp');
  });

  it('sums weights across oz and lb', () => {
    const result = consolidateIngredients([
      ing('Ground Turkey', 8, 'oz'),
      ing('Ground Turkey', 1, 'lb'),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(1.5);
    expect(result[0].unit).toBe('lb');
  });

  it('keeps incompatible families of the same product as separate lines', () => {
    const result = consolidateIngredients([
      ing('Parmesan Cheese', 10, 'oz'),
      ing('Parmesan Cheese', 1, 'cup'),
    ]);
    expect(result).toHaveLength(2);
  });

  it('keeps different count units separate', () => {
    const result = consolidateIngredients([
      ing('Garlic', 1, 'clove'),
      ing('Garlic', 1, 'piece'),
    ]);
    expect(result).toHaveLength(2);
  });

  it('never merges distinct products', () => {
    const result = consolidateIngredients([
      ing('Yellow Onion', 1, 'piece'),
      ing('Red Onion', 1, 'piece'),
    ]);
    expect(result).toHaveLength(2);
  });

  it('collects meal sources when merging', () => {
    const result = consolidateIngredients([
      ing('Garlic', 1, 'clove', { mealName: 'Meal A' }),
      ing('Garlic', 2, 'clove', { mealName: 'Meal B' }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(3);
    expect(result[0].mealSources).toEqual(['Meal A', 'Meal B']);
  });
});

describe('getScaledIngredients', () => {
  it('scales amounts by servings over baseServings', () => {
    const meal = meals[0];
    const scaled = getScaledIngredients([{ mealId: meal.id, servings: meal.baseServings * 1.5 }]);
    expect(scaled).toHaveLength(meal.ingredients.length);
    expect(scaled[0].amount).toBeCloseTo(meal.ingredients[0].amount * 1.5);
  });
});

describe('splitPantryStaples', () => {
  it('routes small amounts to the pantry list instead of dropping them', () => {
    const items = consolidateIngredients([
      ing('Garlic', 1, 'clove'),
      ing('Tuscan Heat Spice', 1, 'tbsp'),
      ing('Chicken Cutlets', 20, 'oz'),
    ]);
    const { mainItems, pantryItems } = splitPantryStaples(items);
    expect(mainItems.map((i) => i.name)).toEqual(['Chicken Cutlets']);
    expect(pantryItems.map((i) => i.name).sort()).toEqual(['Garlic', 'Tuscan Heat Spice']);
  });

  it('routes named staples to the pantry list regardless of quantity', () => {
    const items = consolidateIngredients([ing('Butter', 8, 'tbsp')]);
    const { mainItems, pantryItems } = splitPantryStaples(items);
    expect(mainItems).toHaveLength(0);
    expect(pantryItems).toHaveLength(1);
  });

  it('loses nothing: every consolidated item lands in exactly one list', () => {
    // Regression for the old filterSmallAmounts, which silently deleted ~22%
    // of ingredient rows (garlic, spices, butter...).
    const selection = meals.slice(0, 4).map((m) => ({ mealId: m.id, servings: 3 }));
    const consolidated = consolidateIngredients(getScaledIngredients(selection));
    const { mainItems, pantryItems } = splitPantryStaples(consolidated);
    expect(mainItems.length + pantryItems.length).toBe(consolidated.length);
  });
});

describe('generateShoppingList', () => {
  it('returns main items and pantry items covering every ingredient product', () => {
    const selection = meals.slice(0, 4).map((m) => ({ mealId: m.id, servings: 3 }));
    const { items, pantryItems } = generateShoppingList(selection);
    const listedNames = new Set([...items, ...pantryItems].map((i) => i.name.toLowerCase()));
    for (const sel of selection) {
      const meal = meals.find((m) => m.id === sel.mealId);
      for (const ingredient of meal.ingredients) {
        expect(listedNames.has(ingredient.name.toLowerCase())).toBe(true);
      }
    }
  });

  it('returns stable ids so user edits can be merged across regenerations', () => {
    const selection = meals.slice(0, 2).map((m) => ({ mealId: m.id, servings: 2 }));
    const first = generateShoppingList(selection);
    const second = generateShoppingList(selection);
    expect(first.items.map((i) => i.id)).toEqual(second.items.map((i) => i.id));
  });
});

describe('suggestSwaps', () => {
  // Deterministic PRNG so plan sampling is reproducible across runs.
  const mulberry32 = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const randomPlan = (rand, size = 4) => {
    const ids = new Set();
    while (ids.size < size) {
      ids.add(meals[Math.floor(rand() * meals.length)].id);
    }
    return [...ids].map((mealId) => ({ mealId, servings: 3 }));
  };

  it('advertised total improvement matches what Accept All actually delivers', () => {
    // Regression: the old scorer rated each swap against the ORIGINAL plan,
    // so applying all swaps delivered less than promised 90% of the time.
    const rand = mulberry32(42);
    for (let run = 0; run < 25; run++) {
      const plan = randomPlan(rand);
      const { suggestions, baseScore, finalScore, totalImprovement } = suggestSwaps(plan);

      const finalIds = plan.map((s) => s.mealId);
      for (const sug of suggestions) {
        const slot = finalIds.indexOf(sug.currentMeal.id);
        expect(slot).toBeGreaterThanOrEqual(0);
        finalIds[slot] = sug.bestAlternative.meal.id;
      }
      const actual = planOverlapScore(finalIds);
      expect(actual).toBeGreaterThanOrEqual(baseScore + totalImprovement - 1);
      expect(Math.round(actual)).toBe(finalScore);
      expect(finalScore - baseScore).toBeLessThanOrEqual(totalImprovement + 1);
    }
  });

  it('every suggestion has a positive marginal improvement', () => {
    const rand = mulberry32(7);
    for (let run = 0; run < 10; run++) {
      const { suggestions } = suggestSwaps(randomPlan(rand));
      for (const sug of suggestions) {
        expect(sug.bestAlternative.improvement).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('never suggests a meal already in the plan or the same replacement twice', () => {
    const rand = mulberry32(99);
    for (let run = 0; run < 10; run++) {
      const plan = randomPlan(rand);
      const planIds = new Set(plan.map((s) => s.mealId));
      const { suggestions } = suggestSwaps(plan);
      const replacements = suggestions.map((s) => s.bestAlternative.meal.id);
      expect(new Set(replacements).size).toBe(replacements.length);
      for (const id of replacements) {
        expect(planIds.has(id)).toBe(false);
      }
    }
  });

  it('reports zero improvement when it has no suggestions', () => {
    const single = [{ mealId: meals[0].id, servings: 2 }];
    const result = suggestSwaps(single);
    expect(result.suggestions).toHaveLength(0);
    expect(result.totalImprovement).toBe(0);
  });
});

describe('formatAmount', () => {
  it('renders whole numbers plainly and common fractions as symbols', () => {
    expect(formatAmount(7)).toBe('7');
    expect(formatAmount(0.25)).toBe('¼');
    expect(formatAmount(1.5)).toBe('1½');
    expect(formatAmount(0.4375)).toBe('0.4');
  });
});
