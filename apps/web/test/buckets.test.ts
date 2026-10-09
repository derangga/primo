import { describe, expect, it } from "vitest";
import { bucket } from "../src/buckets";

describe("bucket", () => {
  // Reference 20,000 makes every edge a whole rupiah: 85% 17,000, 95% 19,000, 105% 21,000, 115% 23,000.
  it.each([
    [16_999, "far-below"],
    [17_000, "below"],
    [18_999, "below"],
    [19_000, "near"],
    [20_000, "near"],
    [21_000, "near"],
    [21_001, "above"],
    [23_000, "above"],
    [23_001, "far-above"],
  ] as const)("%i against 20,000 is %s", (value, expected) => {
    expect(bucket(value, 20_000)).toBe(expected);
  });

  it("puts an edge on the near side even where float division would not", () => {
    // 95 / 100 - 1 is -0.05000000000000004 in floating point.
    expect(bucket(95, 100)).toBe("near");
    expect(bucket(105, 100)).toBe("near");
  });

  it("has no bucket for a missing value or a missing reference", () => {
    expect(bucket(null, 20_000)).toBe("no-data");
    expect(bucket(undefined, 20_000)).toBe("no-data");
    expect(bucket(20_000, null)).toBe("no-data");
  });
});
