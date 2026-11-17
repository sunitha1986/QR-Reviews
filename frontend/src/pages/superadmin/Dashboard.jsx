import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  QrCode,
  FileSpreadsheet,
  MessageSquare,
  Users,
  UserPlus,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Layers,
  Phone,
  PhoneCall,
  ScanLine,
  AlertCircle,
  Star
} from 'lucide-react';
import config, { getImageUrl } from '../../config';
import { getClientReviewUrl, generateSlug } from '../../utils/slug';
import { formatPhoneNumber } from '../../utils/phone';
import { DashboardShimmer } from '../../components/Shimmer';
import CopyablePhone from '../../components/CopyablePhone';
import DashboardCharts from '../../components/DashboardCharts';
import headerWaveBanner from '../../assets/header_wave_banner.jpg';

export default function Dashboard({ onNavigate, onTestReview }) {
  const [stats, setStats] = useState({
    totalQrs: 0,
    unassignedQrs: 0,
    assignedQrs: 0,
    totalClients: 0,
    totalReviews: 0,
    totalScans: 0
  });
  const [clients, setClients] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const safetyTimerRef = useRef(null);

  // Helper: fetch with strict timeout and safe JSON handling
  const fetchSafeJson = async (url, ms = 7000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ms);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        console.warn(`[Dashboard] ${url} responded with status:`, res.status);
        return null;
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.warn(`[Dashboard] ${url} returned invalid JSON:`, parseErr.message);
        return null;
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[Dashboard] ${url} fetch error:`, err.message);
      return null;
    }
  };

  const fetchDashboardData = async () => {
    setFetchError('');
    try {
      // Parallel requests for all 3 data sources
      const [statsResult, clientsResult, reviewsResult] = await Promise.allSettled([
        fetchSafeJson(`${config.API_BASE_URL}/api/stats`),
        fetchSafeJson(`${config.API_BASE_URL}/api/clients`),
        fetchSafeJson(`${config.API_BASE_URL}/api/reviews`)
      ]);

      const statsData = statsResult.status === 'fulfilled' ? statsResult.value : null;
      const clientsData = clientsResult.status === 'fulfilled' ? clientsResult.value : null;
      const reviewsData = reviewsResult.status === 'fulfilled' ? reviewsResult.value : null;

      let loadedClients = [];
      if (clientsData && Array.isArray(clientsData.clients)) {
        loadedClients = clientsData.clients;
        setClients(loadedClients);
      }

      let loadedReviews = [];
      if (reviewsData && Array.isArray(reviewsData.reviews)) {
        loadedReviews = reviewsData.reviews;
        setAllReviews(loadedReviews);
        setRecentReviews(loadedReviews.slice(0, 10));
      }

      // Safe numeric stats update with automatic fallback aggregation
      setStats(prev => {
        const totalClientsCount = (statsData && statsData.totalClients !== undefined && !statsData.error)
          ? Number(statsData.totalClients)
          : (loadedClients.length || prev.totalClients || 0);

        const totalReviewsCount = (statsData && statsData.totalReviews !== undefined && !statsData.error)
          ? Number(statsData.totalReviews)
          : (loadedReviews.length || prev.totalReviews || 0);

        const assignedQrsCount = (statsData && statsData.assignedQrs !== undefined && !statsData.error)
          ? Number(statsData.assignedQrs)
          : (loadedClients.filter(c => c && c.qrId).length || prev.assignedQrs || 0);

        const unassignedQrsCount = (statsData && statsData.unassignedQrs !== undefined && !statsData.error)
          ? Number(statsData.unassignedQrs)
          : (prev.unassignedQrs || 0);

        const totalQrsCount = (statsData && statsData.totalQrs !== undefined && !statsData.error)
          ? Number(statsData.totalQrs)
          : (assignedQrsCount + unassignedQrsCount || prev.totalQrs || 0);

        const totalScansCount = (statsData && statsData.totalScans !== undefined && !statsData.error)
          ? Number(statsData.totalScans)
          : (prev.totalScans || totalReviewsCount);

        return {
          totalQrs: totalQrsCount,
          unassignedQrs: unassignedQrsCount,
          assignedQrs: assignedQrsCount,
          totalClients: totalClientsCount,
          totalReviews: totalReviewsCount,
          totalScans: totalScansCount
        };
      });

      // If all three requests failed, report non-blocking warning
      if (!statsData && !clientsData && !reviewsData) {
        setFetchError('Unable to connect to the backend server. Showing offline/cached dashboard.');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setFetchError('Network error while refreshing dashboard. You can retry anytime.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Safety fallback: guaranteed shimmer dismissal after 6.5s to prevent infinite loading screen
    safetyTimerRef.current = setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
    }, 6500);

    return () => {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const safeClients = Array.isArray(clients) ? clients : [];
  const safeAllReviews = Array.isArray(allReviews) ? allReviews : [];
  const totalReviewsCount = stats.totalReviews || safeAllReviews.length || safeClients.reduce((sum, c) => sum + (c?.reviewsCount || 0), 0);
  const totalScansCount = (stats.totalScans !== undefined && Number(stats.totalScans) > 0)
    ? Number(stats.totalScans)
    : (safeClients.reduce((sum, c) => sum + (Number(c?.scansCount) || 0), 0) || totalReviewsCount);

  if (loading) {
    return <DashboardShimmer />;
  }

  return (
    <div className="fade-in dashboard-page">
      {/* Decorative Wavy Ambient Background (reusing cached header_wave_banner.jpg) */}
      <div className="dashboard-wavy-backdrop" aria-hidden="true">
        <img
          src={headerWaveBanner}
          alt=""
          className="dashboard-wavy-img"
        />
        <div className="dashboard-wavy-gradient-overlay" />
      </div>

      {/* Optional Graceful Error / Offline Notification */}
      {fetchError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          padding: '10px 16px',
          marginBottom: '16px',
          color: '#F87171',
          fontSize: '0.84rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ fontSize: '0.74rem', padding: '4px 10px' }}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        {/* 1. Total QR Codes */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(109, 36, 186, 0.15)', color: '#8B5CF6' }}>
            <QrCode size={24} />
          </div>
          <div>
            <div className="stat-val">
              {stats.totalQrs ?? (Number(stats.assignedQrs || 0) + Number(stats.unassignedQrs || 0))}
            </div>
            <div className="stat-label">Total QR Codes</div>
          </div>
        </div>

        {/* 2. Active QR Codes */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success, #10B981)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-val">
              {stats.assignedQrs ?? safeClients.filter(c => c && c.qrId).length}
            </div>
            <div className="stat-label">Active QR Codes</div>
          </div>
        </div>

        {/* 3. Unassigned QR Codes */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning, #F59E0B)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.unassignedQrs || 0}</div>
            <div className="stat-label">Unassigned Count</div>
          </div>
        </div>

        {/* 4. Onboarded Clients */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary, #6366F1)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.totalClients || safeClients.length}</div>
            <div className="stat-label">Onboarded Clients</div>
          </div>
        </div>

        {/* 5. Total QR Scans */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' }}>
            <ScanLine size={24} />
          </div>
          <div>
            <div className="stat-val">{totalScansCount}</div>
            <div className="stat-label">Total QR Scans</div>
          </div>
        </div>

        {/* 6. Customer Reviews Logged */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent, #06B6D4)' }}>
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <div className="stat-val">{totalReviewsCount}</div>
            <div className="stat-label">Customer Reviews Logged</div>
          </div>
        </div>
      </div>

      {/* Standee Pool & Quick Deployment Status */}
      <div className="glass-panel" style={{ padding: '14px 18px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={17} style={{ color: 'var(--primary)' }} />
              <span>Standee Deployment & Inventory Status</span>
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Dynamic standees pre-printed or assigned in the cloud review pool
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => window.open(`${config.API_BASE_URL}/api/reviews/export-master`, '_blank')}
            >
              <Download size={13} />
              <span>Export Master Excel</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate && onNavigate('analytics')}
            >
              <BarChart3 size={13} />
              <span>View Analytics</span>
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
            <span>
              <strong>{stats.assignedQrs || 0} Assigned</strong> ({stats.totalQrs > 0 ? Math.round(((stats.assignedQrs || 0) / stats.totalQrs) * 100) : 0}%)
            </span>
            <span>
              <strong>{stats.unassignedQrs || 0} Available in Pool</strong>
            </span>
          </div>
          <div style={{ height: '8px', borderRadius: '5px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', display: 'flex' }}>
            <div
              style={{
                width: `${stats.totalQrs > 0 ? Math.min(100, Math.round(((stats.assignedQrs || 0) / stats.totalQrs) * 100)) : 0}%`,
                background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                transition: 'width 0.4s ease'
              }}
            />
            <div
              style={{
                flex: 1,
                background: 'rgba(16, 185, 129, 0.25)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Onboarded Businesses & Latest Customer Feedback Grid (1 col on tablet/mobile, 2 col on desktop) */}
      <div className="dashboard-recent-grid" style={{ marginBottom: '14px' }}>
        {/* Column 2: Onboarded Clients */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={17} style={{ color: 'var(--primary)' }} />
              <span>Recent Onboarded Businesses</span>
            </h4>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.73rem', padding: '3px 8px' }}
              onClick={() => onNavigate && onNavigate('clients')}
            >
              <span>View All ({clients.length})</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {safeClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 14px', color: 'var(--text-muted)' }}>
              <Users size={28} style={{ opacity: 0.3, marginBottom: '6px' }} />
              <p style={{ margin: 0, fontSize: '0.84rem' }}>No clients onboarded yet.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: '10px' }}
                onClick={() => onNavigate && onNavigate('onboard')}
              >
                + Onboard First Business
              </button>
            </div>
          ) : (
            <div className="dashboard-scroll-list">
              {safeClients.map((client) => {
                if (!client) return null;
                const reviewUrl = getClientReviewUrl(client, client.qrId);
                const displayName = client.name || 'Assigned Business';
                const firstChar = displayName.trim().charAt(0).toUpperCase() || 'B';
                const reviewTarget = client.slug || generateSlug(client.name) || client.qrId;
                return (
                  <div
                    key={client.id || client.qrId || Math.random()}
                    className="recent-business-card"
                  >
                    <div className="recent-business-card-main">
                      {/* Avatar / Logo */}
                      <div className="recent-business-avatar-wrap">
                        {client.logoUrl ? (
                          <img
                            src={getImageUrl(client.logoUrl)}
                            alt={displayName}
                            className="recent-business-avatar-img"
                          />
                        ) : (
                          <div className="recent-business-avatar-initial">
                            {firstChar}
                          </div>
                        )}
                      </div>

                      {/* Line-by-Line Stacked Information */}
                      <div className="recent-business-info-stack">
                        {/* Line 1: Business Name */}
                        <div
                          className="recent-business-name"
                          title={displayName}
                        >
                          {displayName}
                        </div>

                        {/* Line 2: Phone Number (line by line below name) */}
                        <div className="recent-business-phone-row">
                          <Phone size={11} style={{ color: 'var(--primary)', flexShrink: 0, opacity: 0.85 }} />
                          <CopyablePhone
                            phone={client.phone}
                            displayText={formatPhoneNumber(client.phone)}
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          />
                        </div>

                        {/* Line 3: Category & Location (line by line below phone) */}
                        <div className="recent-business-meta-row">
                          <span className="recent-business-badge-type">
                            {client.businessType || 'General Retail'}
                          </span>
                          {(client.businessLocation || client.address) && (
                            <span
                              className="recent-business-location-snippet"
                              title={client.businessLocation || client.address}
                            >
                              • {client.businessLocation || client.address?.split(',')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: QR ID Badge & Review Action Button */}
                    <div className="recent-business-actions-wrap">
                      <span
                        className="badge badge-primary recent-business-qr-pill"
                        title={`Standee QR: ${client.qrId || 'QR'}`}
                      >
                        {client.qrId || 'QR'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm recent-business-review-btn"
                        onClick={() => onTestReview ? onTestReview(reviewTarget) : window.open(`/${reviewTarget}`, '_blank')}
                        title="Open customer review page"
                      >
                        <ExternalLink size={12} />
                        <span className="recent-business-review-text">Review</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Customer Feedback */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={17} style={{ color: 'var(--primary)' }} />
              <span>Latest Customer Feedback</span>
            </h4>
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              Real-time Feed
            </span>
          </div>

          {(!Array.isArray(recentReviews) || recentReviews.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '24px 14px', color: 'var(--text-muted)' }}>
              <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: '6px' }} />
              <p style={{ margin: 0, fontSize: '0.84rem' }}>No customer reviews submitted yet.</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.76rem' }}>
                When customers scan standees and submit reviews, they appear here live.
              </p>
            </div>
          ) : (
            <div className="dashboard-scroll-list">
              {(Array.isArray(recentReviews) ? recentReviews : []).slice(0, 10).map((rev) => {
                if (!rev) return null;
                const formattedDate = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Just now';
                return (
                  <div
                    key={rev.id || Math.random()}
                    className="dashboard-feedback-item"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                          {rev.clientName || 'Valued Customer'}
                        </strong>
                        {rev.rating && (
                          <span
                            className="feedback-rating-badge"
                            title={`${rev.rating} out of 5 stars`}
                          >
                            <Star size={11} fill="#F59E0B" />
                            <span>{rev.rating}★</span>
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {formattedDate}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.45 }}>
                      "{rev.comments || 'No comment provided.'}"
                    </p>

                    {rev.phone && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                        <PhoneCall size={11} />
                        <span>Customer:</span>
                        <CopyablePhone phone={rev.phone} displayText={formatPhoneNumber(rev.phone)} style={{ fontSize: '0.72rem' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Performance Analytics & Activity Charts Section (Last Section) */}
      <DashboardCharts
        clients={clients}
        allReviews={allReviews}
        stats={stats}
        onNavigate={onNavigate}
      />
    </div>
  );
}

