import { localizedUrl } from "~/i18n";
import { m } from "~/paraglide/messages.js";
import { locales, type Locale } from "~/paraglide/runtime.js";

// The Open Graph tag for each locale's language and region.
const ogLocales: Record<Locale, string> = { en: "en_US", id: "id_ID" };

// The square image that link previews and the home-screen icon share. apps/web/scripts/render-icon.ts
// draws it from the favicon's shape.
const iconPath = "/icon-512.png";

// The site's address with no trailing slash. alchemy.run.ts passes it in at build time. A deploy
// without it would write canonical URLs that point nowhere, so a production build stops. The dev
// server falls back to its own address.
export function siteOrigin(): string {
  const origin = import.meta.env.VITE_SITE_URL;

  if (origin !== undefined && origin !== "") {
    return origin.replace(/\/+$/, "");
  }

  if (import.meta.env.PROD) {
    throw new Error("VITE_SITE_URL is not set. alchemy.run.ts sets it when it builds the website.");
  }

  return "http://localhost:3000";
}

// The address of the home page in a locale, with no search params: `/` or `/id`. Every filtered
// view of the page names this address as its canonical, so the search engine keeps one entry per
// language and not one per commodity, province, date and range.
export function pageUrl(origin: string, locale: Locale): string {
  return localizedUrl(new URL("/", origin), locale).href;
}

// What the document head says about the home page in a locale, for search engines and link
// previews. TanStack Router keeps one meta tag per name or property, and the last one wins, so a
// tag that repeats (theme-color) is written in the root document instead.
export function pageHead(origin: string, locale: Locale) {
  const title = m.home_title();
  const description = m.home_description();
  const url = pageUrl(origin, locale);
  const image = origin + iconPath;

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: m.app_title() },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:locale", content: ogLocales[locale] },
      ...locales
        .filter((other) => other !== locale)
        .map((other) => ({ property: "og:locale:alternate", content: ogLocales[other] })),
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      {
        "script:ld+json": {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: m.app_title(),
          url,
          description,
          inLanguage: locale,
        },
      },
    ],
    links: [
      { rel: "canonical", href: url },
      ...locales.map((alternate) => ({
        rel: "alternate",
        hrefLang: alternate,
        href: pageUrl(origin, alternate),
      })),
      // A visitor whose language the site does not offer gets English, as ADR 0008 says.
      { rel: "alternate", hrefLang: "x-default", href: pageUrl(origin, "en") },
      { rel: "apple-touch-icon", href: iconPath },
    ],
  };
}
