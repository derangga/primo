import type { IsoDate } from "@primo/contract/schemas";
import { provinceName } from "~/areas";
import { powerFill, type Bucket } from "~/buckets";
import { BucketSwatch } from "~/components/bucket-swatch";
import { formatDate } from "~/date-badge-state";
import { formatRupiah } from "~/format";
import type { PowerRow } from "~/purchasing-power";

// The Purchasing Power tooltip (.tip, DESIGN.UI.md Tooltips), on a bar or a province: the bucket
// swatch and the province, then what one UMP buys, the commodity's price and the UMP. A province
// without a price has the one "No data" row.
export function PowerTip(props: {
  readonly areaId: number;
  readonly row: PowerRow | undefined;
  readonly bucket: Bucket;
  readonly date: IsoDate;
}) {
  const { row } = props;

  return (
    <div className="flex w-max min-w-50 flex-col gap-1 rounded-md border border-border bg-card px-3 py-2.5 text-sm shadow-pop">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold">
        <BucketSwatch bucket={props.bucket} fills={powerFill} />
        {provinceName(props.areaId)}
      </div>
      {row === undefined ? (
        <div className="text-text-2">No data on {formatDate(props.date)}</div>
      ) : (
        <>
          <TipRow label="One UMP buys" value={`${formatRupiah(row.kg)} kg`} />
          <TipRow label="Price" value={`Rp ${formatRupiah(row.price)}/kg`} />
          <TipRow label="UMP 2026" value={`Rp ${formatRupiah(row.ump)}`} />
        </>
      )}
    </div>
  );
}

function TipRow(props: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex justify-between gap-5 text-text-2">
      <span>{props.label}</span>
      <b className="font-medium text-text">{props.value}</b>
    </div>
  );
}
