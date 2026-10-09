import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

export function Card(props: ComponentProps<"section">) {
  const { className, ...rest } = props;

  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)} {...rest} />
  );
}

export function CardHeader(props: ComponentProps<"div">) {
  const { className, ...rest } = props;

  return (
    <div className={cn("mb-3 flex items-baseline justify-between gap-3", className)} {...rest} />
  );
}

export function CardTitle(props: ComponentProps<"h2">) {
  const { className, ...rest } = props;

  return <h2 className={cn("text-lg font-semibold", className)} {...rest} />;
}
