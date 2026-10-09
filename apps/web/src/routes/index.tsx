import { createFileRoute } from "@tanstack/react-router";
import { ViewShell } from "~/components/view-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Map · Food Price Monitor" },
      {
        name: "description",
        content: "Staple food prices by Indonesian province, coloured against the national price.",
      },
    ],
  }),
  component: () => <ViewShell heading="Map" cardTitle="Price map" />,
});
