import React, { useState, useEffect } from 'react';
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
  PhoneCall,
  ScanLine
} from 'lucide-react';
import config, { getImageUrl } from '../../config';
import { getClientReviewUrl } from '../../utils/slug';
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

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch system stats
      const statsRes = await fetch(`${config.API_BASE_URL}/api/stats`);
      const statsData = await statsRes.json();
      if (statsData) {
        setStats(statsData);
      }

      // 2. Fetch clients
      const clientsRes = await fetch(`${config.API_BASE_URL}/api/clients`);
      const clientsData = await clientsRes.json();
      if (clientsData && Array.isArray(clientsData.clients)) {
        setClients(clientsData.clients);
      }

      // 3. Fetch all reviews for recent activity feed and rating breakdown
      try {
        const reviewsRes = await fetch(`${config.API_BASE_URL}/api/reviews`);
        const reviewsData = await reviewsRes.json();
        if (reviewsData && Array.isArray(reviewsData.reviews)) {
          setAllReviews(reviewsData.reviews);
          setRecentReviews(reviewsData.reviews.slice(0, 10));
        }
      } catch (e) {
        // Fallback: reviews can also be aggregated if endpoint is busy
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const totalReviewsCount = stats.totalReviews || allReviews.length || clients.reduce((sum, c) => sum + (c.reviewsCount || 0), 0);
  const totalScansCount = (stats.totalScans !== undefined && Number(stats.totalScans) > 0)
    ? Number(stats.totalScans)
    : (clients.reduce((sum, c) => sum + (Number(c.scansCount) || 0), 0) || totalReviewsCount);

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

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        {/* 1. Total QR Codes */}
        <div
          className="stat-card"
          onClick={() => onNavigate && onNavigate('new-qr')}
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          title="Click to view QR generation"
        >
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
        <div
          className="stat-card"
          onClick={() => onNavigate && onNavigate('clients')}
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          title="Click to view active client standees"
        >
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success, #10B981)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-val">
              {stats.assignedQrs ?? clients.filter(c => c.qrId).length}
            </div>
            <div className="stat-label">Active QR Codes</div>
          </div>
        </div>

        {/* 3. Unassigned QR Codes */}
        <div
          className="stat-card"
          onClick={() => onNavigate && onNavigate('new-qr')}
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          title="Click to view unassigned QR pool"
        >
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning, #F59E0B)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.unassignedQrs || 0}</div>
            <div className="stat-label">Unassigned Count</div>
          </div>
        </div>

        {/* 4. Onboarded Clients */}
        <div
          className="stat-card"
          onClick={() => onNavigate && onNavigate('clients')}
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          title="Click to view onboarded businesses"
        >
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary, #6366F1)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="stat-val">{stats.totalClients || clients.length}</div>
            <div className="stat-label">Onboarded Clients</div>
          </div>
        </div>

        {/* 5. Total QR Scans */}
        <div
          className="stat-card"
          onClick={() => onNavigate && onNavigate('analytics')}
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          title="Total dynamic QR standee scans by customers"
        >
          <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' }}>
            <ScanLine size={24} />
          </div>
          <div>
            <div className="stat-val">{totalScansCount}</div>
            <div className="stat-label">Total QR Scans</div>
          </div>
        </div>

        {/* 6. Customer Reviews Logged */}
        <div
          className="stat-card"
          onClick={() => onNavigate && onNavigate('customer-data')}
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          title="Click to view customer feedback data"
        >
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

      {/* Visual Analytics & Activity Charts Section */}
      <DashboardCharts
        clients={clients}
        allReviews={allReviews}
        stats={stats}
        onNavigate={onNavigate}
      />

      {/* Two Column Section: Recent Onboardings & Latest Customer Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '14px' }}>
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

          {clients.length === 0 ? (
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
              {clients.map((client) => {
                const reviewUrl = getClientReviewUrl(client, client.qrId);
                return (
                  <div
                    key={client.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                      {client.logoUrl ? (
                        <img
                          src={getImageUrl(client.logoUrl)}
                          alt={client.name}
                          style={{ width: '32px', height: '32px', borderRadius: '7px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '7px',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.82rem'
                        }}>
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {client.name}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          <CopyablePhone phone={client.phone} displayText={formatPhoneNumber(client.phone)} style={{ fontSize: '0.73rem' }} />
                          <span>• {client.businessType || 'General Retail'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        {client.qrId}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 6px' }}
                        onClick={() => onTestReview && onTestReview(client.qrId)}
                        title="Test Client Review Standee"
                      >
                        <ExternalLink size={12} />
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

          {recentReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 14px', color: 'var(--text-muted)' }}>
              <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: '6px' }} />
              <p style={{ margin: 0, fontSize: '0.84rem' }}>No customer reviews submitted yet.</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.76rem' }}>
                When customers scan standees and submit reviews, they appear here live.
              </p>
            </div>
          ) : (
            <div className="dashboard-scroll-list">
              {recentReviews.slice(0, 10).map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {rev.clientName}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    "{rev.comments}"
                  </p>

                  {rev.phone && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <PhoneCall size={11} />
                      <span>Customer:</span>
                      <CopyablePhone phone={rev.phone} displayText={formatPhoneNumber(rev.phone)} style={{ fontSize: '0.72rem' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

