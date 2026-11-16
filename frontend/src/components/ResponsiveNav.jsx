import React, { useState, useEffect, useRef } from 'react';
import {
  LucideHome,
  QrCode,
  UserPlus,
  Users,
  Tags,
  ChartColumn,
  SettingsIcon,
  Building2,
  MessageSquareText,
  CreditCard,
  MoreHorizontal,
  X,
  Sparkles
} from 'lucide-react';

export default function ResponsiveNav({ user, activeTab, setActiveTab }) {
  const isSuperAdmin = String(user?.role || '').toLowerCase().trim() === 'superadmin';
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const stripRef = useRef(null);

  // Tab definitions for Superadmin
  const superadminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LucideHome },
    { id: 'new-qr', label: 'New QR', icon: QrCode },
    { id: 'onboard', label: 'Onboard', icon: UserPlus },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'analytics', label: 'Analytics', icon: ChartColumn },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  // Tab definitions for Client / Business Admin
  const clientTabs = [
    { id: 'profile', label: 'Profile', icon: Building2 },
    { id: 'keywords', label: 'Keywords', icon: MessageSquareText },
    { id: 'customers', label: 'Reviews', icon: Users },
    { id: 'subscriptions', label: 'Plans', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const currentTabs = isSuperAdmin ? superadminTabs : clientTabs;

  // On mobile phone dock: SuperAdmin primary 4 tabs + 1 "More" tab
  const superadminPrimaryDock = superadminTabs.slice(0, 4);
  const superadminMoreTabs = superadminTabs.slice(4); // categories, analytics, settings
  const isMoreTabActive = isSuperAdmin && superadminMoreTabs.some(t => t.id === activeTab);

  // Auto-scroll active item into view on tablet strip
  useEffect(() => {
    if (!stripRef.current) return;
    const activeEl = stripRef.current.querySelector('.tablet-nav-pill.active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMoreMenuOpen(false);
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. TABLET TOP HORIZONTAL STRIP (Visible 601px - 1024px)   */}
      {/* ======================================================== */}
      <nav
        className="tablet-nav-strip no-print"
        ref={stripRef}
        aria-label="Tablet navigation menu"
      >
        <div className="tablet-nav-scroll-wrap">
          {currentTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tablet-nav-pill ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
                id={`tablet-nav-${tab.id}`}
              >
                <Icon size={16} className="tablet-nav-icon" />
                <span className="tablet-nav-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ======================================================== */}
      {/* 2. MOBILE BOTTOM NAVIGATION DOCK (Visible <= 600px)      */}
      {/* ======================================================== */}
      <nav
        className="mobile-bottom-dock no-print"
        aria-label="Mobile bottom navigation dock"
      >
        {isSuperAdmin ? (
          <>
            {/* Primary 4 SuperAdmin Tabs */}
            {superadminPrimaryDock.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`dock-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                  id={`dock-nav-${tab.id}`}
                >
                  <div className="dock-icon-wrap">
                    <Icon size={19} />
                  </div>
                  <span className="dock-label">{tab.label}</span>
                </button>
              );
            })}

            {/* "More..." Tab for SuperAdmin */}
            <button
              type="button"
              className={`dock-item ${isMoreTabActive || moreMenuOpen ? 'active' : ''}`}
              onClick={() => setMoreMenuOpen(prev => !prev)}
              id="dock-nav-more"
            >
              <div className="dock-icon-wrap">
                <MoreHorizontal size={19} />
              </div>
              <span className="dock-label">
                {isMoreTabActive
                  ? superadminMoreTabs.find(t => t.id === activeTab)?.label || 'More'
                  : 'More'}
              </span>
            </button>
          </>
        ) : (
          /* Client Admin: All 5 Tabs Direct */
          clientTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`dock-item ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
                id={`dock-nav-${tab.id}`}
              >
                <div className="dock-icon-wrap">
                  <Icon size={19} />
                </div>
                <span className="dock-label">{tab.label}</span>
              </button>
            );
          })
        )}
      </nav>

      {/* ======================================================== */}
      {/* 3. SUPERADMIN "MORE" POPUP SHEET FOR MOBILE DOCK        */}
      {/* ======================================================== */}
      {isSuperAdmin && moreMenuOpen && (
        <div
          className="dock-more-overlay no-print"
          onClick={() => setMoreMenuOpen(false)}
        >
          <div
            className="dock-more-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dock-more-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={15} style={{ color: '#C084FC' }} />
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  More Actions
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setMoreMenuOpen(false)}
                style={{ borderRadius: '50%', padding: '4px', width: '28px', height: '28px' }}
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            <div className="dock-more-grid">
              {superadminMoreTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`dock-more-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleTabClick(tab.id)}
                    id={`dock-more-${tab.id}`}
                  >
                    <div className="dock-more-icon-box">
                      <Icon size={20} />
                    </div>
                    <span className="dock-more-label">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

