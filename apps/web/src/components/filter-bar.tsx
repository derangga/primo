import { m } from "~/paraglide/messages.js";
import type { CommodityId } from "@primo/contract/schemas";
import type { ReactNode } from "react";
import { Icon } from "~/components/icon";
import { Field, Picker } from "~/components/picker";
import { Button } from "~/components/ui/button";
import { commodityEntries, commodityName } from "~/commodities";

// The filters the map and the chart share: the commodity, then the province, which comes as children.
// The reset button ends the row beside the province. It clears every search param, the date and the
// range too, so `canReset` is whether the URL holds any. It is `aria-disabled` and not `disabled` so
// that a keyboard user who just pressed it keeps focus. From 640 px it says "Reset", below that it is
// an icon the height of the pickers, which adds no row to a screen the map is already low on.
export function FilterBar(props: {
  readonly commodity: CommodityId;
  readonly onCommodity: (commodity: CommodityId) => void;
  readonly canReset: boolean;
  readonly onReset: () => void;
  readonly children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      <Field label={m.field_commodity()}>
        <Picker
          label={m.field_commodity()}
          entries={commodityEntries}
          value={props.commodity}
          valueLabel={commodityName(props.commodity)}
          className="sm:w-70"
          onChange={props.onCommodity}
        />
      </Field>
      <div className="flex items-end gap-2 max-sm:w-full">
        {props.children}
        <Button
          aria-label={m.filters_reset_label()}
          title={m.filters_reset_label()}
          aria-disabled={!props.canReset}
          className="max-sm:size-(--control-h) max-sm:px-0"
          onClick={() => props.canReset && props.onReset()}
        >
          <Icon name="reset" className="sm:hidden" />
          <span className="max-sm:hidden">{m.filters_reset()}</span>
        </Button>
      </div>
    </div>
  );
}
