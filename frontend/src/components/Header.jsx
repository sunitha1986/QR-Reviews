import React, { useState } from 'react';
import { ShieldCheck, Store, Sun, Moon, Menu, RefreshCw, QrCode, UserPlus } from 'lucide-react';
import sidebarLogo from '../assets/sidebar_logo.png';
import headerWaveBanner from '../assets/header_wave_banner.jpg';

export default function Header({ user, activeTab, theme, onToggleTheme, onToggleMobileMenu, onRefresh, onNavigate }) {
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

  const tabTitles = {
    'dashboard': {
      title: 'Dashboard Overview',
      subtitle: 'Real-time platform metrics, active standees and customer review performance'
    },
    'new-qr': {
      title: 'New QR Generation',
      subtitle: 'Create and manage dynamic QR codes for your clients'
    },
    'onboard': {
      title: 'Onboarding Client',
      subtitle: 'Integrate dynamic QR codes with business name, phone number, and address'
    },
    'clients': {
      title: 'All Clients',
      subtitle: 'View all onboarded businesses, assigned QR codes, and real-time review statistics'
    },
    'categories': {
      title: 'Business Categories',
      subtitle: 'Manage dynamic commercial categories, review templates, and business classifications'
    },
    'analytics': {
      title: 'Performance Analytics',
      subtitle: 'In-depth customer review analytics, scan activity, and growth metrics'
    },
    'settings': {
      title: 'System Settings',
      subtitle: 'Platform preferences, security credentials, and portal configurations'
    },
    'profile': {
      title: 'Business Profile',
      subtitle: 'Manage your business information and your assigned dynamic QR standee'
    },
    'keywords': {
      title: 'Review Keywords & Highlights',
      subtitle: 'Customize business keywords and specialties to generate high-converting customer reviews'
    },
    'customer-data': {
      title: 'Customer Data & Feedback',
      subtitle: 'Review customer submissions, sentiment, and export data directly to Excel sheets'
    }
  };

  const currentInfo = tabTitles[activeTab] || {
    title: 'Dashboard',
    subtitle: 'QR-Reviews Management'
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

      {/* Desktop Header Content */}
      <div className="desktop-header-content">
        <div className="page-info">
          <h2>{currentInfo.title}</h2>
          <p>{currentInfo.subtitle}</p>
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
              <Sun size={15} style={{ color: '#FBBF24' }} />
            ) : (
              <Moon size={15} style={{ color: '#6366F1' }} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Header Bar matching Mockup */}
      <div className="mobile-header-content">
        <div className="mobile-brand-group">
          <div className="mobile-brand-icon">
            <img src={sidebarLogo} alt="QR-Reviews Logo" className="brand-logo-img" />
          </div>
          <div className="mobile-brand-titles">
            <h1 className="mobile-brand-name">QR-Reviews</h1>
            <p className="mobile-brand-role">{isSuperAdmin ? 'SUPERADMIN PORTAL' : 'ADMIN PORTAL'}</p>
          </div>
        </div>

        <div className="mobile-header-actions">
          {isSuperAdmin && onNavigate && (
            <>
              <button
                type="button"
                className="mobile-header-icon-btn"
                onClick={() => onNavigate('new-qr')}
                title="Generate QR"
                aria-label="Generate QR"
                id="btn-mobile-new-qr"
              >
                <QrCode size={16} style={{ color: '#8B5CF6' }} />
              </button>

              <button
                type="button"
                className="mobile-header-icon-btn"
                onClick={() => onNavigate('onboard')}
                title="Onboard Client"
                aria-label="Onboard Client"
                id="btn-mobile-onboard"
              >
                <UserPlus size={16} style={{ color: '#38BDF8' }} />
              </button>
            </>
          )}

          <button
            type="button"
            className="mobile-header-icon-btn"
            onClick={handleRefresh}
            title="Refresh Data"
            disabled={isRefreshing}
            aria-label="Refresh data"
            id="btn-mobile-refresh"
          >
            <RefreshCw
              size={17}
              className={isRefreshing ? 'spin-refresh' : ''}
              style={{ color: '#8B5CF6' }}
            />
          </button>

          <button
            type="button"
            className="mobile-header-icon-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} style={{ color: '#FBBF24' }} /> : <Moon size={18} style={{ color: '#6366F1' }} />}
          </button>

          <button
            type="button"
            className="mobile-header-icon-btn mobile-hamburger-btn"
            onClick={onToggleMobileMenu}
            title="Open Menu"
            id="btn-mobile-hamburger"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}
