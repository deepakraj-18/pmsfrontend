import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/core/Logo';
import './auth.scss';
import { authService, getAuthErrorMessage } from '@/api/services/auth.service';
import { PASSWORD_POLICY, ROUTES } from '@/constants/constants';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!firstName.trim()) return 'First name is required.';
    if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
    if (password.length < PASSWORD_POLICY.MIN_LENGTH)
      return `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters.`;
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
      return 'Password must contain at least one letter and one number.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const message = await authService.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      });
      setDoneMessage(message);
    } catch (err: any) {
      setError(getAuthErrorMessage(err, 'Registration failed. Please try again.'));
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

          {doneMessage ? (
            <>
              <div className="auth-title-block">
                <h1 className="auth-title">Request received</h1>
                <p className="auth-subtitle">{doneMessage}</p>
              </div>
              <Link to={ROUTES.LOGIN} className="auth-submit-btn auth-submit-link">
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <div className="auth-title-block">
                <h1 className="auth-title">Create account</h1>
              </div>

              <form className="auth-form auth-form-spaced" onSubmit={handleSubmit} noValidate>
                <div className="auth-field-row">
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-first">First name</label>
                    <input id="reg-first" className="auth-input" autoComplete="given-name"
                      value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100} required />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reg-last">Last name</label>
                    <input id="reg-last" className="auth-input" autoComplete="family-name"
                      value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-email">Email</label>
                  <input id="reg-email" className="auth-input" type="email" autoComplete="email"
                    placeholder="you@company.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-password">Password</label>
                  <div className="auth-input-wrap">
                    <input id="reg-password" className="auth-input"
                      type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                      maxLength={PASSWORD_POLICY.MAX_LENGTH}
                      value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" className="auth-input-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <span className="auth-hint">
                    At least {PASSWORD_POLICY.MIN_LENGTH} characters, with a letter and a number.
                  </span>
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-confirm">Confirm password</label>
                  <input id="reg-confirm" className="auth-input"
                    type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                </div>

                <div className="auth-form-error" role="alert" aria-live="polite">
                  {error}
                </div>

                <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? <div className="auth-ms-btn-spinner" /> : 'Request access'}
                </button>
              </form>

              <p className="auth-switch">
                Already have an account? <Link to={ROUTES.LOGIN}>Sign in</Link>
              </p>
            </>
          )}
        </div>

        <p className="auth-footer">Techspear © 2026 · All Rights Reserved</p>
      </div>
    </div>
  );
}
