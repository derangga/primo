import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { paraglideOptions } from "./paraglide.config.ts";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    paraglideVitePlugin(paraglideOptions),
    tanstackStart({
      // Each locale's page is its own prerendered file. The language switcher links the two, so
      // crawlLinks would find /id alone, but listing both keeps that from being an accident.
      prerender: { enabled: true, crawlLinks: true },
      pages: [
        { path: "/", prerender: { enabled: true } },
        { path: "/id", prerender: { enabled: true } },
      ],
    }),
    viteReact(),
    tailwindcss(),
  ],
});
