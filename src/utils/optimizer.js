import { meals } from '../data/meals';
import { departmentFor, departmentIndex, PANTRY_STAPLE_NAMES } from '../data/hebDepartments';
import { toTbsp, unitFamilyOf, toBaseAmount, bestDisplayUnit } from './units';

// Normalize ingredient names for comparison
function normalizeIngredient(name) {
  return name.toLowerCase().trim();
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

// Consolidate ingredients by name, summing amounts only within a unit family.
// The same product in incompatible units (e.g. "10 oz" vs "1 cup") stays as
// separate lines rather than being summed nonsensically.
export function consolidateIngredients(scaledIngredients) {
  const map = new Map();

  for (const ing of scaledIngredients) {
    const family = unitFamilyOf(ing.unit);
    const key = `${normalizeIngredient(ing.name)}::${family}`;
    const baseAmount = toBaseAmount(ing.amount, ing.unit);
    if (map.has(key)) {
      const existing = map.get(key);
      existing.baseAmount += baseAmount;
      if (!existing.mealSources.includes(ing.mealName)) {
        existing.mealSources.push(ing.mealName);
      }
    } else {
      map.set(key, {
        id: `shop-${key}`,
        name: ing.name,
        baseAmount,
        family,
        fallbackUnit: ing.unit,
        category: ing.category,
        mealSources: [ing.mealName],
        isChecked: false,
        isCustom: false,
      });
    }
  }

  return Array.from(map.values()).map((item) => {
    const { amount, unit } = bestDisplayUnit(item.baseAmount, item.family, item.fallbackUnit);
    const { baseAmount, family, fallbackUnit, ...rest } = item;
    void baseAmount;
    void family;
    void fallbackUnit;
    return { ...rest, amount, unit };
  });
}

// Split out small amounts and common staples into a "check your pantry"
// list instead of dropping them. Every consolidated item ends up in exactly
// one of the two lists.
export function splitPantryStaples(items) {
  const mainItems = [];
  const pantryItems = [];
  for (const item of items) {
    const isStaple = PANTRY_STAPLE_NAMES.has(normalizeIngredient(item.name));
    const isSmall = toTbsp(item.amount, item.unit) < 2;
    (isStaple || isSmall ? pantryItems : mainItems).push(item);
  }
  return { mainItems, pantryItems };
}

function byDepartmentThenName(a, b) {
  const deptDiff = departmentIndex(departmentFor(a)) - departmentIndex(departmentFor(b));
  if (deptDiff !== 0) return deptDiff;
  return a.name.localeCompare(b.name);
}

// Generate shopping list from selected meals
export function generateShoppingList(selectedMeals) {
  const scaled = getScaledIngredients(selectedMeals);
  const consolidated = consolidateIngredients(scaled);
  const { mainItems, pantryItems } = splitPantryStaples(consolidated);

  mainItems.sort(byDepartmentThenName);
  pantryItems.sort(byDepartmentThenName);

  return { items: mainItems, pantryItems };
}

function ingredientNamesOf(mealId) {
  const meal = meals.find((m) => m.id === mealId);
  if (!meal) return [];
  return meal.ingredients.map((i) => normalizeIngredient(i.name));
}

// Plan-level overlap: the percentage of ingredient rows across the whole plan
// that are shared with at least one other meal in the plan.
export function planOverlapScore(mealIds) {
  const rowsPerMeal = mealIds.map(ingredientNamesOf);
  const mealCountByName = new Map();
  for (const rows of rowsPerMeal) {
    for (const name of new Set(rows)) {
      mealCountByName.set(name, (mealCountByName.get(name) || 0) + 1);
    }
  }

  let total = 0;
  let shared = 0;
  for (const rows of rowsPerMeal) {
    for (const name of rows) {
      total++;
      if (mealCountByName.get(name) >= 2) shared++;
    }
  }
  return total > 0 ? (shared / total) * 100 : 0;
}

// Ingredients a candidate meal shares with the rest of the plan.
function sharedWithPlan(candidateId, otherMealIds) {
  const otherNames = new Set(otherMealIds.flatMap(ingredientNamesOf));
  const meal = meals.find((m) => m.id === candidateId);
  if (!meal) return [];
  return meal.ingredients.filter((i) => otherNames.has(normalizeIngredient(i.name))).map((i) => i.name);
}

// Suggest meal swaps, greedily: each round finds the single swap that most
// improves the plan-level overlap of the plan WITH ALL PRIOR SUGGESTIONS
// APPLIED, so the advertised improvements are additive and "Accept All"
// delivers exactly totalImprovement.
export function suggestSwaps(selectedMeals) {
  const originalIds = selectedMeals.map((s) => s.mealId);
  const baseScore = planOverlapScore(originalIds);

  const workingIds = [...originalIds];
  let workingScore = baseScore;
  const swappedSlots = new Set();
  const suggestions = [];

  while (suggestions.length < originalIds.length) {
    let best = null;
    for (let slot = 0; slot < workingIds.length; slot++) {
      if (swappedSlots.has(slot)) continue;
      for (const candidate of meals) {
        if (workingIds.includes(candidate.id) || originalIds.includes(candidate.id)) continue;
        const trialIds = [...workingIds];
        trialIds[slot] = candidate.id;
        const score = planOverlapScore(trialIds);
        if (score > workingScore + 1e-9 && (!best || score > best.score)) {
          best = { slot, candidate, score };
        }
      }
    }
    if (!best) break;

    const otherIds = workingIds.filter((_, i) => i !== best.slot);
    const currentMeal = meals.find((m) => m.id === originalIds[best.slot]);
    suggestions.push({
      currentMeal,
      bestAlternative: {
        meal: best.candidate,
        overlapScore: Math.round(best.score),
        sharedIngredients: sharedWithPlan(best.candidate.id, otherIds),
        improvement: Math.round(best.score - workingScore),
      },
    });

    workingIds[best.slot] = best.candidate.id;
    workingScore = best.score;
    swappedSlots.add(best.slot);
  }

  return {
    suggestions,
    baseScore: Math.round(baseScore),
    finalScore: Math.round(workingScore),
    totalImprovement: Math.round(workingScore - baseScore),
  };
}

// Format amount for display
export function formatAmount(amount) {
  // Round to reasonable precision
  if (amount === Math.floor(amount)) return amount.toString();
  // Common fractions
  const frac = amount - Math.floor(amount);
  const whole = Math.floor(amount);
  const fractions = [
    [0.25, '¼'],
    [0.33, '⅓'],
    [0.5, '½'],
    [0.67, '⅔'],
    [0.75, '¾'],
  ];
  for (const [val, sym] of fractions) {
    if (Math.abs(frac - val) < 0.06) {
      return whole > 0 ? `${whole}${sym}` : sym;
    }
  }
  return amount.toFixed(1);
}
