# Interface design

The approved visual design for the food price monitor: colour scheme A "Ledger", a component system, and three screens at 1440 px and 390 px in light and dark. Approved 2026-10-08.

`DESIGN.md` says how the app is built and which surfaces exist. This document says how they look and behave. Where the two disagree on appearance, this one wins. The brief that produced it is `.P.DESIGN.UI.md`.

## Where the design lives

| File | What it is | How to use it |
|---|---|---|
| `design/tokens.css` | Every colour, type size, spacing step, radius, shadow and duration, as CSS custom properties with light and dark values | Copy into the app unchanged. It is the single source for values, so this document names tokens and does not repeat hex codes |
| `design/components.css` | The styles of every component and the page layout, exactly as drawn in the mockups | Port these rules to whatever styling approach the app uses. Class names are free to change, values are not |
| `design/mockups/*.dc.html` | The markup of the Map, Chart and Purchasing Power screens | Read for DOM structure and which class goes where. They are canvas files with `{{holes}}` and will not run in a browser |
| https://claude.ai/artifact/ENfe9gzypnwf5hXukPC9UH | The rendered canvas: page 1 colour schemes, page 2 spec sheets, page 3 screens | Open with the Artifact tool (`action: "read"`) or ask the user for a screenshot when a rule here is ambiguous |

`components.css` freezes interaction states as classes so the mockups can show them side by side. In the app they map to:

| Mockup class | Real selector |
|---|---|
| `.is-hover` | `:hover`, inside `@media (hover: hover) and (pointer: fine)` |
| `.is-focus` | `:focus-visible` |
| `.is-pressed` | `:active` |
| `.is-disabled` | `:disabled` |
| `.is-selected` | `[aria-selected="true"]`, `[aria-current="page"]` or `[aria-pressed="true"]`, whichever fits the element |
| `.is-open` | `[aria-expanded="true"]` |

Two things in `components.css` exist only for the mockups. `.sheet-layer` has a fixed 844 px height standing in for a phone screen; in the app it is `position: fixed; inset: 0`. The bottom navigation is `position: absolute`; in the app it is `position: fixed` with `env(safe-area-inset-bottom)` added to its padding.

## Colour

Scheme A "Ledger": cool grey neutrals, an indigo accent used only on controls, and a blue to orange map scale.

- **Buckets.** `--bucket-1` to `--bucket-5` run from good for the buyer to bad for the buyer. Blue is always the good end.
  - Map tab: far below national price is bucket 1, far above is bucket 5.
  - Purchasing Power tab: far above the median is bucket 1, far below is bucket 5. Reverse the mapping from the `bucket()` result to a token. The tokens stay as they are.
- **No data.** Page-coloured fill (`--bucket-nodata`) with a diagonal hatch (`--bucket-hatch`) and a dashed outline. It differs from every bucket by texture as well as colour. It is never black.
- **Accent.** `--color-accent` for the selected tab, links, button labels and the focus ring. `--color-accent-soft` behind a selected option, range segment, calendar day and bottom navigation item.
- **Change.** `--delta-up` when a price rose and `--delta-down` when it fell. Each always appears with an arrow and a sign.
- **Status.** Warning and error each pair a text colour with a tinted background and always carry an icon.

Measured results, for reference when a value has to change:

- Every text pair clears WCAG AA. The lowest are secondary text on the page (6.03:1 light) and `--delta-up` on a card (5.01:1 light).
- Under simulated protanopia, deuteranopia and tritanopia the closest pair among the six map fills measures 10.4 in light and 17.8 in dark (OKLab distance × 100, target 8).
- The pale buckets do not reach 3:1 against the card, which is why every province has a `--color-border-strong` stroke (3.7:1).

Rerun the same checks before changing any bucket or text colour.

## Theme

Three settings: System, Light, Dark. The header's theme switcher changes it.

- `tokens.css` holds light values on `:root` and dark values under `[data-theme="dark"]`.
- Store the setting (`system`, `light` or `dark`) in `localStorage`. An inline script in `<head>` reads it, resolves `system` with `prefers-color-scheme`, and sets `data-theme` on `<html>` before first paint.
- While the setting is `system`, follow changes to `prefers-color-scheme` live.
- Charts and the map are SVG, so their paints are written as `var(--token)` and follow `data-theme` with no code. Do not read token values with `getComputedStyle` or rebuild a chart when the theme changes.

