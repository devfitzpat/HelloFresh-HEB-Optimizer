import { meals } from '../data/meals';
import { useApp } from '../context/AppContext';

export default function SelectedMeals() {
  const {
    selectedMeals,
    updateServings,
    clearSelection,
    optimize,
    suggestions,
    mealNotes,
    updateMealNote,
    saveMealPlan,
  } = useApp();

  if (selectedMeals.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Your Meal Plan
        </h2>
        <div className="flex gap-2">
          <button
            onClick={saveMealPlan}
            className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            Save Plan
          </button>
          <button
            onClick={clearSelection}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {selectedMeals.map((sel) => {
          const meal = meals.find((m) => m.id === sel.mealId);
          if (!meal) return null;
          const note = mealNotes[meal.id] || '';

          return (
            <div
              key={sel.mealId}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{meal.name}</h3>
                <p className="text-xs text-gray-500">
                  Base: Serves {meal.baseServings} | {meal.ingredients.length} ingredients
                </p>
                <input
                  type="text"
                  placeholder="Add a note (dietary prefs, prep notes...)"
                  value={note}
                  onChange={(e) => updateMealNote(meal.id, e.target.value)}
                  className="mt-1 w-full text-xs text-gray-600 bg-transparent border-b border-gray-200 focus:border-emerald-400 outline-none py-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 whitespace-nowrap">Your size:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateServings(sel.mealId, Math.max(1, sel.servings - 1))}
                    className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center text-sm font-bold text-gray-600"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-gray-800">{sel.servings}</span>
                  <button
                    onClick={() => updateServings(sel.mealId, Math.min(12, sel.servings + 1))}
                    className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center text-sm font-bold text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedMeals.length >= 2 && !suggestions && (
        <button
          onClick={optimize}
          className="mt-4 w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          Optimize Ingredient Overlap
        </button>
      )}
    </section>
  );
}
