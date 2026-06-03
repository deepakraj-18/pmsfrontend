import React, { useState } from 'react';
import { Logo } from '@/components/core/Logo';
import './auth.scss';
import { Button } from 'primereact/button';

export function LoginPage() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleMSLogin = () => {
    setIsClicked(true);
    const tenant = import.meta.env.VITE_AZURE_TENANT_ID;
    const client = import.meta.env.VITE_AZURE_CLIENT_ID;
    const redirect = import.meta.env.VITE_AZURE_REDIRECT_URI;

    const scope = 'openid profile email User.Read';
    const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${client}&response_type=code&redirect_uri=${encodeURIComponent(redirect)}&response_mode=query&scope=${encodeURIComponent(scope)}`;

    setTimeout(() => {
      window.location.href = authUrl;
    }, 300);
  };

  return (
    <div className="auth-wrapper">

      <div className="auth-orb-1" />
      <div className="auth-orb-2" />
      <div className="auth-orb-3" />

      <div className="auth-grid" />

      <div className="auth-card-container">
        <div className="auth-card">

          <div className="auth-glow-line" />

          { }
          <div className="auth-logo-section">
            <div className="auth-logo-icon-box">
              <Logo className="h-[38px] text-white" showText={true} />
            </div>
            <div className="auth-brand-tag">Enterprise Edition</div>
          </div>

          { }
          <div className="auth-title-block">
            <h1 className="auth-title">PMS Portal</h1>
            <p className="auth-subtitle">Project Management System — Sign in to continue</p>
          </div>

          { }
          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">ENTERPRISE SSO</span>
            <div className="auth-divider-line" />
          </div>

          { }
          <Button unstyled onClick={handleMSLogin}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={isClicked}
            className="auth-ms-btn"
          >
            {isClicked ? (
              <div className="auth-ms-btn-spinner" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
            )}
            <span className="auth-ms-btn-text">
              {isClicked ? 'Redirecting to Microsoft…' : 'Sign in with Microsoft'}
            </span>
          </Button>

          { }
          <div className="auth-security-badge">
            <div className="auth-security-dot" />
            <span>256-bit encrypted · Enterprise SSO</span>
          </div>

          { }
          <div className="auth-pills">
            {['Project Tracking', 'Time Management', 'Team Reports'].map((label) => (
              <div key={label} className="auth-pill">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path
                    d="M8 1L10 5.5L15 6.2L11.5 9.5L12.4 14.5L8 12.2L3.6 14.5L4.5 9.5L1 6.2L6 5.5L8 1Z"
                    fill="url(#starGrad)"
                  />
                  <defs>
                    <linearGradient id="starGrad" x1="1" y1="8" x2="15" y2="8" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#0CD1C3" />
                      <stop offset="1" stopColor="#B3F57B" />
                    </linearGradient>
                  </defs>
                </svg>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        { }
        <p className="auth-footer">
          TechnoRUCS © 2026 · All Rights Reserved
        </p>
      </div>
    </div>
  );
}
