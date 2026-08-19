import Link from "next/link";
import type { DashboardViewServerProps } from "@payloadcms/next/views";

const formatLabel = (value: string) =>
  value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const DASHBOARD_STYLES = `
  .gdc-dashboard {
    max-width: 1280px;
    margin: 0 auto;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
  }
  .gdc-dash-header {
    margin-bottom: 24px;
    padding: 16px 0;
    border-bottom: 1px solid #d4dae5;
  }
  .gdc-dash-eyebrow {
    color: #F5A524;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 8px 0;
  }
  .gdc-dash-title {
    color: #0f172a;
    font-size: 30px;
    font-weight: 600;
    margin: 0 0 8px 0;
  }
  .gdc-dash-subtitle {
    color: #475467;
    font-size: 15px;
    max-width: 740px;
    line-height: 1.5;
    margin: 0;
  }
  .gdc-dash-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }
  @media (min-width: 768px) {
    .gdc-dash-grid {
      grid-template-columns: minmax(0, 2.2fr) minmax(280px, 1fr);
    }
  }
  .gdc-dash-card {
    background: #ffffff;
    border: 1px solid #d4dae5;
    border-radius: 0;
    padding: 20px;
    box-shadow: 0 6px 14px rgba(16, 24, 40, 0.05);
  }
  .gdc-dash-card-title {
    color: #0f172a;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px 0;
  }
  .gdc-nav-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .gdc-nav-item a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #f7f9fc;
    border: 1px solid #d4dae5;
    border-radius: 0;
    color: #1f2937;
    text-decoration: none;
    transition: all 0.2s ease;
  }
  .gdc-nav-item a:hover {
    background: #fff5ea;
    border-color: #f5a524;
    transform: translateX(2px);
  }
  .gdc-nav-label {
    font-weight: 500;
    font-size: 15px;
  }
  .gdc-nav-arrow {
    color: #F5A524;
    font-weight: bold;
    font-size: 14px;
  }
  .gdc-meta-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px dashed #d4dae5;
  }
  .gdc-meta-item:last-child {
    border-bottom: none;
  }
  .gdc-meta-label {
    color: #475467;
    font-size: 14px;
    margin: 0;
  }
  .gdc-meta-value {
    color: #0f172a;
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }
`;

export default function DashboardView({
  initPageResult,
  user,
}: DashboardViewServerProps) {
  const adminRoute = initPageResult.req.payload.config.routes.admin;
  const visibleCollections = initPageResult.visibleEntities.collections;
  const visibleGlobals = initPageResult.visibleEntities.globals;
  const collectionsConfig = initPageResult.req.payload.config.collections;
  const globalsConfig = initPageResult.req.payload.config.globals;

  const collectionLinks = visibleCollections.map((slug) => {
    const collection = collectionsConfig.find((item) => item.slug === slug);
    const label =
      typeof collection?.labels?.plural === "string"
        ? collection.labels.plural
        : formatLabel(slug);

    return {
      href: `${adminRoute}/collections/${slug}`,
      label,
      slug,
    };
  });

  const globalLinks = visibleGlobals.map((slug) => {
    const global = globalsConfig.find((item) => item.slug === slug);
        const label =
      typeof global?.label === "string"
        ? global.label
        : (typeof global?.label === "object" && global?.label !== null && "singular" in global.label)
          ? (global.label as any).singular
          : formatLabel(slug);

    return {
      href: `${adminRoute}/globals/${slug}`,
      label,
      slug,
    };
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_STYLES }} />
      <div className="gdc-dashboard">
        <header className="gdc-dash-header">
          <p className="gdc-dash-eyebrow">Content Management System</p>
          <h1 className="gdc-dash-title">Halo, {user?.name || user?.email || "Admin"}!</h1>
          <p className="gdc-dash-subtitle">Selamat datang di dashboard Grand Duta City. Di sini Anda bisa mengelola seluruh artikel, konten media, dan informasi penting lainnya dengan mudah.</p>
        </header>

        <div className="gdc-dash-grid">
          {/* Main Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <section className="gdc-dash-card">
              <h2 className="gdc-dash-card-title">Koleksi Konten</h2>
              <ul className="gdc-nav-list">
                {collectionLinks.length > 0 ? (
                  collectionLinks.map((link) => (
                    <li key={link.slug} className="gdc-nav-item">
                      <Link href={link.href}>
                        <span className="gdc-nav-label">{link.label}</span>
                        <span className="gdc-nav-arrow">-&gt;</span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <p style={{ color: "rgba(245,241,232,0.5)", fontSize: "14px" }}>Tidak ada akses koleksi.</p>
                )}
              </ul>
            </section>

            {globalLinks.length > 0 && (
              <section className="gdc-dash-card">
                <h2 className="gdc-dash-card-title">Pengaturan Global</h2>
                <ul className="gdc-nav-list">
                  {globalLinks.map((link) => (
                    <li key={link.slug} className="gdc-nav-item">
                      <Link href={link.href}>
                        <span className="gdc-nav-label">{link.label}</span>
                        <span className="gdc-nav-arrow">-&gt;</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar Meta */}
          <aside className="gdc-dash-card" style={{ height: "fit-content" }}>
            <h2 className="gdc-dash-card-title">Informasi Sistem</h2>
            <div className="gdc-meta-item">
              <p className="gdc-meta-label">Email Anda</p>
              <p className="gdc-meta-value">{user?.email}</p>
            </div>
            <div className="gdc-meta-item">
              <p className="gdc-meta-label">Role Akses</p>
              <p className="gdc-meta-value" style={{ textTransform: "capitalize" }}>{user?.role || "Admin"}</p>
            </div>
            <div className="gdc-meta-item">
              <p className="gdc-meta-label">Total Koleksi Aktif</p>
              <p className="gdc-meta-value">{collectionLinks.length}</p>
            </div>
            <div className="gdc-meta-item" style={{ marginTop: "24px", border: "none" }}>
              <Link href={`${adminRoute}/account`} style={{ color: "#F5A524", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
                Pengaturan Akun Pribadi -&gt;
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

