# Design

A personal monitor for Indonesian staple food prices, modelled on F2aldi's "Monitor Pangan".
Facts and decisions behind this design are in `.FINDINGS.md`. This document says how the pieces fit.
The approved visual design is in `DESIGN.UI.md`. Read it before building any route or component.

Code sketches here follow the Alchemy v2 beta and Effect v4 docs as read on 2026-10-08. Treat exact API names as provisional until the first build.

## What gets built

Three deployables and one script, in a bun monorepo with three workspaces. The reasons behind the main choices are in `docs/adr/`.

| Piece | Runs on | Job |
|---|---|---|
| Website | Cloudflare static assets (TanStack Start, prerendered) | Serves the page shell, JavaScript and province shapes. No server logic. |
| Backend Worker | Cloudflare Worker, Effect-native | Serves the read-only HTTP API, and runs the daily ingest on a cron |
| Database | Cloudflare D1 | One table of prices |
| Backfill script | Your machine, once | Loads the first 90 days into the remote D1 |

The API is an Effect `HttpApi` defined in a shared contract module. The backend implements it and the browser derives its client from it.

```
PIHPS (bi.go.id)
   |  35 GETs, 08:00 WIB (cron)
   v
Backend Worker ---- upsert + prune ----> D1 <---- backfill script (once, local)
   ^      |                              ^
   |      +------ 1 query per API call --+
   | GET /dates, /snapshot, /series (cross-origin)
   |
Browser <--- static shell + JS + provinces.json --- Website (static assets)
```

## Repository layout

```
package.json              bun workspaces: packages/*, apps/*; the root check script
alchemy.run.ts            stack: D1, backend Worker, website
oxlint.config.ts          lint rules for every workspace
tools/oxlint/anti-slop/   vendored lint plugin source
packages/
  contract/               imported by both apps; depends only on effect
    src/
      reference.ts        provinces, commodities, UMP 2026 (constants)
      schemas.ts          AreaId, CommodityId, IsoDate, Rupiah, Snapshot, SeriesPoint
      errors.ts           StorageUnavailable
      api.ts              PricesApi: the HttpApi definition
apps/
  backend/
    migrations/0001_prices.sql
    scripts/backfill.ts   one-off 90-day load
    src/
      worker.ts           Worker entry: API handlers + cron
      handlers.ts         HttpApiBuilder group for PricesApi
      pihps.ts            Pihps service: fetch + decode one area
      price-repo.ts       PriceRepo service: upsert, prune, three reads
      ingest.ts           ingest program (shared by Worker and script)
    test/
      pihps.test.ts       parser against a saved real response
      price-repo.test.ts  the table, upsert and prune against real SQLite
      ingest.test.ts      ingest with swapped layers
      support/fake-d1.ts  a D1 binding over node:sqlite in memory
      fixtures/grid-dki-7d.json
  web/
    public/provinces.json 34 province shapes, keyed by PIHPS id
    src/
      api-client.ts       HttpApiClient derived from PricesApi
      queries.ts          effect-query options
      buckets.ts          percent-band function
      components/ui/      shadcn components, only the ones used
      routes/             __root, index (map), chart, purchasing-power
    test/
      buckets.test.ts
```

Dependencies point one way. Both apps import `packages/contract`. The apps never import each other, and the contract imports neither.

## Shapes

```
AreaId        0 (national) | 1..34 (PIHPS province id)        branded Int
CommodityId   "cat_1".."cat_10" | "com_1".."com_21"           literal union
IsoDate       "2026-10-07"                                    branded string
Rupiah        integer rupiah per kg                           branded Int

PriceRow      { date: IsoDate, areaId: AreaId, commodityId: CommodityId, price: Rupiah }
Snapshot      { date: IsoDate, national: Rupiah | null, byArea: Array<{ areaId, price }> }
SeriesPoint   { date: IsoDate, price: Rupiah }

Bucket        "far-below" | "below" | "near" | "above" | "far-above" | "no-data"

errors
  PihpsUnreachable   { areaId, cause }      network error, timeout, non-2xx
  PihpsMalformed     { areaId, issue }      body is not the expected JSON shape
  IngestFailed       { failedAreas }        every area failed in one run
  StorageUnavailable {}                     the API could not read D1; part of the contract, HTTP 503
```

