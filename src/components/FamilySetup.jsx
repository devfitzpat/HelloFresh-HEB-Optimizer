import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function FamilySetup() {
  const { familySize, completeFamilySetup, closeSetup } = useApp();
  const [size, setSize] = useState(familySize ?? 3);
  const dialogRef = useRef(null);

  // Dismissable only when reopened from settings — first-run setup must finish.
  const canDismiss = familySize != null;

  useEffect(() => {
    const dialog = dialogRef.current;
    const focusables = () => dialog.querySelectorAll('button');
    focusables()[0]?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && canDismiss) {
        closeSetup();
        return;
      }
      if (e.key === 'Tab') {
        const els = [...focusables()];
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    dialog.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [canDismiss, closeSetup]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="family-setup-title"
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3" aria-hidden="true">&#x1F37D;&#xFE0F;</div>
          <h2 id="family-setup-title" className="text-2xl font-bold text-gray-800">
            {canDismiss ? 'Household size' : 'Welcome to Grocery Optimizer'}
          </h2>
          <p className="text-gray-500 mt-2">
            {canDismiss
              ? 'Changing this rescales every meal in your plan.'
              : "Let's set up your household size to get started."}
          </p>
        </div>
        <div className="mb-6">
          <p id="family-size-label" className="block text-sm font-medium text-gray-700 mb-3 text-center">
            How many people are you cooking for?
          </p>
          <div
            className="flex items-center justify-center gap-4"
            role="group"
            aria-labelledby="family-size-label"
          >
            <button
              onClick={() => setSize((s) => Math.max(1, s - 1))}
              aria-label="Decrease household size"
              className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg hover:bg-emerald-200 transition-colors flex items-center justify-center"
            >
              -
            </button>
            <span className="text-4xl font-bold text-gray-800 w-16 text-center" aria-live="polite">
              {size}
            </span>
            <button
              onClick={() => setSize((s) => Math.min(12, s + 1))}
              aria-label="Increase household size"
              className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-lg hover:bg-emerald-200 transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
          <p className="text-center text-sm text-gray-400 mt-2">
            {size === 1 ? '1 person' : `${size} people`}
          </p>
        </div>
        <div className="flex gap-3">
          {canDismiss && (
            <button
              onClick={closeSetup}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => completeFamilySetup(size)}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            {canDismiss ? 'Save' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}
