import { createFileRoute } from "@tanstack/react-router";
import { ViewShell } from "~/components/view-shell";

export const Route = createFileRoute("/purchasing-power")({
  head: () => ({
    meta: [
      { title: "Purchasing Power · Food Price Monitor" },
      {
        name: "description",
        content: "How many kilograms of a staple food one provincial minimum wage buys.",
      },
    ],
  }),
  component: () => <ViewShell heading="Purchasing Power" cardTitle="Purchasing power" />,
});