`packages/contract/src/reference.ts` holds the 34 provinces, the 31 commodities with their parent category, and UMP 2026 per province as plain constants. They change at most once a year, so they are not database tables. `AreaId` and `CommodityId` schemas are derived from these constants.

## Database

One table. Provinces, commodities and UMP live in code.

```sql
CREATE TABLE prices (
  commodity_id TEXT    NOT NULL,   -- 'cat_1' or 'com_3'
  area_id      INTEGER NOT NULL,   -- 0 national, 1..34 province
  date         TEXT    NOT NULL,   -- ISO yyyy-mm-dd
  price        INTEGER NOT NULL,   -- rupiah per kg
  PRIMARY KEY (commodity_id, area_id, date)
) WITHOUT ROWID;
```

- A `"-"` cell from PIHPS is not stored. A missing row means no data.
- Category averages (`cat_N`) are stored as PIHPS reports them, not recomputed from variants.
- There is no secondary index. Each one would double the row writes against D1 Free's 100,000 per day.
- The primary key order serves every read:

| Read | SQL shape | Rows scanned |
|---|---|---|
| Series for the chart | `WHERE commodity_id = ? AND area_id = ? AND date >= ?` | up to 65 |
| Available dates and newest date | `SELECT date ... WHERE commodity_id = 'cat_1' AND area_id = 0` | up to 65 |
| Snapshot for the map | `WHERE commodity_id = ? AND date = ?` | up to 2,275 (one commodity, all areas) |

The newest-date query must keep its `WHERE` clause. A bare `SELECT max(date) FROM prices` would scan all 70,000 rows on every page view and use up the 5 million daily reads in about 70 views.

Writes:

```sql
-- upsert: the whole batch is one JSON string, so one query and one bound parameter
INSERT INTO prices (commodity_id, area_id, date, price)
SELECT value ->> 0, value ->> 1, value ->> 2, value ->> 3 FROM json_each(?1) WHERE true
ON CONFLICT (commodity_id, area_id, date)
DO UPDATE SET price = excluded.price WHERE prices.price <> excluded.price;

-- prune
DELETE FROM prices WHERE date < ?1;
```

A daily batch is about 5,400 rows and 170 KB of JSON.

## Ingestion

### Services

```
Pihps.fetchArea   (areaId, from, to) => Effect<Array<PriceRow>, PihpsUnreachable | PihpsMalformed>
                  R: HttpClient

PriceRepo.upsert  (rows)   => Effect<number, SqlError>     rows D1 reports as written
PriceRepo.prune   (before) => Effect<void, SqlError>
                  R: SqlClient

ingest            (window: { from, to, keepFrom }) => Effect<IngestReport, IngestFailed | SqlError>
                  R: Pihps | PriceRepo
```

### Call graph, daily run

```
shapes: AreaId, IsoDate, PriceRow, IngestReport { areasOk, areasFailed, rows, rowsWritten }

-> cron fires at 01:00 UTC (08:00 WIB)
  -> compute window from the scheduled time        from = today - 7d, keepFrom = today - 90d
-> fetch 35 areas, concurrency 5
  -> Pihps.fetchArea(area, from, to)   R: HttpClient    E: PihpsUnreachable -> escape, skip area, log
    -> HttpClient.get(GetGridDataDaerah)                 timeout 10 s
    -> decode body with Schema                           E: PihpsMalformed -> escape, skip area, log
    -> pivot wide rows into PriceRow[]                   unknown commodity name -> skip row, log
-> if every area failed                                  E: IngestFailed -> fail the run
-> PriceRepo.upsert(all rows)          R: SqlClient      E: SqlError -> fail the run
-> PriceRepo.prune(keepFrom)           R: SqlClient      E: SqlError -> escape, log
-> log IngestReport
```

Every node produces one value, so this is `Effect` throughout with `Effect.forEach` for the fan-out. Nothing here is a `Stream`.

### Error decisions