## Type and numbers

IBM Plex Sans at weights 400, 500 and 600 for everything. The scale is in `tokens.css`.

- **Tabular figures everywhere.** Set `font-variant-numeric: tabular-nums` once on the app root. Figures swap in place when the date steps, so digits must not shift.
- **Price.** `Rp 16.400/kg`. "Rp" is the figure's size at weight 400 in secondary text. The figure is weight 600. "/kg" is 0.45 of the figure size and never below 13 px. See `.num`, `.rp`, `.unit`.
- **Sizes.** `--num-xl` for the one headline figure in the Map summary panel, `--num-lg` in stat tiles, `--num-md` for secondary figures.
- **Change.** `+Rp 550 (+3,4%)`: 13 px, weight 500, arrow, sign, rupiah first, percent in brackets. Use a real minus sign (−) for falls.
- **Formats.** Dot for thousands. Comma before the single decimal of a percent. Whole rupiah and whole kilograms (`338 kg`). Dates as `7 Oct 2026`, or `Wed, 7 Oct 2026` inside the date trigger. Wages as `Rp 5.729.876`.
- **Language.** Interface text is English. Province and commodity names stay in Indonesian as PIHPS gives them.

## Layout

Two breakpoints, 640 px and 1024 px. The content column stops at `--content-max`.

| Width | Layout |
|---|---|
| 1024 px and up | Header with tabs. Filters in one row. Main area in two columns |
| 640 to 1023 px | Header with tabs. Filters in one wrapping row. Main area in one column |
| Below 640 px | Header without tabs, bottom navigation, filters stacked at full width, controls 44 px high, one column |

The mockups switch layout with container queries on `.app` so one markup renders at any frame width. Media queries at the same widths are equally valid in the app.

Per screen:

- **Map.** Two columns: map card, then a 340 px summary panel. Below 1024 px the summary panel moves above the map, so the national price is the first thing on screen.
- **Chart.** Four stat tiles in a row, then the chart card. Below 640 px the tiles are a 2 × 2 grid with `--num-md` figures.
- **Purchasing Power.** Two columns: a 520 px ranking card, then the map card. The map card is `position: sticky` so it stays in view while the 34 rows scroll. Below 1024 px the map comes first and the ranking follows at full width.

## Components

Each component's exact values are in `components.css` under the class named here. The notes are the rules the CSS cannot express.

### Header (`.hdr`)

App title, tabs, date badge, theme switcher. Card surface with a bottom border. It scrolls with the page.

### Tabs and bottom navigation (`.tabs`, `.tab`)

- Each tab is a link to its route, so the back button works.
- From 640 px: pills in a page-coloured track inside the header. The selected tab is solid accent.
- Below 640 px: the same three links become a bottom navigation bar fixed to the bottom edge. It is 64 px high plus the safe area, with three equal items, each an 18 px icon above a 12 px label. The selected item has the soft accent fill and accent text. The page gets matching bottom padding.
- Switching tabs does not animate.

### Date badge (`.badge`)

Not interactive. Four states:

| State | Appearance |
|---|---|
| Loading | A skeleton bar inside the badge outline |
| Fresh | Accent dot, "Data", the newest date |
| Stale, newest date more than 4 days old | Warning colours, clock icon, date, then "· 7 days old". Below 640 px the age is dropped |
| Error | Error colours, alert icon, "Data unavailable" |

### Theme switcher (`.iconbtn.is-round`)

A 36 px round icon button at the end of the header. Its icon shows the current setting: monitor for System, sun for Light, moon for Dark. It opens a three-option list with a check on the current setting.

### Pickers: commodity, province or area, date (`.ctl`, `.pop`, `.opt`)

One trigger and one option list serve all three.

- **Trigger.** An overline label above a 40 px button showing the current value and a chevron. Widths: commodity 280 px, area 240 px, date 176 px. The longest names ("Minyak Goreng Kemasan Bermerk 1", "Kepulauan Bangka Belitung") fit without truncation. It is disabled with a skeleton bar while its options load.
- **Commodity list.** 31 options. The 10 categories are selectable and set at weight 500. Their variants sit indented beneath them (`.opt.is-sub`).
- **Area list.** On the Chart tab: "National", a divider, then 34 provinces in alphabetical order. On the Map tab the same picker is labelled "Province" and its first option is "All provinces", which clears the selection.
- **Date.** A month calendar, not a list: the shadcn Calendar over react-day-picker. See "Calendar". Changed 2026-10-09, the list under month headings was hard to scan across 90 days and wrong on a phone.
- **From 640 px** a list opens as a popover under the trigger, at most 360 px tall. Typing jumps to a match. The date calendar opens in the same kind of popover.
- **Below 640 px** every picker opens in a bottom sheet.

