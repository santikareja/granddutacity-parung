type AdminAuthLogoProps = {
  compact?: boolean;
  variant?: "brand-bubble" | "console-header" | "badge-only";
};

export default function AdminAuthLogo({
  compact = false,
  variant = "console-header",
}: AdminAuthLogoProps) {
  if (variant === "brand-bubble") {
    return (
      <div
        className="mum-auth-bubble-logo"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-outfit, 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif)",
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "#E28743",
            textShadow: "0 2px 14px rgba(226, 135, 67, 0.45), 0 0 2px #733413",
            lineHeight: 1.15,
            userSelect: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            textAlign: "center",
          }}
        >
          <span>Grand Duta City Parung</span>
        </div>
        <p
          style={{
            margin: 0,
            color: "#A69B8D",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          Admin Dashboard
        </p>
      </div>
    );
  }

  // Console header variant (for Sidebar / Nav / Default Logo)
  return (
    <div
      className={`gdc-auth-logo${compact ? " gdc-auth-logo--compact" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 10 : 12,
      }}
    >
      <div
        className="gdc-auth-logo__mark"
        aria-hidden="true"
        style={{
          width: compact ? 36 : 40,
          height: compact ? 36 : 40,
          borderRadius: 9999,
          background: "#2D433C",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 4px 12px rgba(45, 67, 60, 0.25)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: compact ? 15 : 17,
            fontWeight: 800,
            lineHeight: 1,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          M
        </span>
      </div>
      <div
        className="gdc-auth-logo__copy"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <strong
          className="gdc-auth-logo__title"
          style={{
            color: "#181D20",
            fontSize: compact ? 14 : 15,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          Admin Console
        </strong>
        <span
          className="gdc-auth-logo__eyebrow"
          style={{
            color: "#7E858E",
            fontSize: compact ? 11 : 12,
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          Grand Duta City Parung
        </span>
      </div>
    </div>
  );
}