- **A failed area is skipped, not retried.** Retries cost subrequests, and the Free plan allows 50 per invocation. A run uses 35 fetches plus 2 database queries, which leaves 13 spare. Tomorrow's run refetches the same 7 days, so a skipped area repairs itself. The 7-day window is the retry policy.
- **A malformed body is a typed error, not a defect.** BI changing its response is the outside world changing, not a bug in this code. One area's bad body must not stop the other 34.
- **An unknown commodity name skips that row.** If BI adds a commodity, the run still stores the 31 known ones and the log names the new one.
- **All 35 areas failing fails the run.** This is the signal that BI is down or blocking Cloudflare.
- **A failed upsert fails the run.** Nothing was stored, and the next run covers the same days.
- **A failed prune is logged and ignored.** Old rows cost nothing for one more day.
- **Nothing dies on purpose.** No assumption in this graph is strong enough that breaking it should crash the Worker.

### Boundary

PIHPS is the only untrusted input to ingestion. One Schema decodes the response body:

```
GridResponse = { data: Array<{ no, name: string, level: 1 | 2, [date: "dd/mm/yyyy"]: string }> }
```

The decoder then:

1. Trims `name` and looks it up in `reference.ts` together with `level`. The lookup needs both, because a category and a variant can share a name.
2. Treats every key other than `no`, `name` and `level` as a date and converts `dd/mm/yyyy` to `IsoDate`.
3. Parses `"16,400"` to `16400`. `"-"` produces no row. Anything else is `PihpsMalformed`.

After this step the rest of the program only sees `PriceRow`.

### Behaviour wrapped around nodes

- 10 second timeout on each PIHPS request.
- Concurrency of 5, to stay polite to BI. The run takes about 3 seconds.
- A span per area and one for the run.
- `Effect.log` for the report and each skipped area. Cloudflare's dashboard shows these.

### Backfill script

`apps/backend/scripts/backfill.ts` runs the same `ingest` program with a 90-day window. Only the layers differ.

```
backend Worker, cron

-> ingest(7-day window)
  -> Pihps.fetchArea        R: FetchHttpClient
  -> PriceRepo.upsert       R: D1 binding

backfill script: same graph, R swapped

-> ingest(90-day window)
  -> Pihps.fetchArea        R: FetchHttpClient, wrapped with retry x3 and a 60 s timeout
  -> PriceRepo.upsert       R: D1 REST API (POST .../d1/database/{id}/query), one call per area
```

The script has no subrequest cap, so it can retry. It upserts per area to keep each JSON payload near 60 KB. The full load writes about 70,000 rows, which fits D1 Free's daily 100,000 as long as it runs once. It needs a Cloudflare API token and the database id in the environment.

Run it before the first cron. It also works if BI turns out to block Cloudflare IPs, in which case it becomes the daily job, run locally.

## Website

### Rendering

The website has no server logic. It is a shell that the browser fills with data from the API.

- Each route's title, meta description, heading, tabs and filter bar are in the HTML. This is what a search engine reads.
- The three routes are prerendered at build time, so Cloudflare serves them as static files and a page load costs no Worker CPU.
- Prices are not in the HTML. Routes have no loader. Components call `useQuery` and show a skeleton until data arrives.
- The backend's URL reaches the browser as a build-time variable (`VITE_API_URL`).

### API contract

`packages/contract/src/api.ts` defines one `HttpApi` with one group and three `GET` endpoints. Request parameters, response bodies and errors are all Schemas from `packages/contract/src`.

```
PricesApi
  GET /dates                                        => { dates: Array<IsoDate> }     newest last
  GET /snapshot?commodityId=&date=                  => Snapshot
  GET /series?commodityId=&areaId=&days=            => Array<SeriesPoint>            days: 7 | 30 | 90

  errors: StorageUnavailable (503)
          parameter decode failure (400, produced by HttpApi from the schemas)
```

The contract is the only thing the two sides share. The backend passes it to `HttpApiBuilder` and must implement every endpoint. The web app passes it to `HttpApiClient.make`, which returns typed methods with no code generation.

Call graph for one endpoint. The other two have the same shape.

