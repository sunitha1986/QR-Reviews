import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  QrCode,
  Layers,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Grid,
  Scissors,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getImageUrl } from '../config';
import config from '../config';
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

// Single Unassigned Standee Card item with prominent STAND-ID
function UnassignedStandeeItem({ qrItem, qrsPerPage, showCutGuides = true, onToggleSelect = null, isMiniPreview = false }) {
  const n = parseInt(qrsPerPage, 10) || 1;
  const qrUrl = qrItem.filePath
    ? getImageUrl(qrItem.filePath)
    : getImageUrl(`/uploads/qr-codes/${qrItem.filename || `${qrItem.qrId}.png`}`);

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

  const qrSize = is1
    ? (isMiniPreview ? 140 : 210)
    : is2
      ? (isMiniPreview ? 110 : 155)
      : is4
        ? (isMiniPreview ? 80 : 115)
        : is6
          ? (isMiniPreview ? 65 : 92)
          : is8
            ? (isMiniPreview ? 55 : 76)
            : (isMiniPreview ? 46 : 64);

  const titleFontSize = is1 ? '1.25rem' : is2 ? '1.05rem' : is4 ? '0.88rem' : is6 ? '0.78rem' : '0.70rem';
  const standIdFontSize = is1 ? '1.15rem' : is2 ? '1.02rem' : is4 ? '0.88rem' : is6 ? '0.78rem' : '0.70rem';
  const ctaFontSize = is1 ? '0.94rem' : is2 ? '0.82rem' : is4 ? '0.74rem' : is6 ? '0.68rem' : '0.60rem';

  return (
    <div
      className={`print-standee-card ${showCutGuides ? 'has-cut-guides' : 'no-cut-guides'}`}
      style={{
        background: '#FFFFFF',
        color: '#0F172A',
        borderRadius: showCutGuides ? '6px' : '10px',
        padding: cardPadding,
        textAlign: 'center',
        border: showCutGuides ? '1.5px dashed #94A3B8' : '1.5px solid #CBD5E1',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        boxShadow: isMiniPreview ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
        overflow: 'hidden'
      }}
    >
      {/* On-screen quick remove button */}
      {onToggleSelect && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(qrItem.qrId);
          }}
          className="no-print"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            padding: '1px 5px',
            fontSize: '0.62rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: '#475569',
            zIndex: 2
          }}
          title="Remove from printout"
        >
          ✕
        </button>
      )}

      {/* Scissor icon cut marker */}
      {showCutGuides && !is1 && (
        <div
          className="no-print"
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            opacity: 0.45,
            color: '#64748B'
          }}
        >
          <Scissors size={10} />
        </div>
      )}

      {/* Top Header */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            fontSize: is1 ? '0.84rem' : is4 ? '0.68rem' : '0.62rem',
            fontWeight: 800,
            color: '#4338CA',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1px'
          }}
        >
          Review Us on Google
        </div>

        <div
          style={{
            fontSize: titleFontSize,
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.15,
            marginBottom: '2px'
          }}
        >
          Dynamic Review Standee
        </div>

        {/* PROMINENT STAND-ID BADGE */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: '#F1F5F9',
            border: '1.5px solid #0F172A',
            borderRadius: '4px',
            padding: is1 ? '3px 12px' : is4 ? '2px 8px' : '1px 6px',
            margin: '2px auto 4px auto',
            fontWeight: 900,
            fontSize: standIdFontSize,
            color: '#0F172A',
            letterSpacing: '0.04em',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          <span style={{ fontSize: is1 ? '0.70rem' : '0.60rem', color: '#64748B', fontWeight: 700 }}>STAND-ID:</span>
          <span>{qrItem.qrId}</span>
        </div>
      </div>

      {/* QR Code Frame */}
      <div
        style={{
          background: '#FFFFFF',
          padding: is1 ? '8px' : is4 ? '5px' : '3px',
          border: '1.5px solid #E2E8F0',
          borderRadius: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '2px auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
        }}
      >
        <img
          src={qrUrl}
          alt={`QR ${qrItem.qrId}`}
          style={{
            width: `${qrSize}px`,
            height: `${qrSize}px`,
            display: 'block',
            objectFit: 'contain'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getImageUrl(`/uploads/qr-codes/${qrItem.qrId}.png`);
          }}
        />
      </div>

      {/* Scan Call to Action */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            fontSize: ctaFontSize,
            fontWeight: 800,
            color: '#0F172A',
            marginTop: '2px',
            lineHeight: 1.15
          }}
        >
          Scan with Phone Camera
        </div>
        {!is8 && !is12 && (
          <div
            style={{
              fontSize: '0.62rem',
              color: '#64748B',
              marginTop: '1px'
            }}
          >
            No app required • Instant review
          </div>
        )}
      </div>

      {/* Vasmi Group Standee Footer */}
      <div
        style={{
          width: '100%',
          marginTop: is1 ? '8px' : '4px',
          paddingTop: is1 ? '5px' : '3px',
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
            fontSize: is12 ? '0.54rem' : is8 ? '0.58rem' : is4 ? '0.62rem' : '0.66rem',
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

export default function BatchPrintUnassignedModal({ isOpen, onClose, initialQrs = [] }) {
  const [unassignedList, setUnassignedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  // QRs per A4 sheet setting: default 4
  const [qrsPerPage, setQrsPerPage] = useState(4);
  const [showCutGuides, setShowCutGuides] = useState(true);
  const [copiedAll, setCopiedAll] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activePreviewPage, setActivePreviewPage] = useState(1);

  // Fetch or filter latest unassigned QRs on open
  useEffect(() => {
    if (!isOpen) return;

    const pullUnassigned = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${config.API_BASE_URL}/api/qr/unassigned`);
        const data = await res.json();
        if (data && Array.isArray(data.qrs)) {
          setUnassignedList(data.qrs);
          setSelectedIds(data.qrs.map(q => q.qrId));
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch from /api/qr/unassigned, using initial pool:', err);
      }

      // Fallback to initial pool if API lookup fails
      const fallbackPool = Array.isArray(initialQrs)
        ? initialQrs.filter(q => q && q.status === 'unassigned')
        : [];
      setUnassignedList(fallbackPool);
      setSelectedIds(fallbackPool.map(q => q.qrId));
      setLoading(false);
    };

    pullUnassigned().finally(() => setLoading(false));
  }, [isOpen, initialQrs]);

  if (!isOpen) return null;

  // Presets for QRs per page
  const presets = [
    { count: 1, label: '1 / Page', desc: 'Full A4 Standee' },
    { count: 2, label: '2 / Page', desc: 'Half A4 Cards' },
    { count: 4, label: '4 / Page', desc: 'Quarter / A6 Cards (Recommended)' },
    { count: 6, label: '6 / Page', desc: '2×3 Table Cards' },
    { count: 8, label: '8 / Page', desc: '2×4 Mini Cards' },
    { count: 12, label: '12 / Page', desc: '3×4 Sticker Labels' }
  ];

  // Filtered by search keyword
  const filteredQrs = unassignedList.filter(q => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const qrId = (q.qrId || '').toLowerCase();
    const seq = String(q.sequence || '').toLowerCase();
    const note = (q.note || '').toLowerCase();
    return qrId.includes(term) || seq.includes(term) || note.includes(term);
  });

  const selectedQrs = unassignedList.filter(q => selectedIds.includes(q.qrId));

  // Toggle single item selection
  const handleToggleSelect = (qrId) => {
    setSelectedIds(prev =>
      prev.includes(qrId) ? prev.filter(id => id !== qrId) : [...prev, qrId]
    );
  };

  // Select all / Deselect all
  const handleSelectAll = () => {
    if (selectedIds.length === filteredQrs.length && filteredQrs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQrs.map(q => q.qrId));
    }
  };

  // Quick select top N
  const handleSelectTopN = (n) => {
    const top = unassignedList.slice(0, n).map(q => q.qrId);
    setSelectedIds(top);
    showToast(`Selected top ${top.length} unassigned QRs`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Copy list of unassigned IDs to clipboard
  const handleCopyIds = () => {
    const listToCopy = selectedQrs.length > 0 ? selectedQrs : unassignedList;
    const idsString = listToCopy.map(q => q.qrId).join(', ');
    navigator.clipboard.writeText(idsString);
    setCopiedAll(true);
    showToast(`Copied ${listToCopy.length} QR IDs to clipboard!`);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Export list of unassigned QRs to CSV file
  const handleExportCsv = () => {
    const list = selectedQrs.length > 0 ? selectedQrs : unassignedList;
    if (list.length === 0) return;

    const headers = ['QR_ID', 'Sequence', 'Status', 'Review_Target_URL', 'Created_Date'];
    const rows = list.map(q => [
      q.qrId,
      q.sequence || '',
      q.status || 'unassigned',
      q.targetUrl || `${config.API_BASE_URL.replace(/:\d+$/, '')}/${q.qrId}`,
      q.createdAt ? new Date(q.createdAt).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(field => `"${field}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `unassigned_qrs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${list.length} QR details to CSV!`);
  };

  const handlePrint = () => {
    window.print();
  };

  const parsedQrsPerPage = Math.max(1, Math.min(24, parseInt(qrsPerPage, 10) || 1));
  const { cols, rows } = getGridLayout(parsedQrsPerPage);

  // Group selected QRs into pages of parsedQrsPerPage
  const pages = [];
  for (let i = 0; i < selectedQrs.length; i += parsedQrsPerPage) {
    pages.push(selectedQrs.slice(i, i + parsedQrsPerPage));
  }
  const totalSheets = Math.max(1, pages.length);

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1250 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          width: '95%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          background: 'var(--card-bg, #0F172A)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.75)',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2))',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.35)'
            }}>
              <Printer size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Pull & Print Unassigned QR Standees
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Print physical empty standees & stickers with labeled IDs to hand out to clients during onboarding
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

        {/* SETTINGS CONTROLS PANEL: QRs per A4 Sheet Setting */}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Grid size={15} style={{ color: '#10B981' }} />
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

          {/* Row 2: Custom Number Input & Options */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Custom Input */}
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
                  style={{ accentColor: '#10B981' }}
                />
                <span>Cut Guidelines (dashed scissors border)</span>
              </label>
            </div>

            {/* Total Sheets Badge */}
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
                {selectedQrs.length} QRs will print across {pages.length} A4 Sheet{pages.length > 1 ? 's' : ''} ({parsedQrsPerPage} per page)
              </span>
            </div>
          </div>
        </div>

        {/* TOOLBAR: Selection controls, Search, Copy IDs, CSV */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            marginBottom: '10px',
            flexShrink: 0
          }}
        >
          {/* Quick Select & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSelectAll}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', padding: '3px 8px' }}
            >
              {selectedIds.length === filteredQrs.length && filteredQrs.length > 0 ? (
                <>
                  <CheckSquare size={12} style={{ color: '#10B981' }} />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square size={12} />
                  <span>Select All ({filteredQrs.length})</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleSelectTopN(4)}
              style={{ fontSize: '0.72rem', padding: '3px 6px' }}
            >
              Top 4
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleSelectTopN(8)}
              style={{ fontSize: '0.72rem', padding: '3px 6px' }}
            >
              Top 8
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleSelectTopN(16)}
              style={{ fontSize: '0.72rem', padding: '3px 6px' }}
            >
              Top 16
            </button>

            {/* Search Filter */}
            <div style={{ position: 'relative', width: '130px' }}>
              <Search size={11} style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '3px 6px 3px 22px',
                  fontSize: '0.74rem',
                  borderRadius: '5px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Copy IDs & Export CSV */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyIds}
              title="Copy selected QR IDs list"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', padding: '3px 8px' }}
            >
              {copiedAll ? <Check size={11} style={{ color: '#10B981' }} /> : <Copy size={11} />}
              <span>Copy IDs</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportCsv}
              title="Export unassigned QR list to CSV"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', padding: '3px 8px' }}
            >
              <FileSpreadsheet size={11} style={{ color: '#10B981' }} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* TOAST ALERT */}
        {toastMessage && (
          <div
            className="no-print"
            style={{
              padding: '6px 12px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10B981',
              borderRadius: '6px',
              fontSize: '0.76rem',
              color: '#10B981',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <Check size={13} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* LIVE A4 SHEET PREVIEW CONTAINER (On Screen) */}
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
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: 'var(--text-muted)' }}>
              <RefreshCw className="spinning" size={24} style={{ color: '#10B981' }} />
              <span style={{ fontSize: '0.85rem' }}>Pulling unassigned dynamic QRs...</span>
            </div>
          ) : selectedQrs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px', color: 'var(--text-muted)' }}>
              <QrCode size={32} style={{ opacity: 0.4 }} />
              <span style={{ fontSize: '0.86rem' }}>No unassigned standees selected. Click "Select All" or choose IDs above.</span>
            </div>
          ) : (
            <>
              {/* Pagination navigation if multiple sheets */}
              {pages.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActivePreviewPage(p => Math.max(1, p - 1))}
                    disabled={activePreviewPage <= 1}
                    style={{ padding: '2px 6px' }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    A4 Sheet {activePreviewPage} of {pages.length} ({pages[activePreviewPage - 1]?.length || 0} QRs)
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActivePreviewPage(p => Math.min(pages.length, p + 1))}
                    disabled={activePreviewPage >= pages.length}
                    style={{ padding: '2px 6px' }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* Scaled A4 Sheet Card Mockup */}
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
                {(pages[activePreviewPage - 1] || []).map((qrItem, idx) => (
                  <UnassignedStandeeItem
                    key={qrItem.qrId || idx}
                    qrItem={qrItem}
                    qrsPerPage={parsedQrsPerPage}
                    showCutGuides={showCutGuides}
                    onToggleSelect={handleToggleSelect}
                    isMiniPreview={true}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Selected: <strong style={{ color: '#10B981' }}>{selectedQrs.length}</strong> unassigned QRs across <strong>{pages.length}</strong> A4 Sheet(s)
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              style={{ fontSize: '0.78rem' }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              disabled={selectedQrs.length === 0}
              id="btn-print-batch-standees"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                color: '#FFFFFF',
                padding: '6px 16px'
              }}
            >
              <Printer size={15} />
              <span>Print {pages.length} A4 Sheet{pages.length > 1 ? 's' : ''} ({selectedQrs.length} Standees)</span>
            </button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* PRINTABLE CONTAINER (Only visible during window.print())   */}
        {/* ========================================================== */}
        <div id="printable-batch-container">
          {pages.map((pageChunk, pageIndex) => (
            <div
              key={pageIndex}
              className="a4-print-page"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap: parsedQrsPerPage <= 2 ? '10mm' : parsedQrsPerPage <= 4 ? '7mm' : '5mm'
              }}
            >
              {pageChunk.map((qrItem, itemIndex) => (
                <UnassignedStandeeItem
                  key={qrItem.qrId || itemIndex}
                  qrItem={qrItem}
                  qrsPerPage={parsedQrsPerPage}
                  showCutGuides={showCutGuides}
                  onToggleSelect={null}
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
