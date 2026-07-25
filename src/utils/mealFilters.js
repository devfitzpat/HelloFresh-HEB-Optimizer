export const PROTEINS = ['Chicken', 'Beef', 'Turkey', 'Pork', 'Seafood', 'Veggie'];

// Classify a meal by its main protein, using only Proteins/Meat ingredients
// so stock concentrates and sauces don't misfire. Bacon is checked last —
// when it appears alongside another protein it's a topping, not the star.
export function proteinOf(meal) {
  const names = meal.ingredients
    .filter((i) => i.category === 'Proteins/Meat')
    .map((i) => i.name.toLowerCase());
  const has = (re) => names.some((n) => re.test(n));

  if (has(/salmon|shrimp|scallop|cod|tilapia|barramundi|fish/)) return 'Seafood';
  if (has(/chicken/)) return 'Chicken';
  if (has(/turkey/)) return 'Turkey';
  if (has(/beef|steak/)) return 'Beef';
  if (has(/pork|bacon|sausage|ham/)) return 'Pork';
  return 'Veggie';
}

export function filterMeals(meals, { search = '', category = null, protein = null } = {}) {
  const needle = search.trim().toLowerCase();
  return meals.filter((meal) => {
    if (category && meal.category !== category) return false;
    if (protein && proteinOf(meal) !== protein) return false;
    if (needle) {
      const haystack = `${meal.name} ${meal.description}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}
