import React, { useState, useEffect } from 'react';
import {
  Lock,
  Phone,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sun,
  Moon,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Home,
  Check
} from 'lucide-react';
import sidebarLogo from '../assets/sidebar_logo.png';
import loginWaveBg from '../assets/login_wave_bg.jpg';
import Footer from '../components/Footer';
import config from '../config';
import { cleanPhoneNumber } from '../utils/phone';
import { applyColorTheme } from '../utils/colorThemes';

export default function Login({ onLoginSuccess, onDirectCustomerScan, theme = 'light', onToggleTheme, onBackToLanding }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Prevent any document scrollbar and ensure default branding colors while Login screen is mounted
  useEffect(() => {
    applyColorTheme('royal-violet');
    document.body.classList.add('login-page-active');
    document.documentElement.classList.add('login-page-active');
    return () => {
      document.body.classList.remove('login-page-active');
      document.documentElement.classList.remove('login-page-active');
    };
  }, []);

  const handlePhoneKeyDown = (e) => {
    // Allow navigational and control keys
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) ||
      ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z', 'A', 'C', 'V', 'X', 'Z'].includes(e.key))
    ) {
      return;
    }

    // Only allow numeric key strokes 0-9 via regex
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setPhoneError('Only numbers (0-9) are allowed in the phone field.');
      return;
    }

    // Indian mobile numbers must start with 6, 7, 8, or 9
    const input = e.target;
    const isFirstDigit = (input.selectionStart === 0 && (username.length === 0 || input.selectionEnd === username.length));
    if (isFirstDigit && /^[0-5]$/.test(e.key)) {
      e.preventDefault();
      setPhoneError('Indian mobile numbers must start with 6, 7, 8, or 9.');
      return;
    }

    if (phoneError) {
      setPhoneError('');
    }
  };

  const handleUsernameChange = (e) => {
    const raw = e.target.value;

    // Detect if user attempted to type or paste letters or special characters
    if (/\D/.test(raw)) {
      setPhoneError('Only numbers (0-9) are allowed. Special characters and letters are not permitted.');
    }

    // Extract strictly numbers, limited to 10 digits
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    setUsername(digits);

    if (digits.length > 0 && !/^[6-9]/.test(digits)) {
      setPhoneError('Indian mobile numbers must start with 6, 7, 8, or 9.');
    } else if (digits.length === 10) {
      setPhoneError('');
      if (error && (error.includes('phone') || error.includes('Invalid'))) {
        setError('');
      }
    } else if (phoneError && (phoneError.includes('Only numbers') || phoneError.includes('Indian mobile numbers'))) {
      setPhoneError('');
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    const clean = username.trim();
    if (!clean) {
      setPhoneError('Please enter your 10-digit registered Indian phone number.');
    } else if (!/^\d+$/.test(clean)) {
      setPhoneError('Phone number must contain only numbers (0-9).');
    } else if (!/^[6-9]/.test(clean)) {
      setPhoneError('Indian mobile numbers must start with 6, 7, 8, or 9.');
    } else if (clean.length < 10) {
      setPhoneError(`Phone number must be exactly 10 digits (${clean.length}/10 entered).`);
    } else {
      setPhoneError('');
    }
  };

  const handleUsernamePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const cleaned = cleanPhoneNumber(pasted) || pasted.replace(/\D/g, '');
    if (!cleaned) {
      setPhoneError('Pasted text contains no valid numbers. Please enter a valid 10-digit Indian number.');
      return;
    }

    if (!/^[6-9]/.test(cleaned)) {
      setPhoneError('Invalid Indian number: Indian mobile numbers must start with 6, 7, 8, or 9.');
      setUsername(cleaned.slice(0, 10));
      return;
    }

    const digits = cleaned.slice(0, 10);
    setUsername(digits);
    if (digits.length === 10) {
      setPhoneError('');
      if (error) setError('');
    } else {
      setPhoneError(`Pasted number has ${digits.length}/10 digits.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = username.trim();

    if (!cleanPhone) {
      setPhoneError('Please enter your 10-digit registered Indian phone number.');
      return;
    }

    if (!/^\d+$/.test(cleanPhone)) {
      setPhoneError('Phone number must contain only numbers (0-9).');
      return;
    }

    if (!/^[6-9]/.test(cleanPhone)) {
      setPhoneError('Invalid Indian number: Indian mobile numbers must start with 6, 7, 8, or 9.');
      return;
    }

    if (cleanPhone.length !== 10) {
      setPhoneError(`Phone number must be exactly 10 digits (${cleanPhone.length}/10 entered).`);
      return;
    }

    if (!password) {
      setError('Please enter your password to continue.');
      return;
    }

    setLoading(true);
    setError('');
    setPhoneError('');

    try {
      const res = await fetch(`${config.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanPhone, password })
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        if (!res.ok) {
          throw new Error(`Server error (${res.status}): Please verify backend files are uploaded.`);
        }
        if (text.includes('iisnode') || text.includes('<html') || text.includes('<!DOCTYPE') || text.includes('<pre>')) {
          const match = text.match(/<pre>([\s\S]*?)<\/pre>/i) || text.match(/<p>([\s\S]*?)<\/p>/i);
          const detail = match ? match[1].replace(/<[^>]+>/g, '').trim() : '';
          throw new Error(detail ? `Server error: ${detail.slice(0, 160)}` : `Server returned an HTML error page (${res.status}).`);
        }
        throw new Error('Unexpected server response format.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Unable to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Full-Viewport Wavy Ambient Background */}
      <div className="login-wavy-backdrop" aria-hidden="true">
        <img src={loginWaveBg} alt="" className="login-wavy-img" />
        <div className="login-wavy-overlay" />
      </div>

      {/* Ambient Glowing Purple Orbs */}
      <div className="login-ambient-orb login-ambient-orb-1" aria-hidden="true" />
      <div className="login-ambient-orb login-ambient-orb-2" aria-hidden="true" />

      <div className="login-card login-split-card fade-in">
        {/* Left Column: Brand Showcase with Sidebar Logo */}
        <div className="login-hero-showcase">
          <div className="login-hero-showcase-header">
            <div className="login-hero-title-row">
              {/* Mobile Home Button */}
              {onBackToLanding && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm login-back-btn mobile-only-inline-flex"
                  onClick={onBackToLanding}
                  title="Return to Home Landing Page"
                >
                  <Home size={15} />
                </button>
              )}

              <h2 className="login-hero-img-heading">QR Reviews Portal</h2>

              {/* Mobile Theme Toggle Button */}
              {onToggleTheme && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm login-theme-toggle-btn mobile-only-inline-flex"
                  onClick={onToggleTheme}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  id="btn-login-theme-toggle-mobile"
                >
                  {theme === 'dark' ? (
                    <Sun size={16} className="theme-toggle-icon sun-icon" />
                  ) : (
                    <Moon size={16} className="theme-toggle-icon moon-icon" />
                  )}
                </button>
              )}
            </div>

            <p className="login-hero-img-tagline">
              <span>✦</span> Smart QR Reputation Platform <span>✦</span>
            </p>
          </div>

          <div className="login-hero-image-wrapper">
            <img
              src={sidebarLogo}
              alt="QR Reviews Logo"
              className="login-hero-image"
            />
          </div>
        </div>

        {/* Right Column: Portal Login Form */}
        <div className="login-form-panel">
          {/* Top Bar with Back to Landing & Theme Toggle (Desktop Only) */}
          <div className="login-panel-top desktop-only-flex">
            {onBackToLanding ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm login-back-btn"
                onClick={onBackToLanding}
                title="Return to Home Landing Page"
              >
                <Home size={15} />
                <span className="login-top-btn-label"></span>
              </button>
            ) : <div />}

            {onToggleTheme && (
              <button
                type="button"
                className="btn btn-secondary btn-sm login-theme-toggle-btn"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                id="btn-login-theme-toggle"
              >
                {theme === 'dark' ? (
                  <Sun size={16} className="theme-toggle-icon sun-icon" />
                ) : (
                  <Moon size={16} className="theme-toggle-icon moon-icon" />
                )}
              </button>
            )}
          </div>

          {/* Form Heading */}
          <div className="login-panel-header">
            <h1 className="login-title">Welcome</h1>
            <p className="login-subtitle">
              Sign in with your registered phone number
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="login-error-alert" role="alert" aria-live="assertive">
              <div className="login-error-icon-box">
                <AlertCircle size={18} className="login-error-icon" />
              </div>
              <span className="login-error-text">{error}</span>
            </div>
          )}

          {/* Primary Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Registered Phone Number */}
            <div className="form-group login-form-group">
              <div className="login-field-header">
                <label className="form-label" htmlFor="input-username">
                  Registered Phone Number
                </label>
                {username.length === 10 && !phoneError ? (
                  <span className="login-digit-counter valid" style={{ color: theme === 'light' ? '#059669' : '#10B981', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                    <Check size={12} />
                    <span>10/10 digits</span>
                  </span>
                ) : (
                  <span className="login-digit-counter" style={{ color: phoneError ? (theme === 'light' ? '#B91C1C' : '#FCA5A5') : 'var(--text-muted)', fontWeight: phoneError ? 700 : 500 }}>
                    {username.length}/10 digits
                  </span>
                )}
              </div>
              <div className={`login-input-wrapper ${phoneError ? 'has-error' : ''}`}>
                <Phone size={15} className="login-input-icon" />
                <span className="login-phone-prefix">+91</span>
                <input
                  id="input-username"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="login-input-field login-input-field-phone"
                  value={username}
                  onChange={handleUsernameChange}
                  onKeyDown={handlePhoneKeyDown}
                  onBlur={handlePhoneBlur}
                  onPaste={handleUsernamePaste}
                  placeholder="98765 43210"
                  maxLength={10}
                  autoComplete="tel"
                  aria-invalid={Boolean(phoneError)}
                  aria-describedby={phoneError ? 'phone-error-msg' : undefined}
                  required
                />
              </div>
              {phoneError && (
                <div className="login-field-inline-error" id="phone-error-msg" role="alert">
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  <span>{phoneError}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="form-group login-form-group login-form-group-password">
              <div className="login-field-header">
                <label className="form-label" htmlFor="input-password">
                  Password
                </label>
              </div>
              <div className="login-input-wrapper">
                <Lock size={15} className="login-input-icon" />
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-input-action"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Sign In CTA Button */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
              id="btn-login-submit"
            >
              {loading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>



          </form>
        </div>
      </div>

      {/* Login Screen Footer */}
      <Footer />
    </div>
  );
}
