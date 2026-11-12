import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  MessageSquareText,
  Users,
  Building2,
  FileSpreadsheet,
  Download,
  RefreshCw,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  ArrowUpRight,
  ScanLine
} from 'lucide-react';
import config from '../../config';
import { formatPhoneNumber, cleanPhoneNumber } from '../../utils/phone';
import { AnalyticsShimmer } from '../../components/Shimmer';
import CopyablePhone from '../../components/CopyablePhone';

export default function Analytics({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalyticsData = async () => {
    try {
      // 1. Fetch system stats
      const statsRes = await fetch(`${config.API_BASE_URL}/api/stats`);
      const statsData = await statsRes.json();
      if (statsData) setStats(statsData);

      // 2. Fetch clients
      const clientsRes = await fetch(`${config.API_BASE_URL}/api/clients`);
      const clientsData = await clientsRes.json();
      if (clientsData && Array.isArray(clientsData.clients)) {
        setClients(clientsData.clients);
      }

      // 3. Fetch reviews
      try {
        const reviewsRes = await fetch(`${config.API_BASE_URL}/api/reviews`);
        const reviewsData = await reviewsRes.json();
        if (reviewsData && Array.isArray(reviewsData.reviews)) {
          setReviews(reviewsData.reviews);
        }
      } catch (e) {
        // reviews might be empty
      }

      // 4. Fetch categories
      try {
        const catRes = await fetch(`${config.API_BASE_URL}/api/categories`);
        const catData = await catRes.json();
        if (catData && Array.isArray(catData.categories)) {
          setCategories(catData.categories);
        }
      } catch (e) { }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  const totalReviews = reviews.length || stats?.totalReviews || 0;
  const totalScans = (stats?.totalScans !== undefined && Number(stats.totalScans) > 0)
    ? Number(stats.totalScans)
    : (clients.reduce((sum, c) => sum + (Number(c.scansCount) || 0), 0) || totalReviews);
  const scanConversionRate = totalScans > 0 ? Math.min(100, Math.round((totalReviews / totalScans) * 100)) : 0;
  const phoneCapturedReviews = reviews.filter(r => r.phone && cleanPhoneNumber(r.phone).length === 10).length;
  const phoneCaptureRate = totalReviews > 0 ? Math.round((phoneCapturedReviews / totalReviews) * 100) : 0;

  // Category distribution calculation
  const categoryCounts = {};
  clients.forEach(c => {
    const cat = c.businessType || 'Other Business';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // Top clients leaderboard
  const sortedClients = [...clients].sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));

  if (loading) {
    return <AnalyticsShimmer />;
  }

  return (
    <div className="fade-in">
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '10px'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Review Insights & Performance Analytics</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Comprehensive analytics of customer feedback, scan conversions, and business classifications
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            title="Refresh Analytics"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => window.open(`${config.API_BASE_URL}/api/reviews/export-master`, '_blank')}
          >
            <Download size={14} />
            <span>Export Master Report (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' }}>
            <ScanLine size={24} />
          </div>
          <div>
            <div className="stat-val">{totalScans}</div>
            <div className="stat-label">Total QR Scans</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <MessageSquareText size={24} />
          </div>
          <div>
            <div className="stat-val">{totalReviews}</div>
            <div className="stat-label">Total Reviews Logged</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-val">{scanConversionRate}%</div>
            <div className="stat-label">Scan Conversion Rate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
            <PhoneCall size={24} />
          </div>
          <div>
            <div className="stat-val">{phoneCaptureRate}%</div>
            <div className="stat-label">Phone Capture Rate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="stat-val">{clients.length}</div>
            <div className="stat-label">Active Onboarded Businesses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent)' }}>
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-val">{Object.keys(categoryCounts).length}</div>
            <div className="stat-label">Active Industry Categories</div>
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>

        {/* Right: Business Category Distribution */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} style={{ color: 'var(--primary)' }} />
            <span>Businesses by Industry Category</span>
          </h4>

          {Object.keys(categoryCounts).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No businesses onboarded yet. Categories will populate dynamically as businesses join.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(categoryCounts).map(([catName, count]) => {
                const pct = clients.length > 0 ? Math.round((count / clients.length) * 100) : 0;
                return (
                  <div key={catName}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{catName}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} client(s) ({pct}%)</span>
                    </div>
                    <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #6366F1 0%, #06B6D4 100%)',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Table: Top Performing Clients */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: '#FBBF24' }} />
            <span>Top Performing Businesses</span>
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Ranked by customer engagement
          </span>
        </div>

        {clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No clients onboarded yet. Onboard clients to start tracking leaderboards.
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table" style={{ width: '100%', minWidth: '580px' }}>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Business Name</th>
                  <th>Category</th>
                  <th>Assigned QR</th>
                  <th>Phone Number</th>
                  <th>Total Reviews</th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((client, index) => (
                  <tr key={client.id}>
                    <td>
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: index === 0 ? 'rgba(245, 158, 11, 0.2)' : index === 1 ? 'rgba(156, 163, 175, 0.2)' : index === 2 ? 'rgba(180, 83, 9, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: index === 0 ? '#FBBF24' : index === 1 ? '#9CA3AF' : index === 2 ? '#B45309' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        #{index + 1}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{client.name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-secondary" style={{ fontSize: '0.74rem' }}>
                        {client.businessType || 'General Retail'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: '0.74rem' }}>
                        {client.qrId}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.84rem' }}>
                      {client.phone ? (
                        <CopyablePhone
                          phone={client.phone}
                          displayText={formatPhoneNumber(client.phone)}
                          style={{ fontSize: '0.84rem' }}
                        />
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: '#10B981' }}>{client.reviewsCount || 0}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

