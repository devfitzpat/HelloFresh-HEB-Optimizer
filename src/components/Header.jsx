import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { familySize, updateFamilySize, reopenSetup, resetApp } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
    setConfirmingReset(false);
  };

  return (
    <header className="bg-emerald-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Grocery Optimizer</h1>
            <p className="text-emerald-100 text-sm">Plan meals, save money, reduce waste</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 bg-emerald-700/50 rounded-lg px-4 py-2">
              <span className="text-sm text-emerald-100">Family size:</span>
              <button
                onClick={() => updateFamilySize(Math.max(1, familySize - 1))}
                aria-label="Decrease family size"
                className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors flex items-center justify-center text-sm font-bold"
              >
                -
              </button>
              <span className="font-bold text-lg w-6 text-center" aria-live="polite">
                {familySize}
              </span>
              <button
                onClick={() => updateFamilySize(Math.min(12, familySize + 1))}
                aria-label="Increase family size"
                className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-400 transition-colors flex items-center justify-center text-sm font-bold"
              >
                +
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
                aria-label="Settings"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="w-11 h-11 rounded-lg bg-emerald-700/50 hover:bg-emerald-700 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <button
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close settings menu"
                    onClick={closeMenu}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 z-20 w-56 bg-white text-gray-700 rounded-lg shadow-xl border border-gray-200 py-1 text-sm"
                  >
                    <button
                      role="menuitem"
                      onClick={() => {
                        closeMenu();
                        reopenSetup();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      Change household size…
                    </button>
                    {confirmingReset ? (
                      <button
                        role="menuitem"
                        onClick={() => {
                          closeMenu();
                          resetApp();
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 font-semibold bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Really reset? This clears everything
                      </button>
                    ) : (
                      <button
                        role="menuitem"
                        onClick={() => setConfirmingReset(true)}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Reset app…
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
