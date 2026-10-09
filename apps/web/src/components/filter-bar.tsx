import type { CommodityId } from "@primo/contract/schemas";
import type { ReactNode } from "react";
import { Field, Picker } from "~/components/picker";
import { commodityEntries, commodityName } from "~/commodities";

// The filters the map and the chart share: the commodity, then the province, which comes as children.
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
