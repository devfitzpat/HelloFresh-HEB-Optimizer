import { meals } from '../data/meals';

// Normalize ingredient names for comparison
function normalizeIngredient(name) {
  return name.toLowerCase().trim();
}

// Convert all amounts to tablespoons for comparison
const UNIT_TO_TBSP = {
  tsp: 1 / 3,
  tbsp: 1,
  cup: 16,
  oz: 2,
  lb: 32,
  piece: 3, // rough estimate: 1 piece ~ 3 tbsp for filtering purposes
  clove: 0.5,
  bunch: 16,
  can: 16,
  stalk: 3,
  head: 48,
  pinch: 0.1,
};

export function toTbsp(amount, unit) {
  return amount * (UNIT_TO_TBSP[unit] || 1);
}

// Scale ingredient amounts based on serving adjustments
export function scaleIngredient(ingredient, mealServings, baseServings) {
  const scale = mealServings / baseServings;
  return {
    ...ingredient,
    amount: ingredient.amount * scale,
  };
}

// Get all ingredients from selected meals, scaled
export function getScaledIngredients(selectedMeals) {
  const result = [];
  for (const sel of selectedMeals) {
    const meal = meals.find((m) => m.id === sel.mealId);
    if (!meal) continue;
    const scale = sel.servings / meal.baseServings;
    for (const ing of meal.ingredients) {
      result.push({
        ...ing,
        amount: ing.amount * scale,
        mealName: meal.name,
        mealId: meal.id,
      });
    }
  }
  return result;
}

// Consolidate ingredients by name, summing amounts
export function consolidateIngredients(scaledIngredients) {
  const map = new Map();

  for (const ing of scaledIngredients) {
    const key = normalizeIngredient(ing.name);
    if (map.has(key)) {
      const existing = map.get(key);
      // Sum amounts (convert to same unit if needed, but for simplicity keep the first unit)
      existing.amount += ing.amount;
      if (!existing.mealSources.includes(ing.mealName)) {
        existing.mealSources.push(ing.mealName);
      }
    } else {
      map.set(key, {
        id: `shop-${key}`,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        category: ing.category,
        mealSources: [ing.mealName],
        isChecked: false,
        isCustom: false,
      });
    }
  }

  return Array.from(map.values());
}

// Filter out items less than 2 tablespoons total
export function filterSmallAmounts(items) {
  return items.filter((item) => toTbsp(item.amount, item.unit) >= 2);
}

// Generate shopping list from selected meals
export function generateShoppingList(selectedMeals) {
  const scaled = getScaledIngredients(selectedMeals);
  const consolidated = consolidateIngredients(scaled);
  const filtered = filterSmallAmounts(consolidated);

  // Sort by category, then by name
  filtered.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  return filtered;
}

// Calculate ingredient overlap score between a meal and a set of other selected meals
function getOverlapScore(candidateMeal, otherSelectedMeals, familySize) {
  const candidateIngNames = new Set(
    candidateMeal.ingredients.map((i) => normalizeIngredient(i.name))
  );

  // Get all ingredient names from other selected meals
  const otherIngNames = new Set();
  for (const sel of otherSelectedMeals) {
    const meal = meals.find((m) => m.id === sel.mealId);
    if (!meal) continue;
    for (const ing of meal.ingredients) {
      otherIngNames.add(normalizeIngredient(ing.name));
    }
  }

  // Count overlaps
  let overlap = 0;
  for (const name of candidateIngNames) {
    if (otherIngNames.has(name)) overlap++;
  }

  return candidateIngNames.size > 0
    ? (overlap / candidateIngNames.size) * 100
    : 0;
}

// Find shared ingredients between a candidate and other meals
function getSharedIngredients(candidateMeal, otherSelectedMeals) {
  const candidateIngNames = new Set(
    candidateMeal.ingredients.map((i) => normalizeIngredient(i.name))
  );

  const otherIngNames = new Set();
  for (const sel of otherSelectedMeals) {
    const meal = meals.find((m) => m.id === sel.mealId);
    if (!meal) continue;
    for (const ing of meal.ingredients) {
      otherIngNames.add(normalizeIngredient(ing.name));
    }
  }

  const shared = [];
  for (const ing of candidateMeal.ingredients) {
    if (otherIngNames.has(normalizeIngredient(ing.name))) {
      shared.push(ing.name);
    }
  }

  return shared;
}

// Main optimization: suggest meal swaps
export function suggestSwaps(selectedMeals, familySize) {
  const selectedIds = new Set(selectedMeals.map((s) => s.mealId));

  // Build all possible swaps first
  const allSwaps = [];
  for (const sel of selectedMeals) {
    const currentMeal = meals.find((m) => m.id === sel.mealId);
    if (!currentMeal) continue;

    const otherSelected = selectedMeals.filter((s) => s.mealId !== sel.mealId);
    const currentOverlap = getOverlapScore(currentMeal, otherSelected, familySize);

    const alternatives = meals
      .filter((m) => !selectedIds.has(m.id))
      .map((candidate) => {
        const overlap = getOverlapScore(candidate, otherSelected, familySize);
        const shared = getSharedIngredients(candidate, otherSelected);
        return {
          meal: candidate,
          overlapScore: Math.round(overlap),
          sharedIngredients: shared,
          improvement: Math.round(overlap - currentOverlap),
        };
      })
      .filter((alt) => alt.improvement > 0)
      .sort((a, b) => b.overlapScore - a.overlapScore)
      .slice(0, 5);

    for (const alt of alternatives) {
      allSwaps.push({ currentMeal, alternative: alt });
    }
  }

  // Sort by improvement descending
  allSwaps.sort((a, b) => b.alternative.improvement - a.alternative.improvement);

  // Greedily pick top swaps, ensuring no duplicate current or replacement meals
  const usedCurrentIds = new Set();
  const usedReplacementIds = new Set();
  const suggestions = [];

  for (const swap of allSwaps) {
    if (usedCurrentIds.has(swap.currentMeal.id)) continue;
    if (usedReplacementIds.has(swap.alternative.meal.id)) continue;

    usedCurrentIds.add(swap.currentMeal.id);
    usedReplacementIds.add(swap.alternative.meal.id);
    suggestions.push({
      currentMeal: swap.currentMeal,
      bestAlternative: swap.alternative,
    });

    if (suggestions.length >= 5) break;
  }

  return suggestions;
}

// Format amount for display
export function formatAmount(amount) {
  // Round to reasonable precision
  if (amount === Math.floor(amount)) return amount.toString();
  // Common fractions
  const frac = amount - Math.floor(amount);
  const whole = Math.floor(amount);
  const fractions = [
    [0.25, '\u00BC'],
    [0.33, '\u2153'],
    [0.5, '\u00BD'],
    [0.67, '\u2154'],
    [0.75, '\u00BE'],
  ];
  for (const [val, sym] of fractions) {
    if (Math.abs(frac - val) < 0.06) {
      return whole > 0 ? `${whole}${sym}` : sym;
    }
  }
  return amount.toFixed(1);
}
