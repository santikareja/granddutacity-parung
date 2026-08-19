import Image from "next/image";
import type { ReactNode } from "react";

const AUTH_IMAGE = "https://res.cloudinary.com/dzhvfbuks/image/upload/v1775630457/Main_Gate_sdap2y.webp";

const AUTH_STYLES = `
  :root {
    --gdc-auth-bg: #0b120c;
    --gdc-auth-surface: #111a12;
    --gdc-auth-border: rgba(245, 241, 232, 0.08);
    --gdc-auth-text: #F5F1E8;
    --gdc-auth-text-muted: rgba(245, 241, 232, 0.6);
    --gdc-auth-brand: #F5A524;
    --gdc-auth-panel-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  }

  html,
  html[data-theme],
  html[data-theme] body {
    background-color: var(--gdc-auth-bg) !important;
  }

  .template-minimal {
    background-color: var(--gdc-auth-bg) !important;
    display: flex !important;
    align-items: stretch !important;
    justify-content: stretch !important;
    padding: 0 !important;
    margin: 0 !important;
    min-height: 100dvh !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  }

  .template-minimal > * {
    width: 100% !important;
    max-width: none !important;
    min-height: 100dvh !important;
    margin: 0 !important;
  }

  .gdc-auth-panel {
    --theme-elevation-150: var(--gdc-auth-border);
    --theme-elevation-500: var(--gdc-auth-text-muted);
    --theme-elevation-800: var(--gdc-auth-text);
    --theme-bg: transparent;
    --theme-input-bg: rgba(255, 255, 255, 0.03);
    --theme-text: var(--gdc-auth-text);
  }

  .gdc-auth-panel .field-type,
  .gdc-auth-panel [class*="field-type"],
  .gdc-auth-panel [class*="text_"],
  .gdc-auth-panel [class*="email_"],
  .gdc-auth-panel [class*="password_"],
  .gdc-auth-panel [class*="fieldType"] {
    box-shadow: none !important;
    margin: 0 0 8px !important;
  }

  .gdc-auth-shell {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(440px, 520px);
    width: 100%;
    min-height: 100dvh;
    background: var(--gdc-auth-surface);
    border: none;
    border-radius: 0;
    overflow: clip;
    box-shadow: none;
  }

  @media (max-width: 1200px) {
    .gdc-auth-shell {
      grid-template-columns: minmax(0, 1fr) minmax(380px, 460px);
    }
  }

  .gdc-auth-hero {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: clamp(28px, 4vw, 48px);
  }

  @media (max-width: 900px) {
    .gdc-auth-hero {
      display: none;
    }
  }

  .gdc-auth-hero__media {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .gdc-auth-hero__media img {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }

  .gdc-auth-hero__veil {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(11,18,12,0.95) 0%, rgba(11,18,12,0.4) 50%, rgba(11,18,12,0.1) 100%);
  }

  .gdc-auth-hero__content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 480px;
  }

  .gdc-auth-hero__eyebrow {
    width: fit-content;
    margin: 0;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(245, 165, 36, 0.15);
    border: 1px solid rgba(245, 165, 36, 0.3);
    color: #fff;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 700;
  }

  .gdc-auth-hero__title {
    margin: 0;
    font-size: 40px;
    line-height: 1.05;
    font-weight: 700;
    letter-spacing: -0.04em;
  }

  .gdc-auth-hero__description {
    margin: 0;
    color: rgba(255,255,255,0.84);
    font-size: 16px;
    line-height: 1.7;
    max-width: 38rem;
  }

  .gdc-auth-hero__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .gdc-auth-hero__chip {
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.85);
    font-size: 12px;
  }

  .gdc-auth-hero__features {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .gdc-auth-hero__feature {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(255,255,255,0.86);
    font-size: 14px;
    line-height: 1.6;
  }

  .gdc-auth-hero__feature::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--gdc-auth-brand);
    box-shadow: 0 0 0 4px rgba(245, 165, 36, 0.18);
    flex-shrink: 0;
  }

  .gdc-auth-panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: clamp(20px, 3.5vw, 44px);
    background: transparent;
    min-height: 100dvh;
    max-height: none;
    overflow-y: auto;
    border-left: 1px solid var(--gdc-auth-border);
  }

  .gdc-auth-form,
  .gdc-auth-panel .create-first-user {
    width: 100%;
    max-width: 460px;
    margin-inline: auto;
  }

  @media (max-width: 900px) {
    .gdc-auth-shell {
      grid-template-columns: 1fr;
      min-height: 100dvh;
    }

    .gdc-auth-panel {
      border-left: none;
      min-height: 100dvh;
      padding: 24px 18px;
    }

    .gdc-auth-form,
    .gdc-auth-panel .create-first-user {
      max-width: 520px;
    }
  }

  .gdc-auth-panel > * {
    width: 100%;
  }

  .gdc-auth-panel__brand {
    display: flex;
    justify-content: center;
    margin-bottom: 40px;
  }

  .gdc-auth-form__intro {
    margin-bottom: 32px;
  }
  .gdc-auth-form__intro h2 {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--gdc-auth-text);
  }
  .gdc-auth-form__intro p {
    margin: 0;
    font-size: 15px;
    color: var(--gdc-auth-text-muted);
  }

  .gdc-auth-form__footer {
    margin-top: 16px;
    margin-bottom: 24px;
  }
  .gdc-auth-form__footer a {
    color: var(--gdc-auth-brand);
    font-size: 14px;
    text-decoration: none;
    font-weight: 500;
  }
  .gdc-auth-form__footer a:hover {
    text-decoration: underline;
  }

  .gdc-auth-panel .create-first-user h1 {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 700;
    color: var(--gdc-auth-text);
  }
  .gdc-auth-panel .create-first-user > p {
    margin: 0 0 24px;
    color: var(--gdc-auth-text-muted);
    font-size: 14px;
  }

  .gdc-auth-form button[type="submit"],
  .gdc-auth-panel .create-first-user button[type="submit"] {
    width: 100%;
    padding: 12px;
    background: var(--gdc-auth-brand) !important;
    color: #0b120c !important;
    border: none !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    cursor: pointer;
    transition: background 0.2s ease !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .gdc-auth-form button[type="submit"]:hover,
  .gdc-auth-panel .create-first-user button[type="submit"]:hover {
    background: #fff !important;
  }
`;

