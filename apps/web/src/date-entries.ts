import type { IsoDate } from "@primo/contract/schemas";
import { formatDate } from "~/date-badge-state";
import type { PickerEntry } from "~/picker-entries";

const utcDay = (date: IsoDate) => new Date(`${date}T00:00:00Z`);

const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

const month = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

// "Wed, 7 Oct 2026", as the date trigger shows it.
export const formatDateWithWeekday = (date: IsoDate) =>
  `${weekday.format(utcDay(date))}, ${formatDate(date)}`;

// One option per date that has data, newest first, under a heading for each month.
// `dates` is the API's list, oldest first.
export function dateEntries(dates: ReadonlyArray<IsoDate>): ReadonlyArray<PickerEntry<IsoDate>> {
  let currentMonth = "";

  return dates.toReversed().flatMap((date) => {
    const title = month.format(utcDay(date));

    const heading: ReadonlyArray<PickerEntry<IsoDate>> =
      title === currentMonth ? [] : [{ kind: "heading", label: title }];

    currentMonth = title;

    return [...heading, { kind: "option", value: date, label: formatDate(date) }];
  });
}
