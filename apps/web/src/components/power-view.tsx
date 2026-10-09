import type { CommodityId, IsoDate } from "@primo/contract/schemas";
import { useMemo } from "react";
import { bucket, powerFill } from "~/buckets";
import { commodityName } from "~/commodities";
import { MapCard } from "~/components/map-card";
import { PowerTip } from "~/components/power-tip";
import type { MapInteraction } from "~/components/province-map";
import { RankingCard } from "~/components/ranking-card";
import { purchasingPower } from "~/purchasing-power";
import { useMapData } from "~/use-map-data";

// The Purchasing Power tab's content: the ranking, and the map coloured by the same result. From
// 1024 px the map is the second column and stays in view while the 34 rows scroll; below that it comes first.
export function PowerView(props: {
  readonly commodity: CommodityId;
  readonly requestedDate: IsoDate | undefined;
}) {
  const { commodity, requestedDate } = props;

  const { features, date, snapshot, stale, failed, retrying, retry } = useMapData(
    commodity,
    requestedDate,
  );

  const power = useMemo(
    () => (snapshot === undefined ? undefined : purchasingPower(snapshot.byArea)),
    [snapshot],
  );

  const interaction = useMemo((): MapInteraction | null => {
    if (power === undefined || snapshot === undefined) {
      return null;
    }

    const rows = new Map(power.rows.map((row) => [row.areaId, row]));

    return {
      fill: (areaId) => powerFill[bucket(rows.get(areaId)?.kg, power.median)],
      // This tab keeps no selected province; the pointer shows the tooltip.
      selected: null,
      onSelect: () => undefined,
      tip: (areaId) => {
        const row = rows.get(areaId);

        return (
          <PowerTip
            areaId={areaId}
            row={row}
            bucket={bucket(row?.kg, power.median)}
            date={snapshot.date}
          />
        );
      },
    };
  }, [power, snapshot]);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[520px_minmax(0,1fr)]">
      <RankingCard
        title={`${commodityName(commodity)} one UMP 2026 buys`}
        power={power}
        date={date}
        dimmed={stale}
        failed={failed}
        retrying={retrying}
        onRetry={retry}
      />
      <MapCard
        className="order-first lg:sticky lg:top-4 lg:order-none"
        title="Relative to the median province"
        cardLabel="Purchasing power map"
        date={date}
        legend="power"
        features={features}
        interaction={interaction}
        ariaLabel="Map of Indonesia's 34 provinces coloured by how many kilograms one minimum wage buys, against the median province"
        dimmed={stale}
        failed={failed}
        retrying={retrying}
        onRetry={retry}
      />
    </div>
  );
}
