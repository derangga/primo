// What the Map tab's summary panel says about a snapshot when no province is selected: the national
// price and the provinces at each end. `byArea` is the API's list of provinces that have a row.
export type Extremes = {
  readonly cheapest: { readonly areaId: number; readonly price: number };
  readonly priciest: { readonly areaId: number; readonly price: number };
};

// Undefined when no province has a price. Provinces with the same price rank by id, lowest first.
export function extremes(
  byArea: ReadonlyArray<{ readonly areaId: number; readonly price: number }>,
): Extremes | undefined {
  const ranked = byArea.toSorted((a, b) => a.price - b.price || a.areaId - b.areaId);
  const cheapest = ranked.at(0);
  const highest = ranked.at(-1)?.price;
  const priciest = ranked.find((row) => row.price === highest);

  return cheapest === undefined || priciest === undefined ? undefined : { cheapest, priciest };
}
