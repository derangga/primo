import { AreaId } from "@primo/contract/schemas";
import { createFileRoute } from "@tanstack/react-router";
import { areaEntries, areaName } from "~/areas";
import { defaultCommodity } from "~/commodities";
import { ChartView } from "~/components/chart-view";
import { FilterBar } from "~/components/filter-bar";
import { Field, Picker } from "~/components/picker";
import { RangeControl } from "~/components/range-control";
import { validateChartSearch } from "~/view-params";

export const Route = createFileRoute("/chart")({
  validateSearch: validateChartSearch,
  head: () => ({
    meta: [
      { title: "Chart · Food Price Monitor" },
      {
        name: "description",
        content:
          "How the price of a staple food has moved over the last 90 days, nationally or by province.",
      },
    ],
  }),
  component: ChartRoute,
});

// Commodity, area and range are in the URL, and an absent or invalid one means Beras, National and 1 month.
// Every navigate below only rewrites a search param, so the page under it does not change:
// `resetScroll: false` says so. The default throws the viewport back to the top, which on a phone
// means picking a province scrolls the map itself off the screen.
function ChartRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const commodity = search.commodity ?? defaultCommodity;
  const area = search.area ?? AreaId.make(0);
  const range = search.range ?? 30;

  return (
    <>
      <h1 className="sr-only">Chart</h1>
      <FilterBar
        commodity={commodity}
        onCommodity={(next) =>
          navigate({ search: (prev) => ({ ...prev, commodity: next }), resetScroll: false })
        }
      >
        <Field label="Area">
          <Picker
            label="Area"
            entries={areaEntries}
            value={String(area)}
            valueLabel={areaName(area)}
            className="sm:w-60"
            onChange={(next) =>
              navigate({
                search: (prev) => ({ ...prev, area: AreaId.make(Number(next)) }),
                resetScroll: false,
              })
            }
          />
        </Field>
        <RangeControl
          value={range}
          onChange={(next) =>
            navigate({ search: (prev) => ({ ...prev, range: next }), resetScroll: false })
          }
        />
      </FilterBar>
      <ChartView commodity={commodity} area={area} range={range} />
    </>
  );
}
