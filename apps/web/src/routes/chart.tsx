import { createFileRoute } from "@tanstack/react-router";
import { ViewShell } from "~/components/view-shell";

export const Route = createFileRoute("/chart")({
  head: () => ({
    meta: [
      { title: "Chart · Food Price Monitor" },
      {
        name: "description",
        content:
          "How the price of a staple food has moved over the last 90 days, nationally or by province.",
      },
    ],
  }),
  component: () => <ViewShell heading="Chart" cardTitle="Price over time" />,
});
