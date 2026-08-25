import Link from "next/link";
import type { DashboardViewServerProps } from "@payloadcms/next/views";

const formatRelativeTimeId = (dateStr?: string | null): string => {
  if (!dateStr) return "Baru saja";
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) {
    const diffMonth = Math.floor(diffDay / 30);
    return `${diffMonth} bulan lalu`;
  }
  if (diffDay > 0) return `${diffDay} hari lalu`;
  if (diffHour > 0) return `${diffHour} jam lalu`;
  if (diffMin > 0) return `${diffMin} menit lalu`;
  return "Baru saja";
};

const getGreetingId = (): string => {
  // Server bisa berjalan di UTC (mis. Vercel). Hitung jam di zona WIB
  // (Asia/Jakarta, UTC+7) agar salam sesuai waktu lokal pengelola.
  const jakartaHour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(new Date()),
  );
  const hour = Number.isNaN(jakartaHour) ? new Date().getHours() : jakartaHour % 24;
  if (hour >= 4 && hour < 11) return "SELAMAT PAGI 👋";
  if (hour >= 11 && hour < 15) return "SELAMAT SIANG 👋";
  if (hour >= 15 && hour < 19) return "SELAMAT SORE 👋";
  return "SELAMAT MALAM 👋";
};

const DASHBOARD_STYLES = `
  .mum-dashboard {
    max-width: 1360px;
    margin: 0 auto;
    padding: 20px 28px 48px;
    font-family: var(--font-inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    color: #1E2229;
    box-sizing: border-box;
  }

  /* Top Navigation Bar */
  .mum-top-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding: 4px 0 16px;
    border-bottom: 1px solid rgba(220, 214, 203, 0.4);
  }

  .mum-top-breadcrumb {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #717780;
    text-transform: uppercase;
    margin: 0;
  }

  .mum-btn-view-site {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    border-radius: 9999px;
    background: #FFFFFF;
    border: 1px solid #E2DCD3;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  }

  .mum-btn-view-site:hover {
    background: #FAF8F5;
    border-color: #D3CBC0;
    color: #111827;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
  }

  /* Greeting Card */
  .mum-greeting-card {
    background: #FFFFFF;
    border-radius: 24px;
    padding: 32px 36px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02), 0 1px 4px rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(228, 222, 212, 0.6);
  }

  .mum-greeting-eyebrow {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #374151;
    text-transform: uppercase;
    margin: 0 0 10px 0;
  }

  .mum-greeting-title {
    font-size: 34px;
    font-weight: 800;
    color: #111827;
    margin: 0 0 12px 0;
    letter-spacing: -0.025em;
    line-height: 1.15;
  }

  .mum-greeting-meta {
    font-size: 14px;
    color: #6B7280;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .mum-greeting-meta strong {
    color: #111827;
    font-weight: 700;
  }

  .mum-greeting-meta .mum-dot {
    color: #9CA3AF;
  }

  /* Stat Cards Grid */
  .mum-stat-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 28px;
  }

  @media (min-width: 768px) {
    .mum-stat-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (min-width: 1100px) {
    .mum-stat-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }

  .mum-stat-card {
    background: #FFFFFF;
    border-radius: 20px;
    padding: 22px 24px;
    border: 1px solid rgba(228, 222, 212, 0.6);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .mum-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  }

  .mum-stat-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mum-stat-icon-wrap svg {
    width: 22px;
    height: 22px;
  }

  .mum-stat-icon--green {
    background: #E7F7F0;
    color: #10B981;
  }

  .mum-stat-icon--orange {
    background: #FEF4E6;
    color: #F59E0B;
  }

  .mum-stat-icon--blue {
    background: #EBF5FF;
    color: #3B82F6;
  }

  .mum-stat-icon--purple {
    background: #F4EBF7;
    color: #8B5CF6;
  }

  .mum-stat-icon--pink {
    background: #FCEBF3;
    color: #EC4899;
  }

  .mum-stat-number {
    font-size: 28px;
    font-weight: 800;
    color: #111827;
    margin: 0;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .mum-stat-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #717780;
    text-transform: uppercase;
    margin: 4px 0 0 0;
  }

  /* Lower Section Layout (Articles + Quick Actions) */
  .mum-content-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  @media (min-width: 1024px) {
    .mum-content-grid {
      grid-template-columns: minmax(0, 2.3fr) minmax(320px, 1fr);
    }
  }

  /* Recent Articles Card */
  .mum-articles-card {
    background: #FFFFFF;
    border-radius: 24px;
    padding: 28px 32px;
    border: 1px solid rgba(228, 222, 212, 0.6);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  }

  .mum-articles-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid #F2EEE9;
  }

  .mum-articles-title {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #1E2229;
    text-transform: uppercase;
    margin: 0;
  }

  .mum-articles-link-all {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 9999px;
    background: #FAF8F5;
    border: 1px solid #EBE4DA;
    color: #4B5563;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .mum-articles-link-all:hover {
    background: #F4EFE6;
    color: #111827;
  }

  .mum-articles-list {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mum-article-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #F5F1EB;
    gap: 16px;
  }

  .mum-article-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .mum-article-item:first-child {
    padding-top: 4px;
  }

  .mum-article-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .mum-article-name {
    color: #1E293B;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    line-height: 1.4;
    transition: color 0.15s ease;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mum-article-name:hover {
    color: #10B981;
  }

  .mum-article-time {
    color: #94A3B8;
    font-size: 12px;
    font-weight: 500;
    margin: 0;
  }

  .mum-badge-live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 9999px;
    background: #E8F8F0;
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #059669;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .mum-badge-live__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10B981;
  }

  .mum-badge-draft {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 9999px;
    background: #FEF4E6;
    border: 1px solid rgba(245, 158, 11, 0.25);
    color: #D97706;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  /* Quick Actions Column */
  .mum-quick-column {
    display: flex;
    flex-direction: column;
  }

  .mum-quick-title {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #717780;
    text-transform: uppercase;
    margin: 0 0 16px 0;
  }

  .mum-quick-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mum-quick-card {
    background: #FFFFFF;
    border-radius: 18px;
    padding: 16px 20px;
    border: 1px solid rgba(228, 222, 212, 0.6);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.02);
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-decoration: none;
    color: #1E293B;
    transition: all 0.2s ease;
  }

  .mum-quick-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
    border-color: #D6CEC2;
  }

  .mum-quick-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .mum-quick-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    flex-shrink: 0;
  }

  .mum-quick-icon svg {
    width: 20px;
    height: 20px;
  }

  .mum-quick-icon--green {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  }

  .mum-quick-icon--blue {
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  }

  .mum-quick-icon--purple {
    background: linear-gradient(135deg, #A855F7 0%, #7C3AED 100%);
    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.25);
  }

  .mum-quick-icon--teal {
    background: linear-gradient(135deg, #334155 0%, #1E293B 100%);
    box-shadow: 0 4px 12px rgba(30, 41, 59, 0.25);
  }

  .mum-quick-text {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
  }

  .mum-quick-arrow {
    color: #94A3B8;
    font-size: 16px;
    transition: transform 0.2s ease, color 0.2s ease;
  }

  .mum-quick-card:hover .mum-quick-arrow {
    transform: translateX(4px);
    color: #111827;
  }
`;

