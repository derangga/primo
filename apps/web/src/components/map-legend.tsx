import { cn } from "~/lib/utils";

// HTML below the map (DESIGN.UI.md, Map legend): the five buckets joined, the band edges at the
// joints, a caption at each end, and "No data" as its own hatched swatch.
export function MapLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-2">
      <div
        role="img"
        aria-label="Colour scale from cheaper to pricier than the national price: below -15%, -15% to -5%, within 5%, +5% to +15%, above +15%"
        className="flex flex-col gap-1"
      >
        <div className="flex justify-between text-[11px] text-text-2">
          <span>Cheaper</span>
          <span>Pricier</span>
        </div>
        <div className="grid grid-cols-[repeat(5,56px)] gap-px">
          {[1, 2, 3, 4, 5].map((n, index) => (
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
