import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatTone = "accent" | "success" | "warning" | "info" | "danger" | "neutral";

const TONE_CLASS: Record<StatTone, string> = {
  accent: "bg-admin-accent-soft text-admin-accent-soft-fg",
  success: "bg-admin-success-soft text-admin-success",
  warning: "bg-admin-warning-soft text-admin-warning",
  info: "bg-admin-info-soft text-admin-info",
  danger: "bg-admin-danger-soft text-admin-danger",
  neutral: "bg-admin-surface-muted text-admin-fg-muted",
};

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-admin-border bg-admin-surface p-4 shadow-admin-xs transition hover:shadow-admin-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-admin-fg">{value}</p>
        {Icon ? (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              TONE_CLASS[tone],
            )}
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-admin-fg-muted">
        {label}
      </p>
    </div>
  );
}
