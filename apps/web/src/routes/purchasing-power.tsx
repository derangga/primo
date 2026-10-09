import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { defaultCommodity } from "~/commodities";
import { DateControl } from "~/components/date-control";
import { FilterBar } from "~/components/filter-bar";
import { PowerView } from "~/components/power-view";
import { datesOptions } from "~/queries";
import { resolveDate, validateMapSearch } from "~/view-params";

export const Route = createFileRoute("/purchasing-power")({
  validateSearch: validateMapSearch,
  head: () => ({
    meta: [
      { title: "Purchasing Power · Food Price Monitor" },
      {
        name: "description",
        content: "How many kilograms of a staple food one provincial minimum wage buys.",
      },
    ],
  }),
  component: PowerRoute,
});

// The commodity and date are in the URL, and an absent or invalid one means Beras and the newest date.
function PowerRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const dates = useQuery(datesOptions).data?.dates;
  const commodity = search.commodity ?? defaultCommodity;

  return (
    <>
      <h1 className="sr-only">Purchasing Power</h1>
      <FilterBar
        commodity={commodity}
        onCommodity={(next) => navigate({ search: (prev) => ({ ...prev, commodity: next }) })}
      >
        <DateControl
          dates={dates}
          date={dates === undefined ? undefined : resolveDate(dates, search.date)}
          onChange={(next) => navigate({ search: (prev) => ({ ...prev, date: next }) })}
        />
      </FilterBar>
      <PowerView commodity={commodity} requestedDate={search.date} />
    </>
  );
}
