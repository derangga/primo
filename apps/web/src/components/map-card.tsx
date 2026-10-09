import type { IsoDate } from "@primo/contract/schemas";
import { ErrorMessage } from "~/components/error-message";
import { MapAttribution } from "~/components/map-attribution";
import { MapLegend } from "~/components/map-legend";
import { ProvinceMap, type MapInteraction } from "~/components/province-map";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { formatDate } from "~/date-badge-state";
import type { ProvinceFeature } from "~/provinces";

// The diagonal hatch of DESIGN.UI.md, Map styling, "No data". It lives in the page, outside the chart,
// because TanStack Charts has no pattern resource; the no-data paints reference it as url(#hatch).
function HatchPattern() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <pattern
          id="hatch"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="5" height="5" style={{ fill: "var(--bucket-nodata)" }} />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5"
            style={{ stroke: "var(--bucket-hatch)", strokeWidth: 1.5 }}
          />
        </pattern>
      </defs>
    </svg>
  );
}

// DESIGN.UI.md, Error message: the outlines stay and the message sits on top in a card.
function MapError(props: { readonly retrying: boolean; readonly onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="rounded-lg border border-border bg-card px-5 py-4 shadow-pop">
        <ErrorMessage retrying={props.retrying} onRetry={props.onRetry} />
      </div>
    </div>
  );
}

// The map card: title, the date the colours are for, the map, the legend and the
// attribution. The legend goes with the map, not the data, so it shows in every state. The outlines
// are a skeleton until `features` arrive, and `interaction` is null until the prices do.
export function MapCard(props: {
  readonly title: string;
  readonly date: IsoDate | undefined;
  readonly features: ReadonlyArray<ProvinceFeature> | undefined;
  readonly interaction: MapInteraction | null;
  readonly ariaLabel: string;
  readonly cardLabel: string;
  readonly dimmed: boolean;
  readonly failed: boolean;
  readonly retrying: boolean;
  readonly onRetry: () => void;
}) {
  const { title, date, features, interaction, dimmed } = props;

  return (
    <Card aria-label={props.cardLabel}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {date === undefined ? null : (
          <span className="text-sm text-text-2">{formatDate(date)}</span>
        )}
      </CardHeader>
      <div className="relative">
        <HatchPattern />
        {features === undefined ? (
          <Skeleton className="aspect-[5/2] w-full" />
        ) : (
          <div className={dimmed ? "opacity-60" : undefined}>
            <ProvinceMap
              features={features}
              interaction={interaction}
              ariaLabel={props.ariaLabel}
            />
          </div>
        )}
        {props.failed ? <MapError retrying={props.retrying} onRetry={props.onRetry} /> : null}
      </div>
      <MapLegend />
      <MapAttribution />
    </Card>
  );
}
