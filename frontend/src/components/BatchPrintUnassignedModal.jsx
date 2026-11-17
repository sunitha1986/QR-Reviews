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
import config, { getImageUrl } from '../config';
import vasmiFullLogo from '../assets/vasmi_full_logo.png';

// Helper to calculate grid columns and rows based on qrsPerPage and columnsCount
function getGridLayout(qrsPerPage, columnsCount = 3) {
  const cols = Math.max(1, Math.min(6, parseInt(columnsCount, 10) || 3));
  const n = Math.max(1, parseInt(qrsPerPage, 10) || cols);
  const rows = Math.max(1, Math.ceil(n / cols));
  return { cols, rows };
}

// Single Unassigned Standee Card item: Large QR code + "Scan with Phone Camera" + Vasmi Group footer + QR ID in center
function UnassignedStandeeItem({ qrItem, qrsPerPage, showCutGuides = true, onToggleSelect = null, isMiniPreview = false, paperSize = 'a4', cols = 3, rows = 2 }) {
  const numCols = Math.max(1, parseInt(cols, 10) || 3);
  const numRows = Math.max(1, parseInt(rows, 10) || Math.ceil((parseInt(qrsPerPage, 10) || 1) / numCols));
  const isA3 = paperSize === 'a3';
  const qrUrl = qrItem.filePath
    ? getImageUrl(qrItem.filePath)
    : getImageUrl(`/uploads/qr-codes/${qrItem.filename || `${qrItem.qrId}.png`}`);

  const is1 = numCols === 1 && numRows === 1;

  // Snug padding cutting off all excess dead space around the card
  const cardPadding = isMiniPreview
    ? (numRows >= 5 ? '2px 2px' : numRows >= 4 ? '2.5px 2px' : '4px 3px')
    : isA3
      ? (numCols === 1
        ? '14px 10px'
        : numCols === 2
          ? '10px 8px'
          : numCols === 3
            ? (numRows >= 4 ? '5px 4px' : '7px 5px')
            : (numRows >= 4 ? '5px 4px' : '6px 4px'))
      : (numCols === 1
        ? '10px 8px'
        : numCols === 2
          ? '8px 6px'
          : numCols === 3
            ? '4px 3px'
            : '3px 2px');

  // Dynamic QR Code size in pixels:
  const qrSize = isA3
    ? numCols === 1
      ? (isMiniPreview ? 180 : (numRows === 1 ? 620 : 440))
      : numCols === 2
        ? (isMiniPreview ? (numRows <= 2 ? 120 : 85) : (numRows <= 2 ? 380 : 270))
        : numCols === 3
          ? (isMiniPreview ? (numRows <= 2 ? 80 : numRows === 3 ? 60 : 45) : (numRows <= 2 ? 300 : numRows === 3 ? 240 : 180))
          : (isMiniPreview ? (numRows <= 2 ? 65 : numRows <= 4 ? 64 : 40) : (numRows <= 2 ? 220 : numRows <= 4 ? 185 : 150))
    : numCols === 1
      ? (isMiniPreview ? 160 : (numRows === 1 ? 430 : 300))
      : numCols === 2
        ? (isMiniPreview ? (numRows <= 2 ? 95 : 70) : (numRows <= 2 ? 250 : 180))
        : numCols === 3
          ? (isMiniPreview ? (numRows <= 2 ? 70 : numRows === 3 ? 52 : 38) : (numRows <= 2 ? 205 : numRows === 3 ? 165 : 120))
          : (isMiniPreview ? (numRows <= 2 ? 50 : 34) : (numRows <= 2 ? 140 : 95));

  const ctaFontSize = isMiniPreview
    ? (numRows >= 5 ? '0.42rem' : numRows >= 4 ? '0.48rem' : numRows === 3 ? '0.56rem' : '0.66rem')
    : isA3
      ? numCols === 1
        ? (numRows === 1 ? '1.50rem' : '1.25rem')
        : numCols === 2
          ? '1.15rem'
          : numCols === 3
            ? (numRows >= 4 ? '0.86rem' : '0.92rem')
            : (numRows >= 4 ? '0.82rem' : '0.86rem')
      : numCols === 1
        ? (numRows === 1 ? '1.10rem' : '0.95rem')
        : numCols === 2
          ? '0.88rem'
          : numCols === 3
            ? '0.72rem'
            : '0.62rem';

  // Small, compact font for footer so it takes minimal space
  const devTextFontSize = isMiniPreview
    ? (numRows >= 5 ? '0.22rem' : numRows >= 4 ? '0.25rem' : numRows === 3 ? '0.28rem' : '0.32rem')
    : isA3
      ? (numCols === 1 ? '0.52rem' : numCols === 2 ? '0.44rem' : numCols === 3 ? '0.38rem' : (numRows >= 4 ? '0.34rem' : '0.36rem'))
      : (numCols === 1 ? '0.44rem' : numCols === 2 ? '0.38rem' : numCols === 3 ? '0.34rem' : '0.28rem');

  // Vasmi logo size
  const logoHeight = isMiniPreview
    ? (numRows >= 5 ? '7px' : numRows >= 4 ? '8.5px' : numRows === 3 ? '10px' : '12px')
    : isA3
      ? (numCols === 1 ? '34px' : numCols === 2 ? '28px' : numCols === 3 ? '22px' : (numRows >= 4 ? '18px' : '20px'))
      : (numCols === 1 ? '26px' : numCols === 2 ? '22px' : numCols === 3 ? '17px' : '14px');

  // Reduced QR ID font size
  const qrIdFontSize = isMiniPreview
    ? (numRows >= 5 ? '0.24rem' : numRows >= 4 ? '0.26rem' : numRows === 3 ? '0.30rem' : '0.34rem')
    : isA3
      ? (numCols === 1 ? '0.52rem' : numCols === 2 ? '0.44rem' : numCols === 3 ? '0.38rem' : (numRows >= 4 ? '0.36rem' : '0.38rem'))
      : (numCols === 1 ? '0.44rem' : numCols === 2 ? '0.38rem' : numCols === 3 ? '0.34rem' : '0.28rem');

  return (
    <div
      className={`print-standee-card ${showCutGuides ? 'has-cut-guides' : 'no-cut-guides'}`}
      style={{
        background: '#FFFFFF',
        color: '#0F172A',
        borderRadius: showCutGuides ? '4px' : '8px',
        padding: cardPadding,
        textAlign: 'center',
        border: showCutGuides ? '1.5px dashed #CBD5E1' : '1px solid #E2E8F0',
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
            color: '#64748B',
            zIndex: 2
          }}
        >
          <Scissors size={10} />
        </div>
      )}

      {/* 1. Scan Call to Action - moved slightly down with balanced top spacing */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: isMiniPreview
            ? (numRows >= 5 ? '2.5px' : '5px')
            : is1
              ? '10px'
              : (isA3 ? (numRows >= 4 ? '8px' : '12px') : (numRows >= 4 ? '5px' : '8px')),
          marginBottom: isMiniPreview
            ? (numRows >= 5 ? '1px' : '2px')
            : is1
              ? '8px'
              : (numCols <= 2 && numRows <= 2)
                ? '4px'
                : '2px',
          flexShrink: 0
        }}
      >
        <div
          style={{
            fontSize: ctaFontSize,
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.15,
            textAlign: 'center',
            letterSpacing: '-0.01em'
          }}
        >
          Scan with Phone Camera
        </div>
      </div>

      {/* 2. Main QR Code Container - tight fit, zero dead space */}
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '0',
          margin: '0',
          minHeight: isMiniPreview
            ? (numRows >= 5 ? '32px' : numRows >= 4 ? '52px' : '65px')
            : (isA3 ? (numRows >= 4 ? '170px' : '220px') : (numRows >= 4 ? '110px' : '150px'))
        }}
      >
        <img
          src={qrUrl}
          alt={`QR ${qrItem.qrId}`}
          crossOrigin="anonymous"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: `${qrSize}px`,
            maxHeight: `${qrSize}px`,
            display: 'block',
            objectFit: 'contain'
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = getImageUrl(`/uploads/qr-codes/${qrItem.qrId}.png`);
          }}
        />
      </div>

      {/* QR ID - centered in same line */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '1px',
          marginBottom: '2px',
          flexShrink: 0
        }}
      >
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: qrIdFontSize,
            color: '#64748B',
            letterSpacing: '0.04em',
            lineHeight: 1,
            textAlign: 'center'
          }}
        >
          {qrItem.qrId}
        </span>
      </div>

      {/* Vasmi Group Standee Footer - 2 LINES STACKED (saves horizontal space) */}
      <div
        style={{
          width: '100%',
          paddingTop: '2px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1px',
          flexShrink: 0
        }}
      >
        <span
          style={{
            fontSize: devTextFontSize,
            color: '#64748B',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            lineHeight: 1.1,
            letterSpacing: '0.02em'
          }}
        >
          Designed and Developed by
        </span>
        <span className="vasmi-logo-wrapper" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <img
            src={vasmiFullLogo}
            alt="Vasmi Group - Creating Your Identity"
            className="vasmi-full-logo-img"
            crossOrigin="anonymous"
            style={{
              height: logoHeight,
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
  // Paper sheet format: 'a3' (11.7 x 16.5 inches) or 'a4' (8.3 x 11.7 inches)
  const [paperSize, setPaperSize] = useState('a3');
  // Column customization: default 3 columns (1, 2, 3, 4)
  const [columnsCount, setColumnsCount] = useState(3);
  // Rows per page customization: default 2 rows (1, 2, 3, 4, 5, 6)
  const [rowsCount, setRowsCount] = useState(2);
  const [showCutGuides, setShowCutGuides] = useState(true);
  const [copiedAll, setCopiedAll] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activePreviewPage, setActivePreviewPage] = useState(1);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  // Copies of each QR (default 1)
  const [copiesPerQr, setCopiesPerQr] = useState(1);
  // Custom overrides per individual QR ID: { [qrId]: number }
  const [customCopies, setCustomCopies] = useState({});
  // Toggle per-QR copies drawer
  const [showCopiesList, setShowCopiesList] = useState(false);

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

  const selectedQrs = unassignedList.filter(q => selectedIds.includes(q.qrId));

  const getCopiesForQr = (qrId) => {
    return customCopies[qrId] !== undefined ? customCopies[qrId] : copiesPerQr;
  };

  const handleSetGlobalCopies = (val) => {
    const num = Math.max(1, Math.min(50, val));
    setCopiesPerQr(num);
    setCustomCopies({});
    showToast(`Set all QRs to ${num} ${num === 1 ? 'copy' : 'copies'} each`);
  };

  const handleSetSingleQrCopies = (qrId, val) => {
    const num = Math.max(1, Math.min(50, val));
    setCustomCopies(prev => ({
      ...prev,
      [qrId]: num
    }));
  };

  // Toggle single item selection
  const handleToggleSelect = (qrId) => {
    setSelectedIds(prev =>
      prev.includes(qrId) ? prev.filter(id => id !== qrId) : [...prev, qrId]
    );
  };

  // Select all / Deselect all
  const handleSelectAll = () => {
    if (selectedIds.length === unassignedList.length && unassignedList.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unassignedList.map(q => q.qrId));
    }
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
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-print-paper-size';
    styleEl.innerHTML = `@page { size: ${paperSize.toUpperCase()} portrait; margin: ${paperSize === 'a3' ? '5mm' : '5mm'}; }`;
    document.head.appendChild(styleEl);
    window.print();
    setTimeout(() => {
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    }, 1500);
  };

  // Helper to convert any image URL to a base64 Data URL (prevents CORS & canvas export issues)
  const toDataUrl = async (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const c = document.createElement('canvas');
            c.width = img.naturalWidth || 300;
            c.height = img.naturalHeight || 300;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(c.toDataURL('image/png'));
          } catch {
            resolve(url);
          }
        };
        img.onerror = () => resolve(url);
        img.src = url;
      });
    }
  };

  // Programmatically generate and download high-resolution multi-page PDF
  const handleGeneratePdf = async () => {
    if (selectedQrs.length === 0 || generatingPdf) return;
    setGeneratingPdf(true);
    showToast(`Preparing high-resolution ${paperSize.toUpperCase()} PDF...`);

    let renderHost = null;
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // 1. Preload / convert all QR code images and the Vasmi logo to Base64 data URLs
      showToast('Loading images for PDF...');
      const dataUrlMap = {};
      const logoDataUrl = await toDataUrl(vasmiFullLogo);

      await Promise.all(
        selectedQrs.map(async (qr) => {
          const qrUrl = qr.filePath
            ? getImageUrl(qr.filePath)
            : getImageUrl(`/uploads/qr-codes/${qr.filename || `${qr.qrId}.png`}`);
          const b64 = await toDataUrl(qrUrl);
          dataUrlMap[qrUrl] = b64;
          dataUrlMap[qr.qrId] = b64;
        })
      );

      // 2. Query the pages from the printable container
      const container = document.getElementById('printable-batch-container');
      if (!container) throw new Error('Print container not found');

      const isA3 = paperSize === 'a3';
      const pageElements = container.querySelectorAll(isA3 ? '.a3-print-page' : '.a4-print-page');
      if (pageElements.length === 0) throw new Error('No print pages found');

      const pageWidthMm = isA3 ? 297 : 210;
      const pageHeightMm = isA3 ? 420 : 297;
      const pageWidthPx = isA3 ? 1123 : 794;
      const pageHeightPx = isA3 ? 1587 : 1123;

      // 3. Create a dedicated rendering host inside the viewport behind the modal overlay (z-index 1240 < modal 1250)
      renderHost = document.createElement('div');
      renderHost.id = 'pdf-render-host';
      renderHost.style.position = 'fixed';
      renderHost.style.left = '0';
      renderHost.style.top = '0';
      renderHost.style.width = `${pageWidthPx}px`;
      renderHost.style.height = `${pageHeightPx}px`;
      renderHost.style.minHeight = `${pageHeightPx}px`;
      renderHost.style.zIndex = '1240';
      renderHost.style.background = '#FFFFFF';
      renderHost.style.overflow = 'hidden';
      renderHost.style.pointerEvents = 'none';
      renderHost.style.boxSizing = 'border-box';
      document.body.appendChild(renderHost);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: isA3 ? 'a3' : 'a4',
        compress: true
      });

      for (let i = 0; i < pageElements.length; i++) {
        showToast(`Rendering Sheet ${i + 1} of ${pageElements.length}...`);
        const pageEl = pageElements[i];
        const pageClone = pageEl.cloneNode(true);

        // Ensure clone has standard layout styles
        pageClone.style.display = 'grid';
        pageClone.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
        pageClone.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
        pageClone.style.width = `${pageWidthPx}px`;
        pageClone.style.height = `${pageHeightPx}px`;
        pageClone.style.minHeight = `${pageHeightPx}px`;
        pageClone.style.boxSizing = 'border-box';
        pageClone.style.background = '#FFFFFF';
        pageClone.style.padding = isA3 ? (rows >= 4 ? '5mm' : '8mm') : (rows >= 4 ? '4mm' : '6mm');
        pageClone.style.gap = isA3 ? (rows >= 4 ? '3.5mm' : '6mm') : (rows >= 4 ? '3mm' : '5mm');
        pageClone.style.margin = '0 auto';
        pageClone.style.visibility = 'visible';

        // Swap images to base64 data URLs
        const imgs = pageClone.querySelectorAll('img');
        imgs.forEach((img) => {
          img.crossOrigin = 'anonymous';
          const src = img.src || img.getAttribute('src');
          if (img.classList.contains('vasmi-full-logo-img') && logoDataUrl) {
            img.src = logoDataUrl;
          } else if (dataUrlMap[src]) {
            img.src = dataUrlMap[src];
          }
        });

        renderHost.innerHTML = '';
        renderHost.appendChild(pageClone);

        // Wait for all images inside to be fully ready
        const allImgs = Array.from(pageClone.querySelectorAll('img'));
        await Promise.all(
          allImgs.map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 400);
            });
          })
        );

        // Small tick for CSS/layout calculation
        await new Promise((r) => setTimeout(r, 60));

        const canvas = await html2canvas(pageClone, {
          scale: isA3 ? 1.6 : 2, // High resolution canvas capture
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FFFFFF',
          width: pageWidthPx,
          height: pageHeightPx,
          windowWidth: pageWidthPx,
          windowHeight: pageHeightPx,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          logging: false
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        if (i > 0) pdf.addPage(isA3 ? 'a3' : 'a4', 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
      }

      const fileName = `unassigned_standees_${paperSize.toUpperCase()}_${totalStandees}standees_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      showToast(`${paperSize.toUpperCase()} PDF downloaded successfully!`);
    } catch (err) {
      console.error('PDF Generation failed, opening print dialog:', err);
      showToast('PDF generation issue, opening print dialog...');
      window.print();
    } finally {
      if (renderHost && renderHost.parentNode) {
        renderHost.parentNode.removeChild(renderHost);
      }
      setGeneratingPdf(false);
    }
  };

  const cols = Math.max(1, Math.min(6, parseInt(columnsCount, 10) || 3));
  const rows = Math.max(1, Math.min(6, parseInt(rowsCount, 10) || 2));
  const parsedQrsPerPage = cols * rows;
  const qrsPerPage = parsedQrsPerPage;

  // Expand selected QRs by their individual copy counts:
  const expandedQrs = [];
  selectedQrs.forEach((qr) => {
    const copies = getCopiesForQr(qr.qrId);
    for (let c = 0; c < copies; c++) {
      expandedQrs.push({
        ...qr,
        _copyIndex: c + 1,
        _totalCopies: copies
      });
    }
  });
  const totalStandees = expandedQrs.length;

  // Group expanded QRs into pages of parsedQrsPerPage
  const pages = [];
  for (let i = 0; i < expandedQrs.length; i += parsedQrsPerPage) {
    pages.push(expandedQrs.slice(i, i + parsedQrsPerPage));
  }
  const totalSheets = Math.max(1, pages.length);

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1250 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '740px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '14px 18px',
          background: 'var(--card-bg, #0F172A)',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.75)',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2))',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.35)'
            }}>
              <Printer size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                Batch Print QR Standees
              </h3>
              <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                Print dynamic unassigned standees on A3 / A4 sheets
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', padding: '4px', width: '28px', height: '28px' }}
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* COMPACT SETTINGS: Sheet Mode (A3/A4) + Columns Dropdown + Rows Dropdown + Cumulative Count + Cut Guidelines */}
        <div
          className="no-print"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '8px 12px',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0
          }}
        >
          {/* Dropdown controls with explicit labels (No pill style) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* 1. Sheet Mode: A3 / A4 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label
                htmlFor="sheet-mode-select"
                style={{
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Sheet Mode
              </label>
              <select
                id="sheet-mode-select"
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="a3">A3 Sheet (297 × 420 mm)</option>
                <option value="a4">A4 Sheet (210 × 297 mm)</option>
              </select>
            </div>

            {/* 2. Columns Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label
                htmlFor="columns-select"
                style={{
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Columns
              </label>
              <select
                id="columns-select"
                value={columnsCount}
                onChange={(e) => setColumnsCount(parseInt(e.target.value, 10))}
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="1">1 Column</option>
                <option value="2">2 Columns</option>
                <option value="3">3 Columns (Default)</option>
                <option value="4">4 Columns</option>
              </select>
            </div>

            {/* 3. Rows per Page Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <label
                htmlFor="rows-select"
                style={{
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Rows / Page
              </label>
              <select
                id="rows-select"
                value={rowsCount}
                onChange={(e) => setRowsCount(parseInt(e.target.value, 10))}
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="1">1 Row</option>
                <option value="2">2 Rows (Default)</option>
                <option value="3">3 Rows</option>
                <option value="4">4 Rows</option>
                <option value="5">5 Rows</option>
                <option value="6">6 Rows</option>
              </select>
            </div>

            {/* 4. Cumulative Calculation Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '7px',
                padding: '5px 12px',
                marginTop: '13px'
              }}
            >
              <Grid size={13} style={{ color: '#10B981' }} />
              <div style={{ fontSize: '0.74rem', color: '#E2E8F0', fontWeight: 600 }}>
                <strong style={{ color: '#10B981', fontSize: '0.80rem' }}>{parsedQrsPerPage} QRs / Sheet</strong>
                {' '}<span style={{ opacity: 0.65 }}>({cols} cols × {rows} rows)</span>
                <span style={{ margin: '0 6px', opacity: 0.3 }}>|</span>
                Cumulative: <strong style={{ color: '#10B981' }}>{totalSheets}</strong> {paperSize.toUpperCase()} Sheet{totalSheets > 1 ? 's' : ''}
                {' '}<span style={{ opacity: 0.65 }}>({totalStandees} total standees)</span>
              </div>
            </div>
          </div>

          {/* Right: Cut Guidelines Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '13px' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.74rem',
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
              <span>Cut Guidelines</span>
            </label>
          </div>
        </div>

        {/* COMPACT TOOLBAR: Select All + Copies per QR + Copy IDs + CSV */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 10px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            marginBottom: '6px',
            flexWrap: 'wrap',
            gap: '6px',
            flexShrink: 0
          }}
        >
          {/* Select All */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleSelectAll}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', padding: '2px 8px' }}
          >
            {selectedIds.length === unassignedList.length && unassignedList.length > 0 ? (
              <>
                <CheckSquare size={11} style={{ color: '#10B981' }} />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <Square size={11} />
                <span>Select All ({unassignedList.length})</span>
              </>
            )}
          </button>

          {/* Center: Copies of each QR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Copies each QR:
            </span>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '5px',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              overflow: 'hidden'
            }}>
              <button
                type="button"
                onClick={() => handleSetGlobalCopies(Math.max(1, copiesPerQr - 1))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#E2E8F0',
                  padding: '1px 6px',
                  cursor: 'pointer',
                  fontSize: '0.80rem',
                  fontWeight: 800
                }}
                title="Decrease copies per QR"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={copiesPerQr}
                onChange={(e) => handleSetGlobalCopies(parseInt(e.target.value, 10) || 1)}
                style={{
                  width: '28px',
                  textAlign: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: '#10B981',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  padding: '1px 0'
                }}
              />
              <button
                type="button"
                onClick={() => handleSetGlobalCopies(Math.min(50, copiesPerQr + 1))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#E2E8F0',
                  padding: '1px 6px',
                  cursor: 'pointer',
                  fontSize: '0.80rem',
                  fontWeight: 800
                }}
                title="Increase copies per QR"
              >
                +
              </button>
            </div>

            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 5].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => handleSetGlobalCopies(cnt)}
                  style={{
                    background: copiesPerQr === cnt && Object.keys(customCopies).length === 0
                      ? '#10B981'
                      : 'rgba(255, 255, 255, 0.05)',
                    color: copiesPerQr === cnt && Object.keys(customCopies).length === 0
                      ? '#FFFFFF'
                      : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '2px 5px',
                    fontSize: '0.67rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {cnt}x
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowCopiesList(prev => !prev)}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.68rem',
                padding: '2px 6px',
                color: Object.keys(customCopies).length > 0 ? '#10B981' : 'var(--text-secondary)',
                fontWeight: Object.keys(customCopies).length > 0 ? 800 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="Customize copies for individual QR IDs"
            >
              <span>Per QR</span>
              <span style={{ fontSize: '0.58rem' }}>{showCopiesList ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* Copy IDs & Export CSV */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyIds}
              title="Copy selected QR IDs list"
              style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.70rem', padding: '2px 7px' }}
            >
              {copiedAll ? <Check size={10} style={{ color: '#10B981' }} /> : <Copy size={10} />}
              <span>Copy IDs</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportCsv}
              title="Export unassigned QR list to CSV"
              style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.70rem', padding: '2px 7px' }}
            >
              <FileSpreadsheet size={10} style={{ color: '#10B981' }} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* EXPANDABLE PER-QR CUSTOM COPIES DRAWER */}
        {showCopiesList && selectedQrs.length > 0 && (
          <div
            className="no-print"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 10px',
              marginBottom: '6px',
              maxHeight: '110px',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Customize Copies per QR ID:
              </span>
              {Object.keys(customCopies).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomCopies({});
                    showToast(`Reset all QRs to uniform ${copiesPerQr}x`);
                  }}
                  style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.67rem', cursor: 'pointer', padding: 0 }}
                >
                  Reset all to {copiesPerQr}x
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '4px' }}>
              {selectedQrs.map((qr) => {
                const currentCopies = getCopiesForQr(qr.qrId);
                return (
                  <div
                    key={qr.qrId}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '5px',
                      padding: '2px 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#CBD5E1', fontWeight: 600 }}>
                      {qr.qrId}
                    </span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '3px' }}>
                      <button
                        type="button"
                        onClick={() => handleSetSingleQrCopies(qr.qrId, currentCopies - 1)}
                        style={{ background: 'none', border: 'none', color: '#CBD5E1', padding: '0 4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                      >
                        −
                      </button>
                      <span style={{ fontSize: '0.70rem', fontWeight: 800, color: '#10B981', minWidth: '14px', textAlign: 'center' }}>
                        {currentCopies}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetSingleQrCopies(qr.qrId, currentCopies + 1)}
                        style={{ background: 'none', border: 'none', color: '#CBD5E1', padding: '0 4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TOAST ALERT */}
        {toastMessage && (
          <div
            className="no-print"
            style={{
              padding: '4px 10px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10B981',
              borderRadius: '6px',
              fontSize: '0.74rem',
              color: '#10B981',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0
            }}
          >
            <Check size={12} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* LIVE A4 SHEET PREVIEW CONTAINER (On Screen) */}
        <div
          className="no-print"
          style={{
            flex: 1,
            minHeight: '200px',
            maxHeight: '46vh',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px', color: 'var(--text-muted)' }}>
              <RefreshCw className="spinning" size={20} style={{ color: '#10B981' }} />
              <span style={{ fontSize: '0.80rem' }}>Pulling unassigned dynamic QRs...</span>
            </div>
          ) : selectedQrs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '6px', color: 'var(--text-muted)' }}>
              <QrCode size={28} style={{ opacity: 0.4 }} />
              <span style={{ fontSize: '0.82rem' }}>No unassigned standees selected. Click "Select All" above.</span>
            </div>
          ) : (
            <>
              {/* Pagination navigation if multiple sheets */}
              {pages.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActivePreviewPage(p => Math.max(1, p - 1))}
                    disabled={activePreviewPage <= 1}
                    style={{ padding: '1px 5px' }}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {paperSize.toUpperCase()} Sheet {activePreviewPage} of {pages.length} ({pages[activePreviewPage - 1]?.length || 0} QRs)
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActivePreviewPage(p => Math.min(pages.length, p + 1))}
                    disabled={activePreviewPage >= pages.length}
                    style={{ padding: '1px 5px' }}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}

              {/* Scaled A3 / A4 Sheet Card Mockup */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '430px',
                  aspectRatio: '1 / 1.414',
                  background: '#FFFFFF',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  padding: rows >= 4 ? '7px' : '10px',
                  boxSizing: 'border-box',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                  gap: rows >= 4 ? '3px' : parsedQrsPerPage <= 2 ? '8px' : parsedQrsPerPage <= 4 ? '6px' : '4px'
                }}
              >
                {(pages[activePreviewPage - 1] || []).map((qrItem, idx) => (
                  <UnassignedStandeeItem
                    key={qrItem.qrId || idx}
                    qrItem={qrItem}
                    qrsPerPage={parsedQrsPerPage}
                    paperSize={paperSize}
                    showCutGuides={showCutGuides}
                    onToggleSelect={handleToggleSelect}
                    isMiniPreview={true}
                    cols={cols}
                    rows={rows}
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
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Selected: <strong style={{ color: '#10B981' }}>{selectedQrs.length}</strong> unassigned QRs (<strong style={{ color: '#10B981' }}>{totalStandees}</strong> standees) across <strong>{pages.length}</strong> {paperSize.toUpperCase()} Sheet(s)
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={generatingPdf}
              style={{ fontSize: '0.76rem', padding: '4px 10px' }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              disabled={selectedQrs.length === 0 || generatingPdf}
              id="btn-print-batch-standees"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.76rem',
                fontWeight: 600,
                padding: '4px 10px'
              }}
              title={`Print directly to ${paperSize.toUpperCase()} printer or print dialog`}
            >
              <Printer size={13} />
              <span>Print {paperSize.toUpperCase()}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleGeneratePdf}
              disabled={selectedQrs.length === 0 || generatingPdf}
              id="btn-generate-batch-pdf"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                color: '#FFFFFF',
                padding: '5px 14px',
                borderRadius: '6px',
                cursor: generatingPdf ? 'wait' : 'pointer'
              }}
              title={`Generate and download multi-page ${paperSize.toUpperCase()} PDF`}
            >
              {generatingPdf ? (
                <>
                  <RefreshCw className="spinning" size={13} />
                  <span>Generating {paperSize.toUpperCase()} PDF...</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Generate {paperSize.toUpperCase()} PDF ({totalStandees} Standees)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================== */}
        {/* PRINTABLE CONTAINER (Only visible during window.print())   */}
        {/* ========================================================== */}
        <div id="printable-batch-container" className="print-only">
          {pages.map((pageChunk, pageIndex) => (
            <div
              key={pageIndex}
              className={paperSize === 'a3' ? 'a3-print-page' : 'a4-print-page'}
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                gap: paperSize === 'a3'
                  ? (rows >= 4 ? '3.5mm' : parsedQrsPerPage <= 2 ? '14mm' : parsedQrsPerPage <= 4 ? '10mm' : '7mm')
                  : (rows >= 4 ? '3mm' : parsedQrsPerPage <= 2 ? '10mm' : parsedQrsPerPage <= 4 ? '7mm' : '5mm')
              }}
            >
              {pageChunk.map((qrItem, itemIndex) => (
                <UnassignedStandeeItem
                  key={qrItem.qrId || itemIndex}
                  qrItem={qrItem}
                  qrsPerPage={parsedQrsPerPage}
                  paperSize={paperSize}
                  showCutGuides={showCutGuides}
                  onToggleSelect={null}
                  isMiniPreview={false}
                  cols={cols}
                  rows={rows}
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
