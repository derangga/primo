import { provinces } from "@primo/contract/reference";
import { expect, it } from "vitest";
import { kilograms, purchasingPower, ump } from "../src/purchasing-power";

const jakarta = 13;

const jawaTimur = 16;

it("rounds the kilograms down", () => {
  expect(kilograms(1_000_000, 15_000)).toBe(66);
  expect(kilograms(1_000_000, 10_000)).toBe(100);
  expect(kilograms(999_999, 10_000)).toBe(99);
});

it("divides each province's own UMP by its price", () => {
  const power = purchasingPower([
    { areaId: jakarta, price: 16_000 },
    { areaId: jawaTimur, price: 16_000 },
  ]);

  // 5.729.876 / 16.000 = 358,1 and 2.446.880 / 16.000 = 152,9.
  expect(power.rows.find((row) => row.areaId === jakarta)?.kg).toBe(358);
  expect(power.rows.find((row) => row.areaId === jawaTimur)?.kg).toBe(152);
  expect(ump(jakarta)).toBe(5_729_876);
});

it("sorts most kilograms first and lists provinces without a price last", () => {
  const power = purchasingPower(
    provinces.slice(0, 5).map((p) => ({ areaId: p.id, price: 15_000 })),
  );

  const kgs = power.rows.map((row) => row.kg);

  expect(kgs).toStrictEqual(kgs.toSorted((a, b) => b - a));
  expect(power.rows).toHaveLength(5);
  expect(power.missing).toHaveLength(provinces.length - 5);
  expect(power.missing).not.toContain(1);
});

it("takes the median of the provinces that have a value", () => {
  const odd = purchasingPower([1, 2, 3].map((areaId) => ({ areaId, price: 10_000 })));
  expect(odd.median).toBe(odd.rows[1]?.kg);

  const even = purchasingPower([1, 2, 3, 4].map((areaId) => ({ areaId, price: 10_000 })));
  expect(even.median).toBe(((even.rows[1]?.kg ?? 0) + (even.rows[2]?.kg ?? 0)) / 2);

  expect(purchasingPower([]).median).toBeNull();
  expect(purchasingPower([]).max).toBe(0);
});
