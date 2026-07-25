import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { meals } from '../data/meals';
import { generateShoppingList, suggestSwaps } from '../utils/optimizer';
import { toBaseAmount, bestDisplayUnit } from '../utils/units';

const AppContext = createContext();

const STORAGE_KEY = 'grocery-optimizer';
const STORAGE_VERSION = 2;
const EMPTY_LIST_STATE = { overrides: {}, customItems: [] };
const EMPTY_GENERATED = { items: [], pantryItems: [] };

function migrate(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.version === STORAGE_VERSION) return data;
  // v1 blobs had no version field and no listState.
  return {
    version: STORAGE_VERSION,
    familySize: data.familySize ?? null,
    selectedMeals: Array.isArray(data.selectedMeals) ? data.selectedMeals : [],
    mealHistory: Array.isArray(data.mealHistory) ? data.mealHistory : [],
    mealNotes: data.mealNotes && typeof data.mealNotes === 'object' ? data.mealNotes : {},
    listState: EMPTY_LIST_STATE,
  };
}

function loadFromStorage() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch {
    // Preserve the unreadable blob instead of letting the next save destroy it.
    try {
      if (raw) localStorage.setItem(`${STORAGE_KEY}.backup-${Date.now()}`, raw);
    } catch {
      // storage unavailable
    }
    return null;
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors (quota, private mode)
  }
}