The Map tab has the province picker because DKI Jakarta is a few pixels wide on the map and the map cannot be reached by keyboard. Selecting in the picker and clicking the map set the same `area` search param.

Changing any filter rewrites a search param without changing the page, so none of them move the
viewport (`resetScroll: false` on every `navigate`). Switching tabs is a real page change and still
goes to the top. Below 640 px the map fills the screen once scrolled to, and the default would have
thrown it off screen on every province picked.

### Date control (`.datectl`)

Previous button, date trigger, next button, "Latest" button.

- Next and "Latest" are disabled on the newest date. Previous is disabled on the oldest.
- Left and right arrow keys step the date while the control has focus.
- Stepping does not animate. A refetch keeps the old content on screen at 60% opacity until the new data arrives.

### Bottom sheet (`.sheet-layer`, `.scrim`, `.bsheet`)

Below 640 px only. One sheet per field: commodity, province or area, date.

- A scrim covers the page. The sheet has 12 px top corners, a grab handle, a title, a close button, and the option list with 44 px rows.
- It is at most 70% of the screen high and its list scrolls. It opens scrolled to the selected option.
- Tapping an option selects it and closes the sheet. Tapping the scrim, the close button, or swiping the sheet down closes it with no change.
- Focus moves into the sheet on open and returns to the trigger on close.

### Calendar (`.cal`, `.cal-day`)

The date picker is a month calendar: in a popover under the trigger from 640 px, in the date bottom sheet below that. Day cells are 44 px on a phone and 40 px from 640 px. The calendar opens on the selected day's month with focus on the selected day.

- Previous and next month buttons either side of the month name, a Su to Sa weekday row, seven columns, 44 px day cells.
- Only days that have data are enabled. Weekends, missing days, future days and days outside the 90-day window are in the disabled colour and cannot be tapped.
- The selected day has the soft accent fill and accent text. Today has a thin outline. Leading and trailing days from the neighbouring months are shown disabled.
- The month buttons disable at the oldest and newest month that has data.

### Range control (`.seg`)

Three segments: 7 days, 1 month, 3 months. One is always selected, 1 month by default. Below 640 px it is full width with equal segments.

### Card (`.card`)

Card surface, 1 px border, 12 px radius, 16 px padding, no shadow. An optional head has a title on the left and a short note on the right. Loading, error and empty content render inside the card and keep its height.

### Stat tile (`.card.tile`)

An overline label, one figure, one supporting line (a date or a change). The Chart tab has four: Current price, Change over the range, Lowest, Highest.

### Summary panel (Map tab)

Built from a card and tiles. It has no class of its own.

| State | Content |
|---|---|
| Nothing selected | National average at `--num-xl` with the date. Then "Cheapest" and "Most expensive", each with a bucket swatch, the province name, the price at `--num-md`, and the difference from national |
| Province selected | The province's price at `--num-xl`, the change against national, then rows for bucket, national average and date, then a "View chart" link that opens the Chart tab with the same commodity and area |
| Selected province has no row | Title "No data for this province on this date" and one line of advice, with no icon and no button |
| Loading | Skeleton blocks in the same positions |
| Error | Hidden. The map carries the error |

### Map legend (`.strip`, `.ticks`)

HTML below the map, not part of the chart. A joined strip of the five buckets with −15%, −5%, +5% and +15% at the joints, a caption at each end, and "No data" as a separate hatched swatch.

| Tab | Strip order, left to right | Captions |
|---|---|---|
| Map | bucket 1 to bucket 5 | "Cheaper", "Pricier" |
| Purchasing Power | bucket 5 to bucket 1 | "Buys less", "Buys more" |

The attribution "© OpenStreetMap contributors" is a caption line under the legend row inside the map card, 11 px in `--color-text-2`, underlined, linking to https://www.openstreetmap.org/copyright. The shapes file is ODbL data and the licence asks for it wherever the map shows, so the Map and Purchasing Power cards both carry it, in every state. Decided 2026-10-09.

