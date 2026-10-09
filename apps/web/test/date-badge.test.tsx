import { IsoDate } from "@primo/contract/schemas";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { BadgeView } from "../src/components/badge-view.tsx";
import { badgeState, formatDate } from "../src/date-badge-state.ts";

const day = (date: string) => IsoDate.make(date);

it("takes the last date as the newest and calls it stale only after 4 days", () => {
  const dates = [day("2026-10-05"), day("2026-10-06"), day("2026-10-07")];

  expect(badgeState(dates, day("2026-10-07"))).toEqual({ kind: "fresh", date: "2026-10-07" });
  expect(badgeState(dates, day("2026-10-11"))).toEqual({ kind: "fresh", date: "2026-10-07" });
  expect(badgeState(dates, day("2026-10-12"))).toEqual({
    kind: "stale",
    date: "2026-10-07",
    ageDays: 5,
  });
});

it("treats a list with no dates as an error", () => {
  expect(badgeState([], day("2026-10-07"))).toEqual({ kind: "error" });
});

it("writes dates as 7 Oct 2026", () => {
  expect(formatDate(day("2026-10-07"))).toBe("7 Oct 2026");
  expect(formatDate(day("2026-09-01"))).toBe("1 Sep 2026");
});

it("draws each of the four states", () => {
  const loading = renderToStaticMarkup(<BadgeView state={{ kind: "loading" }} />);

  const fresh = renderToStaticMarkup(
    <BadgeView state={{ kind: "fresh", date: day("2026-10-07") }} />,
  );

  const error = renderToStaticMarkup(<BadgeView state={{ kind: "error" }} />);

  const stale = renderToStaticMarkup(
    <BadgeView state={{ kind: "stale", date: day("2026-10-01"), ageDays: 7 }} />,
  );

  expect(loading).toContain("Loading the newest data date");
  expect(fresh).toContain("7 Oct 2026");

  expect(stale).toContain("1 Oct 2026");
  expect(stale).toContain("7 days old");
  expect(error).toContain("Data unavailable");
});
