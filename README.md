# Primo

A personal monitor for Indonesian staple food prices by province. It shows a map and a price chart for one commodity, one date and one range at a time. The live site is at https://primo.rangga.site.

The prices come from PIHPS, the national strategic food price information centre run by Bank Indonesia (bi.go.id). A daily job fetches them and stores them, and the browser only ever reads from this project's own API.

## How it works

Everything runs on Cloudflare and is written in TypeScript with [Effect](https://effect.website).

| Piece | Runs on | Job |
|---|---|---|
| Website | Cloudflare static assets (TanStack Start) | Serves the page, the JavaScript and the province shapes |
| Backend | Cloudflare Worker | Serves the read-only API and runs the daily ingest at 08:00 WIB |
| Database | Cloudflare D1 | One table of prices |

The API is defined once in `packages/contract`. The backend implements it and the browser derives its client from it, so a change to a route or a schema fails the build on both sides.

## Repository layout

```
apps/backend/       Worker: API handlers, PIHPS fetcher, ingest, D1 migrations, backfill script
apps/web/           The website
packages/contract/  The shared API definition and reference data
tools/oxlint/       Vendored lint plugin
docs/adr/           Decisions that look wrong but are deliberate
alchemy.run.ts      Infrastructure: the D1 database, the Worker and the website
```

## Develop

You need [Bun](https://bun.sh) 1.4.2.

```sh
bun install
bun run check
```

`bun run check` is the gate. It checks formatting, lints, type-checks, runs the tests and audits the React app. CI runs the same command on every pull request and every push to `master`.

To run the website locally against the live API:

```sh
VITE_API_URL=https://primo-api.rangga.site bun run --filter @primo/web dev
```

## Deploy

A deploy starts with a tag in the format `YYYYMMDD-HHMM`, written in UTC. The commit must be on `master`.

```sh
git tag $(date -u +%Y%m%d-%H%M)
git push origin <tag>
```

GitHub Actions then runs the checks, deploys to Cloudflare with [Alchemy](https://alchemy.run), and fetches the live API and site to confirm they respond. To roll back, revert on `master` and push a new tag. The setup needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as secrets on a GitHub Environment named `production`. The details are in the "Deploying" section of `DESIGN.md`.

The first 90 days of prices are loaded once from a local machine with `bun run backfill`. The script's header comment lists the environment variables it needs.

## Where the decisions are

- `DESIGN.md`: the architecture, the call graphs, the API contract and the Cloudflare Free plan budgets.
- `DESIGN.UI.md`: the approved look and behaviour of every screen.
- `docs/adr/`: the reasons behind the main choices.
- `.FINDINGS.md`: the PIHPS endpoints, their quirks and the measured limits.
- `AGENTS.md`: how coding agents work in this repository.

## License

[MIT](LICENSE)
