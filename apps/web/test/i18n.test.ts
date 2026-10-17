import { IsoDate } from "@primo/contract/schemas";
import { afterEach, expect, it } from "vitest";
import en from "../messages/en.json";
import id from "../messages/id.json";
import { formatDate, formatDayMonth } from "../src/date-badge-state.ts";
import { formatDateWithWeekday } from "../src/date-entries.ts";
import { localizedUrl } from "../src/i18n.ts";
import { m } from "../src/paraglide/messages.js";
import { overwriteGetLocale, type Locale } from "../src/paraglide/runtime.js";

const day = (date: string) => IsoDate.make(date);

// Runs `read` with the active locale set to `locale`, as a page for that locale would see it.
const inLocale = <A>(locale: Locale, read: () => A) => {
  overwriteGetLocale(() => locale);

  return read();
};

afterEach(() => overwriteGetLocale(() => "en"));

// The placeholders in a message, in alphabetical order: a language may word a sentence in a
// different order.
const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).toSorted();

// A message file's entries, without the schema line.
const messagesOf = (file: typeof en) =>
  new Map(Object.entries(file).filter(([key]) => key !== "$schema"));

const english = messagesOf(en);

const indonesian = messagesOf(id);

it("has every message in both languages, with the same placeholders", () => {
  expect([...indonesian.keys()]).toEqual([...english.keys()]);

  for (const [key, text] of english) {
    expect(placeholders(indonesian.get(key) ?? ""), key).toEqual(placeholders(text));
  }
});

it("translates every message except the ones written the same in both languages", () => {
  const same = [...english].flatMap(([key, text]) => (indonesian.get(key) === text ? [key] : []));

  expect(same.toSorted()).toEqual(["badge_data", "picker_value"]);
});

it("reads the message in the active locale", () => {
  expect(m.range_30()).toBe("1 month");
  expect(inLocale("id", () => m.range_30())).toBe("1 bulan");
  expect(inLocale("id", () => m.badge_age({ days: 5 }))).toBe("berumur 5 hari");
});

it("writes dates in the active locale, day first in both", () => {
  expect(formatDate(day("2026-09-01"))).toBe("1 Sep 2026");
  expect(inLocale("id", () => formatDate(day("2026-10-07")))).toBe("7 Okt 2026");
  expect(inLocale("id", () => formatDate(day("2026-08-17")))).toBe("17 Agu 2026");
  expect(inLocale("id", () => formatDateWithWeekday(day("2026-10-07")))).toBe("Rab, 7 Okt 2026");
  expect(inLocale("id", () => formatDayMonth(new Date("2026-05-01T00:00:00Z")))).toBe("1 Mei");
});

it("puts Indonesian under /id and English at the root, with no trailing slash", () => {
  const href = (url: string, locale: Locale) => {
    const localized = localizedUrl(new URL(url, "http://localhost"), locale);

    return localized.pathname + localized.search;
  };

  expect(href("/", "id")).toBe("/id");
  expect(href("/?area=3&range=7", "id")).toBe("/id?area=3&range=7");
  expect(href("/id", "en")).toBe("/");
  expect(href("/id?area=3", "en")).toBe("/?area=3");
});
