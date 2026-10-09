import type { AreaId } from "@primo/contract/schemas";
import { defineChart, text } from "@tanstack/charts";
import * as Geo from "@tanstack/charts/geo";
import { controlledSignal } from "@tanstack/charts/interaction/signal";
import { Chart } from "@tanstack/charts/react/tooltip";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { keyedSelection, whenSelected } from "@tanstack/charts/selection";
import { tooltip } from "@tanstack/charts/tooltip";
import { geoMercator, geoPath } from "d3-geo";
import { useMemo, type ReactNode } from "react";
import { provinceName } from "~/areas";
import type { ProvinceFeature } from "~/provinces";

// The map card is about 5:2 (DESIGN.UI.md, Map styling).
const aspectRatio = 5 / 2;

// The label sits at a province's centre. The text mark places it with two fixed linear scales, so
// the same box, 1000 by 400, fits the outlines (zero inset, zero margin) and projects the labels:
// both then scale to the card together. The Mercator fit below is the one geoShape makes for itself.
const box = { width: 1000, height: 400 };

function labelPositions(features: ReadonlyArray<ProvinceFeature>) {
  const projection = geoMercator().fitExtent(
    [
      [0, 0],
      [box.width, box.height],
    ],
    { type: "FeatureCollection", features: [...features] },
  );

  const path = geoPath(projection);

  return new Map(
    features.map((feature) => {
      const [x = 0, y = 0] = path.centroid(feature);

      return [feature.properties.id, { x, y }] as const;
    }),
  );
}

// What the map does once prices are in: the paint of each province, the selected one, what a click
// proposes, and the tooltip body for the province under the pointer.
export type MapInteraction = {
  readonly fill: (areaId: AreaId) => string;
  readonly selected: AreaId | null;
  readonly onSelect: (areaId: AreaId | null) => void;
  readonly tip: (areaId: AreaId) => ReactNode;
};

const projection = { type: geoMercator, fit: "data", inset: 0 } as const;

// The province outlines, drawn by geoShape. Without `interaction` every province is the skeleton fill
// and the map has no hover, selection, tooltip or keyboard stop.
export function ProvinceMap(props: {
  readonly features: ReadonlyArray<ProvinceFeature>;
  readonly interaction: MapInteraction | null;
  readonly ariaLabel: string;
}) {
  const { features, interaction, ariaLabel } = props;
  const labels = useMemo(() => labelPositions(features), [features]);
  const fill = interaction?.fill;
  const selected = interaction?.selected ?? null;
  const onSelect = interaction?.onSelect;

  const definition = useMemo(() => {
    if (fill === undefined || onSelect === undefined) {
      return defineChart({
        marks: [
          Geo.geoShape(features, {
            key: (feature) => feature.properties.id,
            className: "province",
            projection,
            fill: "var(--skeleton)",
            stroke: "var(--color-card)",
            strokeWidth: 1,
          }),
        ],
        scales: { x: null, y: null },
        margin: 0,
        keyboard: false,
      });
    }

    const selection = keyedSelection<ProvinceFeature, AreaId>({
      selected: controlledSignal(selected, (next) => onSelect(next)),
      key: (feature) => feature.properties.id,
    });

    // Both rings and the label are marks that paint only the selected province, drawn after the
    // provinces: a card-coloured ring under a text-coloured one, so the outline shows on any fill.
    return defineChart({
      marks: [
        Geo.geoShape(features, {
          key: (feature) => feature.properties.id,
          className: "province",
          projection,
          fill: (feature) => fill(feature.properties.id),
          stroke: "var(--color-border-strong)",
          strokeWidth: 0.75,
          states: [
            {
              when: { focus: "primary" },
              style: { stroke: "var(--color-text)", strokeWidth: 1.5 },
            },
          ],
        }),
        whenSelected(
          Geo.geoShape(features, {
            key: (feature) => feature.properties.id,
            className: "province",
            projection,
            fill: "none",
            stroke: "var(--color-card)",
            strokeWidth: 5,
          }),
          selection,
        ),
        whenSelected(
          Geo.geoShape(features, {
            key: (feature) => feature.properties.id,
            className: "province",
            projection,
            fill: "none",
            stroke: "var(--color-text)",
            strokeWidth: 2.5,
          }),
          selection,
        ),
        whenSelected(
          text(features, {
            key: (feature) => feature.properties.id,
            x: (feature) => labels.get(feature.properties.id)?.x,
            y: (feature) => labels.get(feature.properties.id)?.y,
            text: (feature) => provinceName(feature.properties.id),
            fill: "var(--color-text)",
            fontSize: 13,
            fontWeight: 600,
          }),
          selection,
        ),
      ],
      scales: {
        x: { scale: scaleLinear().domain([0, box.width]), axis: false },
        y: { scale: scaleLinear().domain([box.height, 0]), axis: false },
      },
      margin: 0,
      keyboard: false,
      // Hover is the outline on the province; the library's ring at its centre would add a dot.
      focusRing: false,
      selection,
      tooltip: {
        use: tooltip,
        anchor: "pointer",
        placement: ["right", "left", "bottom", "top"],
        offset: 12,
        sticky: false,
        className: "map-tooltip",
      },
    });
  }, [features, labels, fill, selected, onSelect]);

  return (
    <div className="province-map">
      <Chart
        definition={definition}
        aspectRatio={aspectRatio}
        initialWidth={1000}
        ariaLabel={ariaLabel}
        renderTooltipBody={({ points }) => {
          const id = points[0]?.datum.properties.id;

          return interaction === null || id === undefined ? null : interaction.tip(id);
        }}
      />
    </div>
  );
}
