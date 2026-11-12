import React from 'react';
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
  HomeIcon,
  Home,
  LucideHome,
  ChartBar,
  SettingsIcon,
  ChartCandlestick,
  ChartBarIcon,
  ChartColumn,
  ChartColumnBigIcon
} from 'lucide-react';
import sidebarLogo from '../assets/sidebar_logo.png';
import sidebarGrowthBanner from '../assets/sidebar_growth_banner.png';
import { formatPhoneNumber } from '../utils/phone';

export default function Sidebar({ user, activeTab, setActiveTab, onLogout, isOpen, onClose }) {
  const isSuperAdmin = user?.role === 'superadmin';

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-icon-box">
            <img src={sidebarLogo} alt="QR Reviews Logo" className="brand-logo-img" />
          </div>
          <div style={{ textAlign: 'center', minWidth: 0 }}>
            <h1 className="brand-title">QR Reviews</h1>
            <p className="brand-subtitle">{isSuperAdmin ? 'Super Admin Portal' : 'Admin Portal'}</p>
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

              <div className="nav-section-label" style={{ marginTop: '14px', fontSize: '0.72rem', letterSpacing: '0.06em', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', padding: '0 12px', fontWeight: 700 }}>
                Client Management
              </div>

              <div
                className={`nav-item ${activeTab === 'customer-data' ? 'active' : ''}`}
                onClick={() => handleNavClick('customer-data')}
                id="nav-super-customer-data"
              >
                <MessageSquareText size={19} />
                <span className="nav-text">Customer Data</span>
              </div>

              <div
                className={`nav-item ${activeTab === 'keywords' ? 'active' : ''}`}
                onClick={() => handleNavClick('keywords')}
                id="nav-super-client-keywords"
              >
                <Sparkles size={19} />
                <span className="nav-text">Client Keywords</span>
              </div>

              <div
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('profile')}
                id="nav-super-client-profile"
              >
                <Building2 size={19} />
                <span className="nav-text">Client Profile</span>
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
            </>
          )}

          {/* Banner with Round Corners */}
          <div className="sidebar-banner-container">
            <div className="sidebar-banner-card">
              <img
                src={sidebarGrowthBanner}
                alt="Growth Analytics"
                className="sidebar-banner-img"
              />
              <div className="sidebar-banner-text">
                <p style={{ margin: 0 }}>Grow your business</p> with QR Reviews
              </div>
            </div>
          </div>
        </div>

        {/* User Footer & Logout */}
        <div className="sidebar-footer">
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
