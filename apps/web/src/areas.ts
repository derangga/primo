import { provinces } from "@primo/contract/reference";
import { m } from "~/paraglide/messages.js";
import type { PickerEntry } from "~/picker-entries";

const names = new Map<number, string>(provinces.map((province) => [province.id, province.name]));

// PIHPS's name for a province, in Indonesian.
export const provinceName = (areaId: number) => names.get(areaId) ?? `Area ${areaId}`;

// An area is a province, or 0 for the national figure.
export const areaName = (areaId: number) => (areaId === 0 ? m.national() : provinceName(areaId));

// Province names are Indonesian in both locales, so they sort the same way in both.
const sortedProvinces = provinces.toSorted((a, b) => a.name.localeCompare(b.name, "id"));

// The province list: "All provinces", which clears the selection and means the national figure on
// the chart, a divider, then the 34 provinces alphabetically. Values are the area ids as text, since
// a picker's values are strings. A function, because the first label follows the active locale.
export const provinceEntries = (): ReadonlyArray<PickerEntry<string>> => [
  { kind: "option", value: "all", label: m.all_provinces() },
  { kind: "divider" },
  ...sortedProvinces.map((province) => ({
    kind: "option" as const,
    value: String(province.id),
    label: province.name,
  })),
];
