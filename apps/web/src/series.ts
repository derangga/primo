import { IsoDate, type SeriesPoint } from "@primo/contract/schemas";

// What the Chart tab's four tiles say about a series, which the API sends oldest first.
export type SeriesSummary = {
  readonly current: SeriesPoint;
  readonly first: SeriesPoint;
  readonly lowest: SeriesPoint;
  readonly highest: SeriesPoint;
};

// Undefined for an empty series. When the lowest or highest price repeats, the most recent day wins,
// since it is the one closest to now.
export function summarise(points: ReadonlyArray<SeriesPoint>): SeriesSummary | undefined {
  const first = points.at(0);
  const current = points.at(-1);

  if (first === undefined || current === undefined) {
    return undefined;
  }

  const lowest = Math.min(...points.map((point) => point.price));
  const highest = Math.max(...points.map((point) => point.price));

  return {
    current,
    first,
    lowest: points.findLast((point) => point.price === lowest) ?? current,
    highest: points.findLast((point) => point.price === highest) ?? current,
  };
}

// One chart row. A weekday with no stored price has a null price, which breaks the line there.
export type Row = { readonly date: Date; readonly price: number | null };

const dayMs = 24 * 60 * 60 * 1000;

// A chart row's calendar day (the rows are UTC midnights) as the API writes it.
export const isoOf = (date: Date) => IsoDate.make(date.toISOString().slice(0, 10));

const isWeekday = (date: Date) => date.getUTCDay() >= 1 && date.getUTCDay() <= 5;

// A row for every weekday from `start` to the last stored day, and for any stored day that falls on a
// weekend. A weekend with no price has no row, so the line joins Friday to Monday across it.
export function weekdayRows(
  points: ReadonlyArray<SeriesPoint>,
  start: IsoDate,
): ReadonlyArray<Row> {
  const last = points.at(-1);

  if (last === undefined) {
    return [];
  }

  const prices = new Map<string, number>(points.map((point) => [point.date, point.price]));
  const end = Date.parse(`${last.date}T00:00:00Z`);
  const rows: Array<Row> = [];

  for (let at = Date.parse(`${start}T00:00:00Z`); at <= end; at += dayMs) {
    const date = new Date(at);
    const price = prices.get(date.toISOString().slice(0, 10)) ?? null;

    if (price !== null || isWeekday(date)) {
      rows.push({ date, price });
    }
  }

  return rows;
}

// Rows with a price whose neighbours have none: no line reaches them, so they are drawn as dots.
export function isolated(rows: ReadonlyArray<Row>): ReadonlyArray<Row> {
  return rows.filter(
    (row, index) =>
      row.price !== null && rows[index - 1]?.price == null && rows[index + 1]?.price == null,
  );
}
