import { compile } from "@inlang/paraglide-js";
import { paraglideOptions } from "../paraglide.config.ts";

// Writes src/paraglide from messages/*.json. The folder is not committed: `bun run check` calls
// this first, and the Vite plugin rewrites it on every build and dev server start.
await compile(paraglideOptions);
