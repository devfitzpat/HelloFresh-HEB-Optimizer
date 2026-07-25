import { useState } from 'react';
import { meals } from '../data/meals';
import mealMeta from '../data/mealMeta.json';
import { useApp } from '../context/AppContext';
import { PROTEINS, filterMeals } from '../utils/mealFilters';

const CATEGORY_COLORS = {
  Chicken: 'bg-yellow-100 text-yellow-700',
  Pasta: 'bg-red-100 text-red-700',
  Burgers: 'bg-indigo-100 text-indigo-700',
  Meatloaf: 'bg-rose-100 text-rose-700',
  Asian: 'bg-orange-100 text-orange-700',
  Mexican: 'bg-amber-100 text-amber-700',
  'Soup/Chili': 'bg-teal-100 text-teal-700',
  Steak: 'bg-fuchsia-100 text-fuchsia-700',
  Comfort: 'bg-violet-100 text-violet-700',
  Flatbread: 'bg-lime-100 text-lime-700',
  Seafood: 'bg-blue-100 text-blue-700',
};

const CATEGORY_FALLBACK = {
  Chicken: { emoji: '\u{1F357}', gradient: 'from-yellow-50 to-yellow-200' },
  Pasta: { emoji: '\u{1F35D}', gradient: 'from-red-50 to-red-200' },
  Burgers: { emoji: '\u{1F354}', gradient: 'from-indigo-50 to-indigo-200' },
  Meatloaf: { emoji: '\u{1F356}', gradient: 'from-rose-50 to-rose-200' },
  Asian: { emoji: '\u{1F961}', gradient: 'from-orange-50 to-orange-200' },
  Mexican: { emoji: '\u{1F32E}', gradient: 'from-amber-50 to-amber-200' },
  'Soup/Chili': { emoji: '\u{1F372}', gradient: 'from-teal-50 to-teal-200' },
  Steak: { emoji: '\u{1F969}', gradient: 'from-fuchsia-50 to-fuchsia-200' },
  Comfort: { emoji: '\u{1F958}', gradient: 'from-violet-50 to-violet-200' },
  Flatbread: { emoji: '\u{1FAD3}', gradient: 'from-lime-50 to-lime-200' },
  Seafood: { emoji: '\u{1F41F}', gradient: 'from-blue-50 to-blue-200' },
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'bg-emerald-600 text-white'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
      }`}
    >
      {label}
    </button>
  );
}

function MealCardImage({ meal }) {
  const [failed, setFailed] = useState(false);
  const meta = mealMeta[meal.id];
  const fallback = CATEGORY_FALLBACK[meal.category] ?? { emoji: '\u{1F37D}\u{FE0F}', gradient: 'from-gray-50 to-gray-200' };

  if (!meta?.image || failed) {
    return (
      <div
        className={`h-28 rounded-lg mb-3 bg-gradient-to-br ${fallback.gradient} flex items-center justify-center`}
        aria-hidden="true"
      >
        <span className="text-4xl">{fallback.emoji}</span>
      </div>
    );
  }
  return (
    <img
      src={`${import.meta.env.BASE_URL}${meta.image}`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-28 w-full object-cover rounded-lg mb-3"
    />
  );
}

export default function MealSelector() {
  const { selectedMeals, toggleMeal } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(null);
  const [protein, setProtein] = useState(null);

  const selectedIds = new Set(selectedMeals.map((m) => m.mealId));
  const count = selectedMeals.length;

  const filtered = filterMeals(meals, { search, category, protein });
  const hasFilters = search.trim() !== '' || category !== null || protein !== null;

  const clearFilters = () => {
    setSearch('');
    setCategory(null);
    setProtein(null);
  };

  return (
    <section className="print:hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="text-xl font-bold text-gray-800">Choose Your Meals</h2>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Selected: {count} of 4 meals
        </span>
      </div>

      <div className="mb-4 space-y-3">
        <div>
          <label htmlFor="meal-search" className="sr-only">
            Search meals
          </label>
          <input
            id="meal-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meals... (e.g., tacos, creamy, one-pan)"
            className="w-full sm:max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 items-center" role="group" aria-label="Filter by category">
          <span className="text-xs text-gray-400 mr-1">Category:</span>
          <FilterChip label="All" active={category === null} onClick={() => setCategory(null)} />
          {CATEGORIES.map((c) => (
            <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(category === c ? null : c)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center" role="group" aria-label="Filter by protein">
          <span className="text-xs text-gray-400 mr-1">Protein:</span>
          <FilterChip label="All" active={protein === null} onClick={() => setProtein(null)} />
          {PROTEINS.map((p) => (
            <FilterChip key={p} label={p} active={protein === p} onClick={() => setProtein(protein === p ? null : p)} />
          ))}
        </div>
        {hasFilters && (
          <p className="text-xs text-gray-500">
            Showing {filtered.length} of {meals.length} meals
            <button onClick={clearFilters} className="ml-2 text-emerald-700 font-medium hover:underline">
              Clear filters
            </button>
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-2">No meals match your search.</p>
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((meal) => {
            const isSelected = selectedIds.has(meal.id);
            const isDisabled = !isSelected && count >= 4;
            const meta = mealMeta[meal.id];

            return (
              <button
                key={meal.id}
                onClick={() => !isDisabled && toggleMeal(meal.id)}
                disabled={isDisabled}
                aria-pressed={isSelected}
                className={`text-left rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md cursor-pointer'
                }`}
              >
                <MealCardImage meal={meal} />
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
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{meal.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[meal.category] || 'bg-gray-100 text-gray-600'}`}>
                    {meal.category}
                  </span>
                  {meta?.totalTimeMinutes && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                      &#9201; {meta.totalTimeMinutes} min
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    Serves {meal.baseServings}
                  </span>
                </div>
                {meta?.tags?.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-2">
                    {meta.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
