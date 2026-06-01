export const euro = (cents: number) =>
  '€' + (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const priceFor = (baseCents: number, multiplier: number) =>
  Math.round(baseCents * multiplier);
