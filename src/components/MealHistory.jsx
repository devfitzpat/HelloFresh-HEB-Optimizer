import { useApp } from '../context/AppContext';

function planDate(plan) {
  // Newer plans store an ISO savedAt; older ones only a locale date string.
  if (plan.savedAt) {
    return new Date(plan.savedAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
  return plan.date;
}

export default function MealHistory() {
  const { mealHistory, loadMealPlan } = useApp();

  if (mealHistory.length === 0) return null;

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 print:hidden">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Meal Plans</h2>
      <div className="space-y-2">
        {mealHistory.map((plan) => (
          <div
            key={plan.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {plan.meals.map((m) => m.name).join(', ')}
              </p>
              <p className="text-xs text-gray-400">{planDate(plan)}</p>
            </div>
            <button
              onClick={() => loadMealPlan(plan)}
              aria-label={`Load plan from ${planDate(plan)}`}
              className="ml-3 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors flex-shrink-0"
            >
              Load
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
