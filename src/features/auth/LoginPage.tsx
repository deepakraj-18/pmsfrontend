import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/core/Logo';
import './auth.scss';
import { Button } from 'primereact/button';
import { useAuth } from '@/auth/AuthProvider';
import { authService, getAuthErrorMessage } from '@/api/services/auth.service';
import { ROUTES } from '@/constants/constants';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isClicked, setIsClicked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await authService.login({ email: email.trim(), password });
      if (!result?.access_token) throw new Error('Invalid token response: access_token missing.');
      await login(result.access_token, result.refresh_token, result);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err: any) {
      setError(getAuthErrorMessage(err, 'Sign in failed. Please try again.'));
      setIsSubmitting(false);
    }
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

          <div className="auth-logo-section">
            <div className="auth-logo-icon-box">
              <Logo className="h-[38px] text-white" showText={true} />
            </div>
          </div>
          

          {/* <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">EXTERNAL USERS</span>
            <div className="auth-divider-line" />
          </div> */}

          <form className="auth-form" onSubmit={handlePasswordLogin} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="auth-input"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="login-password"
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div className="auth-divider">
            <div className="auth-divider-line" />
            {/* <span className="auth-divider-text">TEAM MEMBERS</span> */}
            <span className="auth-divider-text">Or</span>
            <div className="auth-divider-line" />
          </div>

          <Button unstyled onClick={handleMSLogin}
            disabled={isClicked || isSubmitting}
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

            <div className="auth-form-error" role="alert" aria-live="polite">
              {error}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting || isClicked || !email.trim() || !password}
            >
              {isSubmitting ? <div className="auth-ms-btn-spinner" /> : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            New external user? <Link to={ROUTES.REGISTER}>Create an account</Link>
          </p>
        </div>

        <p className="auth-footer">
          Techspear © 2026 · All Rights Reserved
        </p>
      </div>
    </div>
  );
}
