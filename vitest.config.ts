import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The website's "~/" imports, as in apps/web/tsconfig.json and vite.config.ts.
  resolve: { alias: { "~": fileURLToPath(new URL("./apps/web/src", import.meta.url)) } },
});