```
-> browser: useQuery(snapshotOptions(commodityId, date))
  -> effect-query runs the queryFn Effect
    -> client.prices.snapshot({ commodityId, date })   R: HttpClient (fetch)
                                                       E: StorageUnavailable | HttpClientError | decode error
                                                          -> all three: error state with Retry
-> backend: snapshot handler
  -> HttpApi decodes the query parameters              E: decode failure -> 400, no handler code runs
  -> PriceRepo.snapshot(commodityId, date)   R: SqlClient
                                                       E: SqlError -> StorageUnavailable (503), logged
  -> HttpApi encodes Snapshot
```

- **Parameters are untrusted, and the contract decodes them.** A handler only ever receives a valid `CommodityId`, `AreaId` and `IsoDate`.
- **Responses are decoded on the client too.** The browser validates what it receives against the same schemas, so a backend and website deployed from different commits fail loudly instead of rendering wrong numbers.
- **`SqlError` does not leave the backend.** The handler maps it to `StorageUnavailable`, which carries no detail, and logs the cause.
- **The interface treats every failure the same way**, with one error state and a Retry button. The error type still tells the log which side failed.
- **TanStack Query owns client retry and caching.** `retry: 1`, and `staleTime` of one hour, because the data changes once a day.
- **CORS allows any origin.** The API is read-only public data with no credentials, so `Access-Control-Allow-Origin: *` is enough and the backend does not need to know the website's URL.

Purchasing power needs no endpoint. It is `floor(ump / price)` computed in the browser from a `Snapshot` and the UMP constants.

### Components and charts

- **shadcn/ui on Tailwind v4.** Components are copied into `apps/web/src/components/ui`, only the ones the three views use: tabs, button, card, badge, skeleton, alert, tooltip, toggle group for the range control, calendar and popover for the date picker, and command with popover for the grouped commodity and area pickers. The design system's CSS custom properties are shadcn's theme variables.
- **TanStack Charts draws everything.** The province map, the area chart and the ranking bars are all SVG from `@tanstack/charts`. Version 1.0.0 is days old, so the map is built first to find problems early.

### Interface

Surfaces and the moves between them:

```
Header                 title, tabs (Map / Chart / Purchasing Power), data-date badge, theme switcher
  needs: GET /dates

-> Map  (/)                                 search: commodity, date
  -> FilterBar         commodity picker, province picker, date picker with previous / next / Latest
  -> MapPanel          34 provinces coloured by bucket, legend
     -> select a province                   search: + area
  -> SummaryPanel      national average, cheapest, most expensive
     -> with a province selected: its price, difference from national, "View chart"
        -> Chart, same commodity and area

-> Chart  (/chart)                          search: commodity, area, range
  -> FilterBar         commodity picker, area picker (National + 34), range (7 days / 1 month / 3 months)
  -> StatTiles         current, change over the range, lowest, highest
  -> ChartPanel        one area chart

-> Purchasing Power  (/purchasing-power)    search: commodity, date
  -> FilterBar         commodity picker (defaults to Beras), date picker
  -> RankingBars       34 provinces sorted by kg per UMP, median line; hover shows price and UMP
  -> MapPanel          same map component, coloured by purchasing power
```

- **All view state is in the URL search params.** Commodity, date, area and range are validated by the router with the schemas from `packages/contract/src`. An invalid or missing param falls back to its default: Beras, the newest date, National, 1 month.
- **The commodity picker is grouped.** Ten categories, each with its variants beneath it.
- **The date picker only offers dates from `GET /dates`.** Weekends and holidays cannot be selected, so "no data for this date" is not a state the user can reach.
- **`MapPanel` is one component used twice.** It takes a value per area and a bucket function.

Every way the content can be absent, per surface:

| Surface | Loading | Error | Partial |
|---|---|---|---|
| Badge | Neutral placeholder | "Data unavailable" | Turns to a warning colour when the newest date is more than 4 days old |
| MapPanel | Province outlines in grey | Message with a Retry button, outlines stay | A province with no row gets the "No data" bucket |
| SummaryPanel | Skeleton lines | Hidden, the map carries the error | "No data for this province on this date" when the selected area has no row |
| StatTiles, ChartPanel | Skeleton in the final layout | Message with Retry | Gaps in the line where days are missing, no interpolation |
| RankingBars | Skeleton bars | Message with Retry | Provinces without a price are listed last as "No data" |

