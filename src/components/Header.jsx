import { useApp } from '../context/AppContext';

export default function Header() {
  const { familySize, setFamilySize } = useApp();

  return (
    <header className="bg-emerald-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Grocery Optimizer</h1>
            <p className="text-emerald-100 text-sm">Plan meals, save money, reduce waste</p>
          </div>
          <div className="flex items-center gap-3 bg-emerald-700/50 rounded-lg px-4 py-2">
            <span className="text-sm text-emerald-100">Family size:</span>
            <button
              onClick={() => setFamilySize(Math.max(1, familySize - 1))}
              className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors flex items-center justify-center text-sm font-bold"
            >
              -
            </button>
            <span className="font-bold text-lg w-6 text-center">{familySize}</span>
            <button
              onClick={() => setFamilySize(Math.min(12, familySize + 1))}
              className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors flex items-center justify-center text-sm font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
