import * as D1Client from "@effect/sql-d1/D1Client";
import { readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

// A D1 binding backed by an in-memory SQLite, so tests run the real SQL through the real D1 client.
// It implements only what D1Client calls: prepare(sql).bind(...params).all() and .raw().
// meta.rows_written is SQLite's count of rows the statement changed, which is how D1 counts too.

const migration = readFileSync(
  new URL("../../migrations/0001_prices.sql", import.meta.url),
  "utf8",
);

export const makeFakeD1 = (failingStatement?: RegExp) => {
  const sqlite = new DatabaseSync(":memory:");

  sqlite.exec(migration);

  const queries: Array<string> = [];

  const totalChanges = () => Number(sqlite.prepare("SELECT total_changes() AS n").get()?.["n"]);

  const execute = (sql: string, params: ReadonlyArray<SQLInputValue>) => {
    queries.push(sql);

    if (failingStatement?.test(sql) === true) {
      return Promise.reject(new Error(`D1_ERROR: injected failure for ${sql}`));
    }

    const before = totalChanges();
    const results = sqlite.prepare(sql).all(...params);

    return Promise.resolve({ results, meta: { rows_written: totalChanges() - before } });
  };

  const binding = {
    prepare: (sql: string) => ({
      bind: (...params: Array<SQLInputValue>) => ({
        all: () => execute(sql, params).then((result) => ({ ...result, success: true })),
        raw: () =>
          execute(sql, params).then((result) => result.results.map((row) => Object.values(row))),
      }),
    }),
  };

  // SAFETY: D1Client only calls prepare, bind, all and raw, which binding implements with D1's semantics.
  const db = binding as D1Client.D1ClientConfig["db"];

  return { sqlite, queries, layer: D1Client.layer({ db }) };
};
