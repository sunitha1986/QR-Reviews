import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  QrCode,
  Sparkles,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  FolderCheck,
  RefreshCw,
  Layers,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  X,
  Eye,
  Info,
  Calendar,
  Search,
  List,
  LogOut,
  Trash2,
  AlertTriangle,
  Edit
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PrintModal from '../../components/PrintModal';
import BatchPrintUnassignedModal from '../../components/BatchPrintUnassignedModal';
import EditClientModal from '../../components/EditClientModal';
import { generateSlug } from '../../utils/slug';
import { formatPhoneNumber } from '../../utils/phone';
import config, { getImageUrl } from '../../config';
import { QrGeneratorShimmer } from '../../components/Shimmer';
import CopyablePhone from '../../components/CopyablePhone';
import vasmiIcon from '../../assets/vasmi_icon.png';

export default function NewQrGeneration({ onGoToOnboarding, onTestReview, user, onLogout }) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [latestQr, setLatestQr] = useState(null);
  const [allQrs, setAllQrs] = useState([]);
  const [nextSequenceFormatted, setNextSequenceFormatted] = useState('000001');
  const [filter, setFilter] = useState('all'); // 'all', 'unassigned', 'assigned'
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [printQr, setPrintQr] = useState(null);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [customBatchCount, setCustomBatchCount] = useState(5);
  const [highlightedQrIds, setHighlightedQrIds] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [deletingQr, setDeletingQr] = useState(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [editingClient, setEditingClient] = useState(null);

  const handleEditClick = async (item) => {
    if (item.status === 'assigned' && item.assignedClient?.id) {
      try {
        const res = await fetch(`${config.API_BASE_URL}/api/clients/${item.assignedClient.id}`);
        const data = await res.json();
        if (data.client) {
          setEditingClient(data.client);
          return;
        }
      } catch (err) {
        console.error('Failed to load client for edit:', err);
      }
      setEditingClient(item.assignedClient);
    } else {
      // Unassigned QR -> Go to onboarding with this QR ID
      onGoToOnboarding(item.qrId);
    }
  };
  const highlightTimeoutRef = useRef(null);
  const safetyTimerRef = useRef(null);

  // Clean up highlight timer on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }
    };
  }, []);

  // Smooth scroll down to table grid and highlight the newly created QR
  const handleDoneAndScrollToTable = (createdQrs) => {
    // 1. Close dialog
    setSuccessModalData(null);

    // 2. Identify newly created QR ID(s)
    const idsToHighlight = Array.isArray(createdQrs)
      ? createdQrs.map((q) => q?.qrId || q).filter(Boolean)
      : [createdQrs?.qrId || createdQrs].filter(Boolean);

    if (idsToHighlight.length === 0) return;

    // Reset filter if it was hiding unassigned QRs
    setFilter((currentFilter) => {
      if (currentFilter === 'assigned') return 'all';
      return currentFilter;
    });
    setSearch('');

    // 3. Highlight newly created QR row(s)
    setHighlightedQrIds(idsToHighlight);

    // 4. Smooth slide down to table grid & target row
    setTimeout(() => {
      const primaryId = idsToHighlight[0];
      const targetElement =
        document.getElementById(`qr-row-${primaryId}`) ||
        document.getElementById(`qr-mobile-card-${primaryId}`) ||
        document.querySelector('.qr-catalog-panel');

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    // 5. Remove highlight after a while (4.5s)
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedQrIds([]);
    }, 4500);
  };

  // Fetch all existing QRs with timeout & error handling
  const fetchQrs = async () => {
    setFetchError('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      let res;
      try {
        res = await fetch(`${config.API_BASE_URL}/api/qr/all`, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        console.warn(`[NewQrGeneration] /api/qr/all responded with status ${res.status}`);
        setFetchError('Unable to load QR codes from server. Showing local/cached catalog.');
        return;
      }

      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.warn('[NewQrGeneration] Response was not valid JSON:', parseErr.message);
        setFetchError('Server returned unexpected data format.');
        return;
      }

      if (data && Array.isArray(data.qrs)) {
        setAllQrs(data.qrs);
        if (data.qrs.length > 0) {
          setLatestQr(prev => {
            if (prev && data.qrs.some(q => q && q.qrId === prev.qrId)) {
              return prev;
            }
            return data.qrs[0];
          });
        } else {
          setLatestQr(null);
        }
      }

      if (data && data.nextSequence) {
        setNextSequenceFormatted(String(data.nextSequence).padStart(6, '0'));
      } else if (data && data.nextSequenceFormatted) {
        setNextSequenceFormatted(String(data.nextSequenceFormatted).padStart(6, '0'));
      }
    } catch (err) {
      console.error('Failed to fetch QRs:', err);
      setFetchError(err.name === 'AbortError' ? 'Connection timed out while loading QRs.' : 'Unable to connect to backend server.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchQrs();

    // Safety fallback: guaranteed shimmer dismissal after 6.5s to prevent infinite loading
    safetyTimerRef.current = setTimeout(() => {
      setInitialLoading(false);
    }, 6500);

    return () => {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }
    };
  }, []);

  // Generate single dynamic QR auto
  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${config.API_BASE_URL}/api/qr/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned invalid response (${res.status})`);
      }

      if (!res.ok) throw new Error(data.error || 'Failed to generate QR');

      setLatestQr(data.qr);
      setSuccessModalData({
        type: 'single',
        qr: data.qr,
        created: true,
        message: 'Dynamic QR generated successfully and saved to DB'
      });
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch (e) { }
      await fetchQrs();
    } catch (err) {
      alert(err.message || 'Failed to generate QR');
    } finally {
      setLoading(false);
    }
  };

  // Generate batch sequential QRs
  const handleBatchGenerate = async (count = 3) => {
    setBatchLoading(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/qr/generate-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned invalid response (${res.status})`);
      }

      if (!res.ok) throw new Error(data.error || 'Batch generation failed');

      if (data.qrs && data.qrs.length > 0) {
        setLatestQr(data.qrs[0]);
        setSuccessModalData({
          type: 'batch',
          count: data.qrs.length,
          qrs: data.qrs,
          qr: data.qrs[0],
          created: true,
          message: `${data.qrs.length} Dynamic QRs generated successfully`
        });
        try {
          confetti({ particleCount: 65, spread: 80, origin: { y: 0.6 } });
        } catch (e) { }
      }
      await fetchQrs();
    } catch (err) {
      alert(err.message || 'Batch generation failed');
    } finally {
      setBatchLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyUrlToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Delete a single QR code
  const handleDeleteSingleQr = async () => {
    if (!deletingQr) return;
    try {
      setIsDeletingSingle(true);
      setDeleteError('');
      const res = await fetch(`${config.API_BASE_URL}/api/qr/${encodeURIComponent(deletingQr.qrId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete QR code');
      }
      const removedId = deletingQr.qrId;
      setDeletingQr(null);
      setSuccessToast(`QR code ${removedId} removed successfully.`);
      setTimeout(() => setSuccessToast(''), 4000);
      await fetchQrs();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete QR code');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Open simple standee preview modal on click of thumbnail or standee (same as All Clients)
  const handleOpenQrModal = (qrItem) => {
    if (!qrItem) return;
    setLatestQr(qrItem);
    setPrintQr(qrItem);
    setHighlightedQrIds([qrItem.qrId]);
  };

  // Select row and populate Active Dynamic QR Preview
  const handleSelectQrRow = (qrItem) => {
    if (!qrItem) return;
    setLatestQr(qrItem);
    setHighlightedQrIds([qrItem.qrId]);
  };

  // Filtered QRs with complete null safety
  const safeAllQrs = Array.isArray(allQrs) ? allQrs : [];
  const filteredQrs = safeAllQrs.filter(q => {
    if (!q || !q.qrId) return false;
    const matchesFilter =
      filter === 'all' ? true :
        filter === 'unassigned' ? q.status === 'unassigned' :
          q.status === 'assigned';

    const searchLower = (search || '').trim().toLowerCase();
    if (!searchLower) return matchesFilter;

    const qrIdStr = (q.qrId || '').toLowerCase();
    const noteStr = (q.note || '').toLowerCase();
    const clientNameStr = (q.assignedClient?.name || '').toLowerCase();

    const matchesSearch =
      qrIdStr.includes(searchLower) ||
      noteStr.includes(searchLower) ||
      clientNameStr.includes(searchLower);

    return matchesFilter && matchesSearch;
  });

  if (initialLoading) {
    return <QrGeneratorShimmer />;
  }

  return (
    <div className="fade-in">
      {/* Mobile Page Title Banner (Visible on mobile screens) */}
      <div className="mobile-page-title-card">
        <h1 className="mobile-page-h1">New QR Generation</h1>
        <p className="mobile-page-sub">
          Create and deploy dynamic QR codes with unique IDs for customer review standees
        </p>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(16, 185, 129, 0.18)',
          border: '1px solid rgba(16, 185, 129, 0.45)',
          borderRadius: '10px',
          padding: '10px 16px',
          marginBottom: '16px',
          color: '#10B981',
          fontSize: '0.86rem',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

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
            <Info size={16} />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchQrs}
            style={{ fontSize: '0.74rem', padding: '4px 10px' }}
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}

      <div className="qr-generator-grid">

        {/* Left Column: QR Generator Form */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div className="qr-card-icon-wrap">
              <Sparkles size={17} />
            </div>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Generic Dynamic QR Generator</h3>
          </div>

          {/* Auto Format Specification Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(109, 36, 186, 0.08) 0%, rgba(144, 56, 232, 0.04) 100%)',
            border: '1px solid rgba(109, 36, 186, 0.22)',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '12px'
          }}>
            <div className="qr-digits-display-box">
              <span className="qr-digits-prefix">QR</span>
              <span className="qr-digits-number" title="6-digit sequential increasing number (e.g. 000001)">{nextSequenceFormatted}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Prefix: <strong className="qr-digits-format-val">QR</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>Format: <strong className="qr-digits-format-val">(QR{nextSequenceFormatted})</strong></span>
              <span className="qr-auto-inc-badge">
                Auto Increment
              </span>
            </div>
          </div>

          {/* 1-Click Generate Button */}
          <button
            type="button"
            className={`btn-generate-dynamic-qr ${loading ? 'is-generating' : ''}`}
            disabled={loading || batchLoading}
            onClick={handleGenerate}
            id="btn-generate-single-qr"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Generating Dynamic QR...</span>
              </>
            ) : (
              <>
                <QrCode size={16} />
                <span>Generate Dynamic QR</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Latest QR Live Preview Card */}
        {latestQr ? (
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
            {/* Header: Title + Badge inline */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div className="qr-card-icon-wrap">
                <Eye size={17} />
              </div>
              <h3 style={{ fontSize: '1rem', margin: 0, whiteSpace: 'nowrap' }}>Active Dynamic QR Preview</h3>
              <span className={`badge ${latestQr.status === 'assigned' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.68rem', marginLeft: 'auto' }}>
                {latestQr.status === 'assigned' ? '🔒 Assigned' : '⚡ Ready to Assign'}
              </span>
            </div>

            {/* 50% / 50% Grid: QR on Left (50%), Action Controls on Right (50%) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
              {/* Left 50%: QR Standee Frame */}
              <div
                onClick={() => handleOpenQrModal(latestQr)}
                style={{
                  cursor: 'pointer',
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '8px',
                  boxShadow: '0 3px 12px rgba(109, 36, 186, 0.12)',
                  border: '1px solid rgba(109, 36, 186, 0.18)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                title="Click to preview Standee"
              >
                <img
                  src={getImageUrl(latestQr.filePath)}
                  alt={latestQr.qrId}
                  style={{ width: '100%', maxWidth: '84px', aspectRatio: '1/1', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                />
                <div style={{
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  background: '#F1F5F9',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px dashed #CBD5E1',
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'center'
                }}>
                  {latestQr.qrId}
                </div>

                {latestQr.assignedClient ? (
                  <div style={{ marginTop: '4px', textAlign: 'center', width: '100%' }}>
                    <div
                      style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1E293B', lineHeight: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                      title={latestQr.assignedClient.name}
                    >
                      {latestQr.assignedClient.name}
                    </div>
                    {latestQr.assignedClient.phone && (
                      <div style={{ fontSize: '0.66rem', color: '#64748B', marginTop: '1px' }}>
                        {formatPhoneNumber(latestQr.assignedClient.phone)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: '4px', fontSize: '0.68rem', color: '#059669', fontWeight: 600, textAlign: 'center' }}>
                    Ready for client
                  </div>
                )}

                {latestQr.note && (
                  <div
                    style={{ fontSize: '0.64rem', color: '#64748B', marginTop: '2px', textAlign: 'center', fontStyle: 'italic', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={latestQr.note}
                  >
                    {latestQr.note}
                  </div>
                )}
              </div>

              {/* Right 50%: Action Controls with Distinct Color Themes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', boxSizing: 'border-box' }}>
                <button
                  type="button"
                  className="btn-qr-preview-print"
                  onClick={() => setPrintQr(latestQr)}
                  id="btn-print-latest-qr"
                  title="Print standee counter card"
                >
                  <Printer size={12} style={{ flexShrink: 0 }} />
                  <span>Print Standee</span>
                </button>

                <button
                  type="button"
                  className="btn-qr-preview-scan"
                  onClick={() => onTestReview(latestQr.assignedClient ? (latestQr.assignedClient.slug || generateSlug(latestQr.assignedClient.name)) : latestQr.qrId)}
                  title={latestQr.status === 'unassigned' ? "Scan Preview (Empty Dynamic Prompt)" : "Open customer review form"}
                  id="btn-test-customer-form"
                >
                  <ExternalLink size={12} style={{ flexShrink: 0 }} />
                  <span>{latestQr.status === 'unassigned' ? 'Scan Preview' : 'Open Review'}</span>
                </button>

                {latestQr.status === 'unassigned' ? (
                  <button
                    type="button"
                    className="btn-qr-preview-onboard"
                    onClick={() => onGoToOnboarding(latestQr.qrId)}
                    id="btn-onboard-with-this-qr"
                    title="Onboard a new client with this dynamic QR standee"
                  >
                    <Check size={12} />
                    <span>Onboard Client</span>
                    <ArrowRight size={11} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{
                      height: '28px',
                      fontSize: '0.74rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      borderRadius: '6px'
                    }}
                    onClick={() => handleEditClick(latestQr)}
                    title="Edit assigned client details"
                    id="btn-edit-assigned-client-preview"
                  >
                    <Edit size={12} style={{ color: '#8B5CF6' }} />
                    <span>Edit Client</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', boxSizing: 'border-box' }}>
            <QrCode size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 8px auto' }} />
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 4px 0' }}>No Dynamic QRs Generated Yet</h4>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>Generate your first QR on the left to see the live standee preview.</p>
          </div>
        )}

        {/* Third Column: Dedicated Batch Standee Pre-Generation */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div className="qr-card-icon-wrap">
              <Layers size={17} />
            </div>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Batch Pre-Generation</h3>
          </div>

          {/* Quick Packs (3, 5, 10) */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Quick Batch Packs:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-batch-pack"
                style={{ padding: '6px 4px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                disabled={batchLoading || loading}
                onClick={() => handleBatchGenerate(3)}
                id="btn-batch-3"
              >
                <Layers size={13} />
                <span>+ 3 QRs</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-batch-pack"
                style={{ padding: '6px 4px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                disabled={batchLoading || loading}
                onClick={() => handleBatchGenerate(5)}
                id="btn-batch-5"
              >
                <Layers size={13} />
                <span>+ 5 QRs</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-batch-pack"
                style={{ padding: '6px 4px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                disabled={batchLoading || loading}
                onClick={() => handleBatchGenerate(10)}
                id="btn-batch-10"
              >
                <Layers size={13} />
                <span>+ 10 QRs</span>
              </button>
            </div>
          </div>

          {/* Custom Batch Quantity */}
          <div style={{ marginBottom: '10px', padding: '8px 10px', background: 'rgba(109, 36, 186, 0.05)', borderRadius: '7px', border: '1px solid rgba(109, 36, 186, 0.18)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
              Custom Batch Quantity:
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="number"
                min="2"
                max="50"
                value={customBatchCount}
                onChange={(e) => setCustomBatchCount(Math.max(2, Math.min(50, parseInt(e.target.value, 10) || 2)))}
                className="form-input"
                style={{ width: '60px', padding: '5px 7px', height: '32px', fontSize: '0.84rem' }}
                disabled={batchLoading || loading}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-batch-generate-custom"
                style={{ flex: 1, height: '32px', justifyContent: 'center', fontSize: '0.78rem' }}
                disabled={batchLoading || loading}
                onClick={() => handleBatchGenerate(customBatchCount)}
                id="btn-batch-custom"
              >
                {batchLoading ? <RefreshCw size={12} className="animate-spin" /> : <Layers size={12} />}
                <span>{batchLoading ? 'Generating...' : `Generate ${customBatchCount} Standees`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Generated QRs Catalog / Inventory */}
      <div className="glass-panel qr-catalog-panel" style={{ marginTop: '14px', padding: '12px 16px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="qr-catalog-icon-wrap">
              <List size={17} />
            </div>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>Dynamic QRs Catalog ({filteredQrs.length})</h3>
          </div>

          <div className="catalog-controls-bar" style={{ gap: '8px' }}>
            {/* Filter Pills */}
            <div className="catalog-filter-pills" style={{ padding: '2px', gap: '2px' }}>
              <button
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '5px', padding: '3px 10px', fontSize: '0.74rem', fontWeight: 600, height: '26px' }}
                onClick={() => setFilter('all')}
              >
                All ({allQrs.length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'unassigned' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '5px', padding: '3px 10px', fontSize: '0.74rem', fontWeight: 600, height: '26px' }}
                onClick={() => setFilter('unassigned')}
              >
                Unassigned ({allQrs.filter(q => q.status === 'unassigned').length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'assigned' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '5px', padding: '3px 10px', fontSize: '0.74rem', fontWeight: 600, height: '26px' }}
                onClick={() => setFilter('assigned')}
              >
                Assigned ({allQrs.filter(q => q.status === 'assigned').length})
              </button>
            </div>

            {/* Search Input with Search Icon */}
            <div className="catalog-search-input-wrap">
              <Search size={13} className="catalog-search-icon" style={{ left: '8px' }} />
              <input
                type="text"
                className="form-input catalog-search-input"
                placeholder="Search QR ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ height: '26px', fontSize: '0.76rem', paddingLeft: '26px', width: '150px' }}
              />
            </div>

            {/* Pull & Print Empty QRs Button */}
            <button
              type="button"
              className="btn btn-sm btn-print-empty-qrs"
              onClick={() => setShowBatchPrintModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '26px',
                padding: '0 12px',
                fontSize: '0.74rem',
                fontWeight: 700,
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                color: '#FFFFFF',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              title="Pull all unassigned QRs with unique IDs, copy IDs, export CSV, and print empty standees or stickers"
              id="btn-pull-print-unassigned"
            >
              <Printer size={13} />
              <span>Pull & Print Empty QRs ({allQrs.filter(q => q.status === 'unassigned').length})</span>
            </button>
          </div>
        </div>

        {/* Informational banner when filtered by unassigned */}
        {filter === 'unassigned' && (
          <div style={{
            margin: '8px 0 12px 0',
            padding: '8px 12px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#065F46' }}>
              <Sparkles size={14} style={{ color: '#10B981', flexShrink: 0 }} />
              <span>
                <strong>{allQrs.filter(q => q.status === 'unassigned').length} Unassigned QR(s) available</strong> — You can print physical standees or sticker sheets with prominent <code>STAND-ID</code> badges for field onboarding.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowBatchPrintModal(true)}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <Printer size={12} />
              <span>Open Print Sheet ({allQrs.filter(q => q.status === 'unassigned').length})</span>
            </button>
          </div>
        )}

        {/* Desktop Table of QRs */}
        <div className="catalog-desktop-table data-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '42px' }}>QR</th>
                <th>Unique QR ID</th>
                <th>Status</th>
                <th>Assigned Client</th>
                <th>Generated On</th>
                <th style={{ width: '260px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQrs.map((item) => {
                const isHighlighted = highlightedQrIds.includes(item.qrId);
                return (
                  <tr
                    key={item.id || item.qrId}
                    id={`qr-row-${item.qrId}`}
                    className={isHighlighted ? 'qr-row-highlight' : ''}
                    onClick={() => handleSelectQrRow(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <img
                        src={getImageUrl(item.filePath)}
                        alt={item.qrId}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: '#FFF',
                          padding: '2px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          display: 'block'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectQrRow(item);
                          handleOpenQrModal(item);
                        }}
                        title="Click to preview Standee"
                      />
                    </td>
                    <td>
                      <code
                        style={{
                          fontWeight: 700,
                          color: isHighlighted ? '#DDD6FE' : '#6366F1',
                          cursor: 'pointer',
                          fontSize: '0.82rem'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectQrRow(item);
                          handleOpenQrModal(item);
                        }}
                        title="Click to preview Standee"
                      >
                        {item.qrId}
                      </code>
                      {item.note && (
                        <div style={{ fontSize: '0.68rem', color: isHighlighted ? '#CBD5E1' : 'var(--text-muted)', lineHeight: 1.2 }}>
                          {item.note}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${item.status === 'assigned' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.66rem', padding: '2px 7px' }}>
                        {item.status === 'assigned' ? 'Assigned' : 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      {item.assignedClient ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: isHighlighted ? '#FFFFFF' : 'var(--text-primary)' }}>
                            {item.assignedClient.name || 'Assigned Business'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: isHighlighted ? '#CBD5E1' : 'var(--text-muted)' }}>
                            <CopyablePhone
                              phone={item.assignedClient.phone}
                              displayText={formatPhoneNumber(item.assignedClient.phone)}
                              style={{ fontSize: '0.7rem', color: isHighlighted ? '#CBD5E1' : 'inherit' }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: isHighlighted ? '#DDD6FE' : 'var(--text-muted)', fontSize: '0.76rem' }}>— Ready for client</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: isHighlighted ? '#E2E8F0' : 'var(--text-secondary)' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                        {/* 1. Edit */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            height: '28px',
                            padding: '0 9px',
                            fontSize: '0.74rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: isHighlighted ? '#FFFFFF' : 'var(--text-primary)',
                            borderRadius: '6px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectQrRow(item);
                            handleEditClick(item);
                          }}
                          title={item.status === 'assigned' ? "Edit assigned client details" : "Configure and onboard client with this QR"}
                          id={`btn-action-edit-${item.qrId}`}
                        >
                          <Edit size={12} style={{ color: isHighlighted ? '#DDD6FE' : '#8B5CF6' }} />
                          <span>Edit</span>
                        </button>

                        {/* 2. Review */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            height: '28px',
                            padding: '0 9px',
                            fontSize: '0.74rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: isHighlighted ? '#FFFFFF' : 'var(--text-primary)',
                            borderRadius: '6px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectQrRow(item);
                            onTestReview(item.assignedClient ? (item.assignedClient.slug || generateSlug(item.assignedClient.name || '')) : item.qrId);
                          }}
                          title="Test Review Form"
                          id={`btn-action-review-${item.qrId}`}
                        >
                          <ExternalLink size={12} style={{ color: isHighlighted ? '#7DD3FC' : '#38BDF8' }} />
                          <span>Review</span>
                        </button>

                        {/* 3. Onboarding (wide button) */}
                        {item.status === 'unassigned' ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{
                              height: '28px',
                              padding: '0 12px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              minWidth: '95px',
                              justifyContent: 'center',
                              borderRadius: '6px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectQrRow(item);
                              onGoToOnboarding(item.qrId);
                            }}
                            title="Onboard client with this QR"
                            id={`btn-action-onboard-${item.qrId}`}
                          >
                            <UserPlus size={12} />
                            <span>Onboard</span>
                            <ArrowRight size={11} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{
                              height: '28px',
                              padding: '0 10px',
                              fontSize: '0.72rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              minWidth: '95px',
                              justifyContent: 'center',
                              opacity: isHighlighted ? 0.85 : 0.6,
                              cursor: 'default',
                              borderRadius: '6px',
                              color: isHighlighted ? '#FFFFFF' : undefined
                            }}
                            disabled
                            title="Standee already assigned to business"
                          >
                            <Check size={11} style={{ color: isHighlighted ? '#6EE7B7' : '#10B981' }} />
                            <span>Onboarded</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards List matching Mockup */}
        <div className="catalog-mobile-cards">
          {filteredQrs.map((item) => {
            const isHighlighted = highlightedQrIds.includes(item.qrId);
            return (
              <div
                key={item.id || item.qrId}
                id={`qr-mobile-card-${item.qrId}`}
                className={`mobile-catalog-card ${isHighlighted ? 'qr-row-highlight' : ''}`}
                onClick={() => handleSelectQrRow(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="mobile-card-main-row">
                  <img
                    src={getImageUrl(item.filePath)}
                    alt={item.qrId}
                    className="mobile-card-thumb"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectQrRow(item);
                      handleOpenQrModal(item);
                    }}
                    title="Click to preview Standee"
                  />

                  <div
                    className="mobile-card-info"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectQrRow(item);
                      handleOpenQrModal(item);
                    }}
                  >
                    <div className="mobile-card-qrid" style={{ color: isHighlighted ? '#FFFFFF' : undefined }}>{item.qrId}</div>
                    {(item.assignedClient?.name || item.note) ? (
                      <div className="mobile-card-note" style={{ color: isHighlighted ? '#DDD6FE' : undefined }}>
                        {item.assignedClient?.name || item.note}
                      </div>
                    ) : null}
                  </div>

                  <span
                    className={`badge ${item.status === 'assigned' ? 'badge-success' : 'badge-warning'}`}
                    style={{ fontSize: '0.66rem', padding: '2px 8px', textTransform: 'capitalize' }}
                  >
                    {item.status === 'assigned' ? 'Assigned' : 'Unassigned'}
                  </span>

                  <div className="mobile-card-date" style={{ color: isHighlighted ? '#E2E8F0' : undefined }}>
                    <Calendar size={12} style={{ color: isHighlighted ? '#DDD6FE' : 'var(--text-muted)' }} />
                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>

                  <div className="mobile-card-actions" style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{
                        flex: 1,
                        minHeight: '32px',
                        fontSize: '0.76rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        color: isHighlighted ? '#FFFFFF' : undefined
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectQrRow(item);
                        handleEditClick(item);
                      }}
                    >
                      <Edit size={12} style={{ color: isHighlighted ? '#DDD6FE' : '#8B5CF6' }} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{
                        flex: 1,
                        minHeight: '32px',
                        fontSize: '0.76rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        color: isHighlighted ? '#FFFFFF' : undefined
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectQrRow(item);
                        onTestReview(item.assignedClient ? (item.assignedClient.slug || generateSlug(item.assignedClient.name || '')) : item.qrId);
                      }}
                    >
                      <ExternalLink size={12} style={{ color: isHighlighted ? '#7DD3FC' : '#38BDF8' }} />
                      <span>Review</span>
                    </button>

                    {item.status === 'unassigned' ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1.5, minHeight: '32px', fontSize: '0.76rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectQrRow(item);
                          onGoToOnboarding(item.qrId);
                        }}
                      >
                        <UserPlus size={12} />
                        <span>Onboard</span>
                        <ArrowRight size={11} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{
                          flex: 1.5,
                          minHeight: '32px',
                          fontSize: '0.74rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          opacity: isHighlighted ? 0.85 : 0.6,
                          color: isHighlighted ? '#FFFFFF' : undefined
                        }}
                        disabled
                      >
                        <Check size={11} style={{ color: isHighlighted ? '#6EE7B7' : '#10B981' }} />
                        <span>Onboarded</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Print Standee Modal */}
      {printQr && (
        <PrintModal
          qr={printQr}
          client={printQr.assignedClient}
          onClose={() => setPrintQr(null)}
        />
      )}

      {/* Batch Pull & Print Unassigned QRs Modal */}
      <BatchPrintUnassignedModal
        isOpen={showBatchPrintModal}
        onClose={() => setShowBatchPrintModal(false)}
        initialQrs={allQrs}
      />

      {/* Delete Single QR Confirmation Modal */}
      {deletingQr && createPortal(
        <div
          className="modal-overlay"
          onClick={() => !isDeletingSingle && setDeletingQr(null)}
          style={{ backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out', zIndex: 1100 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                flexShrink: 0
              }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Delete QR {deletingQr.qrId}?</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Status: {deletingQr.status || 'unassigned'}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Are you sure you want to delete QR <strong>{deletingQr.qrId}</strong>?
              {deletingQr.assignedClient && (
                <span style={{ display: 'block', marginTop: '6px', color: '#EF4444' }}>
                  Warning: Currently assigned to "{deletingQr.assignedClient.name}". The client will be unlinked.
                </span>
              )}
            </p>

            {deleteError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#FCA5A5',
                fontSize: '0.82rem',
                marginBottom: '16px'
              }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setDeletingQr(null)}
                disabled={isDeletingSingle}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDeleteSingleQr}
                disabled={isDeletingSingle}
                id="btn-confirm-delete-single-qr"
                style={{
                  background: '#DC2626',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600
                }}
              >
                {isDeletingSingle ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete QR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* QR Generated / View Modal */}
      {successModalData && createPortal(
        <div
          className="modal-overlay"
          onClick={() => handleDoneAndScrollToTable(successModalData.qrs || successModalData.qr)}
          style={{ backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }}
        >
          {successModalData.created ? (
            /* ============================================================
               Simple Dialog Box (Appears after creating a QR)
               ============================================================ */
            <div
              className="modal-content simple-qr-dialog"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '400px',
                width: '92%',
                padding: '24px 22px',
                borderRadius: '16px',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleDoneAndScrollToTable(successModalData.qrs || successModalData.qr)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  borderRadius: '50%',
                  padding: '4px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Close"
                aria-label="Close"
              >
                <X size={15} />
              </button>

              {/* Success Ambient Icon */}
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 0 18px rgba(16, 185, 129, 0.2)'
              }}>
                <CheckCircle2 size={26} />
              </div>

              {/* Title & Subtitle */}
              <h3 style={{ fontSize: '1.18rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                {successModalData.type === 'batch'
                  ? `${successModalData.count} Dynamic QRs Generated!`
                  : 'QR Generated Successfully!'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                Dynamic standee QR is saved to inventory and ready to be assigned.
              </p>

              {/* QR Identifier Badge / Preview */}
              {successModalData.type === 'batch' && successModalData.qrs ? (
                <div style={{
                  background: 'rgba(109, 36, 186, 0.08)',
                  border: '1px solid rgba(109, 36, 186, 0.22)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '18px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  justifyContent: 'center'
                }}>
                  {successModalData.qrs.map((q) => (
                    <span
                      key={q.qrId}
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#8B5CF6',
                        background: 'rgba(139, 92, 246, 0.12)',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        fontSize: '0.78rem'
                      }}
                    >
                      {q.qrId}
                    </span>
                  ))}
                </div>
              ) : successModalData.qr ? (
                <div style={{
                  background: 'rgba(109, 36, 186, 0.06)',
                  border: '1px solid rgba(109, 36, 186, 0.22)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left'
                }}>
                  <img
                    src={getImageUrl(successModalData.qr.filePath)}
                    alt={successModalData.qr.qrId}
                    style={{
                      width: '46px',
                      height: '46px',
                      objectFit: 'contain',
                      background: '#FFFFFF',
                      padding: '3px',
                      borderRadius: '7px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.03em'
                    }}>
                      {successModalData.qr.qrId}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Status:{' '}
                      <span className="badge badge-warning" style={{ fontSize: '0.64rem', padding: '1px 6px' }}>
                        {successModalData.qr.status || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons: Done (scrolls to table & highlights) & Onboard */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '40px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
                    borderRadius: '9px'
                  }}
                  onClick={() => handleDoneAndScrollToTable(successModalData.qrs || successModalData.qr)}
                  id="btn-qr-dialog-done"
                >
                  <Check size={16} />
                  <span>Done</span>
                </button>

                {successModalData.qr && successModalData.qr.status === 'unassigned' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: '100%',
                      height: '36px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onClick={() => {
                      const id = successModalData.qr.qrId;
                      setSuccessModalData(null);
                      onGoToOnboarding(id);
                    }}
                  >
                    <UserPlus size={14} />
                    <span>Onboard Client with this QR</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Inspection Modal */
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '500px',
                width: '100%',
                padding: '28px 24px',
                background: '#0F172A',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.65), 0 0 35px rgba(16, 185, 129, 0.18)',
                borderRadius: '16px',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSuccessModalData(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  borderRadius: '50%',
                  padding: '6px',
                  width: '32px',
                  height: '32px'
                }}
                title="Close Modal"
              >
                <X size={16} />
              </button>

              {/* Success Celebration Icon */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
              }}>
                <CheckCircle2 size={32} />
              </div>

              <h3 style={{ fontSize: '1.25rem', color: '#F8FAFC', marginBottom: '4px', fontWeight: 700 }}>
                {successModalData.title || (successModalData.type === 'batch'
                  ? `${successModalData.count} Dynamic QRs Generated!`
                  : 'QR Generated Successfully!')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '18px' }}>
                {successModalData.subtitle || 'Dynamic standee QR is saved to inventory and ready for client onboarding.'}
              </p>

              {/* Standee Preview Box */}
              {successModalData.qr && (
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '16px 14px',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  margin: '0 auto 16px auto',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  minWidth: '200px'
                }}>
                  <div style={{
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#64748B',
                    fontWeight: 700,
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Sparkles size={11} style={{ color: '#F59E0B' }} />
                    <span>Dynamic Review Standee</span>
                  </div>
                  <img
                    src={getImageUrl(successModalData.qr.filePath)}
                    alt={successModalData.qr.qrId}
                    style={{ width: '170px', height: '170px', objectFit: 'contain', display: 'block' }}
                  />
                  <div style={{
                    marginTop: '8px',
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    background: '#F1F5F9',
                    padding: '3px 12px',
                    borderRadius: '6px',
                    border: '1px dashed #CBD5E1',
                    letterSpacing: '0.04em'
                  }}>
                    {successModalData.qr.qrId}
                  </div>

                  {/* Standee Footer: Developed By Vasmi Group with Logo */}
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '6px',
                    borderTop: '1px solid #E2E8F0',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '0.7rem'
                  }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Developed by</span>
                    <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
                      <span style={{ color: '#0F172A' }}>Vasmi</span>
                      <span style={{ color: '#EA580C', marginLeft: '1px' }}>Group</span>
                    </span>
                    <img
                      src={vasmiIcon}
                      alt="Vasmi Group"
                      width="14"
                      height="12"
                      style={{ objectFit: 'contain', display: 'inline-block', marginLeft: '2px' }}
                    />
                  </div>
                </div>
              )}

              {/* If Assigned Client details exist */}
              {successModalData.qr && successModalData.qr.assignedClient && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '14px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Client:</span>
                  <strong style={{ color: '#34D399' }}>{successModalData.qr.assignedClient.name}</strong>
                </div>
              )}

              {/* Target URL Info Box */}
              {successModalData.qr && (() => {
                const targetUrl = successModalData.qr.assignedClient
                  ? `${window.location.origin}/${successModalData.qr.assignedClient.slug || generateSlug(successModalData.qr.assignedClient.name)}`
                  : `${window.location.origin}/${successModalData.qr.qrId}`;
                return (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '18px',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Target URL: </span>
                      <code style={{ color: '#E2E8F0' }}>{targetUrl}</code>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.72rem', height: '24px', flexShrink: 0 }}
                      onClick={() => copyUrlToClipboard(targetUrl)}
                      title="Copy Review URL"
                    >
                      {copiedUrl ? <Check size={11} style={{ color: 'var(--success)' }} /> : <Copy size={11} />}
                      <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {successModalData.qr && (
                  successModalData.qr.status === 'unassigned' ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        height: '42px',
                        width: '100%',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #6D24BA 100%)',
                        border: 'none',
                        color: '#FFF',
                        boxShadow: '0 4px 14px rgba(109, 36, 186, 0.35)'
                      }}
                      onClick={() => {
                        const targetId = successModalData.qr.qrId;
                        setSuccessModalData(null);
                        onGoToOnboarding(targetId);
                      }}
                      id="btn-modal-onboard-client"
                    >
                      <UserPlus size={16} />
                      <span>Onboard Client with this QR</span>
                      <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        height: '42px',
                        width: '100%',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #6D24BA 100%)',
                        border: 'none',
                        color: '#FFF',
                        boxShadow: '0 4px 14px rgba(109, 36, 186, 0.35)'
                      }}
                      onClick={() => {
                        const targetSlug = successModalData.qr.assignedClient?.slug || generateSlug(successModalData.qr.assignedClient?.name) || successModalData.qr.qrId;
                        setSuccessModalData(null);
                        onTestReview(targetSlug);
                      }}
                      id="btn-modal-open-review"
                    >
                      <ExternalLink size={16} />
                      <span>Open Customer Review Form</span>
                    </button>
                  )
                )}

                {/* Secondary Actions Row */}
                <div style={{ display: 'grid', gridTemplateColumns: successModalData.qr ? 'repeat(3, 1fr)' : '1fr', gap: '8px' }}>
                  {successModalData.qr && (
                    <a
                      href={getImageUrl(successModalData.qr.filePath)}
                      download={`${successModalData.qr.qrId}.png`}
                      className="btn btn-secondary btn-sm"
                      style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.78rem' }}
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </a>
                  )}

                  {successModalData.qr && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.78rem' }}
                      onClick={() => {
                        const qrToPrint = successModalData.qr;
                        setSuccessModalData(null);
                        setPrintQr(qrToPrint);
                      }}
                    >
                      <Printer size={13} />
                      <span>Print</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}
                    onClick={() => handleDoneAndScrollToTable(successModalData.qr)}
                  >
                    <span>Done</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Edit Client Modal opened from Actions -> Edit */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSaveSuccess={() => {
            setEditingClient(null);
            fetchQrs();
          }}
        />
      )}

      {/* Mobile Bottom User Profile & Sign Out Bar matching Mockup */}
      <div className="mobile-bottom-user-bar">
        <div className="mobile-user-profile">
          <div className="mobile-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="mobile-user-text">
            <span className="mobile-user-name">{user?.name || 'Super Admin'}</span>
            <span className="mobile-user-role">{user?.role === 'superadmin' ? 'Superadmin' : 'Client Admin'}</span>
          </div>
        </div>

        <div className="mobile-user-divider" />

        <button
          type="button"
          className="mobile-signout-btn"
          onClick={onLogout}
          id="btn-mobile-signout"
          title="Sign out of Superadmin Portal"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
