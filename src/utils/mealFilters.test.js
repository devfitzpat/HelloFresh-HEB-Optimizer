import { describe, it, expect } from 'vitest';
import { meals } from '../data/meals';
import { PROTEINS, proteinOf, filterMeals } from './mealFilters';

describe('proteinOf', () => {
  it('classifies every meal into a known protein', () => {
    for (const meal of meals) {
      expect(PROTEINS).toContain(proteinOf(meal));
    }
  });

  it('is not fooled by stock concentrates', () => {
    // Ground-beef meal that also contains Chicken Stock Concentrate.
    const meal = {
      ingredients: [
        { name: 'Ground Beef', category: 'Proteins/Meat' },
        { name: 'Chicken Stock Concentrate', category: 'Pantry/Dry Goods' },
      ],
    };
    expect(proteinOf(meal)).toBe('Beef');
  });

  it('treats bacon as a topping when another protein is present', () => {
    const meal = {
      ingredients: [
        { name: 'Chicken Cutlets', category: 'Proteins/Meat' },
        { name: 'Bacon', category: 'Proteins/Meat' },
      ],
    };
    expect(proteinOf(meal)).toBe('Chicken');
  });

  it('classifies salmon as seafood and meatless meals as veggie', () => {
    expect(proteinOf({ ingredients: [{ name: 'Salmon', category: 'Proteins/Meat' }] })).toBe('Seafood');
    expect(proteinOf({ ingredients: [{ name: 'Cheese Tortelloni', category: 'Pantry/Dry Goods' }] })).toBe('Veggie');
  });
});

describe('filterMeals', () => {
  it('returns everything with no filters', () => {
    expect(filterMeals(meals)).toHaveLength(meals.length);
  });

  it('matches search terms in name and description, case-insensitively', () => {
    const results = filterMeals(meals, { search: 'TORTELLONI' });
    expect(results.length).toBeGreaterThan(0);
    for (const meal of results) {
      expect(`${meal.name} ${meal.description}`.toLowerCase()).toContain('tortelloni');
    }
  });

  it('filters by category and protein together', () => {
    const results = filterMeals(meals, { category: 'Pasta', protein: 'Chicken' });
    for (const meal of results) {
      expect(meal.category).toBe('Pasta');
      expect(proteinOf(meal)).toBe('Chicken');
    }
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterMeals(meals, { search: 'zzz-no-such-meal' })).toHaveLength(0);
  });
});
