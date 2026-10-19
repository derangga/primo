import { m } from "~/paraglide/messages.js";
import { IsoDate, type AreaId, type CommodityId } from "@primo/contract/schemas";
import { windowStart, type RangeDays } from "@primo/contract/window";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, type ReactNode } from "react";
import { areaName } from "~/areas";
import { commodityName } from "~/commodities";
import { ErrorMessage } from "~/components/error-message";
import { Delta, Price } from "~/components/price";
import { ChartTip } from "~/components/chart-tip";
import { rangeLabel } from "~/range";
import { StatTile } from "~/components/stat-tile";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { formatDate } from "~/date-badge-state";
import { cn } from "~/lib/utils";
import { changeBetween } from "~/format";
import { seriesOptions } from "~/queries";
import { isoOf, summarise, weekdayRows } from "~/series";

// The chart library is its own chunk, so it stays out of the bundle that hydrates the page. The
// download starts here, beside the price request, rather than once the prices arrive.
const chartModule = import("~/components/price-chart");

const PriceChart = lazy(() => chartModule.then((module) => ({ default: module.PriceChart })));

const chartSkeleton = <Skeleton className="h-[220px] w-full sm:h-[280px]" />;

const figure = "leading-(--leading-num) font-semibold tracking-[-0.01em] whitespace-nowrap";

// A card the size of the content it stands in for, with one message in it: the error that replaces the
// tiles and the chart together, or the empty message.
function MessageCard(props: { readonly children: ReactNode }) {
  return <Card className="flex min-h-80 items-center justify-center">{props.children}</Card>;
}

// The same layout as the loaded view, so nothing moves when the prices arrive.
function ChartSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[0, 1, 2, 3].map((tile) => (
          <Card key={tile} className="flex flex-col gap-2">
            <div className="flex h-4 items-center">
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="h-[22px] w-32 sm:h-[31px]" />
            <div className="flex h-[17.4px] items-center">
              <Skeleton className="h-2.5 w-16" />
            </div>
          </Card>
        ))}
      </div>
      <Card aria-label={m.chart_loading()}>
        <CardHeader>
          <CardTitle>{m.chart_title()}</CardTitle>
        </CardHeader>
        {chartSkeleton}
      </Card>
    </>
  );
}

// The chart section's content: four tiles and the area chart for one commodity in one area over a range.
// One failure of any kind is one message that replaces them all.
export function ChartView(props: {
  readonly commodity: CommodityId;
  readonly area: AreaId;
  readonly range: RangeDays;
}) {
  const { commodity, area, range } = props;
  const series = useQuery(seriesOptions(commodity, area, range));
  const data = series.data;

  // The range comes with the answer: a refetch shows the old answer, and its rows start where it started.
  const rows = useMemo(
    () =>
      data === undefined
        ? []
        : weekdayRows(data.points, IsoDate.make(windowStart(isoOf(new Date()), data.days))),
    [data],
  );

  if (series.isError || (data === undefined && series.errorUpdateCount > 0)) {
    return (
      <MessageCard>
        <ErrorMessage retrying={series.isFetching} onRetry={() => void series.refetch()} />
      </MessageCard>
    );
  }

  if (data === undefined) {
    return <ChartSkeleton />;
  }

  const summary = summarise(data.points);

  if (summary === undefined) {
    return (
      <MessageCard>
        <div className="flex flex-col items-center gap-2 text-center text-text-2">
          <div className="font-medium text-text">{m.chart_empty_title()}</div>
          <p>{m.chart_empty_hint()}</p>
        </div>
      </MessageCard>
    );
  }

  const name = commodityName(commodity);
  const where = areaName(area);
  const label = `${name} · ${where}`;
  const change = changeBetween(summary.current.price, summary.first.price);
  const several = data.points.length > 1;

  return (
    <div
      className={
        series.isPlaceholderData
          ? "flex flex-col gap-3 opacity-60 sm:gap-4"
          : "flex flex-col gap-3 sm:gap-4"
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatTile
          label={m.tile_current()}
          figure={<Price rupiah={summary.current.price} size="tile" unit />}
          support={formatDate(summary.current.date)}
        />
        <StatTile
          label={m.tile_change({ range: rangeLabel(data.days) })}
          figure={
            <span className={cn("text-(length:--num-md) sm:text-(length:--num-lg)", figure)}>
              {several ? change.percent : "—"}
            </span>
          }
          support={
            several ? (
              <Delta value={summary.current.price} reference={summary.first.price} show="rupiah" />
            ) : (
              m.tile_one_day()
            )
          }
        />
        <StatTile
          label={m.tile_lowest()}
          figure={<Price rupiah={summary.lowest.price} size="tile" unit />}
          support={formatDate(summary.lowest.date)}
        />
        <StatTile
          label={m.tile_highest()}
          figure={<Price rupiah={summary.highest.price} size="tile" unit />}
          support={formatDate(summary.highest.date)}
        />
      </div>
      <Card aria-label={m.chart_title()}>
        <CardHeader>
          <CardTitle>{m.chart_title()}</CardTitle>
          <span className="text-sm text-text-2">{label} · Rp/kg</span>
        </CardHeader>
        <Suspense fallback={chartSkeleton}>
          <PriceChart
            rows={rows}
            ariaLabel={m.chart_aria({
              area: where,
              commodity: name,
              first: formatDate(summary.first.date),
              last: formatDate(summary.current.date),
            })}
            tip={(row) =>
              row.price === null ? null : (
                <ChartTip date={isoOf(row.date)} label={label} price={row.price} />
              )
            }
          />
        </Suspense>
      </Card>
    </div>
  );
}