### Tooltips (`.tip`)

Card surface with `--shadow-pop`. A title line, then label and value rows with right-aligned values.

| Where | Title | Rows |
|---|---|---|
| Map tab | Bucket swatch, province | Price, vs national, Bucket |
| Map tab, no data | Hatched swatch, province | "No data on 7 Oct 2026" |
| Purchasing Power, map or bar | Bucket swatch, province | One UMP buys, commodity price, UMP 2026 |
| Chart | The date | A line sample with "Beras · National", then the price |

It follows the pointer at a 12 px offset and flips at the card edge. On touch a tap shows it and a tap elsewhere hides it. Every value in a tooltip is also visible in the summary panel, the tiles or a ranking row.

### Ranking row (`.rank`)

Plain HTML rows, not a TanStack Charts chart.

- Province name, a 12 px bar from a shared zero, the value in kilograms. The longest bar is 100% wide.
- The bar takes its bucket colour from the province's distance to the median, the same rule as the Purchasing Power map.
- One solid 1 px line in primary text colour marks the median across all rows, with a "Median province, 200 kg" label below the list.
- Provinces without a price sort last and show "No data" in place of the bar and value.
- Below 640 px each row is two lines: name and value, then an 8 px bar at full width. The 34 rows scroll with the page.

### Skeleton (`.sk`)

Blocks in `--skeleton` with a 4 px radius, sized and placed like the content they replace, so nothing moves when data arrives. Opacity pulses between 1 and 0.55 over 1.2 s, and stays still with reduced motion. Skeletons show on first load only.

### Error message and empty message (`.msg`)

- **Error.** Alert icon in the error colour, the title "Couldn't load prices", the line "Check your connection, then try again.", and a Retry button. Centred in the card it replaces, at that card's height. While the retry runs the button is disabled and reads "Retrying".
- **Chart tab error.** One message replaces the four tiles and the chart.
- **Map error.** The province outlines stay in the skeleton fill and the message sits on top in a card with `--shadow-pop`.
- **Empty.** A title and one line of advice, with no icon and no button.

## Map styling (TanStack Charts)

The map is SVG drawn by `geoShape` from `@tanstack/charts/geo`, one `<path>` per province. Every paint below is a CSS custom property written as `var(--token)`. `.map` in `components.css` holds the same values as CSS rules.

- **Shapes.** One `geoShape` over the 34 features of `provinces.json`, keyed by PIHPS province id. Its projection fits the features to the card at about 5:2. No basemap.
- **Fill.** The app computes each province's bucket, and the `fill` channel returns that bucket's token, for example `var(--bucket-3)`. Hover and selection never change the fill.
- **Border.** `stroke: var(--color-border-strong)`, `stroke-width: 0.75`, `stroke-linejoin: round`. Strokes do not scale with the map (`vector-effect: non-scaling-stroke`), and zoom does not scale them either (see Zoom and pan).
- **Hover.** A focus state on the same mark (`when: { focus: 'primary' }`) sets `stroke: var(--color-text)` and `stroke-width: 1.5`. Hover shows no label.
- **Selected.** One province at a time, held in the `area` search param and passed to the chart as a controlled keyed selection. Two rings and a label, each a mark that paints only the selected province (`whenSelected`). All three are drawn after the province layer, in this order:
  1. Under-ring: `fill: none`, `stroke: var(--color-card)`, `stroke-width: 5`.
  2. Over-ring: `fill: none`, `stroke: var(--color-text)`, `stroke-width: 2.5`.
  3. Label: the province name, 13 px, weight 600, `fill: var(--color-text)`, with a halo of `stroke: var(--color-card)`, `stroke-width: 3.5` and `paint-order: stroke`, centred on the province.
  - Both rings are needed. The text-coloured ring alone measures 2.76:1 on the darkest blue in light mode and 1.81:1 on the lightest blue in dark mode. The card-coloured ring covers those cases.
