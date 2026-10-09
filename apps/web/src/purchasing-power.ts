import { provinces } from "@primo/contract/reference";

export type PowerRow = {
  readonly areaId: number;
  readonly kg: number;
  readonly price: number;
  readonly ump: number;
};

export type Power = {
  // Provinces with a price, most kilograms first. Equal kilograms keep the province id order.
  readonly rows: ReadonlyArray<PowerRow>;
  // Provinces without a price on this date, in id order.
  readonly missing: ReadonlyArray<number>;
  // The median of the kilograms in `rows`, or null when no province has a price.
  readonly median: number | null;
  readonly max: number;
};

const umps = new Map<number, number>(provinces.map((province) => [province.id, province.ump2026]));

export const ump = (areaId: number) => umps.get(areaId);

// Whole kilograms one monthly UMP buys at a price per kg. The division of two integers is correctly
// rounded, so a quotient that is a whole number is never pushed below it.
export const kilograms = (monthlyUmp: number, price: number) => Math.floor(monthlyUmp / price);

// The middle value, or the mean of the two middle ones. DESIGN.md: there is no national UMP, so the
// reference of every province is the median province.
const medianOf = (sorted: ReadonlyArray<number>) => {
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle];
  const lower = sorted[sorted.length - 1 - middle];

  return upper === undefined || lower === undefined ? null : (upper + lower) / 2;
};

export function purchasingPower(
  byArea: ReadonlyArray<{ readonly areaId: number; readonly price: number }>,
): Power {
  const prices = new Map<number, number>(byArea.map((row) => [row.areaId, row.price]));

  const rows = provinces
    .flatMap((province) => {
      const price = prices.get(province.id);

      return price === undefined
        ? []
        : [
            {
              areaId: province.id,
              kg: kilograms(province.ump2026, price),
              price,
              ump: province.ump2026,
            },
          ];
    })
    .toSorted((a, b) => b.kg - a.kg || a.areaId - b.areaId);

  return {
    rows,
    missing: provinces
      .filter((province) => !prices.has(province.id))
      .map((province) => province.id),
    median: medianOf(rows.map((row) => row.kg)),
    max: rows[0]?.kg ?? 0,
  };
}
