import { describe, it, expect } from 'vitest';
import { toTbsp, unitFamilyOf, toBaseAmount, convert, bestDisplayUnit } from './units';

describe('unitFamilyOf', () => {
  it('groups volume and weight units into families', () => {
    expect(unitFamilyOf('tsp')).toBe('volume');
    expect(unitFamilyOf('tbsp')).toBe('volume');
    expect(unitFamilyOf('cup')).toBe('volume');
    expect(unitFamilyOf('oz')).toBe('weight');
    expect(unitFamilyOf('lb')).toBe('weight');
  });

  it('keeps count units separate from each other', () => {
    expect(unitFamilyOf('piece')).toBe('count:piece');
    expect(unitFamilyOf('clove')).toBe('count:clove');
    expect(unitFamilyOf('can')).toBe('count:can');
    expect(unitFamilyOf('piece')).not.toBe(unitFamilyOf('clove'));
  });
});

describe('toBaseAmount', () => {
  it('converts volume to teaspoons', () => {
    expect(toBaseAmount(1, 'tsp')).toBe(1);
    expect(toBaseAmount(2, 'tbsp')).toBe(6);
    expect(toBaseAmount(0.25, 'cup')).toBe(12);
  });

  it('converts weight to ounces', () => {
    expect(toBaseAmount(10, 'oz')).toBe(10);
    expect(toBaseAmount(1.5, 'lb')).toBe(24);
  });

  it('passes count units through', () => {
    expect(toBaseAmount(3, 'piece')).toBe(3);
    expect(toBaseAmount(2, 'clove')).toBe(2);
  });
});

describe('convert', () => {
  it('converts within the volume family', () => {
    expect(convert(3, 'tsp', 'tbsp')).toBe(1);
    expect(convert(1, 'cup', 'tbsp')).toBe(16);
    expect(convert(8, 'tbsp', 'cup')).toBe(0.5);
  });

  it('converts within the weight family', () => {
    expect(convert(16, 'oz', 'lb')).toBe(1);
    expect(convert(2, 'lb', 'oz')).toBe(32);
  });

  it('refuses cross-family and count conversions', () => {
    expect(() => convert(1, 'cup', 'oz')).toThrow();
    expect(() => convert(1, 'piece', 'clove')).toThrow();
  });
});

describe('bestDisplayUnit', () => {
  it('prefers cups for clean quarter-cup volumes', () => {
    expect(bestDisplayUnit(24, 'volume')).toEqual({ amount: 0.5, unit: 'cup' });
    expect(bestDisplayUnit(48, 'volume')).toEqual({ amount: 1, unit: 'cup' });
  });

  it('falls back to tbsp when cups would be awkward', () => {
    // 21 tsp = 7 tbsp = 0.4375 cup -> "7 tbsp" reads better
    expect(bestDisplayUnit(21, 'volume')).toEqual({ amount: 7, unit: 'tbsp' });
  });

  it('falls back to tsp for tiny or uneven volumes', () => {
    expect(bestDisplayUnit(2, 'volume')).toEqual({ amount: 2, unit: 'tsp' });
    expect(bestDisplayUnit(4, 'volume')).toEqual({ amount: 4, unit: 'tsp' });
  });

  it('prefers pounds for clean quarter-pound weights', () => {
    expect(bestDisplayUnit(24, 'weight')).toEqual({ amount: 1.5, unit: 'lb' });
    expect(bestDisplayUnit(10, 'weight')).toEqual({ amount: 10, unit: 'oz' });
  });

  it('passes counts through with their own unit', () => {
    expect(bestDisplayUnit(2, 'count:clove', 'clove')).toEqual({ amount: 2, unit: 'clove' });
  });
});

describe('toTbsp', () => {
  it('estimates tablespoon equivalents for the pantry threshold', () => {
    expect(toTbsp(3, 'tsp')).toBeCloseTo(1);
    expect(toTbsp(1, 'cup')).toBe(16);
    expect(toTbsp(1, 'clove')).toBe(0.5);
  });
});
