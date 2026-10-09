// One row of a picker's list. The commodity list is categories with their variants indented, the
// area list is "National" or "All provinces", a divider and the provinces.
export type PickerEntry<V extends string> =
  | { readonly kind: "divider" }
  | {
      readonly kind: "option";
      readonly value: V;
      readonly label: string;
      readonly indent?: boolean;
      readonly emphasis?: boolean;
    };

// The index at or after `start` (wrapping round) of the first label that begins with what the
// person typed, ignoring case, or -1. Typing "min" in the commodity list lands on "Minyak Goreng".
export function typeaheadMatch(labels: ReadonlyArray<string>, typed: string, start: number) {
  const wanted = typed.toLowerCase();

  for (let step = 0; step < labels.length; step += 1) {
    const index = (start + step) % labels.length;

    if (labels[index]?.toLowerCase().startsWith(wanted) === true) {
      return index;
    }
  }

  return -1;
}
