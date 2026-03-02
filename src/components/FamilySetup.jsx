import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function FamilySetup() {
  const { completeFamilySetup } = useApp();
  const [size, setSize] = useState(3);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">&#x1F37D;&#xFE0F;</div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome to Grocery Optimizer</h2>
          <p className="text-gray-500 mt-2">Let's set up your household size to get started.</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How many people are you cooking for?
          </label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setSize((s) => Math.max(1, s - 1))}
              className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg hover:bg-emerald-200 transition-colors flex items-center justify-center"
            >
              -
            </button>
            <span className="text-4xl font-bold text-gray-800 w-16 text-center">{size}</span>
            <button
              onClick={() => setSize((s) => Math.min(12, s + 1))}
              className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg hover:bg-emerald-200 transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
          <p className="text-center text-sm text-gray-400 mt-2">
            {size === 1 ? '1 person' : `${size} people`}
          </p>
        </div>
        <button
          onClick={() => completeFamilySetup(size)}
          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