export function AppProvider({ children }) {
  const [saved] = useState(loadFromStorage);

  const [familySize, setFamilySize] = useState(saved?.familySize ?? null);
  const [selectedMeals, setSelectedMeals] = useState(saved?.selectedMeals ?? []);
  const [listState, setListState] = useState(saved?.listState ?? EMPTY_LIST_STATE);
  const [suggestions, setSuggestions] = useState(null);
  const [mealHistory, setMealHistory] = useState(saved?.mealHistory ?? []);
  const [mealNotes, setMealNotes] = useState(saved?.mealNotes ?? {});
  const [showSetup, setShowSetup] = useState(saved?.familySize == null);

  // Persist to localStorage
  useEffect(() => {
    saveToStorage({
      version: STORAGE_VERSION,
      familySize,
      selectedMeals,
      mealHistory,
      mealNotes,
      listState,
    });
  }, [familySize, selectedMeals, mealHistory, mealNotes, listState]);

  // The generated list is pure derived state; user edits live in listState
  // and are merged on top so they survive reloads and meal changes.
  const generated = useMemo(
    () => (selectedMeals.length > 0 ? generateShoppingList(selectedMeals) : EMPTY_GENERATED),
    [selectedMeals]
  );

  const { shoppingList, pantryList } = useMemo(() => {
    const { overrides, customItems } = listState;
    // amountDelta is stored in the item's base unit (tsp/oz/count), so a
    // "+¼" made at one display unit still means the same quantity after a
    // rescale changes the display unit.
    const applyOverride = (item, o) => {
      const base = Math.max(0.25, item.baseAmount + (o?.amountDelta ?? 0));
      const { amount, unit } = bestDisplayUnit(base, item.family, item.fallbackUnit);
      return {
        ...item,
        amount,
        unit,
        isChecked: o?.isChecked ?? false,
      };
    };

    const main = [];
    const pantry = [];
    for (const item of generated.items) {
      const o = overrides[item.id];
      if (o?.deleted) continue;
      main.push(applyOverride(item, o));
    }
    for (const item of generated.pantryItems) {
      const o = overrides[item.id];
      if (o?.deleted) continue;
      (o?.pantryPromoted ? main : pantry).push(applyOverride(item, o));
    }
    for (const item of customItems) {
      main.push({ ...item, mealSources: ['Custom'], isCustom: true });
    }
    return { shoppingList: main, pantryList: pantry };
  }, [generated, listState]);

  const patchOverride = useCallback((itemId, patch) => {
    setListState((prev) => ({
      ...prev,
      overrides: {
        ...prev.overrides,
        [itemId]: { ...prev.overrides[itemId], ...patch(prev.overrides[itemId] ?? {}) },
      },
    }));
  }, []);

  const toggleMeal = useCallback(
    (mealId) => {
      setSelectedMeals((prev) => {
        const exists = prev.find((m) => m.mealId === mealId);
        if (exists) {
          return prev.filter((m) => m.mealId !== mealId);
        }
        if (prev.length >= 4) return prev; // Max 4 meals
        return [...prev, { mealId, servings: familySize || 3 }];
      });
      setSuggestions(null); // Clear suggestions on meal change
    },
    [familySize]
  );

  const updateServings = useCallback((mealId, servings) => {
    setSelectedMeals((prev) =>
      prev.map((m) => (m.mealId === mealId ? { ...m, servings } : m))
    );
    setSuggestions(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMeals([]);
    setListState(EMPTY_LIST_STATE);
    setSuggestions(null);
  }, []);

  const optimize = useCallback(() => {
    setSuggestions(suggestSwaps(selectedMeals));
  }, [selectedMeals]);

  const applySwap = useCallback((currentMealId, newMealId) => {
    setSelectedMeals((prev) =>
      prev.map((m) =>
        m.mealId === currentMealId
          ? { mealId: newMealId, servings: m.servings }
          : m
      )
    );
    setSuggestions(null);
  }, []);

  const applyAllSwaps = useCallback((swapMap) => {
    // swapMap: { currentMealId: newMealId, ... }
    setSelectedMeals((prev) =>
      prev.map((m) =>
        swapMap[m.mealId]
          ? { mealId: swapMap[m.mealId], servings: m.servings }
          : m
      )
    );
    setSuggestions(null);
  }, []);

  const rejectAllSwaps = useCallback(() => {
    setSuggestions(null);
  }, []);

  // Shopping list actions — all edits are stored as overrides/custom items in
  // listState, never on the derived arrays.
  const toggleShoppingItem = useCallback(
    (itemId) => {
      if (itemId.startsWith('custom-')) {
        setListState((prev) => ({
          ...prev,
          customItems: prev.customItems.map((c) =>
            c.id === itemId ? { ...c, isChecked: !c.isChecked } : c
          ),
        }));
      } else {
        patchOverride(itemId, (o) => ({ isChecked: !(o.isChecked ?? false) }));
      }
    },
    [patchOverride]
  );

  // delta is in the item's CURRENT display unit; stored in base units.
  const updateShoppingQuantity = useCallback(
    (item, delta) => {
      if (item.id.startsWith('custom-')) {
        setListState((prev) => ({
          ...prev,
          customItems: prev.customItems.map((c) =>
            c.id === item.id ? { ...c, amount: Math.max(0.25, c.amount + delta) } : c
          ),
        }));
      } else {
        const baseDelta = toBaseAmount(delta, item.unit);
        patchOverride(item.id, (o) => ({ amountDelta: (o.amountDelta ?? 0) + baseDelta }));
      }
    },
    [patchOverride]
  );

  const deleteShoppingItem = useCallback(
    (itemId) => {
      if (itemId.startsWith('custom-')) {
        setListState((prev) => ({
          ...prev,
          customItems: prev.customItems.filter((c) => c.id !== itemId),
        }));
      } else {
        patchOverride(itemId, () => ({ deleted: true }));
      }
    },
    [patchOverride]
  );

  const addCustomItem = useCallback((name, quantity, unit, category) => {
    const item = {
      id: `custom-${Date.now()}`,
      name,
      amount: quantity,
      unit,
      category,
      isChecked: false,
    };
    setListState((prev) => ({ ...prev, customItems: [...prev.customItems, item] }));
  }, []);

  const promotePantryItem = useCallback(
    (itemId) => {
      patchOverride(itemId, () => ({ pantryPromoted: true }));
    },
    [patchOverride]
  );

  // Save current meal plan to history
  const saveMealPlan = useCallback(() => {
    if (selectedMeals.length === 0) return;
    const plan = {
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
      meals: selectedMeals.map((s) => ({
        ...s,
        name: meals.find((m) => m.id === s.mealId)?.name || 'Unknown',
      })),
    };
    setMealHistory((prev) => [plan, ...prev.slice(0, 9)]); // Keep last 10
  }, [selectedMeals]);

  const loadMealPlan = useCallback((plan) => {
    setSelectedMeals(plan.meals.map((m) => ({ mealId: m.mealId, servings: m.servings })));
    setListState(EMPTY_LIST_STATE);
    setSuggestions(null);
  }, []);

  const updateMealNote = useCallback((mealId, note) => {
    setMealNotes((prev) => ({ ...prev, [mealId]: note }));
  }, []);

  // Change household size AND rescale the plan to match.
  const updateFamilySize = useCallback((size) => {
    setFamilySize(size);
    setSelectedMeals((prev) => prev.map((m) => ({ ...m, servings: size })));
  }, []);

  const completeFamilySetup = useCallback(
    (size) => {
      updateFamilySize(size);
      setShowSetup(false);
    },
    [updateFamilySize]
  );

  const reopenSetup = useCallback(() => {
    setShowSetup(true);
  }, []);

  const closeSetup = useCallback(() => {
    setShowSetup(false);
  }, []);

  const resetApp = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
    setFamilySize(null);
    setSelectedMeals([]);
    setListState(EMPTY_LIST_STATE);
    setSuggestions(null);
    setMealHistory([]);
    setMealNotes({});
    setShowSetup(true);
  }, []);

  return (
    <AppContext.Provider
      value={{
        familySize,
        selectedMeals,
        shoppingList,
        pantryList,
        suggestions,
        mealHistory,
        mealNotes,
        showSetup,
        toggleMeal,
        updateServings,
        clearSelection,
        optimize,
        applySwap,
        applyAllSwaps,
        rejectAllSwaps,
        toggleShoppingItem,
        updateShoppingQuantity,
        deleteShoppingItem,
        addCustomItem,
        promotePantryItem,
        saveMealPlan,
        loadMealPlan,
        updateMealNote,
        updateFamilySize,
        completeFamilySetup,
        reopenSetup,
        closeSetup,
        resetApp,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
