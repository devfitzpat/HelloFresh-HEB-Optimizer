import { describe, it, expect, beforeEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';
import { meals } from '../data/meals';
import { toBaseAmount } from '../utils/units';

const STORAGE_KEY = 'grocery-optimizer';

let ctx;
function Capture() {
  // Test probe: capture the context value for assertions.
  // eslint-disable-next-line react-hooks/globals
  ctx = useApp();
  return null;
}

const renderApp = () =>
  render(
    <AppProvider>
      <Capture />
    </AppProvider>
  );

beforeEach(() => {
  localStorage.clear();
  ctx = undefined;
});

describe('storage migration', () => {
  it('migrates a v1 blob and starts saving v2', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        familySize: 4,
        selectedMeals: [{ mealId: meals[0].id, servings: 4 }],
        mealHistory: [],
        mealNotes: { [meals[0].id]: 'extra spicy' },
      })
    );

    renderApp();

    expect(ctx.familySize).toBe(4);
    expect(ctx.selectedMeals).toHaveLength(1);
    expect(ctx.mealNotes[meals[0].id]).toBe('extra spicy');
    expect(ctx.showSetup).toBe(false);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.version).toBe(2);
    expect(saved.listState).toEqual({ overrides: {}, customItems: [] });
  });

  it('backs up a corrupt blob instead of destroying it, then boots fresh', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');

    renderApp();

    expect(ctx.showSetup).toBe(true);
    const backupKeys = Object.keys(localStorage).filter((k) =>
      k.startsWith(`${STORAGE_KEY}.backup-`)
    );
    expect(backupKeys).toHaveLength(1);
    expect(localStorage.getItem(backupKeys[0])).toBe('{not valid json');
  });
});

describe('shopping list edits survive regeneration', () => {
  it('keeps check-offs when the meal plan changes', () => {
    renderApp();
    act(() => ctx.completeFamilySetup(3));
    act(() => ctx.toggleMeal(meals[0].id));

    const item = ctx.shoppingList[0];
    act(() => ctx.toggleShoppingItem(item.id));
    expect(ctx.shoppingList.find((i) => i.id === item.id).isChecked).toBe(true);

    // Adding another meal regenerates the list; the check must survive.
    act(() => ctx.toggleMeal(meals[1].id));
    expect(ctx.shoppingList.find((i) => i.id === item.id).isChecked).toBe(true);
  });

  it('keeps check-offs and custom items across a reload', () => {
    renderApp();
    act(() => ctx.completeFamilySetup(3));
    act(() => ctx.toggleMeal(meals[0].id));
    const item = ctx.shoppingList[0];
    act(() => ctx.toggleShoppingItem(item.id));
    act(() => ctx.addCustomItem('Paper Towels', 1, 'piece', 'Other'));

    cleanup();
    renderApp();

    expect(ctx.shoppingList.find((i) => i.id === item.id).isChecked).toBe(true);
    expect(ctx.shoppingList.some((i) => i.name === 'Paper Towels' && i.isCustom)).toBe(true);
  });

  it('keeps deletions and quantity edits when servings change', () => {
    renderApp();
    act(() => ctx.completeFamilySetup(2));
    act(() => ctx.toggleMeal(meals[0].id));

    const [first, second] = ctx.shoppingList;
    act(() => ctx.deleteShoppingItem(first.id));
    act(() => ctx.updateShoppingQuantity(second, 0.5));
    const bumped = ctx.shoppingList.find((i) => i.id === second.id).amount;
    expect(bumped).toBeCloseTo(second.amount + 0.5);

    act(() => ctx.updateServings(meals[0].id, 4));
    expect(ctx.shoppingList.some((i) => i.id === first.id)).toBe(false);
    // The +0.5 delta still applies on top of the rescaled (doubled) base
    // amount, measured in base units so a display-unit change can't warp it.
    const rescaled = ctx.shoppingList.find((i) => i.id === second.id);
    const rescaledBase = rescaled.baseAmount + 0.5;
    expect(toBaseAmount(rescaled.amount, rescaled.unit)).toBeCloseTo(rescaledBase);
    expect(rescaledBase).toBeCloseTo(second.baseAmount * 2 + 0.5);
  });

  it('rescales every meal when the header family size changes', () => {
    renderApp();
    act(() => ctx.completeFamilySetup(2));
    act(() => ctx.toggleMeal(meals[0].id));
    act(() => ctx.toggleMeal(meals[1].id));

    act(() => ctx.updateFamilySize(6));

    expect(ctx.familySize).toBe(6);
    for (const sel of ctx.selectedMeals) {
      expect(sel.servings).toBe(6);
    }
  });

  it('promotes pantry items onto the main list', () => {
    renderApp();
    act(() => ctx.completeFamilySetup(3));
    act(() => ctx.toggleMeal(meals[0].id));

    expect(ctx.pantryList.length).toBeGreaterThan(0);
    const staple = ctx.pantryList[0];
    act(() => ctx.promotePantryItem(staple.id));

    expect(ctx.pantryList.some((i) => i.id === staple.id)).toBe(false);
    expect(ctx.shoppingList.some((i) => i.id === staple.id)).toBe(true);
  });
});

describe('reset', () => {
  it('clears storage and returns to first-run setup', () => {
    renderApp();
    act(() => ctx.completeFamilySetup(3));
    act(() => ctx.toggleMeal(meals[0].id));

    act(() => ctx.resetApp());

    expect(ctx.showSetup).toBe(true);
    expect(ctx.familySize).toBe(null);
    expect(ctx.selectedMeals).toHaveLength(0);
    expect(ctx.shoppingList).toHaveLength(0);
  });
});
