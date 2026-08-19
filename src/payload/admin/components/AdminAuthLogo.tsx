type AdminAuthLogoProps = {
  compact?: boolean;
};

export default function AdminAuthLogo({ compact = false }: AdminAuthLogoProps) {
  const markSize = compact ? 32 : 40;
  const eyebrowStyle = {
    color: "#667085",
    fontSize: compact ? 10 : 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    fontWeight: 700,
    lineHeight: 1.2,
  };

  const titleStyle = {
    color: "#101828",
    fontSize: compact ? 15 : 16,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  };

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
          width: markSize,
          height: markSize,
          borderRadius: compact ? 12 : 14,
          background:
            "linear-gradient(135deg, rgba(245, 165, 36, 0.16), rgba(17, 24, 39, 0.96))",
          border: "1px solid rgba(229, 234, 242, 0.95)",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          className="gdc-auth-logo__diamond"
          style={{
            color: "#ffffff",
            fontSize: compact ? 14 : 16,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          G
        </span>
        <span className="gdc-auth-logo__core" />
      </div>
      <div
        className="gdc-auth-logo__copy"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <span className="gdc-auth-logo__eyebrow" style={eyebrowStyle}>
          Grand Duta City
        </span>
        <strong className="gdc-auth-logo__title" style={titleStyle}>
          Grand Duta CMS
        </strong>
        {!compact ? (
          <span
            className="gdc-auth-logo__meta"
            style={{
              color: "#667085",
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            Kelola artikel, media, dan konten website dalam satu dashboard.
          </span>
        ) : null}
      </div>
    </div>
  );
}
