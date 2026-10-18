---
status: accepted
---

# One indexed page per language, whatever the filters say

The home page keeps the commodity, province, date and range in its search params, so `/?area=3&range=7` and `/` show different data under one route. Every such URL names the language's bare page as its canonical: `https://primo.rangga.site/` or `https://primo.rangga.site/id`. A search engine therefore keeps two entries for the site, one per language, tied together by `hreflang` alternates and an `x-default` that points at English (ADR 0008).

We did not give each province or commodity its own prerendered route. That would let a page such as "harga beras Jawa Barat" rank on its own, but it would also change the route table, multiply the prerendered files by the number of combinations, and give the site a second way to address a view. The site is a monitor that one visitor reads at a time, so ranking for the site's name and for the general terms is enough.

## Consequences

- **The head is written once, in the root route.** `apps/web/src/seo.ts` builds the canonical, the alternates, the Open Graph and Twitter tags and the `WebSite` JSON-LD from the active locale. The site has one page, so no route overrides it. A second page would need its own canonical.
- **The origin comes from `VITE_SITE_URL`.** `alchemy.run.ts` sets it from the same domain the website is attached to. A production build without it fails, because canonical URLs that point nowhere do harm. `public/sitemap.xml` and `public/robots.txt` are static files and repeat the domain by hand.
- **The preview image is square.** `public/icon-512.png` is both the `og:image` and the `apple-touch-icon`, and the Twitter card is `summary`. `apps/web/scripts/render-icon.ts` draws it from the favicon's shape.
- **A shared link to a filtered view previews the home page**, not the commodity or province in it.
- **The `Dataset` JSON-LD type is left out** until the terms under which PIHPS data may be republished are known.
- **The router keeps one meta tag per name.** The two `theme-color` tags, for light and dark, are written in the root document and not in `head`.