### Map buckets

`buckets.ts` has one function, used for prices and for purchasing power.

```
bucket(value, reference): Bucket
  ratio = value / reference - 1
  ratio < -15%          far-below
  -15% <= ratio < -5%   below
  -5% <= ratio <= 5%    near
  5% < ratio <= 15%     above
  ratio > 15%           far-above
  value missing         no-data
```

- On the Map tab the reference is the national price from PIHPS (area 0).
- On the Purchasing Power tab the reference is the median of the 34 provinces. There is no national UMP, so there is no national figure to divide. This replaces the "national figure marked" wording from the grilling round.
- Colours are a blue to orange diverging scale with a hatched "No data" fill. On the Purchasing Power tab the scale flips, because higher is better. The palette, its contrast figures and the flip rule are in `DESIGN.UI.md`.

### Map shapes

`public/provinces.json` is prepared once and committed. It has 34 features, each with the PIHPS province id as a property. Papua and Papua Barat have their pre-2022 extents, which take in Papua Selatan, Papua Tengah, Papua Pegunungan and Papua Barat Daya; the source already draws them that way, so nothing is merged. The file is simplified to keep it small, since it only draws a country-scale choropleth. The browser fetches it as a static asset and passes it to the TanStack Charts map.

## Infrastructure

```ts
// alchemy.run.ts (sketch)
export default Alchemy.Stack(
  "Primo",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const backend = yield* Backend;           // apps/backend/src/worker.ts: HttpApi + cron "0 1 * * *", binds D1
    const website = yield* Website;           // Cloudflare.Website.Vite, given backend.url as VITE_API_URL
    return {
      apiUrl: backend.url.as<string>(),
      websiteUrl: website.url.as<string>(),
      crons: backend.crons,
    };
  }),
);
```

- The backend is one Effect-native `Cloudflare.Worker`. Its constructor binds D1, builds the `PricesApi` handlers once, registers `Cloudflare.Workers.cron("0 1 * * *", ingest)` and returns `{ fetch }`.
- The D1 database is declared with `Cloudflare.D1.Database("Prices", { name: "primo-prices", migrations: "./apps/backend/migrations" })` and bound only to the backend.
- `vite.config.ts` has `tanstackStart()`, `viteReact()` and the Tailwind plugin. Alchemy's docs say `@cloudflare/vite-plugin` conflicts with it.
- **Domains.** The website is `primo.rangga.site` and the backend is `primo-api.rangga.site`, both attached as Worker custom domains (`domain` on the resource) in the `rangga.site` zone of the same account. `VITE_API_URL` is `https://primo-api.rangga.site`.
- **Names.** Every resource has an explicit `name` (the backend Worker is `primo-api`), and the stage is pinned to `prod` in the package scripts. Alchemy's default stage is `live_${USER}`, which would put the machine's user name into resource names and state.
- Commands are `bun run deploy`, `bun run destroy` and `bun run logs` (each `alchemy … --stage prod`). Do not run `bun alchemy deploy` bare: it deploys a second stage named after the local user.

Free plan budget per daily run:

