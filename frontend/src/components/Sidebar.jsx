import React, { useState, useEffect } from 'react';
import {
  QrCode,
  UserPlus,
  Users,
  Building2,
  MessageSquareText,
  LogOut,
  Tags,
  Sparkles,
  X,
  LucideHome,
  ChartColumn,
  SettingsIcon,
  MapPin,
  Palette,
  Check,
  CreditCard
} from 'lucide-react';
import sidebarLogo from '../assets/sidebar_logo.png';
import { formatPhoneNumber } from '../utils/phone';
import config, { getImageUrl } from '../config';
import { COLOR_THEMES, applyColorTheme, getSavedThemeId } from '../utils/colorThemes';

export default function Sidebar({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  isOpen,
  onClose,
  colorThemeId,
  onSelectColorTheme
}) {
  const isSuperAdmin = String(user?.role || '').toLowerCase().trim() === 'superadmin';
  const currentBusinessId = !isSuperAdmin
    ? (user?.clientId || user?.qrId || (user?.id ? String(user.id).replace('user-', '') : ''))
    : '';

  const [clientProfile, setClientProfile] = useState(null);
  const [localThemeId, setLocalThemeId] = useState(() => getSavedThemeId(currentBusinessId));
  const [showThemePicker, setShowThemePicker] = useState(true);

  // Fetch client details in admin flow to ensure real-time logo, name & location
  useEffect(() => {
    if (isSuperAdmin) return;
    const targetId = currentBusinessId;
    if (!targetId) return;

    let isMounted = true;
    fetch(`${config.API_BASE_URL}/api/clients/${encodeURIComponent(targetId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isMounted && data && (data.client || data.id)) {
          const profile = data.client || data;
          setClientProfile(profile);
          const businessTheme = profile.colorTheme || getSavedThemeId(profile.id);
          if (businessTheme) {
            setLocalThemeId(businessTheme);
            applyColorTheme(businessTheme, profile.id);
            if (onSelectColorTheme) {
              onSelectColorTheme(businessTheme, profile.id);
            }
          }
        }
      })
      .catch(err => console.warn('[Sidebar] Client profile fetch error:', err.message));

    return () => { isMounted = false; };
  }, [user, isSuperAdmin, currentBusinessId]);

  const currentThemeId = isSuperAdmin ? 'royal-violet' : (colorThemeId || localThemeId);
  const activeTheme = isSuperAdmin ? COLOR_THEMES[0] : (COLOR_THEMES.find(t => t.id === currentThemeId) || COLOR_THEMES[0]);

  const handleSelectTheme = (themeId) => {
    if (isSuperAdmin) return;
    setLocalThemeId(themeId);
    const targetBizId = clientProfile?.id || currentBusinessId;
    applyColorTheme(themeId, targetBizId);
    if (onSelectColorTheme) {
      onSelectColorTheme(themeId, targetBizId);
    }

    if (targetBizId) {
      fetch(`${config.API_BASE_URL}/api/clients/${encodeURIComponent(targetBizId)}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorTheme: themeId })
      }).catch(err => console.warn('[Sidebar] Theme save to backend error:', err.message));
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  // Resolve business branding in admin flow (uploaded logo, business name, and location)
  const displayLogo = !isSuperAdmin
    ? (clientProfile?.logoUrl || user?.logoUrl || '')
    : '';
  const displayName = !isSuperAdmin
    ? (clientProfile?.name || user?.name || 'My Business')
    : 'QR Reviews';
  const displayLocation = !isSuperAdmin
    ? (clientProfile?.businessLocation || clientProfile?.address || user?.businessLocation || user?.address || 'Admin Portal')
    : 'Super Admin Portal';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${isOpen ? 'mobile-open' : ''}`}
        style={{ background: activeTheme.gradient }}
      >
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className={`brand-icon-box ${!isSuperAdmin && displayLogo ? 'business-logo-box' : ''}`}>
            {displayLogo ? (
              <img
                src={getImageUrl(displayLogo)}
                alt={displayName}
                className="brand-logo-img business-logo-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = sidebarLogo;
                }}
              />
            ) : (
              <img src={sidebarLogo} alt="QR Reviews Logo" className="brand-logo-img" />
            )}
          </div>
          <div style={{ textAlign: 'center', minWidth: 0, width: '100%', padding: '0 4px' }}>
            <h1 className="brand-title business-brand-title" title={displayName}>
              {displayName}
            </h1>
            <p className="brand-subtitle business-location-subtitle" title={displayLocation}>
              {!isSuperAdmin && (
                <MapPin size={10} style={{ display: 'inline-block', marginRight: '3px', verticalAlign: '-1px', color: '#C4B5FD', flexShrink: 0 }} />
              )}
              <span className="location-text-truncate">{displayLocation}</span>
            </p>
          </div>
          {/* Close button visible only on mobile */}
          <button
            type="button"
            className="mobile-sidebar-close-btn"
            onClick={onClose}
            title="Close Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="sidebar-nav">
          {isSuperAdmin ? (
            <>
              <div
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('dashboard')}
                id="nav-dashboard"
              >
                <LucideHome size={19} />
                <span className="nav-text">Dashboard</span>
              </div>

              <div
                className={`nav-item ${activeTab === 'new-qr' ? 'active' : ''}`}
                onClick={() => handleNavClick('new-qr')}
                id="nav-new-qr"
              >
                <QrCode size={19} />
                <span className="nav-text">New QR Generation</span>
              </div>

              <div
                className={`nav-item ${activeTab === 'onboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('onboard')}
                id="nav-onboard-client"
              >
                <UserPlus size={19} />
                <span className="nav-text">Onboarding Client</span>
              </div>

              <div
                className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`}
                onClick={() => handleNavClick('clients')}
                id="nav-all-clients"
              >
                <Users size={19} />
                <span className="nav-text">All Clients</span>
              </div>

              <div
                className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => handleNavClick('categories')}
                id="nav-business-categories"
              >
                <Tags size={19} />
                <span className="nav-text">Business Categories</span>
              </div>
              <div
                className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => handleNavClick('analytics')}
                id="nav-business-analytics"
              >
                <ChartColumn size={19} />
                <span className="nav-text">Analytics</span>
              </div>
              <div
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleNavClick('settings')}
                id="nav-business-settings"
              >
                <SettingsIcon size={19} />
                <span className="nav-text">Settings</span>
              </div>

              <div
                className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
                onClick={() => handleNavClick('subscriptions')}
                id="nav-super-subscriptions"
              >
                <CreditCard size={19} />
                <span className="nav-text">Subscriptions</span>
              </div>

              <div
                className={`nav-item ${activeTab === 'client-management' || activeTab === 'profile' || activeTab === 'keywords' || activeTab === 'customer-data' ? 'active' : ''}`}
                onClick={() => handleNavClick('client-management')}
                id="nav-super-client-management"
              >
                <Building2 size={19} />
                <span className="nav-text">Client Management</span>
              </div>
            </>
          ) : (
            <>
              <div className="nav-section-label">Business Management</div>

              <div
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('profile')}
                id="nav-client-profile"
              >
                <Building2 size={19} />
                <span className="nav-text">Profile</span>
              </div>

              <div
                className={`nav-item ${activeTab === 'keywords' ? 'active' : ''}`}
                onClick={() => handleNavClick('keywords')}
                id="nav-client-keywords"
              >
                <Sparkles size={19} />
                <span className="nav-text">Keywords</span>
              </div>

              <div
                className={`nav-item ${activeTab === 'customer-data' ? 'active' : ''}`}
                onClick={() => handleNavClick('customer-data')}
                id="nav-customer-data"
              >
                <MessageSquareText size={19} />
                <span className="nav-text">Customer data</span>
              </div>

              <div
                className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
                onClick={() => handleNavClick('subscriptions')}
                id="nav-client-subscriptions"
              >
                <CreditCard size={19} />
                <span className="nav-text">Subscriptions</span>
              </div>
            </>
          )}
        </div>

        {/* User Footer & Logout */}
        <div className="sidebar-footer">
          {/* Business Theme Switcher (Exclusively in Business Admin flow; completely hidden for Super Admin) */}
          {!isSuperAdmin && String(user?.role || '').toLowerCase().trim() === 'admin' && (
            <div className="sidebar-theme-container">
              <div className="sidebar-theme-row">
                <span className="sidebar-theme-label">
                  <Palette size={13} style={{ color: '#C4B5FD' }} />
                  <span>Business Theme</span>
                </span>
                <button
                  type="button"
                  className="sidebar-theme-toggle-btn"
                  onClick={() => setShowThemePicker(prev => !prev)}
                  title="Customize business color theme"
                >
                  <span className="sidebar-theme-dot" style={{ background: activeTheme.preview }} />
                  <span>{activeTheme.name}</span>
                </button>
              </div>

              {/* Gradient Swatches Grid */}
              {showThemePicker && (
                <div className="sidebar-gradient-swatches">
                  {COLOR_THEMES.map(t => {
                    const isSelected = t.id === currentThemeId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`sidebar-swatch-circle ${isSelected ? 'active' : ''}`}
                        style={{ background: t.preview }}
                        onClick={() => handleSelectTheme(t.id)}
                        title={t.name}
                      >
                        {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="user-badge-card">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <div className="user-name" title={user?.name || user?.username}>
                {user?.name || (user?.username && /^\d+$/.test(user.username) ? formatPhoneNumber(user.username) : user?.username)}
              </div>
              <div className="user-role-tag">{user?.role}</div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onLogout}
            id="btn-sidebar-logout"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
