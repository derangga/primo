import { m } from "~/paraglide/messages.js";

// Says where the prices come from and when they change (DESIGN.UI.md, Page footer). It also gives a
// search engine text to read: the map and the chart load their data in the browser.
export function DataFooter() {
  return (
    <footer className="mx-auto max-w-(--content-max) px-4 pb-6 text-xs text-text-2 sm:px-6">
      <p>{m.footer_about()}</p>
    </footer>
  );
}
