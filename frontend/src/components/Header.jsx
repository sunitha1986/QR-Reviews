import React, { useState } from 'react';
import { Sun, Moon, Menu, RefreshCw, QrCode, UserPlus, ScanLine } from 'lucide-react';
import sidebarLogo from '../assets/sidebar_logo.png';
import headerWaveBanner from '../assets/header_wave_banner.jpg';

export default function Header({ user, activeTab, theme, onToggleTheme, onToggleMobileMenu, onRefresh, onNavigate, onOpenQuickScanner }) {
  const isSuperAdmin = user?.role === 'superadmin';
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await Promise.resolve(onRefresh());
      }
      window.dispatchEvent(new CustomEvent('app:refresh'));
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 700);
    }
  };

  return (
    <header className="top-bar">
      {/* Background Banner Graphic (Loaded once, cached across every page) */}
      <img
        src={headerWaveBanner}
        alt=""
        aria-hidden="true"
        className="header-wave-banner"
      />

      {/* Desktop Header Content - Constant Branding */}
      <div className="desktop-header-content">
        <div className="header-brand-constant">
          <div className="header-brand-icon">
            <img src={sidebarLogo} alt="QR Reviews Logo" className="header-brand-logo-img" />
          </div>
          <div className="header-brand-titles">
            <h2 className="header-brand-name">QR Reviews</h2>
            <p className="header-brand-tagline">Turn QR scans into Trusted reviews</p>
          </div>
        </div>

        <div className="top-actions">
          {/* Quick Action Navigation for Super Admin */}
          {isSuperAdmin && onNavigate && (
            <div className="header-quick-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '4px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm header-nav-btn"
                onClick={() => onNavigate('new-qr')}
                title="Create and manage dynamic QR codes"
                id="btn-header-new-qr"
              >
                <QrCode size={14} style={{ color: '#8B5CF6' }} />
                <span>+ Generate QR</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm header-nav-btn"
                onClick={() => onNavigate('onboard')}
                title="Integrate dynamic QR code with new client"
                id="btn-header-onboard"
              >
                <UserPlus size={14} />
                <span>+ Onboard Client</span>
              </button>
            </div>
          )}

          {/* Quick Scanner Action Button */}
          {onOpenQuickScanner && (
            <button
              type="button"
              className="btn btn-secondary btn-sm header-action-btn header-scan-btn"
              onClick={onOpenQuickScanner}
              title="Quick QR Standee Scanner (Beep & Instant Review)"
              id="btn-header-quick-scan"
              aria-label="Scan QR Standee"
            >
              <ScanLine size={15} style={{ color: '#10B981' }} />
              <span className="desktop-only-inline" style={{ fontSize: '0.78rem' }}>Scan QR</span>
            </button>
          )}

          {/* Refresh Action Button */}
          <button
            type="button"
            className="btn btn-secondary btn-sm header-action-btn"
            onClick={handleRefresh}
            title="Refresh Data"
            id="btn-header-refresh"
            disabled={isRefreshing}
            aria-label="Refresh data"
          >
            <RefreshCw
              size={15}
              className={isRefreshing ? 'spin-refresh' : ''}
              style={{ color: '#8B5CF6' }}
            />
          </button>

          {/* Global Dark / Light Mode Toggle */}
          <button
            type="button"
            className="btn btn-secondary btn-sm header-action-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            id="btn-header-theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={16} className="theme-toggle-icon sun-icon" />
            ) : (
              <Moon size={16} className="theme-toggle-icon moon-icon" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Header Bar matching Constant Branding */}
      <div className="mobile-header-content">
        <div className="mobile-brand-group">
          <div className="mobile-brand-icon">
            <img src={sidebarLogo} alt="QR Reviews Logo" className="brand-logo-img" />
          </div>
          <div className="mobile-brand-titles">
            <h1 className="mobile-brand-name">QR Reviews</h1>
            <p className="mobile-brand-tagline">Turn QR scans into Trusted reviews</p>
          </div>
        </div>

        <div className="mobile-header-actions">
          {isSuperAdmin && onNavigate && (
            <>
              <button
                type="button"
                className="mobile-header-icon-btn btn-new-qr-icon"
                onClick={() => onNavigate('new-qr')}
                title="Generate QR"
                aria-label="Generate QR"
                id="btn-mobile-new-qr"
              >
                <QrCode size={16} style={{ color: '#A78BFA' }} />
              </button>

              <button
                type="button"
                className="mobile-header-icon-btn btn-onboard-icon"
                onClick={() => onNavigate('onboard')}
                title="Onboard Client"
                aria-label="Onboard Client"
                id="btn-mobile-onboard"
              >
                <UserPlus size={16} style={{ color: '#38BDF8' }} />
              </button>
            </>
          )}

          {onOpenQuickScanner && (
            <button
              type="button"
              className="mobile-header-icon-btn btn-scan-icon"
              onClick={onOpenQuickScanner}
              title="Scan QR Standee"
              aria-label="Scan QR Standee"
              id="btn-mobile-quick-scan"
            >
              <ScanLine size={16} style={{ color: '#34D399' }} />
            </button>
          )}

          <button
            type="button"
            className="mobile-header-icon-btn btn-refresh-icon"
            onClick={handleRefresh}
            title="Refresh Data"
            disabled={isRefreshing}
            aria-label="Refresh data"
            id="btn-mobile-refresh"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? 'spin-refresh' : ''}
              style={{ color: '#818CF8' }}
            />
          </button>

          <button
            type="button"
            className="mobile-header-icon-btn btn-theme-icon"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
            id="btn-mobile-theme-toggle"
          >
            {theme === 'dark' ? (
              <Sun size={17} className="theme-toggle-icon sun-icon" style={{ color: '#F59E0B' }} />
            ) : (
              <Moon size={17} className="theme-toggle-icon moon-icon" style={{ color: '#6366F1' }} />
            )}
          </button>

          <button
            type="button"
            className="mobile-header-icon-btn mobile-hamburger-btn"
            onClick={onToggleMobileMenu}
            title="Open Menu"
            id="btn-mobile-hamburger"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
