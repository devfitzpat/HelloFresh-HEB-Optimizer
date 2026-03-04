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
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-800">{meal.name}</h3>
                  {meal.recipeUrl && (
                    <a
                      href={meal.recipeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      View Recipe
                    </a>
                  )}
                </div>
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
