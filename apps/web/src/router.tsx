import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  // One client per router: the prerender builds a router per page and must not share a cache.
  const queryClient = new QueryClient();

  return createRouter({
    routeTree,
    scrollRestoration: true,
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
