---
status: accepted
---

# Paraglide, with the language in the URL

The interface is in English and Indonesian. We use [Paraglide](https://paraglidejs.com): it compiles each message to a function, so a message that a page does not call is not in its bundle, and a missing parameter fails the type check.

The website is static (ADR 0006) and has no server to read `Accept-Language` or a cookie. So the language is part of the address. English stays at `/`, so existing links keep their meaning, and Indonesian is at `/id`. Both pages are prerendered at build time and Cloudflare serves them as files. The router rewrites between the two forms, so the route table and the search params are the same in both languages.

## Consequences

- **No automatic choice.** A first visit to `/` is English whatever the browser prefers. Nothing remembers a choice, because nothing could act on it without a redirect that flashes the wrong page first. The header's language link is the only way to change language. If that proves too little, a script in `<head>`, like the theme script, could redirect from a stored choice before first paint.
- **`src/paraglide` is generated and not committed.** `bun run messages` writes it. `types` and `test` run it first, and the Vite plugin rewrites it on every build. The plugin's options live in `apps/web/paraglide.config.ts`, which the script shares, so a test sees the code the build sees. The folder is excluded from the formatter and the linter.
- **`src/server.ts` exists only for the build.** Prerendering renders each page through the server entry, and `paraglideMiddleware` there sets the locale from the URL. Cloudflare never runs it.
- **Messages are called, not stored.** A module-level constant that holds a translated string would freeze the language of whichever page the build rendered first. Labels are functions (`rangeLabel`, `priceBucketLabel`, `themeLabel`, `provinceEntries`) or records of message functions.
- **Province and commodity names stay Indonesian in both languages**, as PIHPS gives them. Numbers already followed `id-ID` and still do. Dates use `Intl` with the page's language and always read day, month, year.
- **Paraglide writes the root as `/id/`.** `localizedUrl` in `i18n.ts` removes the slash, since the router writes `/id` and Cloudflare would redirect the other form.
- **Every message needs an entry in both `messages/en.json` and `messages/id.json`.** `test/i18n.test.ts` fails when a key or a placeholder is missing from one.
