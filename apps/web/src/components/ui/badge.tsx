import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

// The badge in its neutral, warning and error colours.
const badgeVariants = cva(
  "inline-flex h-7 items-center gap-1.5 rounded-pill border px-2.5 text-sm whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-border text-text-2",
        warn: "border-transparent bg-warn-bg font-medium text-warn",
        error: "border-transparent bg-error-bg font-medium text-error",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge(props: ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  const { className, variant, ...rest } = props;

  return <div className={cn(badgeVariants({ variant }), className)} {...rest} />;
}
