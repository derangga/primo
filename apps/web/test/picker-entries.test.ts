import { IsoDate } from "@primo/contract/schemas";
import { expect, it } from "vitest";
import { commodityEntries } from "../src/commodities";
import { dateEntries, formatDateWithWeekday } from "../src/date-entries";
import { typeaheadMatch } from "../src/picker-entries";

const day = (date: string) => IsoDate.make(date);

it("lists 10 emphasised categories with 21 indented variants, 31 options in all", () => {
  const options = commodityEntries.flatMap((entry) => (entry.kind === "option" ? [entry] : []));

  expect(options).toHaveLength(31);
  expect(options.filter((option) => option.emphasis === true)).toHaveLength(10);
  expect(options.filter((option) => option.indent === true)).toHaveLength(21);
  expect(options[0]).toMatchObject({ label: "Beras", emphasis: true });
  expect(options[1]).toMatchObject({ label: "Beras Kualitas Bawah I", indent: true });
});

it("lists dates newest first under one heading per month", () => {
  const entries = dateEntries([day("2026-09-30"), day("2026-10-01"), day("2026-10-02")]);

  expect(entries.flatMap((entry) => (entry.kind === "divider" ? [] : [entry.label]))).toEqual([
    "October 2026",
    "2 Oct 2026",
    "1 Oct 2026",
    "September 2026",
    "30 Sep 2026",
  ]);
});

it("writes the weekday in the date trigger", () => {
  expect(formatDateWithWeekday(day("2026-10-07"))).toBe("Wed, 7 Oct 2026");
});

it("jumps to the first label that starts with what was typed, from the current option, wrapping round", () => {
  const labels = ["Beras", "Daging Ayam", "Daging Sapi", "Minyak Goreng"];

  expect(typeaheadMatch(labels, "min", 0)).toBe(3);
  expect(typeaheadMatch(labels, "DAG", 0)).toBe(1);
  expect(typeaheadMatch(labels, "d", 2)).toBe(2);
  expect(typeaheadMatch(labels, "b", 3)).toBe(0);
  expect(typeaheadMatch(labels, "zz", 0)).toBe(-1);
});
