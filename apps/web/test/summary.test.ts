import { expect, it } from "vitest";
import { changeBetween, formatRupiah } from "../src/format";
import { extremes } from "../src/summary";

it("finds the cheapest and most expensive province, lowest id first on a tie", () => {
  const byArea = [
    { areaId: 13, price: 16_950 },
    { areaId: 18, price: 13_900 },
    { areaId: 33, price: 19_250 },
    { areaId: 21, price: 19_250 },
    { areaId: 2, price: 13_900 },
  ];

  expect(extremes(byArea)).toEqual({
    cheapest: { areaId: 2, price: 13_900 },
    priciest: { areaId: 21, price: 19_250 },
  });
  expect(extremes([{ areaId: 5, price: 15_000 }])).toEqual({
    cheapest: { areaId: 5, price: 15_000 },
    priciest: { areaId: 5, price: 15_000 },
  });
  expect(extremes([])).toBeUndefined();
});

it("writes prices with a dot for thousands", () => {
  expect(formatRupiah(16_400)).toBe("16.400");
  expect(formatRupiah(5_729_876)).toBe("5.729.876");
});

it("writes a change as rupiah first and percent in brackets, with a real minus", () => {
  expect(changeBetween(16_950, 16_400)).toMatchObject({ direction: "up", text: "+Rp 550 (+3,4%)" });
  expect(changeBetween(13_900, 16_400)).toMatchObject({
    direction: "down",
    text: "−Rp 2.500 (−15,2%)",
  });
  expect(changeBetween(16_400, 16_400)).toMatchObject({ direction: "flat", text: "Rp 0 (0,0%)" });
});
