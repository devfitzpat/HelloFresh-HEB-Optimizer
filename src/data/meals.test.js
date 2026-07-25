import { describe, it, expect } from 'vitest';
import { meals } from './meals';
import mealMeta from './mealMeta.json';
import { departmentFor, DEPARTMENT_ORDER } from './hebDepartments';

const KNOWN_UNITS = ['tsp', 'tbsp', 'cup', 'oz', 'lb', 'piece', 'clove', 'can'];

describe('meal catalog integrity', () => {
  it('has unique meal ids', () => {
    const ids = meals.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has globally unique ingredient ids', () => {
    const ids = meals.flatMap((m) => m.ingredients.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only known units with positive amounts and servings', () => {
    for (const meal of meals) {
      expect(meal.baseServings).toBeGreaterThan(0);
      for (const ingredient of meal.ingredients) {
        expect(KNOWN_UNITS, `${meal.id}: ${ingredient.name}`).toContain(ingredient.unit);
        expect(ingredient.amount, `${meal.id}: ${ingredient.name}`).toBeGreaterThan(0);
      }
    }
  });

  it('never pairs a turkey recipe URL with ground beef, or vice versa', () => {
    // Regression: three recipes listed Ground Beef while linking to
    // hellofresh.com turkey recipes, so the list disagreed with the recipe.
    for (const meal of meals) {
      const slug = meal.recipeUrl.split('/').pop().toLowerCase();
      const ingredientNames = meal.ingredients.map((i) => i.name.toLowerCase());
      if (slug.includes('turkey')) {
        expect(ingredientNames, meal.id).not.toContain('ground beef');
      }
      if (slug.includes('beef')) {
        expect(ingredientNames, meal.id).not.toContain('ground turkey');
      }
    }
  });

  it('keeps the display name consistent with the recipe URL protein', () => {
    for (const meal of meals) {
      const slug = meal.recipeUrl.split('/').pop().toLowerCase();
      if (slug.includes('turkey') && /meatball|burger|meatloaf|melt/.test(slug)) {
        expect(meal.name.toLowerCase(), meal.id).toContain('turkey');
      }
    }
  });

  it('maps every ingredient to a real HEB department', () => {
    for (const meal of meals) {
      for (const ingredient of meal.ingredients) {
        expect(DEPARTMENT_ORDER, `${meal.id}: ${ingredient.name}`).toContain(
          departmentFor(ingredient)
        );
      }
    }
  });

  it('has a mealMeta entry for every meal', () => {
    for (const meal of meals) {
      expect(mealMeta, meal.id).toHaveProperty(meal.id);
    }
  });

  it('links every recipe to hellofresh.com', () => {
    for (const meal of meals) {
      expect(meal.recipeUrl).toMatch(/^https:\/\/www\.hellofresh\.com\/recipes\//);
    }
  });
});
