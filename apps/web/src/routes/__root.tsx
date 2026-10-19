import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { DataFooter } from "~/components/data-footer";
import { Header } from "~/components/header";
import { getLocale } from "~/paraglide/runtime.js";
import { pageHead, siteOrigin } from "~/seo";
import plex400 from "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2?url";
import plex500 from "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2?url";
import plex600 from "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2?url";
import styles from "~/styles.css?url";
import { themeScript } from "~/theme-script";

export const Route = createRootRoute({
  head: () => {
    // The site has one page per language, so its head is the root's.
    const page = pageHead(siteOrigin(), getLocale());

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        ...page.meta,
      ],
      links: [
        { rel: "stylesheet", href: styles },
        // The first paint waits for the fonts, and the stylesheet alone would only ask for them
        // once it has arrived. These are the files styles.css imports.
        ...[plex400, plex500, plex600].map((href) => ({
          rel: "preload",
          href,
          as: "font",
          type: "font/woff2",
          crossOrigin: "anonymous" as const,
        })),
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        ...page.links,
      ],
      scripts: [{ children: themeScript }],
    };
  },
  component: RootLayout,
  shellComponent: RootDocument,
});

function RootDocument(props: { readonly children: ReactNode }) {
  return (
    // The head script sets data-theme and data-setting before React hydrates.
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        {/* The router keeps one meta tag per name, so the two theme colours are written here. They
            are the --color-page values of tokens.css. */}
        <meta name="theme-color" content="#f3f4f6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0e1116" media="(prefers-color-scheme: dark)" />
        <HeadContent />
      </head>
      <body>
        {props.children}
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-(--content-max) flex-col gap-3 p-4 sm:gap-4 sm:p-6">
        <Outlet />
      </main>
      <DataFooter />
    </>
  );
}
