import type { AreaId, CommodityId, IsoDate } from "@primo/contract/schemas";
import { useMemo } from "react";
import { bucket, priceFill } from "~/buckets";
import { commodityName } from "~/commodities";
import { MapCard } from "~/components/map-card";
import { MapTip } from "~/components/map-tip";
import type { MapInteraction } from "~/components/province-map";
import { SummaryPanel } from "~/components/summary-panel";
import { useMapData } from "~/use-map-data";

// The map section's content: the map card and the summary panel beside it (above it below 1024 px).
// `requestedDate` is the URL's date, which may have no data: the newest shows then. `area` is the
// selected province from the URL, and `onArea` is how the map asks to change it.
export function MapView(props: {
  readonly commodity: CommodityId;
  readonly requestedDate: IsoDate | undefined;
  readonly area: AreaId | undefined;
  readonly onArea: (area: AreaId | undefined) => void;
}) {
  const { commodity, requestedDate, area, onArea } = props;

  const {
    features,
    date,
    snapshot: data,
    stale,
    failed,
    retrying,
    retry,
  } = useMapData(commodity, requestedDate);

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

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <MapCard
        title={`${commodityName(commodity)}, price vs national average`}
        cardLabel="Price map"
        date={date}
        features={features}
        interaction={interaction}
        ariaLabel={`Map of Indonesia's 34 provinces coloured by ${commodityName(commodity)} price against the national price`}
        dimmed={stale}
        failed={failed}
        retrying={retrying}
        onRetry={retry}
      />
      {failed ? null : (
        <SummaryPanel commodity={commodity} date={date} snapshot={data} area={area} />
      )}
    </div>
  );
}
