import { meals } from '../data/meals';
import { useApp } from '../context/AppContext';

const CATEGORY_COLORS = {
  Italian: 'bg-red-100 text-red-700',
  Seafood: 'bg-blue-100 text-blue-700',
  Mexican: 'bg-amber-100 text-amber-700',
  Asian: 'bg-orange-100 text-orange-700',
  American: 'bg-indigo-100 text-indigo-700',
  Salad: 'bg-green-100 text-green-700',
  Mediterranean: 'bg-purple-100 text-purple-700',
};

export default function MealSelector() {
  const { selectedMeals, toggleMeal } = useApp();
  const selectedIds = new Set(selectedMeals.map((m) => m.mealId));
  const count = selectedMeals.length;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Choose Your Meals</h2>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Selected: {count} of 4 meals
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {meals.map((meal) => {
          const isSelected = selectedIds.has(meal.id);
          const isDisabled = !isSelected && count >= 4;

          return (
            <button
              key={meal.id}
              onClick={() => !isDisabled && toggleMeal(meal.id)}
              disabled={isDisabled}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800 text-sm leading-tight pr-2">
                  {meal.name}
                </h3>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{meal.description}</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[meal.category] || 'bg-gray-100 text-gray-600'}`}>
                  {meal.category}
                </span>
                <span className="text-xs text-gray-400">
                  Serves {meal.baseServings}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
