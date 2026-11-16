import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  Sparkles,
  MapPin,
  Star,
  Scissors,
  Layers,
  ChevronLeft,
  ChevronRight,
  Grid
} from 'lucide-react';
import { getImageUrl } from '../config';
import vasmiFullLogo from '../assets/vasmi_full_logo.png';
import vasmiIcon from '../assets/vasmi_icon.png';

// Helper to calculate grid columns and rows based on qrsPerPage
function getGridLayout(qrsPerPage) {
  const n = parseInt(qrsPerPage, 10) || 1;
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n === 2) return { cols: 2, rows: 1 };
  if (n <= 4) return { cols: 2, rows: 2 };
  if (n <= 6) return { cols: 2, rows: 3 };
  if (n <= 8) return { cols: 2, rows: 4 };
  if (n <= 9) return { cols: 3, rows: 3 };
  if (n <= 12) return { cols: 3, rows: 4 };
  if (n <= 16) return { cols: 4, rows: 4 };
  if (n <= 20) return { cols: 4, rows: 5 };
  return { cols: 4, rows: Math.ceil(n / 4) };
}

// Single Standee Card scaled dynamically for the grid
function StandeeCardItem({ qr, client, qrsPerPage, showCutGuides = true, isMiniPreview = false }) {
  const n = parseInt(qrsPerPage, 10) || 1;
  const clientName = client?.name || qr?.assignedClient?.name || (qr?.status === 'unassigned' ? 'Dynamic Review Standee' : 'Valued Business Partner');
  const clientLocation = client?.businessLocation || client?.address || qr?.assignedClient?.businessLocation || qr?.assignedClient?.address || '';
  const clientLogo = client?.logoUrl || qr?.assignedClient?.logoUrl || null;
  const qrUrl = qr?.filePath ? getImageUrl(qr.filePath) : getImageUrl(`/uploads/qr-codes/${qr.filename || `${qr.qrId}.png`}`);

  // Dynamic scaling parameters
  const is1 = n === 1;
  const is2 = n === 2;
  const is4 = n >= 3 && n <= 4;
  const is6 = n >= 5 && n <= 6;
  const is8 = n >= 7 && n <= 8;
  const is12 = n >= 9;

  const cardPadding = is1
    ? (isMiniPreview ? '14px 12px' : '20px 18px')
    : is2
      ? (isMiniPreview ? '10px 8px' : '14px 12px')
      : is4
        ? (isMiniPreview ? '8px 6px' : '10px 8px')
        : is6
          ? (isMiniPreview ? '6px 4px' : '8px 6px')
          : (isMiniPreview ? '4px 3px' : '6px 4px');

  const logoSize = is1 ? 48 : is2 ? 38 : is4 ? 32 : is6 ? 26 : 22;
  const qrSize = is1 ? (isMiniPreview ? 140 : 210) : is2 ? (isMiniPreview ? 110 : 155) : is4 ? (isMiniPreview ? 80 : 115) : is6 ? (isMiniPreview ? 65 : 92) : is8 ? (isMiniPreview ? 55 : 76) : (isMiniPreview ? 46 : 64);
  const nameFontSize = is1 ? '1.35rem' : is2 ? '1.1rem' : is4 ? '0.9rem' : is6 ? '0.8rem' : '0.72rem';
  const subFontSize = is1 ? '0.82rem' : is2 ? '0.74rem' : is4 ? '0.68rem' : '0.62rem';
  const ctaFontSize = is1 ? '0.96rem' : is2 ? '0.84rem' : is4 ? '0.76rem' : is6 ? '0.7rem' : '0.62rem';
  const starsSize = is1 ? 16 : is2 ? 14 : is4 ? 12 : is6 ? 10 : 9;

  return (
    <div
      className={`print-standee-card ${showCutGuides ? 'has-cut-guides' : 'no-cut-guides'}`}
      style={{
        background: '#FFFFFF',
        color: '#0F172A',
        padding: cardPadding,
        borderRadius: showCutGuides ? '6px' : '10px',
        border: showCutGuides ? '1.5px dashed #94A3B8' : '1.5px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        boxShadow: isMiniPreview ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
        overflow: 'hidden'
      }}
    >
      {/* Cut scissors indicator badge in top right corner if cut guides are on */}
      {showCutGuides && !is1 && (
        <div
          className="no-print"
          style={{
            position: 'absolute',
            top: '3px',
            right: '3px',
            opacity: 0.45,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '0.55rem',
            color: '#64748B'
          }}
          title="Cut line"
        >
          <Scissors size={10} />
        </div>
      )}

      {/* Top Header: Business Logo & Name */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {clientLogo && (
          <div
            style={{
              width: `${logoSize}px`,
              height: `${logoSize}px`,
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              margin: '0 auto 4px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}
          >
            <img
              src={getImageUrl(clientLogo)}
              alt={clientName}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        )}

        <h3
          style={{
            fontSize: nameFontSize,
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 1px 0',
            letterSpacing: '-0.3px',
            lineHeight: 1.15,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: is12 ? 'nowrap' : 'normal'
          }}
        >
          {clientName}
        </h3>

        {/* STAND-ID Badge for unassigned standees */}
        {qr?.status === 'unassigned' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#F1F5F9',
              border: '1.5px solid #0F172A',
              borderRadius: '4px',
              padding: is12 ? '1px 6px' : '2px 8px',
              margin: '2px auto 4px auto',
              fontWeight: 900,
              fontSize: is1 ? '1.05rem' : is4 ? '0.85rem' : '0.74rem',
              color: '#0F172A',
              letterSpacing: '0.04em'
            }}
          >
            <span style={{ fontSize: '0.62rem', color: '#64748B', fontWeight: 700 }}>STAND-ID:</span>
            <span>{qr.qrId}</span>
          </div>
        )}

        {/* Location Subtitle (if available and card has room) */}
        {!is12 && clientLocation ? (
          <p
            style={{
              fontSize: subFontSize,
              color: '#475569',
              margin: '0 auto 4px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              lineHeight: 1.1,
              maxWidth: '92%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <MapPin size={11} style={{ color: '#4F46E5', flexShrink: 0 }} />
            <span>{clientLocation}</span>
          </p>
        ) : null}
      </div>

      {/* QR Code Frame */}
      <div
        style={{
          background: '#FFFFFF',
          padding: is1 ? '8px' : is4 ? '5px' : '4px',
          border: '1.5px solid #E2E8F0',
          borderRadius: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '2px auto',
          boxShadow: '0 2px 5px rgba(0,0,0,0.04)'
        }}
      >
        <img
          src={qrUrl}
          alt={`QR Code ${qr?.qrId || ''}`}
          style={{
            width: `${qrSize}px`,
            height: `${qrSize}px`,
            display: 'block',
            objectFit: 'contain'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getImageUrl(`/uploads/qr-codes/${qr?.qrId}.png`);
          }}
        />
      </div>

      {/* Five Stars & Review Call to Action */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', margin: '2px 0 3px 0' }}>
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={starsSize} fill="#F59E0B" color="#F59E0B" />
          ))}
        </div>

        <div
          style={{
            fontSize: ctaFontSize,
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.15
          }}
        >
          {is12 ? 'Scan to Review' : 'Scan with Phone Camera'}
        </div>

        {!is8 && !is12 && (
          <div
            style={{
              fontSize: '0.64rem',
              color: '#64748B',
              marginTop: '1px'
            }}
          >
            Instant review • No app required
          </div>
        )}
      </div>

      {/* Vasmi Group Standee Footer */}
      <div
        style={{
          width: '100%',
          marginTop: is1 ? '8px' : '4px',
          paddingTop: is1 ? '6px' : '3px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          flexWrap: 'nowrap'
        }}
      >
        <span
          style={{
            fontSize: is12 ? '0.56rem' : is8 ? '0.60rem' : is4 ? '0.64rem' : '0.68rem',
            color: '#64748B',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}
        >
          Designed and Developed by
        </span>
        <span className="vasmi-logo-wrapper" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <img
            src={vasmiFullLogo}
            alt="Vasmi Group - Creating Your Identity"
            className="vasmi-full-logo-img"
            style={{
              height: is12 ? '10px' : is8 ? '11px' : is4 ? '13px' : '15px',
              width: 'auto',
              display: 'inline-block',
              objectFit: 'contain'
            }}
          />
        </span>
      </div>
    </div>
  );
}

export default function PrintModal({ qr, client, onClose }) {
  // QRs per A4 page setting (1, 2, 4, 6, 8, 12 or custom input)
  const [qrsPerPage, setQrsPerPage] = useState(1);
  // Total A4 sheet copies
  const [sheetCopies, setSheetCopies] = useState(1);
  // Cut guidelines (dashed borders)
  const [showCutGuides, setShowCutGuides] = useState(true);
  // Active preview page
  const [previewPage, setPreviewPage] = useState(1);

  if (!qr) return null;

  const clientName = client?.name || qr?.assignedClient?.name || (qr?.status === 'unassigned' ? 'Dynamic Review Standee' : 'Valued Business Partner');
  const qrUrl = qr?.filePath ? getImageUrl(qr.filePath) : getImageUrl(`/uploads/qr-codes/${qr.filename || `${qr.qrId}.png`}`);

  // Presets
  const presets = [
    { count: 1, label: '1 / Page', desc: 'Full A4 Standee' },
    { count: 2, label: '2 / Page', desc: 'Half-Page Cards' },
    { count: 4, label: '4 / Page', desc: 'Quarter / A6 Cards (Recommended)' },
    { count: 6, label: '6 / Page', desc: '2×3 Table Cards' },
    { count: 8, label: '8 / Page', desc: '2×4 Mini Cards' },
    { count: 12, label: '12 / Page', desc: '3×4 Stickers' }
  ];

  const handlePrint = () => {
    window.print();
  };

  const parsedQrsPerPage = Math.max(1, Math.min(24, parseInt(qrsPerPage, 10) || 1));
  const parsedSheetCopies = Math.max(1, Math.min(20, parseInt(sheetCopies, 10) || 1));
  const totalCardsToPrint = parsedQrsPerPage * parsedSheetCopies;
  const { cols, rows } = getGridLayout(parsedQrsPerPage);

  // Generate pages array
  const pagesList = Array.from({ length: parsedSheetCopies }, (_, i) => i + 1);

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '95%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          background: 'var(--card-bg, #0F172A)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(59, 130, 246, 0.2))',
                color: 'var(--primary, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(139, 92, 246, 0.35)'
              }}
            >
              <Printer size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Official Review Standee & Cards Printout
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Configure QRs per A4 sheet setting to hand out to <strong>{clientName}</strong> during onboarding
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', padding: '6px', width: '32px', height: '32px' }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* SETTINGS CONTROLS PANEL: QRs Per A4 Page */}
        <div
          className="no-print"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '12px',
            flexShrink: 0
          }}
        >
          {/* Row 1: Setting Label & Presets */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Grid size={15} style={{ color: 'var(--primary, #8B5CF6)' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                QRs per A4 Sheet Setting:
              </span>
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              {presets.map((p) => {
                const isSelected = parsedQrsPerPage === p.count;
                return (
                  <button
                    key={p.count}
                    type="button"
                    onClick={() => {
                      setQrsPerPage(p.count);
                      setShowCutGuides(p.count > 1);
                    }}
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      fontSize: '0.74rem',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: isSelected ? 700 : 500
                    }}
                    title={p.desc}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Custom Number Inputs & Options */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Custom Input: QRs per page */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Exact QRs / Sheet:</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={qrsPerPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setQrsPerPage(isNaN(val) ? '' : Math.max(1, Math.min(24, val)));
                  }}
                  style={{
                    width: '54px',
                    height: '26px',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Number of A4 Sheets / Copies */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>A4 Sheets to Print:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={sheetCopies}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setSheetCopies(isNaN(val) ? 1 : Math.max(1, Math.min(20, val)));
                  }}
                  style={{
                    width: '50px',
                    height: '26px',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Cut Guidelines Checkbox */}
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.76rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={showCutGuides}
                  onChange={(e) => setShowCutGuides(e.target.checked)}
                  style={{ accentColor: 'var(--primary, #8B5CF6)' }}
                />
                <span>Cut Guidelines (dashed scissors border)</span>
              </label>
            </div>

            {/* Total Summary Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.76rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '3px 10px',
                borderRadius: '6px',
                color: '#10B981',
                fontWeight: 700
              }}
            >
              <Sparkles size={12} />
              <span>
                Total {totalCardsToPrint} Card{totalCardsToPrint > 1 ? 's' : ''} ({parsedSheetCopies} A4 Sheet{parsedSheetCopies > 1 ? 's' : ''})
              </span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE A4 LIVE PREVIEW (On Screen Only) */}
        <div
          className="no-print"
          style={{
            flex: 1,
            minHeight: '260px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {/* Pagination bar if multiple sheets */}
          {parsedSheetCopies > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                disabled={previewPage <= 1}
                style={{ padding: '2px 6px' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                A4 Sheet {previewPage} of {parsedSheetCopies}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewPage(p => Math.min(parsedSheetCopies, p + 1))}
                disabled={previewPage >= parsedSheetCopies}
                style={{ padding: '2px 6px' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Scaled A4 Sheet Container */}
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              aspectRatio: '1 / 1.414',
              background: '#FFFFFF',
              borderRadius: '8px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              padding: '12px',
              boxSizing: 'border-box',
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gap: parsedQrsPerPage <= 2 ? '10px' : parsedQrsPerPage <= 4 ? '8px' : '6px'
            }}
          >
            {[...Array(parsedQrsPerPage)].map((_, i) => (
              <StandeeCardItem
                key={i}
                qr={qr}
                client={client}
                qrsPerPage={parsedQrsPerPage}
                showCutGuides={showCutGuides}
                isMiniPreview={true}
              />
            ))}
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '14px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Layout: <strong>{parsedQrsPerPage} QR{parsedQrsPerPage > 1 ? 's' : ''}</strong> per A4 sheet ({cols} cols × {rows} rows)
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={qrUrl}
              download={`${qr.qrId || 'standee'}.png`}
              className="btn btn-secondary btn-sm"
              id="btn-modal-download-png"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Download size={14} />
              <span>Download PNG</span>
            </a>

            <button
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              id="btn-modal-print-standee"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                border: 'none',
                padding: '6px 16px'
              }}
            >
              <Printer size={15} />
              <span>Print {parsedSheetCopies} A4 Sheet{parsedSheetCopies > 1 ? 's' : ''} ({totalCardsToPrint} QRs)</span>
            </button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* PRINTABLE CONTAINER (Only visible during window.print())   */}
        {/* ========================================================== */}
        <div id="printable-standee-container">
          {pagesList.map((pageNum) => (
            <div
              key={pageNum}
              className="a4-print-page"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap: parsedQrsPerPage <= 2 ? '10mm' : parsedQrsPerPage <= 4 ? '7mm' : '5mm'
              }}
            >
              {[...Array(parsedQrsPerPage)].map((_, cardIndex) => (
                <StandeeCardItem
                  key={cardIndex}
                  qr={qr}
                  client={client}
                  qrsPerPage={parsedQrsPerPage}
                  showCutGuides={showCutGuides}
                  isMiniPreview={false}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
