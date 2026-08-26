import * as React from "react";

import { cn } from "@/lib/utils";

export const AdminCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-admin-border bg-admin-surface shadow-admin-xs",
      className,
    )}
    {...props}
  />
));
AdminCard.displayName = "AdminCard";

export const AdminCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between gap-3 border-b border-admin-border px-5 py-4",
      className,
    )}
    {...props}
  />
));
AdminCardHeader.displayName = "AdminCardHeader";

export const AdminCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-sm font-semibold text-admin-fg", className)}
    {...props}
  />
));
AdminCardTitle.displayName = "AdminCardTitle";

export const AdminCardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4 p-5", className)} {...props} />
));
AdminCardBody.displayName = "AdminCardBody";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const BADGE_TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-admin-surface-muted text-admin-fg-muted",
  success: "bg-admin-success-soft text-admin-success",
  warning: "bg-admin-warning-soft text-admin-warning",
  danger: "bg-admin-danger-soft text-admin-danger",
  info: "bg-admin-info-soft text-admin-info",
  accent: "bg-admin-accent-soft text-admin-accent-soft-fg",
};

export function AdminBadge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        BADGE_TONE_CLASS[tone],
        className,
      )}
      {...props}
    />
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-admin-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-admin-fg">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm text-admin-fg-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function AdminAlert({
  variant = "error",
  children,
  className,
}: {
  variant?: "error" | "success" | "warning" | "info";
  children: React.ReactNode;
  className?: string;
}) {
  const styles: Record<typeof variant, string> = {
    error: "border-admin-danger/20 bg-admin-danger-soft text-admin-danger",
    success: "border-admin-success/20 bg-admin-success-soft text-admin-success",
    warning: "border-admin-warning/25 bg-admin-warning-soft text-admin-warning",
    info: "border-admin-info/20 bg-admin-info-soft text-admin-info",
  };
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        styles[variant],
        className,
      )}
    >
      {children}
    </p>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-5 py-14 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium text-admin-fg">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-admin-fg-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
