import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatAmount } from '../utils/optimizer';
import { DEPARTMENT_ORDER, DEPARTMENT_ICONS, departmentFor } from '../data/hebDepartments';

function groupByDepartment(items) {
  const grouped = {};
  for (const item of items) {
    const dept = departmentFor(item);
    if (!grouped[dept]) grouped[dept] = [];
    grouped[dept].push(item);
  }
  const order = DEPARTMENT_ORDER.filter((d) => grouped[d]);
  for (const dept of Object.keys(grouped)) {
    if (!order.includes(dept)) order.push(dept);
  }
  return { grouped, order };
}

export default function ShoppingList() {
  const {
    shoppingList,
    pantryList,
    selectedMeals,
    familySize,
    toggleShoppingItem,
    updateShoppingQuantity,
    deleteShoppingItem,
    addCustomItem,
    promotePantryItem,
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '1', unit: 'piece', category: 'Other' });
  const [copyStatus, setCopyStatus] = useState('idle');
  const [pantryOpen, setPantryOpen] = useState(true);

  if (shoppingList.length === 0 && pantryList.length === 0) return null;

  const { grouped, order: sortedDepartments } = groupByDepartment(shoppingList);
  const toBuy = shoppingList.filter((i) => !i.isChecked);
  const checkedCount = shoppingList.length - toBuy.length;

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    const quantity = Math.max(0.25, parseFloat(newItem.quantity) || 1);
    addCustomItem(newItem.name.trim(), quantity, newItem.unit, newItem.category);
    setNewItem({ name: '', quantity: '1', unit: 'piece', category: 'Other' });
    setShowAddForm(false);
  };

  // Plaintext list for pasting into heb.com search or a notes app.
  // Checked items are treated as already handled and left out.
  const buildCopyText = () => {
    const date = new Date().toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const lines = [
      `HEB List — ${date} (${selectedMeals.length} meal${selectedMeals.length === 1 ? '' : 's'}, serves ${familySize})`,
    ];
    const { grouped: copyGroups, order } = groupByDepartment(toBuy);
    for (const dept of order) {
      lines.push('', dept.toUpperCase());
      for (const item of copyGroups[dept]) {
        lines.push(`${item.name} — ${formatAmount(item.amount)} ${item.unit}`);
      }
    }
    if (pantryList.length > 0) {
      lines.push('', 'CHECK YOUR PANTRY (small amounts — you may already have these)');
      for (const item of pantryList) {
        lines.push(`${item.name} — ${formatAmount(item.amount)} ${item.unit}`);
      }
    }
    return lines.join('\n');
  };

  const handleCopyList = async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText());
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    setTimeout(() => setCopyStatus('idle'), 2500);
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6" id="shopping-list">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Shopping List</h2>
          <p className="text-sm text-gray-500 print:hidden">
            {shoppingList.length} items | {checkedCount} checked off
          </p>
          <p className="hidden print:block text-sm text-gray-600">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} —{' '}
            {selectedMeals.length} meals, serves {familySize}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            aria-expanded={showAddForm}
            className="px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            + Add Item
          </button>
          <button
            onClick={handleCopyList}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              copyStatus === 'copied'
                ? 'text-emerald-700 bg-emerald-100'
                : copyStatus === 'failed'
                ? 'text-red-700 bg-red-50'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {copyStatus === 'copied'
              ? 'Copied ✓'
              : copyStatus === 'failed'
              ? 'Copy failed'
              : `Copy (${toBuy.length} to buy)`}
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Print
          </button>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {copyStatus === 'copied'
          ? 'Shopping list copied to clipboard'
          : copyStatus === 'failed'
          ? 'Copying failed — select the list and copy manually'
          : ''}
      </p>

      {showAddForm && (
        <form onSubmit={handleAddCustom} className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-2 items-end print:hidden">
          <div className="flex-1 min-w-[120px]">
            <label htmlFor="custom-item-name" className="block text-xs text-gray-500 mb-1">
              Item
            </label>
            <input
              id="custom-item-name"
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="e.g., Milk"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
              autoFocus
            />
          </div>
          <div className="w-20">
            <label htmlFor="custom-item-qty" className="block text-xs text-gray-500 mb-1">
              Qty
            </label>
            <input
              id="custom-item-qty"
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              min="0.25"
              step="0.25"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
            />
          </div>
          <div className="w-24">
            <label htmlFor="custom-item-unit" className="block text-xs text-gray-500 mb-1">
              Unit
            </label>
            <select
              id="custom-item-unit"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
            >
              <option value="piece">piece</option>
              <option value="cup">cup</option>
              <option value="tbsp">tbsp</option>
              <option value="tsp">tsp</option>
              <option value="oz">oz</option>
              <option value="lb">lb</option>
              <option value="can">can</option>
            </select>
          </div>
          <div className="w-44">
            <label htmlFor="custom-item-dept" className="block text-xs text-gray-500 mb-1">
              Department
            </label>
            <select
              id="custom-item-dept"
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
            >
              {DEPARTMENT_ORDER.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Add
          </button>
        </form>
      )}

      <div className="space-y-6">
        {sortedDepartments.map((department) => (
          <div key={department}>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span aria-hidden="true">{DEPARTMENT_ICONS[department] || ''}</span>
              {department}
              <span className="text-xs font-normal text-gray-400">({grouped[department].length})</span>
            </h3>
            <div className="space-y-1">
              {grouped[department].map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 flex-wrap px-3 py-2 rounded-lg transition-colors ${
                    item.isChecked ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => toggleShoppingItem(item.id)}
                    role="checkbox"
                    aria-checked={item.isChecked}
                    aria-label={`${item.name}, ${formatAmount(item.amount)} ${item.unit}`}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      item.isChecked
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    {item.isChecked && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <span
                    className={`flex-1 min-w-[120px] text-sm ${
                      item.isChecked ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {item.name}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateShoppingQuantity(item.id, -0.25)}
                      aria-label={`Decrease ${item.name} quantity`}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center text-xs font-bold text-gray-600 print:hidden"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium text-gray-700 w-16 text-center whitespace-nowrap">
                      {formatAmount(item.amount)} {item.unit}
                    </span>
                    <button
                      onClick={() => updateShoppingQuantity(item.id, 0.25)}
                      aria-label={`Increase ${item.name} quantity`}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center text-xs font-bold text-gray-600 print:hidden"
                    >
                      +
                    </button>
                  </div>

                  <span
                    className="text-xs text-gray-400 hidden sm:block max-w-[120px] truncate"
                    title={item.mealSources.join(', ')}
                  >
                    {item.mealSources.join(', ')}
                  </span>

                  <button
                    onClick={() => deleteShoppingItem(item.id)}
                    aria-label={`Remove ${item.name} from list`}
                    className="w-6 h-6 rounded hover:bg-red-100 transition-colors flex items-center justify-center text-gray-400 hover:text-red-500 flex-shrink-0 print:hidden"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {pantryList.length > 0 && (
        <div className="mt-6 border-t border-dashed border-gray-300 pt-4">
          <button
            onClick={() => setPantryOpen(!pantryOpen)}
            aria-expanded={pantryOpen}
            className="w-full flex items-center gap-2 text-left print:hidden"
          >
            <span aria-hidden="true">{pantryOpen ? '▾' : '▸'}</span>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
              Check your pantry
              <span className="ml-2 text-xs font-normal text-gray-400 normal-case tracking-normal">
                {pantryList.length} small amounts &amp; staples you may already have
              </span>
            </h3>
          </button>
          <h3 className="hidden print:block text-sm font-semibold text-gray-600 uppercase tracking-wider">
            Check your pantry (you may already have these)
          </h3>
          {pantryOpen && (
            <div className="space-y-1 mt-2">
              {pantryList.map((item) => (
                <div key={item.id} className="flex items-center gap-3 flex-wrap px-3 py-1.5 rounded-lg text-sm">
                  <span className="text-gray-600 flex-1 min-w-[120px]">{item.name}</span>
                  <span className="text-gray-500 font-medium whitespace-nowrap">
                    {formatAmount(item.amount)} {item.unit}
                  </span>
                  <span
                    className="text-xs text-gray-400 hidden sm:block max-w-[120px] truncate"
                    title={item.mealSources.join(', ')}
                  >
                    {item.mealSources.join(', ')}
                  </span>
                  <button
                    onClick={() => promotePantryItem(item.id)}
                    className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full px-2.5 py-1 transition-colors print:hidden"
                  >
                    Add to list
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
