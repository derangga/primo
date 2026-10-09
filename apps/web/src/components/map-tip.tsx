import { bucket, priceBucketLabel } from "~/buckets";
import { BucketSwatch } from "~/components/bucket-swatch";
import { changeBetween, formatRupiah } from "~/format";
import { formatDate } from "~/date-badge-state";
import type { IsoDate } from "@primo/contract/schemas";
import { provinceName } from "~/areas";

// The Map tab's tooltip (.tip, DESIGN.UI.md Tooltips): a title with the bucket swatch, then label and
// value rows, or the one "No data" row for a province without a price on this date.
export function MapTip(props: {
  readonly areaId: number;
  readonly price: number | undefined;
  readonly national: number | null;
  readonly date: IsoDate;
}) {
  const kind = bucket(props.price, props.national);

  return (
    <div className="flex w-max min-w-50 flex-col gap-1 rounded-md border border-border bg-card px-3 py-2.5 text-sm shadow-pop">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold">
        <BucketSwatch bucket={kind} />
        {provinceName(props.areaId)}
      </div>
      {props.price === undefined ? (
        <div className="text-text-2">No data on {formatDate(props.date)}</div>
      ) : (
        <>
          <TipRow label="Price" value={`Rp ${formatRupiah(props.price)}/kg`} />
          {props.national === null ? null : (
            <>
              <TipRow label="vs national" value={changeBetween(props.price, props.national).text} />
              <TipRow label="Bucket" value={priceBucketLabel[kind]} />
            </>
          )}
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
