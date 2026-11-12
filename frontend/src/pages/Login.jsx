import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import sidebarLogo from '../assets/sidebar_logo.png';
import loginWaveBg from '../assets/login_wave_bg.jpg';
import Footer from '../components/Footer';
import config from '../config';
import { cleanPhoneNumber } from '../utils/phone';

export default function Login({ onLoginSuccess, onDirectCustomerScan, theme = 'light', onToggleTheme, onBackToLanding }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUsernameChange = (e) => {
    const raw = e.target.value;
    // If user is typing or pasting numbers, limit strictly to 10 digits
    if (/^[\d\s+\-()]*$/.test(raw)) {
      const digits = raw.replace(/\D/g, '').slice(0, 10);
      setUsername(digits);
    } else {
      setUsername(raw);
    }
  };

  const handleUsernamePaste = (e) => {
    const pasted = e.clipboardData.getData('text');
    const cleaned = cleanPhoneNumber(pasted);
    if (cleaned && /^\d+$/.test(cleaned)) {
      e.preventDefault();
      setUsername(cleaned.slice(0, 10));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both your registered phone number and password.');
      return;
    }

    const targetUsername = cleanPhoneNumber(username) || username.trim();

    if (/^\d+$/.test(targetUsername) && targetUsername.length !== 10) {
      setError('Registered phone number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${config.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUsername, password })
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
            <h2 className="login-hero-img-heading">QR Reviews Portal</h2>
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
          {/* Top Bar with Back to Landing & Theme Toggle */}
          <div className="login-panel-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {onBackToLanding ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onBackToLanding}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '6px 12px' }}
                title="Return to Home Landing Page"
              >
                <ArrowLeft size={14} />
                <span>Back to Home</span>
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
                  <>
                    <Sun size={13} style={{ color: '#FBBF24' }} />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon size={13} style={{ color: '#6366F1' }} />
                    <span>Dark</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Form Heading */}
          <div className="login-panel-header">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">
              Sign in with your registered phone number
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="login-error-alert">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
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
                {/^\d+$/.test(username) && (
                  <span className="login-digit-counter" style={{ color: username.length === 10 ? 'var(--success, #10B981)' : 'var(--text-muted)' }}>
                    {username.length}/10 digits
                  </span>
                )}
              </div>
              <div className="login-input-wrapper">
                <Phone size={15} className="login-input-icon" />
                <span className="login-phone-prefix">+91</span>
                <input
                  id="input-username"
                  type="tel"
                  className="login-input-field login-input-field-phone"
                  value={username}
                  onChange={handleUsernameChange}
                  onPaste={handleUsernamePaste}
                  placeholder="98765 43210"
                  maxLength={/^\d*$/.test(username) ? 10 : 50}
                  autoComplete="username"
                  required
                />
              </div>
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
