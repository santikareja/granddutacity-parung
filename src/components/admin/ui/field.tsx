import * as React from "react";

import { cn } from "@/lib/utils";

// Input, Textarea, Select, dan Label untuk panel /admin. Pola visual sama
// (border admin-border, focus ring admin-accent) supaya form di seluruh
// panel (artikel, kategori, pengaturan, dll.) konsisten tanpa mengulang
// string className di tiap file.

const fieldBase =
  "w-full rounded-lg border border-admin-border bg-admin-surface px-3.5 py-2.5 text-sm text-admin-fg outline-none transition placeholder:text-admin-fg-dim focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 disabled:cursor-not-allowed disabled:bg-admin-surface-muted disabled:text-admin-fg-dim";

export const AdminInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, className)} {...props} />
));
AdminInput.displayName = "AdminInput";

export const AdminTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, "resize-y", className)} {...props} />
));
AdminTextarea.displayName = "AdminTextarea";

export const AdminSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(fieldBase, "cursor-pointer", className)} {...props} />
));
AdminSelect.displayName = "AdminSelect";

export const AdminLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("block text-sm font-medium text-admin-fg", className)}
    {...props}
  />
));
AdminLabel.displayName = "AdminLabel";

export const AdminCheckbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    className={cn(
      "h-4 w-4 shrink-0 accent-admin-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent/40",
      className,
    )}
    {...props}
  />
));
AdminCheckbox.displayName = "AdminCheckbox";
