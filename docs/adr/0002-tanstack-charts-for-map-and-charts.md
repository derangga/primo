---
status: accepted
---

# TanStack Charts draws the map and the charts

One library, `@tanstack/charts`, draws the province choropleth and the price area chart. We chose it over ECharts to keep to one SVG-based library that fits the TanStack stack already in use and adds about 30 KB gzip, where ECharts is a larger canvas library with its own theming system.

We accepted a known risk: version 1.0.0 was released on 2026-10-03, five days before this decision, and its map support is unproven for us.

## Considered options

- **ECharts for both.** Mature choropleth support. Rejected for bundle size and a second styling system beside Tailwind.
- **Leaflet with OpenStreetMap tiles**, as in the reference app. Rejected because a basemap adds a third-party tile dependency and nothing this app needs.

## Consequences

- The map is built before the other views, so a blocking problem shows up early.
- If the map cannot be made to work, it falls back to plain SVG with d3-geo, and TanStack Charts stays for the area chart.
