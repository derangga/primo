---
status: accepted
---

# A shared Effect HttpApi contract on a backend Worker, not server functions

The website is a TanStack Start app, so the expected way to read data is `createServerFn`. We instead define an Effect `HttpApi` in the `packages/contract` workspace (request parameters, response bodies and errors as Schemas), implement it in a separate backend Worker, and derive the browser's client from the same definition with `HttpApiClient.make`. We chose this because the whole app is written in Effect and one contract gives both sides the same types and the same validation, including typed errors that `effect-query` can pass to the interface.

The backend Worker also runs the daily ingest cron. The website keeps no server logic and is prerendered to static files.

## Considered options

- **Server functions.** Less code and same-origin, but errors cross the boundary untyped and the request and response shapes exist only as TypeScript types, not as a contract either side validates.
- **HttpApi mounted inside the website Worker** through a catch-all server route. Same origin, but Alchemy only documents `HttpApi` on a plain `Cloudflare.Worker`, and every page load would still pass through a Worker.
- **Three Workers** (website, API, ingest). More isolation than three read-only endpoints and one cron need.

## Consequences

- The browser calls the API cross-origin. The API sends `Access-Control-Allow-Origin: *`, which is acceptable only because the data is public and read-only. Adding anything private or any write endpoint means revisiting this.
- TanStack Start is used for routing and prerendering only. Do not add loaders or server functions that read D1; the website has no database binding.
- The backend and the website deploy together but are separate artefacts. The client decodes responses against the contract, so a mismatch fails as a decode error instead of rendering wrong numbers.
- An API fault and an ingest fault share one Worker, but they are separate invocations.
