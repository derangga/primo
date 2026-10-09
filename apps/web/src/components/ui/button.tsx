import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

// The text button and the icon button. Hover only where a fine pointer exists.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center border border-border bg-card font-medium whitespace-nowrap transition-[transform,background-color,border-color] duration-(--dur-press) active:scale-[0.97] motion-reduce:active:scale-100 disabled:pointer-events-none disabled:bg-page disabled:text-text-disabled",
  {
    variants: {
      variant: {
        default:
          "h-(--control-h) rounded-md px-3.5 text-accent fine-hover:hover:border-accent fine-hover:hover:bg-accent-soft active:border-accent active:bg-accent-soft",
        icon: "size-(--control-h) rounded-md p-0 text-text fine-hover:hover:border-border-strong fine-hover:hover:bg-hover aria-expanded:border-accent",
        round:
          "size-9 rounded-pill p-0 text-text fine-hover:hover:border-border-strong fine-hover:hover:bg-hover aria-expanded:border-accent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Button(props: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  const { className, variant, type = "button", ...rest } = props;

  return <button type={type} className={cn(buttonVariants({ variant }), className)} {...rest} />;
}
