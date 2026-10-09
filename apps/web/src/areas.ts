import { provinces } from "@primo/contract/reference";
import type { PickerEntry } from "~/picker-entries";

const names = new Map<number, string>(provinces.map((province) => [province.id, province.name]));

// PIHPS's name for a province, in Indonesian.
export const provinceName = (areaId: number) => names.get(areaId) ?? `Area ${areaId}`;

// An area is a province, or 0 for the national figure.
export const areaName = (areaId: number) => (areaId === 0 ? "National" : provinceName(areaId));

// The province list: "All provinces", which clears the selection and means the national figure on
// the chart, a divider, then the 34 provinces alphabetically. Values are the area ids as text, since
// a picker's values are strings.
export const provinceEntries: ReadonlyArray<PickerEntry<string>> = [
  { kind: "option", value: "all", label: "All provinces" },
  { kind: "divider" },
  ...provinces
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .map((province) => ({
      kind: "option" as const,
      value: String(province.id),
      label: province.name,
    })),
];
