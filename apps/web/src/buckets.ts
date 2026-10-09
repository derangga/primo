export type Bucket = "far-below" | "below" | "near" | "above" | "far-above" | "no-data";

// Where a value falls against a reference, in the bands of DESIGN.md "Map buckets". The Map tab
// passes a price and the national price; Purchasing Power passes kilograms and the median.
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

// Map tab: a low price is good for the buyer, so far-below is bucket 1. Purchasing Power reverses this mapping.
export const priceFill: Record<Bucket, string> = {
  "far-below": "var(--bucket-1)",
  below: "var(--bucket-2)",
  near: "var(--bucket-3)",
  above: "var(--bucket-4)",
  "far-above": "var(--bucket-5)",
  "no-data": "url(#hatch)",
};

// The Map tab's words for each bucket, against the national price.
export const priceBucketLabel: Record<Bucket, string> = {
  "far-below": "Far below average",
  below: "Below average",
  near: "Near average",
  above: "Above average",
  "far-above": "Far above average",
  "no-data": "No data",
};
