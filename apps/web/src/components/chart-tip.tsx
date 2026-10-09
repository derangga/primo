import type { IsoDate } from "@primo/contract/schemas";
import { formatDate } from "~/date-badge-state";
import { formatRupiah } from "~/format";

// The Chart tab's tooltip (.tip): the date, then a line sample with what the line is, and the price.
export function ChartTip(props: {
  readonly date: IsoDate;
  readonly label: string;
  readonly price: number;
}) {
  return (
    <div className="flex w-max min-w-50 flex-col gap-1 rounded-md border border-border bg-card px-3 py-2.5 text-sm shadow-pop">
      <div className="text-[13px] font-semibold">{formatDate(props.date)}</div>
      <div className="flex items-center justify-between gap-5 text-text-2">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-3.5 rounded-full bg-(--chart-line)" />
          {props.label}
        </span>
        <b className="font-medium text-text">Rp {formatRupiah(props.price)}/kg</b>
      </div>
    </div>
  );
}
