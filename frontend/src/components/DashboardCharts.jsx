import React, { useMemo } from 'react';
import {
  Award,
  Building2,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  BarChart3,
  QrCode
} from 'lucide-react';

export default function DashboardCharts({ clients = [], allReviews = [], stats = {}, onNavigate }) {
  // Calculate Top Performing Businesses sorted by reviewsCount descending
  const topClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    const sorted = [...clients].sort((a, b) => {
      const countA = Number(a?.reviewsCount) || 0;
      const countB = Number(b?.reviewsCount) || 0;
      return countB - countA;
    });
    return sorted.slice(0, 8);
  }, [clients]);

  const maxClientReviews = useMemo(() => {
    if (topClients.length === 0) return 1;
    const maxVal = Math.max(...topClients.map((c) => Number(c?.reviewsCount) || 0));
    return Math.max(maxVal, 1);
  }, [topClients]);

  return (
    <div style={{ marginBottom: '14px' }}>
      {/* Charts Section Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--primary, #6366F1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <BarChart3 size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Performance Analytics & Activity Charts
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
              Leaderboard of active onboarded clients by customer reviews
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.74rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => onNavigate('clients')}
          >
            <span>View All Clients</span>
            <ArrowUpRight size={13} />
          </button>
        )}
      </div>

      {/* Main Single Card: Top Businesses by Reviews */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Award size={17} style={{ color: 'var(--warning, #F59E0B)' }} />
              <span>Top Businesses by Reviews</span>
            </h4>
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              Ranked by total verified customer reviews submitted
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#F59E0B',
              fontWeight: 700,
              fontSize: '0.76rem'
            }}
          >
            <TrendingUp size={12} />
            <span>Leaderboard</span>
          </div>
        </div>

        {topClients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 14px', color: 'var(--text-muted)' }}>
            <Building2 size={32} style={{ opacity: 0.35, marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600 }}>No onboarded businesses yet.</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem' }}>
              When businesses are onboarded and collect reviews, their rankings appear here.
            </p>
            {onNavigate && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: '12px' }}
                onClick={() => onNavigate('onboard')}
              >
                + Onboard First Business
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topClients.map((client, i) => {
              const reviewCount = Number(client?.reviewsCount) || 0;
              const pct = maxClientReviews > 0 ? Math.round((reviewCount / maxClientReviews) * 100) : 0;
              const displayName = client?.name || client?.businessName || `Client #${i + 1}`;

              // Dynamic styling based on rank
              const isFirst = i === 0;
              const isSecond = i === 1;
              const isThird = i === 2;

              const rankBg = isFirst
                ? 'rgba(245, 158, 11, 0.2)'
                : isSecond
                ? 'rgba(139, 92, 246, 0.2)'
                : isThird
                ? 'rgba(6, 182, 212, 0.2)'
                : 'rgba(255, 255, 255, 0.05)';

              const rankColor = isFirst
                ? '#F59E0B'
                : isSecond
                ? '#A78BFA'
                : isThird
                ? '#38BDF8'
                : 'var(--text-muted)';

              const barGradient = isFirst
                ? 'linear-gradient(90deg, #F59E0B 0%, #EC4899 100%)'
                : isSecond
                ? 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)'
                : isThird
                ? 'linear-gradient(90deg, #06B6D4 0%, #10B981 100%)'
                : 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)';

              return (
                <div
                  key={client.id || client._id || client.qrId || i}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.80rem', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '5px',
                          background: rankBg,
                          color: rankColor,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {displayName}
                      </span>
                      {client.qrId && (
                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontFamily: 'monospace',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.12)',
                            color: '#818CF8',
                            flexShrink: 0
                          }}
                        >
                          {client.qrId}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', whiteSpace: 'nowrap', marginLeft: '10px' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{reviewCount}</strong> review{reviewCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.07)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(pct, reviewCount > 0 ? 5 : 2)}%`,
                        height: '100%',
                        background: barGradient,
                        borderRadius: '4px',
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
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
  );
}
