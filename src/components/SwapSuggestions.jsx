import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SwapSuggestions() {
  const { suggestions: result, applySwap, applyAllSwaps, rejectAllSwaps } = useApp();
  const [acceptedSwaps, setAcceptedSwaps] = useState({});

  if (!result) return null;

  const { suggestions, baseScore, totalImprovement } = result;

  if (suggestions.length === 0) {
    return (
      <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 print:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">No swaps needed</h2>
            <p className="text-sm text-gray-600 mt-1">
              Your plan already shares a lot of ingredients ({baseScore}% overlap) — we couldn't
              find a swap that improves it.
            </p>
          </div>
          <button
            onClick={rejectAllSwaps}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      </section>
    );
  }

  const toggleSwap = (currentMealId, newMealId) => {
    setAcceptedSwaps((prev) => {
      const copy = { ...prev };
      if (copy[currentMealId] === newMealId) {
        delete copy[currentMealId];
      } else {
        copy[currentMealId] = newMealId;
      }
      return copy;
    });
  };

  const handleAcceptAll = () => {
    const swapMap = {};
    for (const sug of suggestions) {
      swapMap[sug.currentMeal.id] = sug.bestAlternative.meal.id;
    }
    applyAllSwaps(swapMap);
    setAcceptedSwaps({});
  };

  const handleApplySelected = () => {
    for (const [currentId, newId] of Object.entries(acceptedSwaps)) {
      applySwap(currentId, newId);
    }
    setAcceptedSwaps({});
  };

  const handleRejectAll = () => {
    rejectAllSwaps();
    setAcceptedSwaps({});
  };

  return (
    <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 print:hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Suggested Meal Swaps</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            Accepting all {suggestions.length} raises your plan's ingredient overlap from{' '}
            {baseScore}% to {baseScore + totalImprovement}%.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Accept All (+{totalImprovement}%)
          </button>
          {Object.keys(acceptedSwaps).length > 0 && (
            <button
              onClick={handleApplySelected}
              className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              Apply Selected ({Object.keys(acceptedSwaps).length})
            </button>
          )}
          <button
            onClick={handleRejectAll}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reject All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {suggestions.map((sug) => (
          <div key={sug.currentMeal.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-700">{sug.currentMeal.name}</span>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="font-semibold text-emerald-700">{sug.bestAlternative.meal.name}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Shared ingredients: {sug.bestAlternative.sharedIngredients.join(', ') || 'none yet'}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {sug.bestAlternative.overlapScore}% plan overlap after swap
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    +{sug.bestAlternative.improvement}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleSwap(sug.currentMeal.id, sug.bestAlternative.meal.id)}
                aria-pressed={acceptedSwaps[sug.currentMeal.id] === sug.bestAlternative.meal.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  acceptedSwaps[sug.currentMeal.id] === sug.bestAlternative.meal.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {acceptedSwaps[sug.currentMeal.id] === sug.bestAlternative.meal.id ? 'Selected' : 'Select Swap'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