- **No data.** `fill: url(#hatch)`, `stroke-dasharray: 3 2`, with the normal border colour and width. `#hatch` is an SVG `<pattern>`, 5 × 5 user units, rotated 45°: a `--bucket-nodata` square under one 1.5-wide line in `--bucket-hatch`. If the hatch cannot be applied, the dashed border alone still separates the province.
- **Loading.** The shapes ship with the page, so draw the map at once with every province in `fill: var(--skeleton)`, `stroke: var(--color-card)`, `stroke-width: 1`, and no hover, selection or tooltip.
- **Tooltip.** Anchored to the pointer at a 12 px offset, flipping placement at the card edge. The body is the `.tip` HTML rendered by React (`renderTooltipBody`). The library's own tooltip surface is restyled through its `className` to be transparent with no border, padding or shadow, so only `.tip` shows.

### Zoom and pan

The map goes from its fitted view to 8x, which brings DKI Jakarta up to about the width Jawa Timur
has unzoomed. It can never go below the fitted view, and it can never be dragged so that the card
shows anything beside the map.

Zoom is a CSS transform on a wrapper around the chart, not a new projection. Refitting the 34
features costs about 13 ms a frame on a desktop, so no gesture could carry it. The chart resolves a
pointer through the SVG's `getScreenCTM`, which carries that transform, so hover, selection and the
tooltip go on hitting the province under the cursor.

- **Controls.** One segmented control in the bottom right corner of the map: `--control-h` icon
  buttons sharing a `--radius-md` border and one `--shadow-pop`, separated by 1 px of
  `--color-border`. Each press is a factor of 1.6, so four presses reach 8x. The map is not a
  keyboard stop, so these buttons are the whole keyboard and screen reader route into zoom.
  At the fitted view only zoom in can do anything, so it is the only button shown: a phone's map is
  about 130 px tall and three buttons cover a third of it. Reset and zoom out appear to its left
  once the map is zoomed in, in the order reset, zoom out, zoom in. Zoom in is at the right end and
  never moves, so pressing it again never lands on a button that has just appeared under the
  finger.
- **Wheel.** A plain wheel scrolls the page. Ctrl or Cmd held zooms about the pointer, which is also
  what a trackpad pinch sends.
- **Touch.** One finger scrolls the page while the map is at its fitted view, and pans the map once
  it is zoomed in (`touch-action` moves from `pan-y` to `none`). Two fingers always belong to the
  map: pinch zooms, drag pans.
- **Click.** A click still picks a province. A drag does not, and a double click does nothing.
- **What does not scale.** Everything the map draws at a fixed pixel size divides the zoom back out,
  so it holds that size on screen at any zoom: both selection rings, the province border and its
  hover width, and the selected province's label and halo. The shapes are what grows. The tooltip
  leaves the transform entirely, through the chart's `portal` tooltip option, which opens it in the
  browser's top layer.
- **Sharpness.** The wrapper must not carry `will-change: transform`. It promotes the map to a layer
  rasterised once at the fitted size, and the GPU then stretches that bitmap instead of redrawing
  the outlines.

## Chart styling (TanStack Charts)

SVG from `@tanstack/charts`, one area mark under one line mark over the same rows. `.chart` in `components.css` holds the same values as CSS rules.

- **Rows.** One row per weekday in the range. A weekday without data has `price: null`, which breaks both the line and the area there. Weekends have no row at all, so the line joins Friday to Monday across a time axis.
- **Line.** `stroke: var(--chart-line)`, `stroke-width: 2`, `fill: none`, round joins and caps, no point markers.
- **Area.** `fill: var(--chart-fill)`, a flat fill from the line down to the bottom of the plot (the start of the y range, not zero).
- **Isolated day.** A day with a gap on both sides has no line segment, so a dot mark draws it as an 8 px circle (`r: 4`) in `fill: var(--chart-line)`.
- **Hover.** The focused day gets an 8 px dot (`r: 4`): `fill: var(--chart-line)`, `stroke: var(--color-card)`, `stroke-width: 2`.
- **X axis.** Time scale. Baseline `stroke: var(--color-border-strong)`, 1 px. No tick stubs (`ticks.size: 0`). Labels 12 px in `fill: var(--color-text-2)`, formatted as `8 Sep`. Labels that would overlap are dropped.
- **Y axis.** The domain fits the data and does not start at zero. About 3 tick values. No baseline and no tick stubs. Solid 1 px gridlines in `stroke: var(--color-border)`. Labels 12 px in `--color-text-2`, dot thousands, no "Rp". The unit is in the card head.
- **Margins.** Left 0, right 8, top 12, bottom 0, plus whatever the axis labels need.
- **Tooltip.** Follows the focused day across the whole plot height, not only on the line. A solid 1 px vertical rule in `stroke: var(--color-border-strong)` marks that day. Same `.tip` HTML and surface treatment as the map.
- Height 280 px from 1024 px, 220 px below 640 px.
- The line draws in over 200 ms on first render. A filter change redraws at once, with no transition.