export default function AdminAuthShell({ children, mode = "login" }: { children: ReactNode; mode?: "login" | "first-user" }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_STYLES }} />
      <div className="gdc-auth-shell">
        {/* Left Hero */}
        <div className="gdc-auth-hero">
          <div className="gdc-auth-hero__media">
            <Image src={AUTH_IMAGE} alt="Grand Duta City" fill priority />
            <div className="gdc-auth-hero__veil" />
          </div>
          <div className="gdc-auth-hero__content">
            <p className="gdc-auth-hero__eyebrow">Sistem Manajemen Konten</p>
            <h1 className="gdc-auth-hero__title">Membangun Kota<br/>Masa Depan</h1>
            <p className="gdc-auth-hero__description">
              Pusat kendali konten Grand Duta City. Akses ini dikhususkan bagi
              administrator dan tim pemasaran.
            </p>
            <div className="gdc-auth-hero__chips">
              <span className="gdc-auth-hero__chip">Cluster Ladera</span>
              <span className="gdc-auth-hero__chip">Cluster Cascada</span>
              <span className="gdc-auth-hero__chip">200 Hektar</span>
            </div>
            <ul className="gdc-auth-hero__features">
              <li className="gdc-auth-hero__feature">Kelola artikel dan kampanye pemasaran</li>
              <li className="gdc-auth-hero__feature">Pembaruan siteplan dan daftar stok real-time</li>
              <li className="gdc-auth-hero__feature">Akses aman dengan enkripsi terkini</li>
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="gdc-auth-panel">
          {children}
        </div>
      </div>
    </>
  );
}
