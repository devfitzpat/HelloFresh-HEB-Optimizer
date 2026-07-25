// Unit families for ingredient consolidation. Amounts are only summed within
// a family; a volume amount never merges with a weight or count amount.
const VOLUME_IN_TSP = { tsp: 1, tbsp: 3, cup: 48 };
const WEIGHT_IN_OZ = { oz: 1, lb: 16 };

// Rough tbsp-equivalents used only for the "small amount" pantry threshold.
const UNIT_TO_TBSP = {
  tsp: 1 / 3,
  tbsp: 1,
  cup: 16,
  oz: 2,
  lb: 32,
  piece: 3,
  clove: 0.5,
  can: 16,
};

export function toTbsp(amount, unit) {
  return amount * (UNIT_TO_TBSP[unit] || 1);
}

// Volume and weight units merge within their family; every other unit
// (piece, clove, can, ...) only merges with itself.
export function unitFamilyOf(unit) {
  if (unit in VOLUME_IN_TSP) return 'volume';
  if (unit in WEIGHT_IN_OZ) return 'weight';
  return `count:${unit}`;
}

// Convert an amount to its family's base unit (tsp for volume, oz for weight,
// itself for counts).
export function toBaseAmount(amount, unit) {
  if (unit in VOLUME_IN_TSP) return amount * VOLUME_IN_TSP[unit];
  if (unit in WEIGHT_IN_OZ) return amount * WEIGHT_IN_OZ[unit];
  return amount;
}

export function convert(amount, fromUnit, toUnit) {
  if (fromUnit === toUnit) return amount;
  const family = unitFamilyOf(fromUnit);
  if (family !== unitFamilyOf(toUnit) || family.startsWith('count:')) {
    throw new Error(`Cannot convert ${fromUnit} to ${toUnit}`);
  }
  const table = family === 'volume' ? VOLUME_IN_TSP : WEIGHT_IN_OZ;
  return (amount * table[fromUnit]) / table[toUnit];
}

const isQuarterMultiple = (x) => Math.abs(x * 4 - Math.round(x * 4)) < 1e-6;

// Pick the friendliest display unit for a base amount: the largest unit in
// the family whose value lands on a quarter fraction (so "½ cup" wins over
// "8 tbsp", but 7 tbsp stays "7 tbsp" instead of becoming "0.44 cup").
export function bestDisplayUnit(baseAmount, familyKey, fallbackUnit) {
  if (familyKey === 'volume') {
    const cups = baseAmount / VOLUME_IN_TSP.cup;
    if (cups >= 0.25 && isQuarterMultiple(cups)) return { amount: cups, unit: 'cup' };
    const tbsp = baseAmount / VOLUME_IN_TSP.tbsp;
    if (tbsp >= 1 && isQuarterMultiple(tbsp)) return { amount: tbsp, unit: 'tbsp' };
    return { amount: baseAmount, unit: 'tsp' };
  }
  if (familyKey === 'weight') {
    const lb = baseAmount / WEIGHT_IN_OZ.lb;
    if (lb >= 1 && isQuarterMultiple(lb)) return { amount: lb, unit: 'lb' };
    return { amount: baseAmount, unit: 'oz' };
  }
  return { amount: baseAmount, unit: fallbackUnit };
}
