import { runInNewContext } from "node:vm";
import { expect, it } from "vitest";
import { parseThemeSetting } from "../src/theme.ts";
import { themeScript } from "../src/theme-script.ts";

// Runs the real head script against a fake browser and returns what it set on <html>.
function runHeadScript(stored: string | "throws" | null, osIsDark: boolean) {
  const dataset: Record<string, string> = {};

  const localStorage = {
    getItem: () => {
      if (stored === "throws") {
        throw new Error("storage blocked");
      }

      return stored;
    },
  };

  runInNewContext(themeScript, {
    localStorage,
    matchMedia: () => ({ matches: osIsDark }),
    document: { documentElement: { dataset } },
  });

  return dataset;
}

it("applies a stored light or dark setting whatever the operating system says", () => {
  expect(runHeadScript("dark", false)).toEqual({ theme: "dark", setting: "dark" });
  expect(runHeadScript("light", true)).toEqual({ theme: "light", setting: "light" });
});

it("follows the operating system when nothing valid is stored or storage is blocked", () => {
  expect(runHeadScript(null, true)).toEqual({ theme: "dark", setting: "system" });
  expect(runHeadScript("system", false)).toEqual({ theme: "light", setting: "system" });
  expect(runHeadScript("sepia", true)).toEqual({ theme: "dark", setting: "system" });
  expect(runHeadScript("throws", true)).toEqual({ theme: "dark", setting: "system" });
});

it("reads the same three settings in the app as in the head script", () => {
  expect(["system", "light", "dark", "sepia", null].map(parseThemeSetting)).toEqual([
    "system",
    "light",
    "dark",
    "system",
    "system",
  ]);
});