| Limit | Allowed | Used |
|---|---|---|
| Subrequests | 50 | 35 measured on 2026-10-09 (the 35 fetches; Cloudflare's analytics do not count the 2 D1 binding queries) |
| D1 rows written per day | 100,000 | about 6,500 (5,400 upserts at most, 1,085 pruned) |
| Cron triggers | 5 | 1 |
| CPU | 10 ms | 304 ms on 2026-10-09, over the limit; see the CPU row under Still to verify |

## Tooling

One root script, `bun run check`, is the gate. A change is done when it passes. Nothing runs it automatically: there is no git hook and no CI.

| Step | Tool | Scope |
|---|---|---|
| Format | `oxfmt` | every workspace |
| Lint | `oxlint` with the vendored anti-slop plugin | every workspace |
| Types | `tsc`, plus the Effect language service's diagnostics | every workspace |
| Tests | Vitest with `@effect/vitest` | every workspace |
| React audit | `react-doctor --blocking error` | `apps/web` only |

- **anti-slop is vendored.** It has no npm package, so its source lives in `tools/oxlint/anti-slop` and `oxlint.config.ts` loads it as a JS plugin. All 20 generic rules and the 5 Effect rules are errors.
- **Turning a rule off needs a reason.** When a rule fights a React or Effect idiom, disable it for that workspace in `oxlint.config.ts` with a one-line comment that says why. Component props are the expected first case, since `no-object-parameters` forbids them.
- **Type checking stays on `tsc`.** The Effect language service is a TypeScript plugin, and it reports floating Effects and unsatisfied requirements that no lint rule sees.
- **Every tool version is pinned exactly.** `oxfmt` is before 1.0 and its output can change between releases. `react-doctor` is at 0.9.

## Tests

Tests run on Vitest with `@effect/vitest`, so each test is an Effect given test layers.

Production and tests run the same graphs. Only the layers behind `R` change.

```
ingest test: same graph, R swapped

-> ingest(window)
  -> Pihps.fetchArea        R: test layer, returns the fixture for some areas and PihpsUnreachable for others
  -> PriceRepo.upsert       R: D1Client over a D1 binding backed by node:sqlite in memory
  -> PriceRepo.prune        R: same binding, which records each query and can fail chosen statements
```

Three small tests:

1. **Parser.** Decode `fixtures/grid-dki-7d.json`, a saved real response. Assert the row count, one known price, that `"-"` yields no row, and that `"Cabai Merah Keriting "` resolves despite the trailing space.
2. **Buckets.** The band edges at ±5% and ±15%, and a missing value.
3. **Ingest.** With some areas failing, the run stores the rest. With all areas failing, it fails with `IngestFailed`.

The contract needs no test of its own. If the backend's handlers or the web app's calls drift from it, the type checker fails. The interface is checked by running the app against real data.

## Build order

Each step ends with something you can run.

1. **Scaffold and probe.** Set up the workspaces and `bun run check` with every tool in place. Deploy a Worker that fetches `GetRefProvince` from BI and logs the status. This answers whether BI blocks Cloudflare IPs. Everything after depends on the answer.
2. **Contract and PIHPS module.** `packages/contract/src`, `pihps.ts`, the fixture and the parser test.
3. **Database.** Migration, `price-repo.ts`, stack with D1.
4. **Backfill.** Run the script. D1 now holds 90 days.
5. **Backend Worker.** Deploy the cron and the three endpoints. Read the first run's log and CPU time, and call each endpoint with `curl`.
6. **Website shell.** Tailwind, shadcn, routes, header, the derived client, and the badge from `GET /dates`.
7. **Map tab.** `GET /snapshot`, `provinces.json`, buckets. This is the first use of TanStack Charts and its riskiest.
8. **Chart tab.** `GET /series`.
9. **Purchasing Power tab.** Reuses the snapshot and the map.

## Still to verify

These are assumptions the design rests on. Each has a fallback.

| Assumption | Checked at step | Fallback | Result |
|---|---|---|---|
| BI answers Cloudflare IPs | 1 | Run ingestion locally on a schedule with the backfill script's layers | Answered, 2026-10-08. A deployed Worker fetched `GetRefProvince` six times: HTTP 200 and 34 provinces every time, 109 to 440 ms, leaving from the SIN and HKG colos. No block headers. |
| A daily run fits in 10 ms CPU | 5 | Split the 35 areas across up to 5 cron triggers | Failed, 2026-10-09. The 01:00 UTC run used 304 ms CPU and 6.1 s wall time, and Cloudflare still reported it as a success. Locally, decoding and pivoting the 35 responses costs about 63 ms on a cold start and 20 ms warm, so the PIHPS decode is most of it. Five triggers would still need about 60 ms each, so the fallback does not fit either. Kept as is on 2026-10-09: the run stays one Schema-decoded cron while Cloudflare lets it finish, and Workers Paid is the way out if it starts failing. |
| `@effect/sql-d1` can take the D1 binding inside Alchemy's Effect-native Worker | 3 | Back `PriceRepo` with Alchemy's own `Cloudflare.D1.QueryDatabase` client | Confirmed, 2026-10-09. The cron upserted through `D1Client` over the binding: 2026-10-09 rows appeared and the prune moved the oldest date to 2026-07-13. |
| One Effect-native Worker can serve an `HttpApi` and register a cron | 5 | Split the cron into a second Worker bound to the same D1 | Half confirmed, 2026-10-09. `primo-api` serves `GET /dates` (200, `access-control-allow-origin: *`, a 204 preflight) and its deploy plan kept `Cron(0 1 * * *)` unchanged. Not yet seen: a cron run after the API was added, due 2026-10-10 01:00 UTC. |
| An API request (decode, one query, encode) fits in 10 ms CPU | 5 | Drop response encoding to plain JSON for the series endpoint | Failed narrowly, 2026-10-09. Dashboard for `primo-api` version 0880e8c9, 17 minutes after deploy: median CPU 10.53 ms and a CPU Time card of 15 ms (percentile not shown) over 33 invocations, mixed `GET /dates`, `OPTIONS` preflights and one 404, cold and warm. Wall time 32 ms. 0 errors: Cloudflare let every request finish. The earlier cron bead saw 404-only cold starts at 13 to 40 ms and warm ones at about 2 ms, so start-up cost is likely most of it, which the listed fallback (plain JSON encoding) would not remove. No fallback applied, pending the user's decision. |
| TanStack Charts 1.0 can draw 34 provinces with hover and selection | 7 | Draw the map as plain SVG with d3-geo and keep TanStack Charts for the charts |  |
| A 170 KB string fits one D1 bound parameter | 3 | Split the batch into 5 upserts of 7 areas each, about 34 KB per query, for 41 subrequests in total | Confirmed through the REST API, 2026-10-08. The stored 2026-10-01 to 10-08 rows (6,354 rows, a 205,060-byte JSON string) went through the upsert as one bound parameter in 20 ms. The binding path held on 2026-10-09: the cron's one upsert carried about 6,500 rows. |
| The conditional `DO UPDATE ... WHERE` avoids counting unchanged rows as writes | 5 | None needed, the budget holds either way | Confirmed, 2026-10-08. D1 reported `rows_written` 0 for an unchanged single row, for the 205 KB batch above, and for a second full backfill of 68,957 rows. A rerun costs reads only. |
| Prerendering works under `Cloudflare.Website.Vite` | 6 | Let the website Worker render the shell per request, and measure it against 10 ms CPU | Confirmed, 2026-10-09. Alchemy's build ran TanStack Start's prerender (`/`, `/chart`, `/purchasing-power`) and uploaded the HTML with the other 17 assets. `curl` without JavaScript returns each route's title and `h1` from Cloudflare's asset layer. One setting was needed: `assets: { htmlHandling: "drop-trailing-slash" }`, because the default answered `/chart` with a 307 to `/chart/`, which is not the router's URL. |
| GeoJSON source licence allows redistribution | 7 | Use the other candidate source from `.FINDINGS.md` | Yes, 2026-10-08. geoBoundaries gbOpen IDN ADM1 is ODbL 1.0 (OpenStreetMap), which allows redistribution with "© OpenStreetMap contributors" shown and the derived file kept under ODbL. It has the 34 pre-2022 provinces. Details in `apps/web/public/provinces.source.md`. |
| UMP 2026 for all 34 provinces from a Kemnaker source | 2 | None, this must be found before the Purchasing Power tab | Found, 2026-10-08, but not from Kemnaker directly: its list exists only as an Instagram post. All 34 figures agree across at least two independent outlets (Detik, IDX Channel, Metro TV), and DKI Jakarta and Jawa Barat match. Sumatera Utara's decree (3,228,971) and Kemnaker's list (3,228,949) differ by Rp 22; the user chose the decree. Sources are in `reference.ts`. |
