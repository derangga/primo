import { cn } from "~/lib/utils";

export type LegendKind = "price" | "power";

// The words and the colour order of each tab (DESIGN.UI.md, Map legend). Blue is the good end, so on
// Purchasing Power the strip runs the other way, from bucket 5 ("Buys less") to bucket 1.
const legends = {
  price: {
    low: "Cheaper",
    high: "Pricier",
    label:
      "Colour scale from cheaper to pricier than the national price: below -15%, -15% to -5%, within 5%, +5% to +15%, above +15%",
    buckets: [1, 2, 3, 4, 5],
  },
  power: {
    low: "Buys less",
    high: "Buys more",
    label:
      "Colour scale from buying less to buying more than the median province: below -15%, -15% to -5%, within 5%, +5% to +15%, above +15%",
    buckets: [5, 4, 3, 2, 1],
  },
} as const;

// HTML below the map (DESIGN.UI.md, Map legend): the five buckets joined, the band edges at the
// joints, a caption at each end, and "No data" as its own hatched swatch.
export function MapLegend(props: { readonly kind: LegendKind }) {
  const legend = legends[props.kind];

  return (
    <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-2">
      <div role="img" aria-label={legend.label} className="flex flex-col gap-1">
        <div className="flex justify-between text-[11px] text-text-2">
          <span>{legend.low}</span>
          <span>{legend.high}</span>
        </div>
        <div className="grid grid-cols-[repeat(5,56px)] gap-px">
          {legend.buckets.map((n, index) => (
            <i
              key={n}
              className={cn(
                "h-2.5",
                index === 0 && "rounded-l-[3px]",
                index === 4 && "rounded-r-[3px]",
              )}
              style={{ background: `var(--bucket-${n})` }}
            />
          ))}
        </div>
        <div className="grid grid-cols-[repeat(5,57px)] text-[11px] text-text-2" aria-hidden="true">
          {["−15%", "−5%", "+5%", "+15%", ""].map((edge) => (
            <span key={edge} className="translate-x-1/2 text-right">
              {edge}
            </span>
          ))}
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 pt-4 text-sm whitespace-nowrap text-text-2">
        <i className="no-data-swatch inline-block size-3 flex-none rounded-[3px]" />
        No data
      </span>
    </div>
  );
}
