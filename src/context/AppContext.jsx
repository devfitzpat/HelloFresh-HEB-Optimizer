import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { meals } from '../data/meals';
import { generateShoppingList, suggestSwaps } from '../utils/optimizer';

const AppContext = createContext();

const STORAGE_KEY = 'grocery-optimizer';

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore parse errors
  }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore storage errors
  }
}

export function AppProvider({ children }) {
  const saved = loadFromStorage();

  const [familySize, setFamilySize] = useState(saved?.familySize ?? null);
  const [selectedMeals, setSelectedMeals] = useState(saved?.selectedMeals ?? []);
  const [shoppingList, setShoppingList] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [mealHistory, setMealHistory] = useState(saved?.mealHistory ?? []);
  const [mealNotes, setMealNotes] = useState(saved?.mealNotes ?? {});
  const [showSetup, setShowSetup] = useState(saved?.familySize == null);

  // Persist to localStorage
  useEffect(() => {
    saveToStorage({ familySize, selectedMeals, mealHistory, mealNotes });
  }, [familySize, selectedMeals, mealHistory, mealNotes]);

  // Regenerate shopping list whenever selected meals change
  useEffect(() => {
    if (selectedMeals.length > 0) {
      setShoppingList(generateShoppingList(selectedMeals));
    } else {
      setShoppingList([]);
    }
  }, [selectedMeals]);

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
    setSuggestions(null);
  }, []);

  const optimize = useCallback(() => {
    const result = suggestSwaps(selectedMeals, familySize || 3);
    setSuggestions(result);
  }, [selectedMeals, familySize]);

  const applySwap = useCallback(
    (currentMealId, newMealId) => {
      setSelectedMeals((prev) =>
        prev.map((m) =>
          m.mealId === currentMealId
            ? { mealId: newMealId, servings: m.servings }
            : m
        )
      );
      setSuggestions(null);
    },
    []
  );

  const applyAllSwaps = useCallback(
    (swapMap) => {
      // swapMap: { currentMealId: newMealId, ... }
      setSelectedMeals((prev) =>
        prev.map((m) =>
          swapMap[m.mealId]
            ? { mealId: swapMap[m.mealId], servings: m.servings }
            : m
        )
      );
      setSuggestions(null);
    },
    []
  );

  const rejectAllSwaps = useCallback(() => {
    setSuggestions(null);
  }, []);

  // Shopping list actions
  const toggleShoppingItem = useCallback((itemId) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  }, []);

  const updateShoppingQuantity = useCallback((itemId, delta) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, amount: Math.max(0.25, item.amount + delta) }
          : item
      )
    );
  }, []);

  const deleteShoppingItem = useCallback((itemId) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const addCustomItem = useCallback((name, quantity, unit, category) => {
    const id = `custom-${Date.now()}`;
    setShoppingList((prev) => [
      ...prev,
      {
        id,
        name,
        amount: quantity,
        unit,
        category,
        mealSources: ['Custom'],
        isChecked: false,
        isCustom: true,
      },
    ]);
  }, []);

  // Save current meal plan to history
  const saveMealPlan = useCallback(() => {
    if (selectedMeals.length === 0) return;
    const plan = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      meals: selectedMeals.map((s) => ({
        ...s,
        name: meals.find((m) => m.id === s.mealId)?.name || 'Unknown',
      })),
    };
    setMealHistory((prev) => [plan, ...prev.slice(0, 9)]); // Keep last 10
  }, [selectedMeals]);

  const loadMealPlan = useCallback((plan) => {
    setSelectedMeals(plan.meals.map((m) => ({ mealId: m.mealId, servings: m.servings })));
    setSuggestions(null);
  }, []);

  const updateMealNote = useCallback((mealId, note) => {
    setMealNotes((prev) => ({ ...prev, [mealId]: note }));
  }, []);

  const completeFamilySetup = useCallback((size) => {
    setFamilySize(size);
    setShowSetup(false);
    // Update any selected meals to new family size
    setSelectedMeals((prev) =>
      prev.map((m) => ({ ...m, servings: size }))
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        familySize,
        setFamilySize,
        selectedMeals,
        shoppingList,
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
        saveMealPlan,
        loadMealPlan,
        updateMealNote,
        completeFamilySetup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
