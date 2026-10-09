import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Header } from "~/components/header";
import styles from "~/styles.css?url";
import { themeScript } from "~/theme-script";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Food Price Monitor" },
    ],
    links: [
      { rel: "stylesheet", href: styles },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
    ],
    scripts: [{ children: themeScript }],
  }),
  component: RootLayout,
  shellComponent: RootDocument,
});

function RootDocument(props: { readonly children: ReactNode }) {
  return (
    // The head script sets data-theme and data-setting before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
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
      <main className="mx-auto flex max-w-(--content-max) flex-col gap-3 p-4 pb-[calc(var(--space-4)+64px+env(safe-area-inset-bottom))] sm:gap-4 sm:p-6">
        <Outlet />
      </main>
    </>
  );
}
