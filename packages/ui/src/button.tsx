import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20 hover:bg-primary/90 hover:shadow-md active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground ring-1 ring-border/50 hover:bg-secondary/80",
        outline: "border border-border bg-card text-foreground shadow-sm hover:border-primary/30 hover:bg-muted/60",
        ghost: "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        soft: "bg-primary/10 text-primary ring-1 ring-primary/15 hover:bg-primary/15",
        accent: "bg-accent text-accent-foreground shadow-sm ring-1 ring-accent/20 hover:bg-accent/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-5 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size, type = "button", variant, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return <Comp className={cn(buttonVariants({ className, size, variant }))} ref={ref} type={asChild ? undefined : type} {...props} />;
  },
);

Button.displayName = "Button";

export { buttonVariants };