export default async function DashboardView({
  initPageResult,
}: DashboardViewServerProps) {
  const { payload } = initPageResult.req;
  const adminRoute = payload.config.routes.admin;

  // Safe queries to count articles, media, categories, tags
  let publishedCount = 0;
  let draftCount = 0;
  let scheduledCount = 0;
  let mediaCount = 0;
  let categoryCount = 0;
  let tagCount = 0;
  let recentArticles: Array<{
    id: string | number;
    title?: string | null;
    status?: string | null;
    updatedAt?: string | null;
    publishedAt?: string | null;
  }> = [];

  const nowIso = new Date().toISOString();

  try {
    const [pubRes, draftRes, schedRes, medRes, catRes, tagRes, artListRes] =
      await Promise.all([
        // published = sudah tayang (publishedAt <= sekarang). `status` di-sinkronkan
        // dengan `_status` lewat hook Artikel, jadi aman dipakai sebagai sumber.
        payload.count({
          collection: "artikel",
          where: {
            and: [
              { status: { equals: "published" } },
              { publishedAt: { less_than_equal: nowIso } },
            ],
          },
        }),
        payload.count({
          collection: "artikel",
          where: { status: { equals: "draft" } },
        }),
        // scheduled = published tapi publishedAt masih di masa depan.
        payload.count({
          collection: "artikel",
          where: {
            and: [
              { status: { equals: "published" } },
              { publishedAt: { greater_than: nowIso } },
            ],
          },
        }),
        payload.count({ collection: "media" }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: "categories" }).catch(() => ({ totalDocs: 0 })),
        payload.count({ collection: "tags" }).catch(() => ({ totalDocs: 0 })),
        payload
          .find({
            collection: "artikel",
            limit: 5,
            sort: "-updatedAt",
            depth: 0,
          })
          .catch(() => ({ docs: [] })),
      ]);

    publishedCount = pubRes.totalDocs;
    draftCount = draftRes.totalDocs;
    scheduledCount = schedRes.totalDocs;
    mediaCount = medRes.totalDocs;
    categoryCount = catRes.totalDocs;
    tagCount = tagRes.totalDocs;
    recentArticles = (artListRes.docs || []) as typeof recentArticles;
  } catch (err) {
    console.error("Error fetching dashboard statistics:", err);
  }

  const greeting = getGreetingId();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DASHBOARD_STYLES }} />
      <div className="mum-dashboard">
        {/* Top Navbar */}
        <nav className="mum-top-nav" aria-label="Dashboard breadcrumb">
          <p className="mum-top-breadcrumb">ADMIN DASHBOARD</p>
          <a
            href="https://granddutacitysouthofjakarta.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mum-btn-view-site"
          >
            <span>Lihat Website</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </nav>

        {/* Greeting Banner */}
        <section className="mum-greeting-card">
          <p className="mum-greeting-eyebrow">{greeting}</p>
          <h1 className="mum-greeting-title">Dashboard Grand Duta City Parung</h1>
          <p className="mum-greeting-meta">
            <strong>{publishedCount}</strong> artikel published
            <span className="mum-dot">&bull;</span>
            <strong>{draftCount}</strong> draft
            <span className="mum-dot">&bull;</span>
            <strong>{mediaCount}</strong> media
          </p>
        </section>

        {/* 5 Stat Cards */}
        <section className="mum-stat-grid" aria-label="Statistik Konten">
          {/* Card 1: Published */}
          <div className="mum-stat-card">
            <div className="mum-stat-icon-wrap mum-stat-icon--green">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="mum-stat-number">{publishedCount}</p>
              <p className="mum-stat-label">PUBLISHED</p>
            </div>
          </div>

          {/* Card 2: Draft */}
          <div className="mum-stat-card">
            <div className="mum-stat-icon-wrap mum-stat-icon--orange">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="mum-stat-number">{draftCount}</p>
              <p className="mum-stat-label">DRAFT</p>
            </div>
          </div>

          {/* Card 3: Scheduled */}
          <div className="mum-stat-card">
            <div className="mum-stat-icon-wrap mum-stat-icon--blue">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <div>
              <p className="mum-stat-number">{scheduledCount}</p>
              <p className="mum-stat-label">SCHEDULED</p>
            </div>
          </div>

          {/* Card 4: Kategori */}
          <div className="mum-stat-card">
            <div className="mum-stat-icon-wrap mum-stat-icon--purple">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <div>
              <p className="mum-stat-number">{categoryCount}</p>
              <p className="mum-stat-label">KATEGORI</p>
            </div>
          </div>

          {/* Card 5: Tag */}
          <div className="mum-stat-card">
            <div className="mum-stat-icon-wrap mum-stat-icon--pink">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            </div>
            <div>
              <p className="mum-stat-number">{tagCount}</p>
              <p className="mum-stat-label">TAG</p>
            </div>
          </div>
        </section>

        {/* Lower 2 Columns */}
        <div className="mum-content-grid">
          {/* Left: Artikel Terbaru */}
          <section className="mum-articles-card">
            <div className="mum-articles-header">
              <h2 className="mum-articles-title">Artikel Terbaru</h2>
              <Link href={`${adminRoute}/collections/artikel`} className="mum-articles-link-all">
                <span>Semua</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <ul className="mum-articles-list">
              {recentArticles.length > 0 ? (
                recentArticles.map((art) => {
                  const isPublished = art.status === "published";
                  const timeLabel = formatRelativeTimeId(art.publishedAt || art.updatedAt);
                  return (
                    <li key={art.id} className="mum-article-item">
                      <div className="mum-article-info">
                        <Link
                          href={`${adminRoute}/collections/artikel/${art.id}`}
                          className="mum-article-name"
                          title={art.title || "Tanpa Judul"}
                        >
                          {art.title || "Artikel Tanpa Judul"}
                        </Link>
                        <p className="mum-article-time">{timeLabel}</p>
                      </div>
                      {isPublished ? (
                        <span className="mum-badge-live">
                          <span className="mum-badge-live__dot" />
                          <span>LIVE</span>
                        </span>
                      ) : (
                        <span className="mum-badge-draft">
                          <span>DRAFT</span>
                        </span>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="mum-article-item">
                  <div className="mum-article-info">
                    <p className="mum-article-name" style={{ color: "#94A3B8" }}>
                      Belum ada artikel yang dibuat.
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </section>

          {/* Right: Quick Actions */}
          <aside className="mum-quick-column">
            <h2 className="mum-quick-title">Quick Actions</h2>
            <div className="mum-quick-stack">
              {/* Tulis Artikel */}
              <Link href={`${adminRoute}/collections/artikel/create`} className="mum-quick-card">
                <div className="mum-quick-left">
                  <div className="mum-quick-icon mum-quick-icon--green">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </div>
                  <span className="mum-quick-text">Tulis Artikel</span>
                </div>
                <span className="mum-quick-arrow" aria-hidden="true">&rarr;</span>
              </Link>

              {/* SEO Dashboard */}
              <Link href={`${adminRoute}/collections/artikel`} className="mum-quick-card">
                <div className="mum-quick-left">
                  <div className="mum-quick-icon mum-quick-icon--blue">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <span className="mum-quick-text">SEO Dashboard</span>
                </div>
                <span className="mum-quick-arrow" aria-hidden="true">&rarr;</span>
              </Link>

              {/* AI Tools */}
              <Link href={`${adminRoute}/ai-studio`} className="mum-quick-card">
                <div className="mum-quick-left">
                  <div className="mum-quick-icon mum-quick-icon--purple">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <span className="mum-quick-text">AI Tools</span>
                </div>
                <span className="mum-quick-arrow" aria-hidden="true">&rarr;</span>
              </Link>

              {/* Konfigurasi AI */}
              <Link href={`${adminRoute}/collections/ai-providers`} className="mum-quick-card">
                <div className="mum-quick-left">
                  <div className="mum-quick-icon mum-quick-icon--teal">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="mum-quick-text">Konfigurasi AI</span>
                </div>
                <span className="mum-quick-arrow" aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
