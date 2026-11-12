import React from 'react';
import headerWaveBanner from '../assets/header_wave_banner.jpg';

/**
 * Base Shimmer Block with purple ambient gradient wave
 */
export function ShimmerBlock({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  style = {},
  className = ''
}) {
  return (
    <div
      className={`shimmer-block ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
}

/**
 * Dashboard Full Page Shimmer
 */
export function DashboardShimmer() {
  return (
    <div className="fade-in dashboard-page" aria-busy="true" aria-label="Loading dashboard...">
      {/* Decorative Wavy Ambient Background */}
      <div className="dashboard-wavy-backdrop" aria-hidden="true">
        <img
          src={headerWaveBanner}
          alt=""
          className="dashboard-wavy-img"
        />
        <div className="dashboard-wavy-gradient-overlay" />
      </div>

      {/* Quick Action Bar Shimmer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShimmerBlock width="160px" height="28px" borderRadius="8px" />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ShimmerBlock width="85px" height="34px" borderRadius="8px" />
          <ShimmerBlock width="120px" height="34px" borderRadius="8px" />
          <ShimmerBlock width="135px" height="34px" borderRadius="8px" />
        </div>
      </div>

      {/* KPI Cards Grid Shimmer */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ShimmerBlock width="48px" height="48px" borderRadius="12px" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <ShimmerBlock width="60%" height="24px" style={{ marginBottom: '8px' }} />
              <ShimmerBlock width="85%" height="13px" />
            </div>
          </div>
        ))}
      </div>

      {/* Standee Deployment & Inventory Status Shimmer */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <ShimmerBlock width="260px" height="20px" style={{ marginBottom: '8px' }} />
            <ShimmerBlock width="340px" height="13px" />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <ShimmerBlock width="145px" height="32px" borderRadius="6px" />
            <ShimmerBlock width="120px" height="32px" borderRadius="6px" />
          </div>
        </div>
        <ShimmerBlock width="100%" height="12px" borderRadius="6px" />
      </div>

      {/* Multi-Column Section: Onboarded Businesses & Recent Customer Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Card 1: Recent Onboarded Businesses */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <ShimmerBlock width="180px" height="20px" />
            <ShimmerBlock width="60px" height="24px" borderRadius="6px" />
          </div>
          {[1, 2, 3, 4].map((row) => (
            <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <ShimmerBlock width="38px" height="38px" borderRadius="9px" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <ShimmerBlock width="55%" height="15px" style={{ marginBottom: '6px' }} />
                <ShimmerBlock width="75%" height="12px" />
              </div>
              <ShimmerBlock width="70px" height="24px" borderRadius="6px" />
            </div>
          ))}
        </div>

        {/* Card 2: Customer Reviews Feed */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <ShimmerBlock width="170px" height="20px" />
            <ShimmerBlock width="60px" height="24px" borderRadius="6px" />
          </div>
          {[1, 2, 3, 4].map((row) => (
            <div key={row} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShimmerBlock width="26px" height="26px" borderRadius="50%" />
                  <ShimmerBlock width="90px" height="13px" />
                </div>
                <ShimmerBlock width="70px" height="14px" />
              </div>
              <ShimmerBlock width="95%" height="13px" style={{ marginBottom: '6px' }} />
              <ShimmerBlock width="65%" height="12px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Universal Table View Shimmer
 * Used in All Clients, Customer Reviews, Business Categories, QR Catalog
 */
export function TableShimmer({
  columns = 5,
  rows = 5,
  showHeaderActions = true,
  title = 'Loading...'
}) {
  return (
    <div className="fade-in" aria-busy="true" aria-label={`Loading ${title}...`}>
      {showHeaderActions && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '400px' }}>
            <ShimmerBlock width="100%" height="38px" borderRadius="8px" />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <ShimmerBlock width="90px" height="38px" borderRadius="8px" />
            <ShimmerBlock width="130px" height="38px" borderRadius="8px" />
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {/* Table Header Placeholder */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '16px',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          {Array.from({ length: columns }).map((_, c) => (
            <ShimmerBlock key={c} width={`${Math.floor(50 + Math.random() * 35)}%`} height="14px" />
          ))}
        </div>

        {/* Table Rows Placeholder */}
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: '16px',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Column 1: Avatar + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShimmerBlock width="38px" height="38px" borderRadius="9px" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <ShimmerBlock width="80%" height="15px" style={{ marginBottom: '6px' }} />
                <ShimmerBlock width="50%" height="12px" />
              </div>
            </div>

            {/* Other Columns */}
            {Array.from({ length: columns - 1 }).map((_, c) => (
              <div key={c}>
                <ShimmerBlock width={`${Math.floor(45 + Math.random() * 45)}%`} height="14px" style={{ marginBottom: '4px' }} />
                {c === 0 && <ShimmerBlock width="35%" height="11px" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * QR Generator Page Shimmer
 */
export function QrGeneratorShimmer() {
  return (
    <div className="fade-in" aria-busy="true" aria-label="Loading QR generator...">
      {/* Top 3 Generator Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Card 1: Single QR */}
        <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <ShimmerBlock width="34px" height="34px" borderRadius="8px" />
            <ShimmerBlock width="170px" height="18px" />
          </div>
          <ShimmerBlock width="100%" height="40px" borderRadius="8px" style={{ marginBottom: '14px' }} />
          <ShimmerBlock width="100%" height="40px" borderRadius="8px" style={{ marginBottom: '14px' }} />
          <div style={{ marginTop: 'auto' }}>
            <ShimmerBlock width="100%" height="42px" borderRadius="8px" />
          </div>
        </div>

        {/* Card 2: Batch Generator */}
        <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <ShimmerBlock width="34px" height="34px" borderRadius="8px" />
            <ShimmerBlock width="160px" height="18px" />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            {[1, 2, 3, 4].map(b => (
              <ShimmerBlock key={b} width="55px" height="32px" borderRadius="8px" />
            ))}
          </div>
          <ShimmerBlock width="100%" height="40px" borderRadius="8px" style={{ marginBottom: '14px' }} />
          <div style={{ marginTop: 'auto' }}>
            <ShimmerBlock width="100%" height="42px" borderRadius="8px" />
          </div>
        </div>

        {/* Card 3: Active Dynamic QR Preview */}
        <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <ShimmerBlock width="34px" height="34px" borderRadius="8px" />
            <ShimmerBlock width="180px" height="18px" />
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
            <ShimmerBlock width="130px" height="130px" borderRadius="12px" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ShimmerBlock width="100%" height="30px" borderRadius="6px" />
              <ShimmerBlock width="100%" height="30px" borderRadius="6px" />
              <ShimmerBlock width="100%" height="30px" borderRadius="6px" />
              <ShimmerBlock width="100%" height="30px" borderRadius="6px" />
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Table Shimmer */}
      <TableShimmer columns={6} rows={5} title="Dynamic QRs Catalog" />
    </div>
  );
}

/**
 * Analytics Page Shimmer
 */
export function AnalyticsShimmer() {
  return (
    <div className="fade-in" aria-busy="true" aria-label="Loading analytics...">
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
        <ShimmerBlock width="220px" height="26px" borderRadius="8px" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <ShimmerBlock width="120px" height="34px" borderRadius="8px" />
          <ShimmerBlock width="140px" height="34px" borderRadius="8px" />
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ShimmerBlock width="46px" height="46px" borderRadius="12px" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <ShimmerBlock width="55%" height="22px" style={{ marginBottom: '8px' }} />
              <ShimmerBlock width="80%" height="13px" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <ShimmerBlock width="200px" height="20px" style={{ marginBottom: '18px' }} />
          <ShimmerBlock width="100%" height="220px" borderRadius="10px" />
        </div>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <ShimmerBlock width="200px" height="20px" style={{ marginBottom: '18px' }} />
          <ShimmerBlock width="100%" height="220px" borderRadius="10px" />
        </div>
      </div>

      {/* Bottom Table */}
      <TableShimmer columns={5} rows={4} showHeaderActions={false} title="Client Analytics" />
    </div>
  );
}

/**
 * Client Profile Page Shimmer
 */
export function ClientProfileShimmer() {
  return (
    <div className="fade-in" aria-busy="true" aria-label="Loading client profile...">
      {/* Top Banner & Quick Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
        <ShimmerBlock width="200px" height="26px" borderRadius="8px" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <ShimmerBlock width="120px" height="34px" borderRadius="8px" />
          <ShimmerBlock width="140px" height="34px" borderRadius="8px" />
        </div>
      </div>

      {/* 2-Column Profile Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Left: Business Info Card */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
            <ShimmerBlock width="64px" height="64px" borderRadius="14px" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <ShimmerBlock width="70%" height="22px" style={{ marginBottom: '8px' }} />
              <ShimmerBlock width="40%" height="15px" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <ShimmerBlock width="100%" height="40px" borderRadius="8px" />
            <ShimmerBlock width="100%" height="40px" borderRadius="8px" />
            <ShimmerBlock width="100%" height="40px" borderRadius="8px" />
            <ShimmerBlock width="100%" height="40px" borderRadius="8px" />
          </div>
        </div>

        {/* Right: Standee QR Card */}
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <ShimmerBlock width="200px" height="20px" style={{ margin: '0 auto 18px auto' }} />
          <ShimmerBlock width="180px" height="180px" borderRadius="14px" style={{ margin: '0 auto 20px auto' }} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            <ShimmerBlock width="120px" height="36px" borderRadius="8px" />
            <ShimmerBlock width="120px" height="36px" borderRadius="8px" />
          </div>
          <ShimmerBlock width="100%" height="160px" borderRadius="10px" />
        </div>
      </div>
    </div>
  );
}

/**
 * Customer Review Page Shimmer
 * Replaces the spinner inside CustomerReviewForm
 */
export function CustomerReviewShimmer() {
  return (
    <div className="customer-card fade-in" style={{ padding: 0, overflow: 'hidden' }} aria-busy="true" aria-label="Loading customer review experience...">
      {/* Top Bar Shimmer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <ShimmerBlock width="160px" height="16px" borderRadius="4px" />
        <ShimmerBlock width="28px" height="28px" borderRadius="8px" />
      </div>

      {/* Header Banner Shimmer */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <ShimmerBlock width="46px" height="46px" borderRadius="10px" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <ShimmerBlock width="55%" height="20px" style={{ marginBottom: '8px' }} />
          <ShimmerBlock width="40%" height="13px" />
        </div>
      </div>

      {/* Form Body Shimmer */}
      <div style={{ padding: '24px 20px' }}>
        {/* Prompt Chips Shimmer */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {[1, 2, 3, 4].map((c) => (
            <ShimmerBlock key={c} width={`${75 + c * 15}px`} height="30px" borderRadius="20px" />
          ))}
        </div>

        {/* Text Area Shimmer */}
        <ShimmerBlock width="100%" height="90px" borderRadius="10px" style={{ marginBottom: '18px' }} />

        {/* Input Fields Shimmer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
          <ShimmerBlock width="100%" height="42px" borderRadius="8px" />
          <ShimmerBlock width="100%" height="42px" borderRadius="8px" />
        </div>

        {/* Submit CTA Button Shimmer */}
        <ShimmerBlock width="100%" height="48px" borderRadius="12px" />
      </div>
    </div>
  );
}

/**
 * Review Suggestions List Shimmer
 * Smoothly displays while switching language tabs or fetching fresh options
 */
export function ReviewSuggestionsShimmer() {
  return (
    <div className="review-suggestions-list" style={{ gap: '8px', overflowY: 'hidden' }} aria-busy="true" aria-label="Loading review options...">
      {/* Option 1: 2-liner */}
      <div className="review-suggestion-card" style={{ padding: '12px 14px', pointerEvents: 'none', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.15)' }}>
        <ShimmerBlock width="88%" height="14px" borderRadius="4px" style={{ marginBottom: '6px' }} />
        <ShimmerBlock width="62%" height="13px" borderRadius="4px" />
      </div>

      {/* Option 2: 4-liner (Highlight detailed option) */}
      <div className="review-suggestion-card" style={{ padding: '12px 14px', pointerEvents: 'none', background: 'rgba(139, 92, 246, 0.08)', borderColor: 'rgba(168, 85, 247, 0.28)' }}>
        <ShimmerBlock width="95%" height="14px" borderRadius="4px" style={{ marginBottom: '6px' }} />
        <ShimmerBlock width="90%" height="13px" borderRadius="4px" style={{ marginBottom: '6px' }} />
        <ShimmerBlock width="85%" height="13px" borderRadius="4px" style={{ marginBottom: '6px' }} />
        <ShimmerBlock width="68%" height="13px" borderRadius="4px" />
      </div>

      {/* Option 3: 3-liner */}
      <div className="review-suggestion-card" style={{ padding: '12px 14px', pointerEvents: 'none', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.15)' }}>
        <ShimmerBlock width="92%" height="14px" borderRadius="4px" style={{ marginBottom: '6px' }} />
        <ShimmerBlock width="84%" height="13px" borderRadius="4px" style={{ marginBottom: '6px' }} />
        <ShimmerBlock width="54%" height="13px" borderRadius="4px" />
      </div>

      {/* Option 4: 2-liner */}
      <div className="review-suggestion-card" style={{ padding: '12px 14px', pointerEvents: 'none', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.15)' }}>
        <ShimmerBlock width="82%" height="14px" borderRadius="4px" style={{ marginBottom: '6px' }} />
        <ShimmerBlock width="58%" height="13px" borderRadius="4px" />
      </div>
    </div>
  );
}

export default {
  ShimmerBlock,
  DashboardShimmer,
  TableShimmer,
  QrGeneratorShimmer,
  AnalyticsShimmer,
  ClientProfileShimmer,
  CustomerReviewShimmer,
  ReviewSuggestionsShimmer
};
