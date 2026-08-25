import type { ReactNode } from "react";
import AdminAuthLogo from "./AdminAuthLogo";

const AUTH_STYLES = `
  :root {
    --mum-auth-bg: #1B1411;
    --mum-auth-card: #271F1B;
    --mum-auth-border: rgba(255, 255, 255, 0.08);
    --mum-auth-text: #FFFFFF;
    --mum-auth-muted: #A89F93;
    --mum-input-bg: #E8EEF8;
    --mum-input-text: #1E293B;
    --mum-btn-primary: #38554D;
    --mum-btn-primary-hover: #45685E;
  }

  html,
  html[data-theme],
  html[data-theme] body {
    background-color: var(--mum-auth-bg) !important;
    color: var(--mum-auth-text) !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    margin: 0 !important;
    padding: 0 !important;
    min-height: 100vh !important;
  }

  .template-minimal {
    background-color: var(--mum-auth-bg) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 24px 16px !important;
    margin: 0 !important;
    min-height: 100vh !important;
  }

  .template-minimal > * {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
  }

  .mum-auth-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    background: radial-gradient(circle at 50% 30%, #291E19 0%, #17110E 100%);
    box-sizing: border-box;
    width: 100%;
  }

  .mum-auth-header {
    margin-bottom: 28px;
    text-align: center;
  }

  .mum-auth-card {
    width: 100%;
    max-width: 470px;
    background: var(--mum-auth-card);
    border: 1px solid var(--mum-auth-border);
    border-radius: 24px;
    padding: 38px 40px 32px;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.45);
    box-sizing: border-box;
  }

  .mum-auth-card__title {
    color: #FFFFFF;
    font-size: 24px;
    font-weight: 700;
    text-align: center;
    margin: 0 0 26px 0;
    letter-spacing: -0.02em;
  }

  .mum-auth-footer {
    margin-top: 36px;
    text-align: center;
    color: #7B7266;
    font-size: 13px;
    font-weight: 500;
  }

  /* Override Payload CMS Form & Inputs inside Auth Card */
  .mum-auth-card .field-type,
  .mum-auth-card [class*="field-type"],
  .mum-auth-card [class*="fieldType"] {
    margin-bottom: 18px !important;
  }

  .mum-auth-card label,
  .mum-auth-card .field-label {
    color: #C8BFB2 !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    margin-bottom: 8px !important;
    display: block !important;
  }

  .mum-auth-card input[type="text"],
  .mum-auth-card input[type="email"],
  .mum-auth-card input[type="password"] {
    background-color: var(--mum-input-bg) !important;
    color: var(--mum-input-text) !important;
    border: none !important;
    border-radius: 14px !important;
    height: 48px !important;
    padding: 0 16px !important;
    font-size: 15px !important;
    width: 100% !important;
    box-sizing: border-box !important;
    outline: none !important;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05) !important;
    transition: all 0.2s ease !important;
  }

  .mum-auth-card input[type="text"]:focus,
  .mum-auth-card input[type="email"]:focus,
  .mum-auth-card input[type="password"]:focus {
    box-shadow: 0 0 0 2px #E28743 !important;
    background-color: #FFFFFF !important;
  }

  .mum-auth-card button[type="submit"],
  .mum-auth-card .btn--size-large {
    width: 100% !important;
    height: 48px !important;
    border-radius: 14px !important;
    background: var(--mum-btn-primary) !important;
    color: #FFFFFF !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    border: none !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: background-color 0.2s ease, transform 0.1s ease !important;
    margin-top: 10px !important;
    text-transform: none !important;
    letter-spacing: normal !important;
  }

  .mum-auth-card button[type="submit"]:hover,
  .mum-auth-card .btn--size-large:hover {
    background: var(--mum-btn-primary-hover) !important;
    transform: translateY(-1px);
  }

  .mum-auth-card button[type="submit"]:active,
  .mum-auth-card .btn--size-large:active {
    transform: translateY(0);
  }

  .mum-auth-card a {
    color: #A89F93 !important;
    text-decoration: none !important;
    font-size: 13px !important;
  }

  .mum-auth-card a:hover {
    color: #E28743 !important;
    text-decoration: underline !important;
  }

  /* Layout form auth (dipakai AdminLoginForm & AdminCreateFirstUserForm) */
  .mum-auth-form,
  .gdc-auth-form {
    display: flex;
    flex-direction: column;
  }

  .mum-auth-form__fields,
  .gdc-auth-form__fields {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* Variabel warna untuk komponen field auth (mis. toggle password) */
  .mum-auth-card {
    --gdc-auth-text: #FFFFFF;
    --gdc-auth-text-muted: #A89F93;
  }
`;

type AdminAuthShellProps = {
  children: ReactNode;
  mode?: "login" | "first-user";
};

export default function AdminAuthShell({ children, mode = "login" }: AdminAuthShellProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_STYLES }} />
      <div className="mum-auth-container">
        {/* Top Logo */}
        <div className="mum-auth-header">
          <AdminAuthLogo variant="brand-bubble" />
        </div>

        {/* Login / Auth Card */}
        <div className="mum-auth-card">
          <h1 className="mum-auth-card__title">
            {mode === "first-user" ? "Buat Akun Admin Pertama" : "Masuk ke Dashboard"}
          </h1>
          {children}
        </div>

        {/* Footer */}
        <div className="mum-auth-footer">
          &copy; 2026 Grand Duta City Parung. Admin Area.
        </div>
      </div>
    </>
  );
}
