import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { provinceEntries, provinceName } from "~/areas";
import { defaultCommodity } from "~/commodities";
import { DateControl } from "~/components/date-control";
import { FilterBar } from "~/components/filter-bar";
import { MapView } from "~/components/map-view";
import { Field, Picker } from "~/components/picker";
import { datesOptions } from "~/queries";
import { AreaId } from "@primo/contract/schemas";
import { resolveDate, validateMapSearch } from "~/view-params";

export const Route = createFileRoute("/")({
  validateSearch: validateMapSearch,
  head: () => ({
    meta: [
      { title: "Map · Food Price Monitor" },
      {
        name: "description",
        content: "Staple food prices by Indonesian province, coloured against the national price.",
      },
    ],
  }),
  component: MapRoute,
});

// The commodity, date and selected province are in the URL, and an absent or invalid one means
// Beras, the newest date and no province.
function MapRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const dates = useQuery(datesOptions).data?.dates;
  const commodity = search.commodity ?? defaultCommodity;

  const setArea = (area: AreaId | undefined) => navigate({ search: (prev) => ({ ...prev, area }) });

  return (
    <>
      <h1 className="sr-only">Map</h1>
      <FilterBar
        commodity={commodity}
        onCommodity={(next) => navigate({ search: (prev) => ({ ...prev, commodity: next }) })}
      >
        <Field label="Province">
          <Picker
            label="Province"
            entries={provinceEntries}
            value={search.area === undefined ? "all" : String(search.area)}
            valueLabel={search.area === undefined ? "All provinces" : provinceName(search.area)}
            className="sm:w-60"
            onChange={(next) => setArea(next === "all" ? undefined : AreaId.make(Number(next)))}
          />
        </Field>
        <DateControl
          dates={dates}
          date={dates === undefined ? undefined : resolveDate(dates, search.date)}
          onChange={(next) => navigate({ search: (prev) => ({ ...prev, date: next }) })}
        />
      </FilterBar>
      <MapView
        commodity={commodity}
        requestedDate={search.date}
        area={search.area}
        onArea={setArea}
      />
    </>
  );
}
