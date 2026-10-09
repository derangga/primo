import { categories, variants } from "@primo/contract/reference";
import type { CommodityId } from "@primo/contract/schemas";
import type { PickerEntry } from "~/picker-entries";

export const defaultCommodity: CommodityId = "cat_1";

const names = new Map<string, string>([...categories, ...variants].map((c) => [c.id, c.name]));

// PIHPS's name for a commodity, in Indonesian.
export const commodityName = (id: CommodityId) => names.get(id) ?? id;

// The 10 categories, each selectable, with its variants indented beneath it.
export const commodityEntries: ReadonlyArray<PickerEntry<CommodityId>> = categories.flatMap(
  (category) => [
    { kind: "option", value: category.id, label: category.name, emphasis: true },
    ...variants
      .filter((variant) => variant.categoryId === category.id)
      .map((variant) => ({
        kind: "option" as const,
        value: variant.id,
        label: variant.name,
        indent: true,
      })),
  ],
);
