import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { provinceEntries, provinceName } from "~/areas";
import { defaultCommodity } from "~/commodities";
import { ChartView } from "~/components/chart-view";
import { DateControl } from "~/components/date-control";
import { FilterBar } from "~/components/filter-bar";
import { MapView } from "~/components/map-view";
import { Field, Picker } from "~/components/picker";
import { RangeControl } from "~/components/range-control";
import { datesOptions } from "~/queries";
import { AreaId } from "@primo/contract/schemas";
import { resolveDate, validateViewSearch } from "~/view-params";

export const Route = createFileRoute("/")({
  validateSearch: validateViewSearch,
  head: () => ({
    meta: [
      { title: "Food Price Monitor" },
      {
        name: "description",
        content:
          "Staple food prices by Indonesian province, coloured against the national price, and how each has moved over the last 90 days.",
      },
    ],
  }),
  component: HomeRoute,
});

// What a section shows, in words, with the one filter that is the section's own beside it. The space
// above it is what separates the map from the chart.
function SectionHead(props: {
  readonly title: string;
  readonly note: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mt-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-lg font-semibold">{props.title}</h2>
        <p className="text-text-2">{props.note}</p>
      </div>
      {props.children}
    </div>
  );
}

// The commodity, province, date and range are in the URL, and an absent or invalid one means Beras,
// no province, the newest date and 1 month. The commodity and the province apply to the map and the
// chart alike: with no province the chart shows the national figure. The date is the map's and the
// range is the chart's, so each sits above its own section.
// Every navigate below only rewrites a search param, so the page under it does not change:
// `resetScroll: false` says so. The default throws the viewport back to the top, which on a phone
// means picking a province scrolls the map itself off the screen.
function HomeRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const dates = useQuery(datesOptions).data?.dates;
  const commodity = search.commodity ?? defaultCommodity;

  const setArea = (area: AreaId | undefined) =>
    navigate({ search: (prev) => ({ ...prev, area }), resetScroll: false });

  return (
    <>
      <h1 className="sr-only">Food prices</h1>
      <FilterBar
        commodity={commodity}
        onCommodity={(next) =>
          navigate({ search: (prev) => ({ ...prev, commodity: next }), resetScroll: false })
        }
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
      </FilterBar>
      <SectionHead
        title="Prices by province"
        note="One day's price in every province, coloured against the national price."
      >
        <DateControl
          dates={dates}
          date={dates === undefined ? undefined : resolveDate(dates, search.date)}
          onChange={(next) =>
            navigate({ search: (prev) => ({ ...prev, date: next }), resetScroll: false })
          }
        />
      </SectionHead>
      <MapView
        commodity={commodity}
        requestedDate={search.date}
        area={search.area}
        onArea={setArea}
      />
      <SectionHead
        title="Price trend"
        note="How the price has moved over the range, nationally or in the province you picked."
      >
        <RangeControl
          value={search.range ?? 30}
          onChange={(next) =>
            navigate({ search: (prev) => ({ ...prev, range: next }), resetScroll: false })
          }
        />
      </SectionHead>
      <ChartView
        commodity={commodity}
        area={search.area ?? AreaId.make(0)}
        range={search.range ?? 30}
      />
    </>
  );
}
