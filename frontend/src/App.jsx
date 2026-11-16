import React, { useState, useEffect } from 'react';
import './styles/app.css';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import ResponsiveNav from './components/ResponsiveNav';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/superadmin/Dashboard';
import NewQrGeneration from './pages/superadmin/NewQrGeneration';
import OnboardingClient from './pages/superadmin/OnboardingClient';
import AllClients from './pages/superadmin/AllClients';
import BusinessCategories from './pages/superadmin/BusinessCategories';
import Analytics from './pages/superadmin/Analytics';
import Settings from './pages/superadmin/Settings';
import ClientProfile from './pages/admin/ClientProfile';
import ClientKeywords from './pages/admin/ClientKeywords';
import CustomerData from './pages/admin/CustomerData';
import Subscriptions from './pages/admin/Subscriptions';
import ClientManagement from './pages/superadmin/ClientManagement';
import CustomerReviewForm from './pages/customer/CustomerReviewForm';
import LandingPage from './pages/LandingPage';
import QuickReviewScannerModal from './components/QuickReviewScannerModal';
import config from './config';
import { applyColorTheme, getSavedThemeId } from './utils/colorThemes';

// Helper to extract review identifier from URL pathname (supports both /:slug and /review/:slug)
function extractReviewTarget(path) {
  if (!path) return null;
  if (path.startsWith('/review/')) {
    const raw = path.replace('/review/', '');
    return raw ? decodeURIComponent(raw) : null;
  }
  const clean = path.replace(/^\/+|\/+$/g, '');
  if (!clean) return null;
  const reserved = ['login', 'admin', 'superadmin', 'api', 'dashboard', 'settings', 'favicon.ico', 'scan'];
  if (reserved.includes(clean.toLowerCase())) {
    return null;
  }
  return decodeURIComponent(clean);
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('qr_review_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Check URL pathname for direct review slugs or QR scans (e.g. /varshas-kitchen or /review/QR000001)
  const [customerReviewQrId, setCustomerReviewQrId] = useState(() => {
    return extractReviewTarget(window.location.pathname);
  });

  // Track login view vs landing page when unauthenticated
  const [showLogin, setShowLogin] = useState(() => {
    return window.location.pathname.toLowerCase() === '/login';
  });

  // Track instant standee camera scanner (e.g. /scan)
  const [showQuickScanner, setShowQuickScanner] = useState(() => {
    return window.location.pathname.toLowerCase() === '/scan';
  });

  const [preselectedQrForOnboard, setPreselectedQrForOnboard] = useState('');

  // Global Dark / Light Theme (default: light)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('qr_theme');
    const migrated = localStorage.getItem('qr_theme_default_light_v1');
    if (!migrated) {
      localStorage.setItem('qr_theme_default_light_v1', 'true');
      localStorage.setItem('qr_theme', 'light');
      return 'light';
    }
    return saved || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('qr_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeBusinessId = user?.role === 'admin' ? (user.clientId || user.id) : null;

  // Universal Business Color & Gradient Theme (scoped per business; Superadmin always constant)
  const [colorThemeId, setColorThemeId] = useState(() => {
    if (user?.role === 'superadmin') return 'royal-violet';
    return getSavedThemeId(activeBusinessId);
  });

  useEffect(() => {
    if (user?.role === 'superadmin') {
      setColorThemeId('royal-violet');
      applyColorTheme('royal-violet');
    } else if (user?.role === 'admin') {
      const bId = user.clientId || user.id;
      const bTheme = user.colorTheme || getSavedThemeId(bId);
      if (bTheme) {
        setColorThemeId(bTheme);
        applyColorTheme(bTheme, bId);
      }
    } else {
      applyColorTheme('royal-violet');
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      applyColorTheme('royal-violet');
    } else {
      applyColorTheme(colorThemeId, activeBusinessId);
    }
  }, [colorThemeId, theme, activeBusinessId, user?.role]);

  // Active tab inside portal
  const [activeTab, setActiveTab] = useState(() => {
    if (!user) return 'dashboard';
    return user.role === 'superadmin' ? 'dashboard' : 'profile';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedClientForAdminView, setSelectedClientForAdminView] = useState('');
  const [clientManagementSubTab, setClientManagementSubTab] = useState('profile');

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Handle browser back/forward or URL changes
  useEffect(() => {
    const handlePopState = () => {
      setCustomerReviewQrId(extractReviewTarget(window.location.pathname));
      setShowLogin(window.location.pathname.toLowerCase() === '/login');
      setShowQuickScanner(window.location.pathname.toLowerCase() === '/scan');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update active tab when user role changes
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' && !['profile', 'keywords', 'customer-data', 'subscriptions'].includes(activeTab)) {
        setActiveTab('profile');
      }
    }
  }, [user]);

  // Login handler
  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem('qr_review_user', JSON.stringify(userData));
    localStorage.setItem('qr_review_token', token);
    if (userData.role === 'admin') {
      const bId = userData.clientId || userData.id;
      const bTheme = userData.colorTheme || getSavedThemeId(bId);
      if (bTheme) {
        setColorThemeId(bTheme);
        applyColorTheme(bTheme, bId);
      }
    }
    setActiveTab(userData.role === 'superadmin' ? 'dashboard' : 'profile');
  };

  // Logout handler - navigate directly to login screen
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('qr_review_user');
    localStorage.removeItem('qr_review_token');
    window.history.pushState({}, '', '/login');
    setShowLogin(true);
  };

  // Update user subscription plan across state & local storage
  const handleUpdateUserPlan = (newPlan) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, subscriptionPlan: newPlan };
      localStorage.setItem('qr_review_user', JSON.stringify(updated));
      return updated;
    });
  };

  // Open login portal screen
  const handleOpenLogin = () => {
    window.history.pushState({}, '', '/login');
    setShowLogin(true);
  };

  // Return to landing page
  const handleBackToLanding = () => {
    window.history.pushState({}, '', '/');
    setShowLogin(false);
  };

  // Navigate to customer review preview (clean URL /:slug or /:qrId) in a new tab (target="_blank")
  const handleOpenCustomerReview = (qrOrSlug, altSlug) => {
    const target = altSlug || qrOrSlug || user?.slug || user?.qrId || 'QR000001';
    window.open(`/${target}`, '_blank');
  };

  // Open instant standee camera scanner (with audio feedback & auto navigation)
  const handleOpenQuickScanner = () => {
    window.history.pushState({}, '', '/scan');
    setShowQuickScanner(true);
  };

  // Close scanner and clean URL
  const handleCloseQuickScanner = () => {
    setShowQuickScanner(false);
    if (window.location.pathname.toLowerCase() === '/scan') {
      window.history.pushState({}, '', user ? '/' : '/');
    }
  };

  // On successful standee scan: immediately navigate to customer review form
  const handleQuickScannerSuccess = (target) => {
    setShowQuickScanner(false);
    window.history.pushState({}, '', `/${target}`);
    setCustomerReviewQrId(target);
  };

  // Return from customer review back to admin portal or landing
  const handleBackToPortal = () => {
    window.history.pushState({}, '', '/');
    setCustomerReviewQrId(null);
  };

  // 1. Direct Customer Review Screen (when scanned via QR or navigated to /review/:qrId)
  if (customerReviewQrId) {
    return (
      <CustomerReviewForm
        qrId={customerReviewQrId}
        onBackToApp={user ? handleBackToPortal : handleBackToLanding}
        onGoToOnboard={(targetQrId) => {
          setPreselectedQrForOnboard(targetQrId);
          setActiveTab('onboard');
          handleBackToPortal();
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  // 2. Unauthenticated: Show Landing Page or Login Screen
  if (!user) {
    if (showLogin) {
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onDirectCustomerScan={() => handleOpenCustomerReview('QR000001')}
          onBackToLanding={handleBackToLanding}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      );
    }

    return (
      <>
        <LandingPage
          onOpenLogin={handleOpenLogin}
          onOpenCustomerReview={handleOpenCustomerReview}
          onOpenQuickScanner={handleOpenQuickScanner}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
        <QuickReviewScannerModal
          isOpen={showQuickScanner}
          onClose={handleCloseQuickScanner}
          onNavigateToReview={handleQuickScannerSuccess}
        />
      </>
    );
  }

  // 3. Authenticated Portal Layout
  return (
    <div className="app-container">
      {/* Sidebar with dynamic role navigations */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        onLogout={handleLogout}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        colorThemeId={colorThemeId}
        onSelectColorTheme={(newThemeId, bId) => {
          setColorThemeId(newThemeId);
          applyColorTheme(newThemeId, bId || activeBusinessId);
        }}
      />

      {/* Main Layout Area */}
      <div className="main-layout">
        <Header
          user={user}
          activeTab={activeTab}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          onRefresh={handleRefresh}
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenQuickScanner={handleOpenQuickScanner}
        />

        {/* Adaptive Hybrid Navigation (Tablet Top Strip & Mobile Bottom Dock) */}
        <ResponsiveNav
          user={user}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
        />

        <main className="content-body" key={refreshKey}>
          {/* Superadmin Views */}
          {user.role === 'superadmin' && (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  onNavigate={(tab) => setActiveTab(tab)}
                  onTestReview={handleOpenCustomerReview}
                />
              )}

              {activeTab === 'new-qr' && (
                <NewQrGeneration
                  user={user}
                  onLogout={handleLogout}
                  onGoToOnboarding={(qrId) => {
                    setPreselectedQrForOnboard(qrId);
                    setActiveTab('onboard');
                  }}
                  onTestReview={handleOpenCustomerReview}
                />
              )}

              {activeTab === 'onboard' && (
                <OnboardingClient
                  preselectedQrId={preselectedQrForOnboard}
                  onOnboardSuccess={() => { }}
                  onTestReview={handleOpenCustomerReview}
                />
              )}

              {activeTab === 'clients' && (
                <AllClients
                  onTestReview={handleOpenCustomerReview}
                  onGoToOnboarding={() => setActiveTab('onboard')}
                  onNavigateToClient={(tab, clientId) => {
                    setSelectedClientForAdminView(clientId);
                    setClientManagementSubTab(tab === 'customer-data' ? 'customer-data' : tab === 'keywords' ? 'keywords' : 'profile');
                    setActiveTab('client-management');
                  }}
                />
              )}

              {activeTab === 'categories' && (
                <BusinessCategories
                  onGoToOnboarding={(qrId) => {
                    setPreselectedQrForOnboard(qrId || '');
                    setActiveTab('onboard');
                  }}
                  onTestReview={handleOpenCustomerReview}
                />
              )}

              {activeTab === 'analytics' && (
                <Analytics
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'settings' && (
                <Settings
                  user={user}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                />
              )}

              {/* Super Admin Unified Client Management (Profile, Keywords, Customer Data) */}
              {(activeTab === 'client-management' || activeTab === 'profile' || activeTab === 'keywords' || activeTab === 'customer-data') && (
                <ClientManagement
                  user={user}
                  selectedClientId={selectedClientForAdminView}
                  onSelectClient={setSelectedClientForAdminView}
                  onTestReview={handleOpenCustomerReview}
                  initialTab={activeTab === 'customer-data' ? 'customer-data' : activeTab === 'keywords' ? 'keywords' : (clientManagementSubTab || 'profile')}
                  onTabChange={setClientManagementSubTab}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'subscriptions' && (
                <Subscriptions
                  user={user}
                  onNavigate={setActiveTab}
                  onUpdatePlan={handleUpdateUserPlan}
                />
              )}
            </>
          )}

          {/* Admin (Client) Views */}
          {user.role === 'admin' && (
            <>
              {activeTab === 'profile' && (
                <ClientProfile
                  user={user}
                  onTestReview={handleOpenCustomerReview}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'keywords' && (
                <ClientKeywords
                  user={user}
                  onTestReview={handleOpenCustomerReview}
                />
              )}

              {activeTab === 'customer-data' && (
                <CustomerData
                  user={user}
                  onTestReview={handleOpenCustomerReview}
                />
              )}

              {activeTab === 'subscriptions' && (
                <Subscriptions
                  user={user}
                  onNavigate={setActiveTab}
                  onUpdatePlan={handleUpdateUserPlan}
                />
              )}
            </>
          )}
        </main>

        {/* Global Portal Footer */}
        <Footer />
      </div>

      {/* Quick QR Standee Camera Scanner with Sound & Instant Navigation */}
      <QuickReviewScannerModal
        isOpen={showQuickScanner}
        onClose={handleCloseQuickScanner}
        onNavigateToReview={handleQuickScannerSuccess}
      />
    </div>
  );
}
