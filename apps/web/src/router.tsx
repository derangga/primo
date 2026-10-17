import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { localizedUrl } from "./i18n";
import { deLocalizeUrl } from "./paraglide/runtime.js";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  // One client per router: the prerender builds a router per page and must not share a cache.
  const queryClient = new QueryClient();

  return createRouter({
    routeTree,
    scrollRestoration: true,
    // /id/... is the same route as /...: the router matches the unlocalized URL and writes the
    // localized one back to the address bar and to every link.
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizedUrl(url),
    },
    Wrap: (props: { readonly children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
    ),
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
