import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatAmount } from '../utils/optimizer';

const CATEGORY_ORDER = [
  'Produce',
  'Proteins/Meat',
  'Dairy',
  'Pantry/Dry Goods',
  'Condiments/Sauces',
  'Other',
];

const CATEGORY_ICONS = {
  Produce: '\uD83E\uDD66',
  'Proteins/Meat': '\uD83E\uDD69',
  Dairy: '\uD83E\uDDC0',
  'Pantry/Dry Goods': '\uD83C\uDF5E',
  'Condiments/Sauces': '\uD83E\uDD6B',
  Other: '\uD83D\uDCE6',
};

export default function ShoppingList() {
  const {
    shoppingList,
    toggleShoppingItem,
    updateShoppingQuantity,
    deleteShoppingItem,
    addCustomItem,
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '1', unit: 'piece', category: 'Other' });

  if (shoppingList.length === 0) return null;

  // Group by category
  const grouped = {};
  for (const item of shoppingList) {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  // Sort categories
  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped[c]);
  // Add any categories not in the order
  for (const c of Object.keys(grouped)) {
    if (!sortedCategories.includes(c)) sortedCategories.push(c);
  }

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    addCustomItem(newItem.name.trim(), parseFloat(newItem.quantity) || 1, newItem.unit, newItem.category);
    setNewItem({ name: '', quantity: '1', unit: 'piece', category: 'Other' });
    setShowAddForm(false);
  };

  const handleCopyList = () => {
    const lines = [];
    for (const cat of sortedCategories) {
      lines.push(`\n${cat}:`);
      for (const item of grouped[cat]) {
        const check = item.isChecked ? '[x]' : '[ ]';
        lines.push(`  ${check} ${formatAmount(item.amount)} ${item.unit} ${item.name}`);
      }
    }
    navigator.clipboard.writeText(lines.join('\n').trim());
  };

  const handlePrint = () => {
    window.print();
  };

  const checkedCount = shoppingList.filter((i) => i.isChecked).length;

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6" id="shopping-list">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Shopping List</h2>
          <p className="text-sm text-gray-500">
            {shoppingList.length} items | {checkedCount} checked off
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            + Add Item
          </button>
          <button
            onClick={handleCopyList}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Copy
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors print:hidden"
          >
            Print
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddCustom} className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs text-gray-500 mb-1">Item</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              placeholder="e.g., Milk"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
              autoFocus
            />
          </div>
          <div className="w-20">
            <label className="block text-xs text-gray-500 mb-1">Qty</label>
            <input
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              min="0.25"
              step="0.25"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-500 mb-1">Unit</label>
            <select
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
          <div className="w-40">
            <label className="block text-xs text-gray-500 mb-1">Category</label>
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none"
            >
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{c}</option>
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
        {sortedCategories.map((category) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>{CATEGORY_ICONS[category] || ''}</span>
              {category}
              <span className="text-xs font-normal text-gray-400">({grouped[category].length})</span>
            </h3>
            <div className="space-y-1">
              {grouped[category].map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    item.isChecked ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => toggleShoppingItem(item.id)}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      item.isChecked
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    {item.isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <span
                    className={`flex-1 text-sm ${
                      item.isChecked ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {item.name}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateShoppingQuantity(item.id, -0.25)}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center text-xs font-bold text-gray-600"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium text-gray-700 w-16 text-center whitespace-nowrap">
                      {formatAmount(item.amount)} {item.unit}
                    </span>
                    <button
                      onClick={() => updateShoppingQuantity(item.id, 0.25)}
                      className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center text-xs font-bold text-gray-600"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-xs text-gray-400 hidden sm:block max-w-[120px] truncate" title={item.mealSources.join(', ')}>
                    {item.mealSources.join(', ')}
                  </span>

                  <button
                    onClick={() => deleteShoppingItem(item.id)}
                    className="w-6 h-6 rounded hover:bg-red-100 transition-colors flex items-center justify-center text-gray-400 hover:text-red-500 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
