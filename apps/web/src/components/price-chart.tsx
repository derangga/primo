import { areaY, defineChart, lineY, dot } from "@tanstack/charts";
import { crosshair } from "@tanstack/charts/crosshair";
import { Chart } from "@tanstack/charts/react/tooltip";
import { tooltip } from "@tanstack/charts/tooltip";
import { scaleLinear, scaleUtc } from "d3-scale";
import { useMemo, type ReactNode } from "react";
import { formatDayMonth } from "~/date-badge-state";
import { formatRupiah } from "~/format";
import { useMediaQuery } from "~/lib/use-media-query";
import { isolated, type Row } from "~/series";

// The y axis fits the data and does not start at zero, with about 3 tick values. A flat series gets
// a little room either side so it still draws as a line.
function priceDomain(rows: ReadonlyArray<Row>) {
  const prices = rows.flatMap((row) => (row.price === null ? [] : [row.price]));
  const low = Math.min(...prices);
  const high = Math.max(...prices);

  const room = low === high ? Math.max(low * 0.01, 50) : 0;

  const [start = low, end = high] = scaleLinear()
    .domain([low - room, high + room])
    .nice(3)
    .domain();

  return [start, end] as const;
}

// One area mark under one line mark over the same rows (DESIGN.UI.md, Chart styling). `tip` renders
// the tooltip body for the row under the pointer.
export function PriceChart(props: {
  readonly rows: ReadonlyArray<Row>;
  readonly ariaLabel: string;
  readonly tip: (row: Row) => ReactNode;
}) {
  const { rows, ariaLabel, tip } = props;
  const narrow = !useMediaQuery("(min-width: 640px)");

  const definition = useMemo(() => {
    const [start, end] = priceDomain(rows);

    // The time scale ticks every 12 hours over a week or so, which repeats a day's label, so a short range
    // ticks every day it has a row. On a phone the labels are the first, the middle and the last day.
    // Longer ranges on wider screens leave the ticks to the scale.
    const tickFormat = { size: 0, format: (value: Date) => formatDayMonth(value) };
    const first = rows.at(0)?.date;
    const middle = rows.at(Math.floor(rows.length / 2))?.date;
    const last = rows.at(-1)?.date;

    const xTicks =
      narrow && first !== undefined && middle !== undefined && last !== undefined
        ? { ...tickFormat, values: [first, middle, last] }
        : rows.length <= 8
          ? { ...tickFormat, values: rows.map((row) => row.date) }
          : tickFormat;

    return defineChart({
      marks: [
        // A flat fill from the line down to the bottom of the plot: the start of the y range, not zero.
        areaY(rows, {
          x: "date",
          y1: start,
          y2: "price",
          fill: "var(--chart-fill)",
          fillOpacity: 1,
        }),
        lineY(rows, { x: "date", y: "price", stroke: "var(--chart-line)", strokeWidth: 2 }),
        // A day with a gap on both sides has no line segment, so it is drawn as a dot.
        dot(isolated(rows), { x: "date", y: "price", r: 4, fill: "var(--chart-line)" }),
        crosshair({
          x: { stroke: "var(--color-border-strong)", strokeWidth: 1 },
          y: false,
          marker: {
            radius: 4,
            fill: "var(--chart-line)",
            stroke: "var(--color-card)",
            strokeWidth: 2,
          },
        }),
      ],
      scales: {
        x: {
          scale: scaleUtc,
          axis: {
            line: { stroke: "var(--color-border-strong)", strokeWidth: 1 },
            ticks: xTicks,
            // When labels collide the first and last survive.
            tickLabels: { thin: { priority: "ends" } },
          },
        },
        y: {
          scale: scaleLinear().domain([start, end]),
          grid: { stroke: "var(--color-border)", strokeWidth: 1 },
          axis: {
            line: false,
            ticks: { size: 0, count: 3, format: (value: number) => formatRupiah(value) },
          },
        },
      },
      // Left and bottom are not set: the axis labels size them. Right and top are the spec's 8 and 12.
      margin: { right: 8, top: 12 },
      focus: "nearest-x",
      // The crosshair's marker is the one dot on the focused day; the default rings would add two more.
      focusRing: false,
      maxFocusDistance: Number.POSITIVE_INFINITY,
      tooltip: {
        use: tooltip,
        anchor: "pointer",
        placement: ["right", "left", "bottom", "top"],
        offset: 12,
        sticky: false,
        className: "map-tooltip",
      },
    });
  }, [rows, narrow]);

  return (
    <div className="price-chart">
      <Chart
        definition={definition}
        height={narrow ? 220 : 280}
        ariaLabel={ariaLabel}
        renderTooltipBody={({ points }) => {
          const row = points[0]?.datum;

          return row === undefined ? null : tip(row);
        }}
      />
    </div>
  );
}
