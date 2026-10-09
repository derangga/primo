import type { AreaId, CommodityId, IsoDate, Snapshot } from "@primo/contract/schemas";
import type { ReactNode } from "react";
import { provinceName } from "~/areas";
import { bucket, priceBucketLabel } from "~/buckets";
import { BucketSwatch } from "~/components/bucket-swatch";
import { Delta, Price } from "~/components/price";
import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { commodityName } from "~/commodities";
import { formatDate } from "~/date-badge-state";
import { changeBetween, formatRupiah } from "~/format";
import { extremes } from "~/summary";

const overline = "text-xs font-medium tracking-[0.06em] text-text-2 uppercase";

const divider = <div className="h-px bg-border" />;

// The panel beside the map (DESIGN.UI.md, Summary panel). It is built from a card and tiles.
// `snapshot` is undefined while the prices load; the caller leaves the panel out when the request failed.
export function SummaryPanel(props: {
  readonly commodity: CommodityId;
  readonly date: IsoDate | undefined;
  readonly snapshot: Snapshot | undefined;
  readonly area: AreaId | undefined;
}) {
  const { commodity, date, snapshot, area } = props;

  if (snapshot === undefined || date === undefined) {
    return <SummarySkeleton />;
  }

  const prices = new Map<number, number>(snapshot.byArea.map((row) => [row.areaId, row.price]));
  const label = commodityName(commodity);

  if (area === undefined) {
    return <Overview snapshot={snapshot} label={label} date={date} />;
  }

  const price = prices.get(area);

  if (price === undefined) {
    return (
      <Card
        aria-label="Selected province"
        className="order-first flex flex-col gap-3 lg:order-none"
      >
        <div className={overline}>
          {provinceName(area)} · {label}
        </div>
        <div className="flex flex-col gap-2 py-4 text-text-2">
          <div className="font-medium text-text">No data for this province on this date</div>
          <p>Choose another date, or another commodity.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card aria-label="Selected province" className="order-first flex flex-col gap-3 lg:order-none">
      <div className="flex min-w-0 flex-col gap-2">
        <div className={overline}>
          {provinceName(area)} · {label}
        </div>
        <Price rupiah={price} size="xl" unit />
        {snapshot.national === null ? null : (
          <span>
            <Delta value={price} reference={snapshot.national} />{" "}
            <span className="text-[13px] text-text-2">vs national</span>
          </span>
        )}
      </div>
      {divider}
      <div className="flex flex-col gap-2">
        {snapshot.national === null ? null : (
          <>
            <Row label="Bucket">
              <span className="inline-flex items-center gap-2">
                <BucketSwatch bucket={bucket(price, snapshot.national)} />
                {priceBucketLabel[bucket(price, snapshot.national)]}
              </span>
            </Row>
            <Row label="National average">Rp {formatRupiah(snapshot.national)}/kg</Row>
          </>
        )}
        <Row label="Date">{formatDate(date)}</Row>
      </div>
    </Card>
  );
}

function Row(props: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-2">{props.label}</span>
      <span>{props.children}</span>
    </div>
  );
}

function Overview(props: {
  readonly snapshot: Snapshot;
  readonly label: string;
  readonly date: IsoDate;
}) {
  const { snapshot, label, date } = props;
  const ends = extremes(snapshot.byArea);

  return (
    <Card aria-label="Summary" className="order-first flex flex-col gap-3 lg:order-none">
      <div className="flex min-w-0 flex-col gap-2">
        <div className={overline}>National average · {label}</div>
        {snapshot.national === null ? (
          <div className="text-text-2">No national price on this date</div>
        ) : (
          <Price rupiah={snapshot.national} size="xl" unit />
        )}
        <div className="text-sm text-text-2">{formatDate(date)}</div>
      </div>
      {ends === undefined ? null : (
        <>
          {divider}
          <Extreme title="Cheapest" end={ends.cheapest} national={snapshot.national} />
          <Extreme title="Most expensive" end={ends.priciest} national={snapshot.national} />
        </>
      )}
    </Card>
  );
}

function Extreme(props: {
  readonly title: string;
  readonly end: { readonly areaId: number; readonly price: number };
  readonly national: number | null;
}) {
  const { title, end, national } = props;

  return (
    <div className="flex flex-col gap-1">
      <div className={overline}>{title}</div>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <BucketSwatch bucket={bucket(end.price, national)} />
          {provinceName(end.areaId)}
        </span>
        <Price rupiah={end.price} size="md" />
      </div>
      {national === null ? null : (
        <div className="flex items-center justify-between gap-3 text-sm text-text-2">
          <span>vs national</span>
          <span>{changeBetween(end.price, national).text}</span>
        </div>
      )}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <Card aria-label="Summary loading" className="order-first flex flex-col gap-3 lg:order-none">
      <Skeleton className="h-2.5 w-[150px]" />
      <Skeleton className="h-[38px] w-[220px]" />
      <Skeleton className="h-2.5 w-20" />
      {divider}
      <Skeleton className="h-2.5 w-[70px]" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-2.5 w-full" />
      <Skeleton className="mt-2 h-2.5 w-24" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-2.5 w-full" />
    </Card>
  );
}
