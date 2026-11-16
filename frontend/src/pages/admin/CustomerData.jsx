import React, { useState, useEffect } from 'react';
import { 
  MessageSquareText, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Phone, 
  Calendar, 
  Sparkles, 
  RefreshCw,
  ExternalLink,
  Filter,
  CheckCircle2,
  X,
  Building2,
  Users
} from 'lucide-react';
import { generateSlug } from '../../utils/slug';
import { formatPhoneNumber } from '../../utils/phone';
import config from '../../config';
import { TableShimmer } from '../../components/Shimmer';
import CopyablePhone from '../../components/CopyablePhone';

export default function CustomerData({ user, onTestReview, selectedClientId, onSelectClient, hideClientSelector = false }) {
  const isSuperAdmin = user?.role === 'superadmin';
  const [reviews, setReviews] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeClientId, setActiveClientId] = useState(selectedClientId || (isSuperAdmin ? '' : (user?.clientId || user?.qrId || '')));

  // Keep activeClientId in sync if prop changes
  useEffect(() => {
    if (selectedClientId !== undefined) {
      setActiveClientId(selectedClientId);
    }
  }, [selectedClientId]);

  // Load clients list for Super Admin dropdown
  useEffect(() => {
    if (isSuperAdmin) {
      fetch(`${config.API_BASE_URL}/api/clients`)
        .then(res => res.json())
        .then(data => {
          if (data.clients && Array.isArray(data.clients)) {
            setClients(data.clients);
          }
        })
        .catch(err => console.error('Failed to load clients list:', err));
    }
  }, [isSuperAdmin]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let url = '';
      if (isSuperAdmin && (!activeClientId || activeClientId === 'all')) {
        url = `${config.API_BASE_URL}/api/reviews`;
      } else {
        const target = activeClientId || user?.clientId || user?.qrId;
        if (!target) {
          url = `${config.API_BASE_URL}/api/reviews`;
        } else {
          url = `${config.API_BASE_URL}/api/reviews/client/${target}`;
        }
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [activeClientId, user]);

  const currentClient = clients.find(c => c.id === activeClientId || c.qrId === activeClientId) || (!isSuperAdmin ? user : null);

  const filteredReviews = reviews.filter(r => {
    const q = search.toLowerCase().trim();
    return !q || (
      (r.phone && r.phone.toLowerCase().includes(q)) ||
      (r.comments && r.comments.toLowerCase().includes(q)) ||
      (r.qrId && r.qrId.toLowerCase().includes(q))
    );
  });

  const phoneCount = reviews.filter(r => !!r.phone).length;

  return (
    <div className="fade-in">

      {/* Compact KPI Strip (Horizontal 1-Row Summary) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '10px',
        marginBottom: '14px'
      }}>
        {/* Total Reviews */}
        <div className="glass-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MessageSquareText size={16} />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{reviews.length}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Reviews</div>
          </div>
        </div>

        {/* Customer Phone Contacts Captured */}
        <div className="glass-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Phone size={16} />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{phoneCount}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Phone Contacts</div>
          </div>
        </div>

        {/* Excel Sync Status */}
        <div className="glass-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.15)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FileSpreadsheet size={16} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34D399', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} />
              <span>Auto-Synced to Excel</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Live Cloud Spreadsheet
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>

        {/* Compact Filters & Action Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '14px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          {/* Left: Client selector (for Super Admin), Search input, count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
            {isSuperAdmin && !hideClientSelector && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '220px' }}>
                <Building2 size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <select
                  className="form-select"
                  style={{ height: '34px', fontSize: '0.82rem', paddingLeft: '8px', fontWeight: 600, minWidth: '210px' }}
                  value={activeClientId || 'all'}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? '' : e.target.value;
                    setActiveClientId(val);
                    if (onSelectClient) onSelectClient(val);
                  }}
                  id="select-customer-data-client"
                  title="Filter reviews by client"
                >
                  <option value="all">🏢 All Clients (Consolidated View)</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.qrId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Input */}
            <div className="responsive-search-wrap" style={{ position: 'relative', minWidth: '180px', maxWidth: '300px', flex: 1 }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '32px', height: '34px', fontSize: '0.82rem', paddingRight: search ? '28px' : '10px' }}
                placeholder="Search phone, review, or QR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Showing {filteredReviews.length} of {reviews.length}
            </span>
          </div>

          {/* Right: EXPORT EXCEL SHEET BUTTON NEXT TO FILTERS, Refresh, Simulate */}
          <div className="responsive-btn-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Export Excel Button right next to filters */}
            <a
              href={activeClientId && activeClientId !== 'all' ? `${config.API_BASE_URL}/api/reviews/export/${activeClientId}` : `${config.API_BASE_URL}/api/reviews/export-master`}
              download
              className="btn btn-success btn-sm"
              id="btn-export-excel-sheet"
              title={activeClientId && activeClientId !== 'all' ? `Download ${currentClient?.name || 'client'} review workbook (.xlsx)` : 'Download consolidated master reviews workbook (.xlsx)'}
              style={{
                height: '34px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                padding: '0 12px'
              }}
            >
              <Download size={14} />
              <span>{activeClientId && activeClientId !== 'all' ? 'Export Client Excel' : 'Export Master Excel'}</span>
            </a>

            {/* Refresh Reviews */}
            <button 
              className="btn btn-secondary btn-sm"
              onClick={fetchReviews}
              title="Refresh Reviews"
              style={{ height: '34px', padding: '0 9px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Simulate Customer Review */}
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const targetSlug = currentClient?.slug || generateSlug(currentClient?.name) || currentClient?.qrId || (clients[0]?.slug) || 'QR000001';
                onTestReview(targetSlug);
              }}
              id="btn-simulate-review"
              title="Test the live customer review scan form"
              style={{ height: '34px', fontSize: '0.8rem', padding: '0 12px' }}
            >
              <ExternalLink size={14} />
              <span>Test Review QR</span>
            </button>
          </div>
        </div>

        {/* Compact Reviews Table */}
        {loading ? (
          <div style={{ padding: '6px 0' }}>
            <TableShimmer columns={5} rows={5} showHeaderActions={false} title="Customer Reviews" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px' }}>
            <MessageSquareText size={38} style={{ color: 'var(--text-muted)', margin: '0 auto 10px auto' }} />
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginBottom: '6px' }}>No Customer Reviews Found</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 14px auto' }}>
              {search 
                ? 'No reviews match your search. Try clearing filters.' 
                : 'Customer scans of your standee will automatically log feedback and phone numbers here and into your Excel sheet.'}
            </p>
            {search ? (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setSearch('')}
              >
                Clear Search
              </button>
            ) : (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => onTestReview(user?.qrId || 'QR000001')}
              >
                Submit First Customer Review
              </button>
            )}
          </div>
        ) : (
          <div className="data-table-container">
            <table className="custom-table compact-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  {(!activeClientId || activeClientId === 'all') && (
                    <th style={{ minWidth: '160px' }}>Business Client</th>
                  )}
                  <th style={{ minWidth: '150px' }}>Customer Phone</th>
                  <th style={{ minWidth: '140px' }}>Date & Time</th>
                  <th style={{ minWidth: '130px' }}>Standee QR</th>
                  <th>Customer Feedback & Comments</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((rev, index) => {
                  return (
                    <tr key={rev.id || index}>
                      {/* Index */}
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {index + 1}
                      </td>

                      {/* Business Client (shown in consolidated view) */}
                      {(!activeClientId || activeClientId === 'all') && (
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                            {rev.clientName || 'Partner Business'}
                          </div>
                        </td>
                      )}

                      {/* Customer Phone */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Phone size={12} />
                          </div>
                          {rev.phone ? (
                            <CopyablePhone 
                              phone={rev.phone} 
                              displayText={formatPhoneNumber(rev.phone)} 
                              style={{ fontWeight: 600, fontSize: '0.84rem' }} 
                            />
                          ) : (
                            <span style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(rev.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                        <span style={{ color: 'var(--text-muted)' }}>
                          {new Date(rev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* QR ID */}
                      <td>
                        <code style={{
                          fontSize: '0.76rem',
                          color: 'var(--primary)',
                          background: 'rgba(99, 102, 241, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          fontWeight: 700
                        }}>
                          {rev.qrId}
                        </code>
                      </td>

                      {/* Comments */}
                      <td style={{ lineHeight: 1.45, color: 'var(--text-primary)', fontSize: '0.83rem' }}>
                        "{rev.comments}"
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Compact Table Footer */}
        {filteredReviews.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)'
          }}>
            <span>Showing {filteredReviews.length} customer feedback records</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10B981', fontWeight: 600 }}>
              <FileSpreadsheet size={13} />
              <span>Real-time Excel sync active</span>
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
