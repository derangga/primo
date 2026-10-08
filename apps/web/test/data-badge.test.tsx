import { StorageUnavailable } from "@primo/contract/errors";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { DataBadge } from "../src/data-badge.tsx";

it("shows the date, or that data is unavailable", () => {
  expect(renderToStaticMarkup(<DataBadge date="2026-10-07" />)).toContain("Data 2026-10-07");
  expect(renderToStaticMarkup(<DataBadge date={new StorageUnavailable()} />)).toContain(
    "Data unavailable",
  );
});
