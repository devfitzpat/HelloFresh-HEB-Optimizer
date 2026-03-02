import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import FamilySetup from './components/FamilySetup';
import MealSelector from './components/MealSelector';
import SelectedMeals from './components/SelectedMeals';
import SwapSuggestions from './components/SwapSuggestions';
import ShoppingList from './components/ShoppingList';
import MealHistory from './components/MealHistory';

function AppContent() {
  const { showSetup } = useApp();

  return (
    <div className="min-h-screen bg-gray-100">
      {showSetup && <FamilySetup />}
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <MealSelector />
        <SelectedMeals />
        <SwapSuggestions />
        <ShoppingList />
        <MealHistory />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
