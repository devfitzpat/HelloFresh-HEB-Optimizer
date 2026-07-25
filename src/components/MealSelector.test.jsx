import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import MealSelector from './MealSelector';
import { meals } from '../data/meals';

beforeEach(() => {
  localStorage.clear();
});

const renderSelector = () =>
  render(
    <AppProvider>
      <MealSelector />
    </AppProvider>
  );

describe('MealSelector', () => {
  it('renders every meal by default', () => {
    renderSelector();
    for (const meal of meals.slice(0, 5)) {
      expect(screen.getByText(meal.name)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('button', { pressed: false }).length).toBeGreaterThanOrEqual(
      meals.length
    );
  });

  it('narrows the grid when searching', () => {
    renderSelector();
    fireEvent.change(screen.getByLabelText('Search meals'), {
      target: { value: 'tortelloni' },
    });
    const shown = meals.filter((m) =>
      `${m.name} ${m.description}`.toLowerCase().includes('tortelloni')
    );
    expect(shown.length).toBeGreaterThan(0);
    for (const meal of shown) {
      expect(screen.getByText(meal.name)).toBeInTheDocument();
    }
    const hidden = meals.find(
      (m) => !`${m.name} ${m.description}`.toLowerCase().includes('tortelloni')
    );
    expect(screen.queryByText(hidden.name)).not.toBeInTheDocument();
  });

  it('shows a clearable empty state when nothing matches', () => {
    renderSelector();
    fireEvent.change(screen.getByLabelText('Search meals'), {
      target: { value: 'zzz-no-such-meal' },
    });
    expect(screen.getByText('No meals match your search.')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Clear filters')[0]);
    expect(screen.getByText(meals[0].name)).toBeInTheDocument();
  });

  it('marks selected meals with aria-pressed', () => {
    renderSelector();
    const card = screen.getByText(meals[0].name).closest('button');
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });
});
