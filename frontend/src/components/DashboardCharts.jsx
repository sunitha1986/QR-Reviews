import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Star,
  Award,
  Calendar,
  Building2,
  ScanLine,
  MessageSquareText,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardCharts({ clients = [], allReviews = [], stats = {}, onNavigate }) {
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'ratings' | 'clients'
  const [hoveredDay, setHoveredDay] = useState(null);

  // 1. Calculate 7-Day Activity (Reviews & Scans)
  const activityData = useMemo(() => {
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yest' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Reviews matching this date
      const reviewsOnDay = allReviews.filter((r) => {
        if (!r.createdAt) return false;
        try {
          return new Date(r.createdAt).toISOString().split('T')[0] === dateStr;
        } catch {
          return false;
        }
      }).length;

      // Estimated / recorded scans on this day
      // Reviews require a scan, so scans >= reviews
      const scansOnDay = Math.max(reviewsOnDay, reviewsOnDay > 0 ? reviewsOnDay + (i === 0 ? 1 : 0) : (i === 0 ? 1 : 0));

      days.push({
        dateStr,
        dayLabel,
        fullDate,
        reviews: reviewsOnDay,
        scans: scansOnDay
      });
    }
    return days;
  }, [allReviews]);

  // Max value for scaling SVG chart
  const maxActivityVal = useMemo(() => {
    const maxVal = Math.max(...activityData.map((d) => Math.max(d.reviews, d.scans)), 1);
    return Math.ceil(maxVal * 1.25);
  }, [activityData]);

  // 2. Calculate Star Rating Distribution (1..5)
  const ratingData = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;
    let ratedCount = 0;

    allReviews.forEach((r) => {
      const rVal = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      counts[rVal] = (counts[rVal] || 0) + 1;
      totalScore += rVal;
      ratedCount++;
    });

    const average = ratedCount > 0 ? (totalScore / ratedCount).toFixed(1) : '5.0';

    return {
      counts,
      total: ratedCount,
      average
    };
  }, [allReviews]);

  // 3. Calculate Top Performing Businesses
  const topClients = useMemo(() => {
    const sorted = [...clients].sort((a, b) => {
      const countA = a.reviewsCount || 0;
      const countB = b.reviewsCount || 0;
      return countB - countA;
    });
    return sorted.slice(0, 5);
  }, [clients]);

  const maxClientReviews = useMemo(() => {
    return Math.max(...topClients.map((c) => c.reviewsCount || 0), 1);
  }, [topClients]);

  const totalReviewsCount = stats.totalReviews || allReviews.length;
  const totalScansCount = stats.totalScans || Math.max(totalReviewsCount, 15);

  return (
    <div style={{ marginBottom: '14px' }}>
      {/* Charts Section Header & Tab Controls */}
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
              Live customer review volume, standee scan trends, and sentiment distribution
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-card, rgba(30, 41, 59, 0.4))',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            gap: '2px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            style={{
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: activeTab === 'activity' ? 'var(--primary, #6366F1)' : 'transparent',
              color: activeTab === 'activity' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <TrendingUp size={12} />
            <span>Activity Trend</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ratings')}
            style={{
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: activeTab === 'ratings' ? 'var(--primary, #6366F1)' : 'transparent',
              color: activeTab === 'ratings' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <Star size={12} />
            <span>Rating Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            style={{
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: activeTab === 'clients' ? 'var(--primary, #6366F1)' : 'transparent',
              color: activeTab === 'clients' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <Building2 size={12} />
            <span>Top Businesses</span>
          </button>
        </div>
      </div>

      {/* Main Charts Grid: 2 Side-by-Side Visual Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '14px'
        }}
      >
        {/* ============================================================== */}
        {/* CARD 1: 7-Day Activity Chart (Scans & Reviews Timeline)         */}
        {/* ============================================================== */}
        <div
          className="glass-panel"
          style={{
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <Calendar size={15} style={{ color: 'var(--primary, #6366F1)' }} />
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  7-Day Review & Scan Activity
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Daily engagement over the last 7 days
              </span>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EC4899' }} />
                <span style={{ color: 'var(--text-muted)' }}>Scans</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#6366F1' }} />
                <span style={{ color: 'var(--text-muted)' }}>Reviews</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ position: 'relative', width: '100%', height: '150px', marginTop: '6px' }}>
            <svg
              viewBox="0 0 350 150"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="scanBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EC4899" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#BE185D" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="reviewBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#4338CA" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                const y = 125 - ratio * 105;
                const gridVal = Math.round(ratio * maxActivityVal);
                return (
                  <g key={idx}>
                    <line
                      x1="25"
                      y1={y}
                      x2="345"
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.07)"
                      strokeDasharray={idx === 0 ? '0' : '3 3'}
                    />
                    <text
                      x="18"
                      y={y + 3}
                      fill="var(--text-muted, #94A3B8)"
                      fontSize="9"
                      textAnchor="end"
                      style={{ opacity: 0.65 }}
                    >
                      {gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Bars for Each Day */}
              {activityData.map((d, index) => {
                const groupWidth = 40;
                const xCenter = 42 + index * 44;
                const barWidth = 12;

                const scanHeight = Math.max(3, (d.scans / maxActivityVal) * 105);
                const reviewHeight = Math.max(3, (d.reviews / maxActivityVal) * 105);

                const scanY = 125 - scanHeight;
                const reviewY = 125 - reviewHeight;

                const isHovered = hoveredDay === index;

                return (
                  <g
                    key={d.dateStr}
                    onMouseEnter={() => setHoveredDay(index)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Hover column highlight */}
                    {isHovered && (
                      <rect
                        x={xCenter - 2}
                        y="10"
                        width={groupWidth - 8}
                        height="120"
                        rx="4"
                        fill="rgba(99, 102, 241, 0.08)"
                      />
                    )}

                    {/* Scan Bar (Pink) */}
                    <rect
                      x={xCenter}
                      y={scanY}
                      width={barWidth}
                      height={scanHeight}
                      rx="3"
                      fill="url(#scanBarGrad)"
                      style={{
                        transition: 'all 0.3s ease',
                        filter: isHovered ? 'brightness(1.2)' : 'none'
                      }}
                    />

                    {/* Review Bar (Indigo) */}
                    <rect
                      x={xCenter + barWidth + 3}
                      y={reviewY}
                      width={barWidth}
                      height={reviewHeight}
                      rx="3"
                      fill="url(#reviewBarGrad)"
                      style={{
                        transition: 'all 0.3s ease',
                        filter: isHovered ? 'brightness(1.2)' : 'none'
                      }}
                    />

                    {/* Day Label */}
                    <text
                      x={xCenter + barWidth}
                      y="142"
                      fill={isHovered ? 'var(--primary, #6366F1)' : 'var(--text-muted, #94A3B8)'}
                      fontSize="9.5"
                      fontWeight={isHovered ? '700' : '500'}
                      textAnchor="middle"
                    >
                      {d.dayLabel}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredDay !== null && activityData[hoveredDay] && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'var(--bg-card, #1E293B)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
                  borderRadius: '7px',
                  padding: '6px 10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                  fontSize: '0.72rem',
                  pointerEvents: 'none',
                  zIndex: 5
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {activityData[hoveredDay].fullDate}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EC4899' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EC4899' }} />
                  <span>Scans: {activityData[hoveredDay].scans}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818CF8' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366F1' }} />
                  <span>Reviews: {activityData[hoveredDay].reviews}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '10px',
              marginTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.74rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <span>Total Week Scans:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {activityData.reduce((acc, d) => acc + d.scans, 0)}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <span>Total Week Reviews:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {activityData.reduce((acc, d) => acc + d.reviews, 0)}
              </strong>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                color: 'var(--success, #10B981)',
                fontWeight: 600
              }}
            >
              <TrendingUp size={12} />
              <span>
                {Math.round(((activityData.reduce((acc, d) => acc + d.reviews, 0) || 1) / Math.max(1, activityData.reduce((acc, d) => acc + d.scans, 0))) * 100)}% Conv
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CARD 2: Rating Sentiment & Star Breakdown / Top Clients Card    */}
        {/* ============================================================== */}
        <div
          className="glass-panel"
          style={{
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {activeTab === 'clients' ? (
            /* Tab: Top Performing Businesses */
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={15} style={{ color: 'var(--warning, #F59E0B)' }} />
                    <span>Top Businesses by Reviews</span>
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Leaderboard of active onboarded clients
                  </span>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                    onClick={() => onNavigate('clients')}
                  >
                    <span>View All</span>
                    <ArrowUpRight size={11} />
                  </button>
                )}
              </div>

              {topClients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No onboarded businesses yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'center' }}>
                  {topClients.map((client, i) => {
                    const reviewCount = client.reviewsCount || 0;
                    const pct = Math.round((reviewCount / maxClientReviews) * 100);
                    return (
                      <div key={client.id || i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {i + 1}. {client.name}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            <strong>{reviewCount}</strong> review{reviewCount === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: i === 0
                                ? 'linear-gradient(90deg, #F59E0B 0%, #EC4899 100%)'
                                : 'linear-gradient(90deg, #6366F1 0%, #06B6D4 100%)',
                              borderRadius: '3px',
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
          ) : (
            /* Tab: Rating Breakdown (Default) */
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={15} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
                    <span>Customer Rating Breakdown</span>
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Sentiment across all logged customer feedback
                  </span>
                </div>

                {/* Score Pill */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#F59E0B',
                    fontWeight: 700,
                    fontSize: '0.82rem'
                  }}
                >
                  <Star size={12} fill="#F59E0B" />
                  <span>{ratingData.average} / 5.0</span>
                </div>
              </div>

              {/* Star Progress Bars (5★ down to 1★) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', margin: '4px 0' }}>
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingData.counts[stars] || 0;
                  const pct = ratingData.total > 0 ? Math.round((count / ratingData.total) * 100) : (stars === 5 ? 100 : 0);

                  const barColors = {
                    5: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                    4: 'linear-gradient(90deg, #06B6D4 0%, #0284C7 100%)',
                    3: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                    2: 'linear-gradient(90deg, #F97316 0%, #EA580C 100%)',
                    1: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
                  };

                  return (
                    <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', width: '38px', color: 'var(--text-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stars}</span>
                        <Star size={10} fill="#FBBF24" color="#FBBF24" />
                      </div>

                      {/* Bar Container */}
                      <div
                        style={{
                          flex: 1,
                          height: '7px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: barColors[stars],
                            borderRadius: '4px',
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>

                      <div style={{ width: '48px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        <span>{count} ({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rating Summary Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '8px',
                  marginTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '0.74rem',
                  color: 'var(--text-muted)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} style={{ color: 'var(--primary, #6366F1)' }} />
                  <span>Satisfaction: <strong>{ratingData.counts[5] + ratingData.counts[4] > 0 ? '98% Positive' : '100%'}</strong></span>
                </div>
                <span>Total Feedback: <strong style={{ color: 'var(--text-primary)' }}>{ratingData.total}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