## Motion

Durations and curves are tokens. The rules:

- Stepping the date and switching tabs never animate. They happen many times a visit.
- Buttons scale to 0.97 while pressed (`--dur-press`).
- Popovers and tooltips fade in and scale from 0.97 with their origin at the trigger (`--dur-pop`). Closing takes 100 ms.
- The bottom sheet slides up from `translateY(100%)` with `--ease-sheet` over `--dur-sheet` while the scrim fades in. Closing takes 200 ms.
- Skeleton to content is an opacity fade (`--dur-fill`).
- With `prefers-reduced-motion`, keep the fades and drop every scale and slide.

The `emil-design-eng` and `animate` project skills hold the reasoning behind these values.

## What the mockups invent

The screens use real figures from the brief and illustrative ones everywhere else. Take none of the following as data:

- Which province falls in which bucket, and the names beside the cheapest and most expensive rice price.
- The month of chart history and the change, lowest and highest tiles derived from it.
- Every kilogram value except DKI Jakarta (338) and Jawa Timur (160), and the 200 kg median.
- Sulawesi Barat as "No data".
- The variant names in the commodity list. Use the names PIHPS returns.

The province outlines in the mockups are simplified SVG paths in a made-up projection. The app needs its own GeoJSON as `DESIGN.md` describes. The mockups drew theirs from geoBoundaries (`gbOpen/IDN/ADM1`, 34 provinces with Kalimantan Utara and the pre-2022 Papua pair, OpenStreetMap data under ODbL), which is one candidate for that file.

## Not yet checked

- Column and trigger widths were sized from the longest names in the brief, not from real PIHPS data.
- The colour-blindness figures come from simulation, not from testing with colour-blind viewers.
- TanStack Charts 1.0, against its documentation on 2026-10-08. Confirmed there: a per-feature `fill` channel on `geoShape`, `stroke`, `strokeWidth` and `strokeDasharray` options, focus states for hover, keyed selection with `whenSelected` overlays, line and area breaks at `null` values, a pointer-anchored tooltip with an offset and a placement list, a React tooltip body, a `className` on the tooltip surface, axes without baseline or tick stubs, and tick labels thinned on collision by default. Not confirmed:
  - ~~That a `url(#hatch)` fill reaches the DOM unchanged.~~ Confirmed 2026-10-09 with `@tanstack/charts` 1.1.0: the `fill` attribute is `url(#hatch)` as written, and the `<pattern>` defined in the page outside the chart paints it. The dashed border is a CSS rule on `path[fill="url(#hatch)"]`, because `strokeDasharray` is one value for the whole mark, not a per-province channel.
  - ~~A text label positioned on a map feature, with `paint-order: stroke`.~~ Confirmed 2026-10-09: the `text` mark places it through two fixed linear scales over the same 1000 by 400 box the Mercator fit uses, and the halo is a CSS rule on `text` inside the map (the mark has no stroke option).
  - ~~Turning off focus, selection and tooltip for the loading map.~~ Confirmed 2026-10-09: a `geoShape` with no `states`, no `tooltip` and `keyboard: false` has no hover change, no tooltip and no keyboard stop.
  - Loading map strokes and `vector-effect: non-scaling-stroke`. `className` lands on the group, not the paths, and `vector-effect` does not inherit, so the CSS rule is `.province path`.
  - A 200 ms entrance followed by updates with no transition. The `motion` renderer takes one fallback transition for both. Not built, 2026-10-09: the Chart tab draws at once, with no entrance. The rest of the chart styling was seen on real data: the area is `areaY` with `y1` at the start of the y range, the day under the pointer gets the `crosshair` mark's rule and 8 px marker, and `focusRing: false` removes the library's two extra rings. Over a week or so the time scale ticks every 12 hours and repeats a label, so a short range lists its days as tick values, and on a phone the labels are the first, middle and last day.
  - Tap to show and tap elsewhere to hide the tooltip on touch.
  - `vector-effect: non-scaling-stroke` and round line caps and joins, which no mark option names. Set them with CSS on the mark's `className` if needed.
