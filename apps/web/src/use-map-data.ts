import type { CommodityId, IsoDate } from "@primo/contract/schemas";
import { useQuery } from "@tanstack/react-query";
import { datesOptions, provincesOptions, snapshotOptions } from "~/queries";
import { resolveDate } from "~/view-params";

// A query that failed and is being asked again reads as pending, which would drop the error message
// while "Retrying" is meant to show. errorUpdateCount stays above zero once the query has failed.
const hasFailed = (query: {
  readonly isError: boolean;
  readonly data: unknown;
  readonly errorUpdateCount: number;
}) => query.isError || (query.data === undefined && query.errorUpdateCount > 0);

// What the Map and Purchasing Power tabs both load: the outlines, the dates, and the snapshot of the
// commodity on `requestedDate`, which may have no data: the newest shows then.
export function useMapData(commodity: CommodityId, requestedDate: IsoDate | undefined) {
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

  return {
    features: provinces.data?.features,
    date,
    snapshot: snapshot.data,
    // The snapshot on screen is the previous commodity's or date's while the new one loads.
    stale: snapshot.isPlaceholderData,
    failed,
    retrying,
    retry,
  };
}
