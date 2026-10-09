import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

export function Skeleton(props: ComponentProps<"div">) {
  const { className, ...rest } = props;

  return <div className={cn("animate-sk rounded-sm bg-skeleton", className)} {...rest} />;
}
