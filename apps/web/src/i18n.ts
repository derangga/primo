import { getLocale, localizeUrl, type Locale } from "~/paraglide/runtime.js";

// The BCP 47 tag Intl formats each locale with.
const intlTags: Record<Locale, string> = { en: "en-US", id: "id-ID" };

// Each locale's name in its own language. A language switcher shows these as they are, so a visitor
// who cannot read the current language can still find their own.
export const localeNames: Record<Locale, string> = { en: "English", id: "Bahasa Indonesia" };

// The URL in a locale (the active one by default) with no trailing slash. Paraglide turns the
// root into /id/, but the router and Cloudflare's asset layer both say /id, and /id/ would cost a
// redirect.
export function localizedUrl(url: URL, locale: Locale = getLocale()) {
  const localized = localizeUrl(url, { locale });

  if (localized.pathname.length > 1 && localized.pathname.endsWith("/")) {
    localized.pathname = localized.pathname.slice(0, -1);
  }

  return localized;
}

const dateFormats = new Map<string, Intl.DateTimeFormat>();

// A date formatter for the active locale, built once per locale and kind. Paraglide reads the
// locale on every call, so the cache key carries it.
export function dateFormat(kind: string, options: Intl.DateTimeFormatOptions) {
  const tag = intlTags[getLocale()];
  const key = `${tag}|${kind}`;
  const known = dateFormats.get(key);

  if (known !== undefined) {
    return known;
  }

  const made = new Intl.DateTimeFormat(tag, options);

  dateFormats.set(key, made);

  return made;
}
