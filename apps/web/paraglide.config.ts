import type { CompilerOptions } from "@inlang/paraglide-js";

// English is served at the root and Indonesian under /id. The site is static, so the locale comes
// from the URL alone (docs/adr/0008). The Vite plugin and scripts/compile-messages.ts both read
// this, so a test or a type check that runs without Vite sees the code the build sees.
export const paraglideOptions: CompilerOptions = {
  project: "./project.inlang",
  outdir: "./src/paraglide",
  emitTsDeclarations: true,
  strategy: ["url", "baseLocale"],
  // The router writes no trailing slash, and Cloudflare redirects /id/ to /id.
  trailingSlash: "never",
  urlPatterns: [
    {
      pattern: "/:path(.*)?",
      localized: [
        ["id", "/id/:path(.*)?"],
        ["en", "/:path(.*)?"],
      ],
    },
  ],
};
