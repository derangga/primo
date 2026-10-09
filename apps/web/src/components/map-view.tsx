import type { AreaId, CommodityId, IsoDate } from "@primo/contract/schemas";
import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { bucket, priceFill } from "~/buckets";
import { commodityName } from "~/commodities";
import { formatDate } from "~/date-badge-state";
import { ErrorMessage } from "~/components/error-message";
import { MapAttribution } from "~/components/map-attribution";
import { MapLegend } from "~/components/map-legend";
import { MapTip } from "~/components/map-tip";
import { ProvinceMap, type MapInteraction } from "~/components/province-map";
import { SummaryPanel } from "~/components/summary-panel";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { datesOptions, provincesOptions, snapshotOptions } from "~/queries";
import { resolveDate } from "~/view-params";

// A query that failed and is being asked again reads as pending, which would drop the error message
// while "Retrying" is meant to show. errorUpdateCount stays above zero once the query has failed.
const hasFailed = (query: {
  readonly isError: boolean;
  readonly data: unknown;
  readonly errorUpdateCount: number;
}) => query.isError || (query.data === undefined && query.errorUpdateCount > 0);

// The diagonal hatch of DESIGN.UI.md, Map styling, "No data". It lives in the page, outside the chart,
// because TanStack Charts has no pattern resource; the no-data paints reference it as url(#hatch).
function HatchPattern() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <pattern
          id="hatch"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="5" height="5" style={{ fill: "var(--bucket-nodata)" }} />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5"
            style={{ stroke: "var(--bucket-hatch)", strokeWidth: 1.5 }}
          />
        </pattern>
      </defs>
    </svg>
  );
}

// DESIGN.UI.md, Error message: the outlines stay and the message sits on top in a card.
function MapError(props: { readonly retrying: boolean; readonly onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="rounded-lg border border-border bg-card px-5 py-4 shadow-pop">
        <ErrorMessage retrying={props.retrying} onRetry={props.onRetry} />
      </div>
    </div>
  );
}

// The card, its title and the date the colours are for. The legend goes with the map, not the data,
// so it shows in every state.
function MapFrame(props: {
  readonly commodity: CommodityId;
  readonly date: IsoDate | undefined;
  readonly children: ReactNode;
}) {
  return (
    <Card aria-label="Price map">
      <CardHeader>
        <CardTitle>{commodityName(props.commodity)}, price vs national average</CardTitle>
        {props.date === undefined ? null : (
          <span className="text-sm text-text-2">{formatDate(props.date)}</span>
        )}
      </CardHeader>
      <div className="relative">
        <HatchPattern />
        {props.children}
      </div>
      <MapLegend />
      <MapAttribution />
    </Card>
  );
}

// The Map tab's content: the map card and the summary panel beside it (above it below 1024 px).
// `requestedDate` is the URL's date, which may have no data: the newest shows then. `area` is the
// selected province from the URL, and `onArea` is how the map asks to change it.
export function MapView(props: {
  readonly commodity: CommodityId;
  readonly requestedDate: IsoDate | undefined;
  readonly area: AreaId | undefined;
  readonly onArea: (area: AreaId | undefined) => void;
}) {
  const { commodity, requestedDate, area, onArea } = props;
  const provinces = useQuery(provincesOptions);
  const dates = useQuery(datesOptions);

  const date = dates.data === undefined ? undefined : resolveDate(dates.data.dates, requestedDate);
  const snapshot = useQuery(snapshotOptions(commodity, date));

  // A list with no dates means nothing was ever stored: no map to colour, and a retry may find some.
  const empty = dates.isSuccess && dates.data.dates.length === 0;
  const failed = hasFailed(provinces) || hasFailed(dates) || empty || hasFailed(snapshot);
  const retrying = provinces.isFetching || dates.isFetching || snapshot.isFetching;

  const retry = () => {
    if (hasFailed(provinces)) {
      void provinces.refetch();
    }

    if (hasFailed(dates) || empty) {
      void dates.refetch();
    }

    if (hasFailed(snapshot)) {
      void snapshot.refetch();
    }
  };

  const data = snapshot.data;

  const interaction = useMemo((): MapInteraction | null => {
    if (data === undefined) {
      return null;
    }

    const prices = new Map<number, number>(data.byArea.map((row) => [row.areaId, row.price]));

    return {
      fill: (areaId) => priceFill[bucket(prices.get(areaId), data.national)],
      selected: area ?? null,
      onSelect: (next) => onArea(next ?? undefined),
      tip: (areaId) => (
        <MapTip
          areaId={areaId}
          price={prices.get(areaId)}
          national={data.national}
          date={data.date}
        />
      ),
    };
  }, [data, area, onArea]);

  const features = provinces.data?.features;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <MapFrame commodity={commodity} date={date}>
        {features === undefined ? (
          <Skeleton className="aspect-[5/2] w-full" />
        ) : (
          <div className={snapshot.isPlaceholderData ? "opacity-60" : undefined}>
            <ProvinceMap
              features={features}
              interaction={interaction}
              ariaLabel={`Map of Indonesia's 34 provinces coloured by ${commodityName(commodity)} price against the national price`}
            />
          </div>
        )}
        {failed ? <MapError retrying={retrying} onRetry={retry} /> : null}
      </MapFrame>
      {failed ? null : (
        <SummaryPanel commodity={commodity} date={date} snapshot={data} area={area} />
      )}
    </div>
  );
}
