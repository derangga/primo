---
status: accepted
---

# 34 provinces everywhere, with reference data in code

Indonesia has 38 provinces, but PIHPS publishes prices for 34. The app shows 34 areas on the map and in every list. Papua Selatan, Papua Tengah and Papua Pegunungan are merged into Papua, and Papua Barat Daya into Papua Barat, in the map shapes. We chose this because showing 38 would either imply price data that does not exist or leave most of Papua marked as missing.

Provinces and commodities are constants in `packages/contract/src/reference.ts`, not database tables. They change at most once a year, both the backend and the browser need them, and keeping them in code leaves D1 with a single table.

## Consequences

- Until 2026-10-09 the constants also held each province's minimum wage (UMP 2026) for a Purchasing Power tab. Both were removed together.
- If PIHPS starts publishing the four provinces separately, the map shapes, the reference constants and this decision all change together.
