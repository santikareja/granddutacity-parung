import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Button primitive khusus panel /admin. Terpisah dari src/components/ui/button.tsx
// (dipakai situs publik) agar token warna admin (--color-admin-*) tidak bocor
// ke desain publik, dan sebaliknya.
const adminButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-admin-accent text-admin-accent-fg font-semibold shadow-admin-xs hover:bg-admin-accent-hover",
        secondary:
          "border border-admin-border bg-admin-surface text-admin-fg hover:bg-admin-surface-hover",
        ghost: "text-admin-fg-muted hover:bg-admin-surface-hover hover:text-admin-fg",
        soft: "bg-admin-accent-soft text-admin-accent-soft-fg font-semibold hover:bg-admin-accent-soft/70",
        danger:
          "border border-admin-danger/25 bg-admin-danger-soft text-admin-danger hover:bg-admin-danger-soft/70",
        dark: "bg-admin-fg text-white hover:bg-admin-fg/90",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9.5 px-4",
        lg: "h-11 px-5 text-[15px]",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  },
);

export interface AdminButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof adminButtonVariants> {
  asChild?: boolean;
}

const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(adminButtonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
AdminButton.displayName = "AdminButton";

export { AdminButton, adminButtonVariants };
