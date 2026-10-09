import type { CommodityId } from "@primo/contract/schemas";
import type { ReactNode } from "react";
import { Field, Picker } from "~/components/picker";
import { commodityEntries, commodityName } from "~/commodities";

// Every tab's filters start with the commodity. The rest are the tab's own and come as children, in
// the order they should appear: the Map's province and date, the Chart's area and range.
export function FilterBar(props: {
  readonly commodity: CommodityId;
  readonly onCommodity: (commodity: CommodityId) => void;
  readonly children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      <Field label="Commodity">
        <Picker
          label="Commodity"
          entries={commodityEntries}
          value={props.commodity}
          valueLabel={commodityName(props.commodity)}
          className="sm:w-70"
          onChange={props.onCommodity}
        />
      </Field>
      {props.children}
    </div>
  );
}
