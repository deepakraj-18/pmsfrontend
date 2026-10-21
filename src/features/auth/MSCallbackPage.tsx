import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import { useAuth } from '@/auth/AuthProvider';
import './auth.scss';
import { Button } from 'primereact/button';
import { TechspearLoader } from '@/components/feedback/TechspearLoader';

export function MSCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Microsoft's authorization `code` is single-use — exchanging it twice gets the second
  // call rejected (400 invalid_grant) by Microsoft's token endpoint, even though the first
  // call already succeeded. This page's effect has no inherent guarantee it only runs once
  // per real navigation (StrictMode double-invoke in dev, a parent re-render remounting
  // this route, HMR, etc. can all trigger it twice), so guard explicitly rather than rely
  // on the effect firing exactly once.
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (exchangedRef.current) return;

    const code = searchParams.get('code');

    if (code) {
      exchangedRef.current = true;
      exchangeCode(code);
    } else {
      const errorDesc = searchParams.get('error_description');
      setError(errorDesc || 'No authorization code found in redirect URL.');
    }

  }, []);

  const exchangeCode = async (code: string) => {
    try {
      const redirect_uri = import.meta.env.VITE_AZURE_REDIRECT_URI ||
        (window.location.origin + '/redirect');

      const response = await api.post('/auth/redirect', {
        code,
        redirect_uri,
      }, { timeout: 30000 });

      if (response.data?.access_token) {
        // The exchange is often fast enough locally that the "Authenticating" loader would
        // never actually be seen before navigating away - same minimum-display-time idea as
        // the page-switch loader elsewhere.
        await Promise.all([
          login(response.data.access_token, response.data.refresh_token, response.data),
          new Promise((resolve) => setTimeout(resolve, 1200)),
        ]);
        navigate('/', { replace: true });
      } else {
        throw new Error('Invalid token response: access_token missing.');
      }
    } catch (err: any) {
      console.error('[SSO Callback Error]', err);
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (err.message || 'Token exchange failed');
      setError(message);
    }
  };

  if (error) {
    return (
      <div className="auth-wrapper">
        <div className="auth-error-card">
          <div className="auth-error-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="auth-error-title">Authentication Failed</h2>
          <p className="auth-error-message">{error}</p>
          <Button
            onClick={() => navigate('/login')}
            className="auth-retry-btn"
            label="← Return to Login"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <TechspearLoader fullScreen={false} label="Authenticating" />
    </div>
  );
}
