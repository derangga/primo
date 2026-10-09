import { AreaId } from "@primo/contract/schemas";
import { Schema } from "effect";

// public/provinces.json: 34 features keyed by PIHPS province id (see public/provinces.source.md).
// The arrays are mutable because d3-geo's GeoJSON types ask for mutable arrays.
const Position = Schema.mutable(Schema.Array(Schema.Number));

const Ring = Schema.mutable(Schema.Array(Position));

const Polygon = Schema.mutable(Schema.Array(Ring));

const Geometry = Schema.Union([
  Schema.Struct({ type: Schema.Literal("Polygon"), coordinates: Polygon }),
  Schema.Struct({
    type: Schema.Literal("MultiPolygon"),
    coordinates: Schema.mutable(Schema.Array(Polygon)),
  }),
]);

export const ProvinceFeature = Schema.Struct({
  type: Schema.Literal("Feature"),
  id: AreaId,
  properties: Schema.Struct({ id: AreaId }),
  geometry: Geometry,
});

export type ProvinceFeature = typeof ProvinceFeature.Type;

export const ProvinceOutlines = Schema.Struct({
  type: Schema.Literal("FeatureCollection"),
  features: Schema.mutable(Schema.Array(ProvinceFeature)),
});

export type ProvinceOutlines = typeof ProvinceOutlines.Type;
