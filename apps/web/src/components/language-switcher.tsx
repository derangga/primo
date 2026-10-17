import { useRouterState } from "@tanstack/react-router";
import { localeNames, localizedUrl } from "~/i18n";
import { m } from "~/paraglide/messages.js";
import { getLocale, locales, type Locale } from "~/paraglide/runtime.js";

// The language the visitor is not reading: with two locales, the other one.
const otherLocale = (current: Locale) => locales.find((locale) => locale !== current) ?? current;

// A link to the same view in the other language (DESIGN.UI.md, Language switcher). It is a plain
// link, so the browser loads the other language's prerendered page and nothing keeps text of the
// language it left. The router's location is the unlocalized one, with the search params, which is
// what the other language's URL needs.
export function LanguageSwitcher() {
  const href = useRouterState({ select: (state) => state.location.href });
  const target = otherLocale(getLocale());
  const other = localizedUrl(new URL(href, "http://localhost"), target);

  return (
    <a
      // The prerendered page links to the bare path; the browser then knows the search params.
      suppressHydrationWarning
      href={other.pathname + other.search + other.hash}
      hrefLang={target}
      lang={target}
      aria-label={`${m.language_label()}: ${localeNames[target]}`}
      title={localeNames[target]}
      className="inline-flex size-9 items-center justify-center rounded-pill border border-border bg-card text-xs font-semibold text-text uppercase transition-[transform,background-color,border-color] duration-(--dur-press) active:scale-[0.97] motion-reduce:active:scale-100 fine-hover:hover:border-border-strong fine-hover:hover:bg-hover"
    >
      {target}
    </a>
  );
}
