// HEB department layout for the shopping list, in a typical store-walk order.
// Edit this file to match your store: reorder DEPARTMENT_ORDER, remap
// categories, or add NAME_OVERRIDES for items that live somewhere unexpected.

export const DEPARTMENT_ORDER = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery & Tortillas',
  'Pantry & Dry Goods',
  'Condiments & Sauces',
  'Frozen',
  'Other',
];

export const DEPARTMENT_ICONS = {
  Produce: '\u{1F966}',
  'Meat & Seafood': '\u{1F969}',
  'Dairy & Eggs': '\u{1F9C0}',
  'Bakery & Tortillas': '\u{1F956}',
  'Pantry & Dry Goods': '\u{1F35A}',
  'Condiments & Sauces': '\u{1F96B}',
  Frozen: '\u{1F9CA}',
  Other: '\u{1F4E6}',
};

// The recipe catalog uses these five ingredient categories.
const CATEGORY_TO_DEPARTMENT = {
  Produce: 'Produce',
  'Proteins/Meat': 'Meat & Seafood',
  Dairy: 'Dairy & Eggs',
  'Pantry/Dry Goods': 'Pantry & Dry Goods',
  'Condiments/Sauces': 'Condiments & Sauces',
};

// Items whose catalog category doesn't match where HEB shelves them.
// Keys are lowercased ingredient names.
const NAME_OVERRIDES = {
  'brioche buns': 'Bakery & Tortillas',
  'buttermilk biscuits': 'Bakery & Tortillas',
  'ciabatta bread': 'Bakery & Tortillas',
  'demi-baguette': 'Bakery & Tortillas',
  flatbreads: 'Bakery & Tortillas',
  'flour tortillas': 'Bakery & Tortillas',
  'potato buns': 'Bakery & Tortillas',
};

// Common staples most kitchens already have. These are routed to the
// "Check your pantry" section regardless of quantity (lowercased names).
export const PANTRY_STAPLE_NAMES = new Set([
  'butter',
  'sugar',
  'flour',
  'olive oil',
  'vegetable oil',
  'garlic powder',
  'onion powder',
  'salt',
  'pepper',
  'honey',
  'cornstarch',
  'mayonnaise',
]);

export function departmentFor(item) {
  const override = NAME_OVERRIDES[item.name.toLowerCase().trim()];
  if (override) return override;
  const mapped = CATEGORY_TO_DEPARTMENT[item.category];
  if (mapped) return mapped;
  // Custom items store the department directly as their category.
  if (DEPARTMENT_ORDER.includes(item.category)) return item.category;
  return 'Other';
}

export function departmentIndex(department) {
  const idx = DEPARTMENT_ORDER.indexOf(department);
  return idx === -1 ? DEPARTMENT_ORDER.length : idx;
}
