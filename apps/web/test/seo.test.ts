import { afterEach, expect, it } from "vitest";
import { overwriteGetLocale, type Locale } from "../src/paraglide/runtime.js";
import { pageHead, pageUrl } from "../src/seo.ts";

const origin = "https://primo.rangga.site";

// The head the page for `locale` would write.
const headIn = (locale: Locale) => {
  overwriteGetLocale(() => locale);

  return pageHead(origin, locale);
};

afterEach(() => overwriteGetLocale(() => "en"));

it("names each language's page without a trailing slash after /id", () => {
  expect(pageUrl(origin, "en")).toBe("https://primo.rangga.site/");
  expect(pageUrl(origin, "id")).toBe("https://primo.rangga.site/id");
});

it("makes the canonical the page's own bare address in each language", () => {
  expect(headIn("en").links).toContainEqual({
    rel: "canonical",
    href: "https://primo.rangga.site/",
  });
  expect(headIn("id").links).toContainEqual({
    rel: "canonical",
    href: "https://primo.rangga.site/id",
  });
});

it("lists both languages and an x-default that points at English, in both pages", () => {
  for (const locale of ["en", "id"] as const) {
    const alternates = headIn(locale).links.flatMap((link) =>
      link.rel === "alternate" ? [[link.hrefLang, link.href]] : [],
    );

    expect(alternates).toEqual([
      ["en", "https://primo.rangga.site/"],
      ["id", "https://primo.rangga.site/id"],
      ["x-default", "https://primo.rangga.site/"],
    ]);
  }
});

it("writes the title, description and Open Graph locale of the page's language", () => {
  const meta = (locale: Locale) =>
    new Map(
      headIn(locale).meta.flatMap((entry) =>
        "property" in entry ? [[entry.property, entry.content]] : [],
      ),
    );

  expect(meta("en").get("og:title")).toBe(
    "Food Price Monitor: Indonesia Staple Prices by Province",
  );
  expect(meta("en").get("og:locale")).toBe("en_US");
  expect(meta("en").get("og:locale:alternate")).toBe("id_ID");
  expect(meta("id").get("og:title")).toBe("Pemantau Harga Pangan: Harga Pangan Pokok per Provinsi");
  expect(meta("id").get("og:locale")).toBe("id_ID");
  expect(meta("id").get("og:locale:alternate")).toBe("en_US");
});

it("keeps every title under 60 characters, where a search result cuts it", () => {
  for (const locale of ["en", "id"] as const) {
    const title = headIn(locale).meta.find((entry) => "title" in entry);

    expect(title?.title?.length).toBeLessThanOrEqual(60);
  }
});

it("points the preview image at the site's own square icon", () => {
  const image = headIn("en").meta.find((entry) => entry.property === "og:image");

  expect(image?.content).toBe("https://primo.rangga.site/icon-512.png");
});
