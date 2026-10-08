---
status: accepted
---

# Everything runs on Cloudflare, provisioned with Alchemy v2

The API, the cron, the database and the website all run on Cloudflare (Workers, D1, static assets), and the infrastructure is declared in `alchemy.run.ts` with Alchemy v2. We chose a single vendor to avoid running any server, and Alchemy because its v2 declares resources as Effects, so infrastructure, backend and client share one language and one set of types.

Alchemy v2 was at `2.0.0-beta.81` when this was decided. We accepted that its API may change before a stable release.

## Consequences

- There is no `wrangler.jsonc`. Bindings, cron schedules and migrations are defined in TypeScript, and `@cloudflare/vite-plugin` must not be added because Alchemy's Vite integration conflicts with it.
- The backend Worker uses Alchemy's Effect-native `Cloudflare.Worker` form, so its entry file is not a standard `export default { fetch, scheduled }` module.
- Pin the Alchemy version exactly and read its changelog before upgrading.
