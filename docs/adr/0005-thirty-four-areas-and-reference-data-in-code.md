---
status: accepted
---

# 34 provinces everywhere, with reference data in code

Indonesia has 38 provinces, but PIHPS publishes prices for 34. The app shows 34 areas on every map, list and calculation. Papua Selatan, Papua Tengah and Papua Pegunungan are merged into Papua, and Papua Barat Daya into Papua Barat, both in the map shapes and in the minimum wage used for purchasing power. We chose this because showing 38 would either imply price data that does not exist or leave most of Papua marked as missing.

Provinces, commodities and UMP figures are constants in `packages/contract/src/reference.ts`, not database tables. They change at most once a year, both the backend and the browser need them, and keeping them in code leaves D1 with a single table.

## Consequences

- Purchasing power for Papua and Papua Barat uses those two provinces' own UMP, which understates or overstates the wage in the four newer provinces.
- Updating UMP each January is a code change and a deploy.
- If PIHPS starts publishing the four provinces separately, the map shapes, the reference constants and this decision all change together.
