import * as Cloudflare from "alchemy/Cloudflare";
import { Duration, Effect, Schema } from "effect";
import * as FetchHttpClient from "effect/http/FetchHttpClient";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpServerResponse from "effect/http/HttpServerResponse";

// Probe: does PIHPS answer a request made from Cloudflare's network?
const provincesUrl = "https://www.bi.go.id/hargapangan/WebSite/TabelHarga/GetRefProvince";

const ProvinceList = Schema.fromJsonString(
  Schema.Struct({ data: Schema.Array(Schema.Struct({ id: Schema.Int, name: Schema.String })) }),
);

const probe = Effect.gen(function* () {
  const started = Date.now();
  const response = yield* HttpClient.get(provincesUrl).pipe(Effect.timeout(Duration.seconds(10)));
  const body = yield* response.text;

  const provinces = yield* Schema.decodeUnknownEffect(ProvinceList)(body).pipe(
    Effect.map((list) => list.data.length),
    Effect.orElseSucceed(() => null),
  );

  return {
    url: provincesUrl,
    reached: true,
    status: response.status,
    provinces,
    headers: response.headers,
    bodySnippet: provinces === null ? body.slice(0, 500) : null,
    elapsedMs: Date.now() - started,
  };
}).pipe(
  Effect.catch((error) =>
    Effect.succeed({ url: provincesUrl, reached: false, error: String(error) }),
  ),
);

export default Cloudflare.Worker(
  "Backend",
  {
    name: "primo-api",
    domain: "primo-api.rangga.site",
    main: import.meta.url,
    compatibility: { date: "2026-10-01" },
    observability: { enabled: true },
  },
  Effect.succeed({
    fetch: probe.pipe(
      Effect.tap((report) => Effect.log("pihps probe", report)),
      Effect.map((report) => HttpServerResponse.jsonUnsafe(report)),
      Effect.provide(FetchHttpClient.layer),
    ),
  }),
);
