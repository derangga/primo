import { m } from "~/paraglide/messages.js";

export type Bucket = "far-below" | "below" | "near" | "above" | "far-above" | "no-data";

// Where a price falls against the national price, in the bands of DESIGN.md "Map buckets".
// Percentages are compared as whole numbers (100 * value against 85, 95, 105 and 115 * reference)
// so a value exactly 5% or 15% off lands on the band edge, which float division would miss.
export function bucket(value: number | null | undefined, reference: number | null): Bucket {
  if (value === null || value === undefined || reference === null) {
    return "no-data";
  }

  const scaled = value * 100;

  if (scaled < reference * 85) {
    return "far-below";
  }

  if (scaled < reference * 95) {
    return "below";
  }

  if (scaled <= reference * 105) {
    return "near";
  }

  if (scaled <= reference * 115) {
    return "above";
  }

  return "far-above";
}

// A low price is good for the buyer, so far-below is bucket 1.
export const priceFill: Record<Bucket, string> = {
  "far-below": "var(--bucket-1)",
  below: "var(--bucket-2)",
  near: "var(--bucket-3)",
  above: "var(--bucket-4)",
  "far-above": "var(--bucket-5)",
  "no-data": "url(#hatch)",
};

// The words for each bucket, against the national price, in the active locale.
const bucketMessages: Record<Bucket, () => string> = {
  "far-below": m.bucket_far_below,
  below: m.bucket_below,
  near: m.bucket_near,
  above: m.bucket_above,
  "far-above": m.bucket_far_above,
  "no-data": m.no_data,
};

export const priceBucketLabel = (kind: Bucket) => bucketMessages[kind]();
