"use client";

import {
  PasswordField,
} from "@payloadcms/ui";
import { type ComponentProps, useEffect, useRef, useState } from "react";

type CustomPasswordFieldProps = ComponentProps<typeof PasswordField>;

export default function CustomPasswordField(props: CustomPasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inputElement = wrapperRef.current?.querySelector<HTMLInputElement>(
      'input[type="password"], input[type="text"]',
    );
    if (inputElement) {
      inputElement.type = showPassword ? "text" : "password";
    }
  }, [showPassword]);

  return (
    <div ref={wrapperRef} className="custom-password-field">
      <div className="custom-password-field__wrapper">
        <PasswordField {...props} />
        <button
          type="button"
          className="custom-password-field__toggle"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            // Eye Open SVG
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            // Eye Closed SVG
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          )}
        </button>
      </div>
      <style jsx>{`
        .custom-password-field {
          position: relative;
        }

        .custom-password-field__wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .custom-password-field__wrapper :global(input[type="text"]),
        .custom-password-field__wrapper :global(input[type="password"]) {
          padding-right: 44px !important;
        }

        .custom-password-field__toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--gdc-auth-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s ease, background-color 0.2s ease;
          z-index: 10;
        }

        .custom-password-field__toggle:hover {
          color: var(--gdc-auth-text);
          background-color: rgba(255, 255, 255, 0.05);
        }

        .custom-password-field__toggle:active {
          background-color: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

