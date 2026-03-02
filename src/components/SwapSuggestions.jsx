import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SwapSuggestions() {
  const { suggestions, applySwap, applyAllSwaps, rejectAllSwaps } = useApp();
  const [acceptedSwaps, setAcceptedSwaps] = useState({});

  if (!suggestions || suggestions.length === 0) return null;

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
    <section className="bg-amber-50 border border-amber-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Suggested Meal Swaps</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Accept All
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-700">{sug.currentMeal.name}</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="font-semibold text-emerald-700">{sug.bestAlternative.meal.name}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Shared ingredients: {sug.bestAlternative.sharedIngredients.join(', ')}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {sug.bestAlternative.overlapScore}% overlap
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    +{sug.bestAlternative.improvement}% improvement
                  </span>
                </div>
              </div>
              <button
                onClick={() => toggleSwap(sug.currentMeal.id, sug.bestAlternative.meal.id)}
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
