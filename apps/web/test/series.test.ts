import { IsoDate, Rupiah, type SeriesPoint } from "@primo/contract/schemas";
import { expect, it } from "vitest";
import { changeBetween } from "../src/format";
import { isolated, summarise, weekdayRows } from "../src/series";

const point = (date: string, price: number): SeriesPoint => ({
  date: IsoDate.make(date),
  price: Rupiah.make(price),
});

// Mon 5 Oct to Fri 9 Oct 2026, with Wednesday missing, and the weekend before it.
const week = [
  point("2026-10-05", 16_300),
  point("2026-10-06", 16_100),
  point("2026-10-08", 16_400),
  point("2026-10-09", 16_100),
];

it("summarises a series: current, first, lowest and highest, the latest day winning a tie", () => {
  expect(summarise(week)).toEqual({
    current: point("2026-10-09", 16_100),
    first: point("2026-10-05", 16_300),
    lowest: point("2026-10-09", 16_100),
    highest: point("2026-10-08", 16_400),
  });
  expect(summarise([])).toBeUndefined();
  expect(summarise([point("2026-10-09", 16_100)])?.first).toEqual(point("2026-10-09", 16_100));
});

it("gives the change over the range in rupiah and percent, and the tile reads it by hand", () => {
  // 16.300 on the first day, 16.100 now: −200, −200 / 16.300 = −1,2%
  expect(changeBetween(16_100, 16_300)).toMatchObject({
    direction: "down",
    rupiah: "−Rp 200",
    percent: "−1,2%",
  });
  expect(changeBetween(16_400, 16_150)).toMatchObject({
    direction: "up",
    rupiah: "+Rp 250",
    percent: "+1,5%",
  });
});

it("makes a row for every weekday, with null where a weekday has no price, and none for a weekend", () => {
  const rows = weekdayRows(week, IsoDate.make("2026-10-03"));

  expect(rows.map((row) => [row.date.toISOString().slice(0, 10), row.price])).toEqual([
    // Sat 3 and Sun 4 Oct have no row
    ["2026-10-05", 16_300],
    ["2026-10-06", 16_100],
    ["2026-10-07", null],
    ["2026-10-08", 16_400],
    ["2026-10-09", 16_100],
  ]);
});

it("keeps a price that falls on a weekend and starts on the window's first weekday", () => {
  const rows = weekdayRows(
    [point("2026-10-03", 16_000), point("2026-10-05", 16_100)],
    IsoDate.make("2026-10-02"),
  );

  expect(rows.map((row) => [row.date.toISOString().slice(0, 10), row.price])).toEqual([
    ["2026-10-02", null],
    ["2026-10-03", 16_000],
    ["2026-10-05", 16_100],
  ]);
});

it("finds the days with no neighbour to join, which are drawn as dots", () => {
  const rows = weekdayRows(week, IsoDate.make("2026-10-05"));

  // Wednesday is the gap: Tue has Mon as a neighbour, Thu has Fri
  expect(isolated(rows)).toEqual([]);

  const lonely = weekdayRows(
    [point("2026-10-05", 16_300), point("2026-10-07", 16_200), point("2026-10-09", 16_100)],
    IsoDate.make("2026-10-05"),
  );

  expect(isolated(lonely).map((row) => row.price)).toEqual([16_300, 16_200, 16_100]);
});
