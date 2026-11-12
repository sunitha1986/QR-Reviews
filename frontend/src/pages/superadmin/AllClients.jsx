import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  QrCode,
  MapPin,
  FileSpreadsheet,
  Download,
  Printer,
  ExternalLink,
  MessageSquare,
  Building2,
  RefreshCw,
  Edit2,
  ShieldCheck,
  KeyRound,
  Share2,
  Copy,
  Check,
  X,
  Eye,
  Trash2,
  AlertTriangle,
  MessageSquareText,
  Sparkles
} from 'lucide-react';
import PrintModal from '../../components/PrintModal';
import EditClientModal from '../../components/EditClientModal';
import { generateSlug, getClientReviewUrl } from '../../utils/slug';
import { extractPlaceId, buildGoogleReviewUrl } from '../../utils/placeId';
import { formatPhoneNumber, cleanPhoneNumber } from '../../utils/phone';
import config, { getImageUrl } from '../../config';
import { TableShimmer } from '../../components/Shimmer';
import CopyablePhone from '../../components/CopyablePhone';

export default function AllClients({ onTestReview, onGoToOnboarding, onNavigateToClient }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [printQr, setPrintQr] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [credentialModalClient, setCredentialModalClient] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);
  const [successToast, setSuccessToast] = useState('');
  const [deletingAllModal, setDeletingAllModal] = useState(false);
  const [deletingClient, setDeletingClient] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleCopyPhone = (phoneNumber, clientId) => {
    if (!phoneNumber) return;
    const cleanPhone = phoneNumber.toString().trim();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(cleanPhone);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = cleanPhone;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedPhoneId(clientId);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  const handleShareWhatsApp = (client) => {
    if (!client) return;
    const rawPhone = client.phone ? client.phone.toString().replace(/\D/g, '') : '';
    const portalUrl = window.location.origin;
    const reviewUrl = getClientReviewUrl(client, client.qrId);
    const password = client.password || 'admin@123';
    const message = `👋 Hello ${client.name}!\n\nHere are your QR-Reviews Portal Login Details:\n\n🌐 *Portal Login*:\n🔗 URL: ${portalUrl}\n👤 Username (Phone): ${formatPhoneNumber(client.phone)}\n🔑 Password: ${password}\n\n⭐ *Customer Review Standee Link*:\n${reviewUrl}\n\nLog in anytime to see your customer feedback and download Excel reports!`;
    const encoded = encodeURIComponent(message);
    const targetUrl = rawPhone.length === 10
      ? `https://api.whatsapp.com/send?phone=91${rawPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(targetUrl, '_blank');
  };

  const handleCopyCredentials = (client) => {
    if (!client) return;
    const portalUrl = window.location.origin;
    const reviewUrl = getClientReviewUrl(client, client.qrId);
    const password = client.password || 'admin@123';
    const text = `Business: ${client.name}\nPortal URL: ${portalUrl}\nUsername (Phone): ${formatPhoneNumber(client.phone)}\nPassword: ${password}\nReview Link: ${reviewUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/clients`);
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleEditSaved = (updatedClient) => {
    setSuccessToast(`Successfully updated ${updatedClient.name}!`);
    setTimeout(() => setSuccessToast(''), 4000);
    fetchClients();
  };

  const handleRemoveAllClients = async () => {
    try {
      setIsDeleting(true);
      setDeleteError('');
      const res = await fetch(`${config.API_BASE_URL}/api/clients/all?deleteQrs=true`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove all clients');
      }
      setDeletingAllModal(false);
      setSuccessToast('All clients, assigned QR codes, and reviews have been permanently removed.');
      setTimeout(() => setSuccessToast(''), 4500);
      await fetchClients();
    } catch (err) {
      setDeleteError(err.message || 'Failed to remove all clients');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingleClient = async (client) => {
    if (!client) return;
    try {
      setIsDeleting(true);
      setDeleteError('');
      const res = await fetch(`${config.API_BASE_URL}/api/clients/${client.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete client');
      }
      setDeletingClient(null);
      setSuccessToast(`Client "${client.name}" removed successfully.`);
      setTimeout(() => setSuccessToast(''), 4000);
      await fetchClients();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      (c.businessLocation && c.businessLocation.toLowerCase().includes(q)) ||
      (c.qrId && c.qrId.toLowerCase().includes(q)) ||
      (c.businessType && c.businessType.toLowerCase().includes(q))
    );
  });

  const totalReviews = clients.reduce((sum, c) => sum + (c.reviewsCount || 0), 0);

  return (
    <div className="fade-in">
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '8px',
          padding: '12px 18px',
          color: '#34D399',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <ShieldCheck size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* High-level metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <div className="stat-val">{clients.length}</div>
            <div className="stat-label">Onboarded Clients</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent)' }}>
            <QrCode size={24} />
          </div>
          <div>
            <div className="stat-val">{clients.filter(c => c.qrId).length}</div>
            <div className="stat-label">Integrated QR Codes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <div className="stat-val">{totalReviews}</div>
            <div className="stat-label">Reviews in Excel Sheets</div>
          </div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => window.open(`${config.API_BASE_URL}/api/reviews/export-master`, '_blank')}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
            <Download size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Export Master Excel</div>
            <div className="stat-label">Download All Reviews (.xlsx)</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>All Onboarded Clients Directory</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Manage onboarded clients, assigned dynamic QRs, and Google Review targets.
            </p>
          </div>

          <div className="responsive-toolbar-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="responsive-search-wrap" style={{ position: 'relative', width: '260px', flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
                placeholder="Search name, phone, address, QR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchClients}
              title="Refresh Client List"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            {clients.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setDeleteError('');
                  setDeletingAllModal(true);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#EF4444',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600
                }}
                id="btn-remove-all-clients"
                title="Permanently remove all clients and assigned QRs"
              >
                <Trash2 size={14} />
                <span>Remove All Clients</span>
              </button>
            )}

            <button
              className="btn btn-primary btn-sm"
              onClick={onGoToOnboarding}
            >
              <span>+ Onboard New Client</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div style={{ padding: '8px 0' }}>
            <TableShimmer columns={6} rows={6} showHeaderActions={false} title="Onboarded Clients" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <Building2 size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 14px auto' }} />
            <h4 style={{ color: 'var(--text-secondary)' }}>No Onboarded Clients Found</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {search ? 'No clients match your search query.' : 'Onboard your first client to integrate dynamic QR standees.'}
            </p>
            <button className="btn btn-primary btn-sm" onClick={onGoToOnboarding}>
              Onboard Client Now
            </button>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Client / Business</th>
                  <th>Assigned QR Code</th>
                  <th>Contact Phone</th>
                  <th>Reviews</th>
                  <th style={{ textAlign: 'center', width: '170px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const qrUrl = client?.qrDetails?.filePath ? getImageUrl(client.qrDetails.filePath) : getImageUrl(`/uploads/qr-codes/${client.qrId}.png`);
                  return (
                    <tr key={client.id}>
                      {/* Name & Type with Logo */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {client.logoUrl ? (
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              padding: '2px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                              flexShrink: 0
                            }}>
                              <img
                                src={getImageUrl(client.logoUrl)}
                                alt={client.name}
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            </div>
                          ) : (
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFF',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              flexShrink: 0
                            }}>
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{client.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                {client.businessType || 'Partner'}
                              </span>
                              {client.isPhoneMandatory ? (
                                <span className="badge" style={{ fontSize: '0.66rem', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                  Phone Mandatory
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* QR Thumbnail & Code */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={qrUrl}
                            alt={`QR for ${client.name}`}
                            style={{
                              width: '38px',
                              height: '38px',
                              background: '#FFFFFF',
                              padding: '2px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              cursor: 'pointer'
                            }}
                            onClick={() => setPrintQr({
                              qrId: client.qrId,
                              filename: `${client.qrId}.png`,
                              name: client.name,
                              address: client.address,
                              businessLocation: client.businessLocation || client.address,
                              logoUrl: client.logoUrl
                            })}
                            title="Click to view & print standee"
                          />
                          <code
                            style={{ fontWeight: 700, color: '#A5B4FC', fontSize: '0.85rem', cursor: 'pointer' }}
                            onClick={() => setPrintQr({
                              qrId: client.qrId,
                              filename: `${client.qrId}.png`,
                              name: client.name,
                              address: client.address,
                              businessLocation: client.businessLocation || client.address,
                              logoUrl: client.logoUrl
                            })}
                            title="Click to view & print standee"
                          >
                            {client.qrId}
                          </code>
                        </div>
                      </td>

                      {/* Phone */}
                      <td>
                        {client.phone ? (
                          <CopyablePhone
                            phone={client.phone}
                            displayText={formatPhoneNumber(client.phone)}
                            style={{ fontSize: '0.86rem', fontWeight: 500 }}
                          />
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Reviews Count */}
                      <td>
                        <span
                          className={`badge ${client.reviewsCount > 0 ? 'badge-success' : 'badge-muted'}`}
                          style={{ cursor: onNavigateToClient ? 'pointer' : 'default' }}
                          onClick={() => onNavigateToClient && onNavigateToClient('customer-data', client.id)}
                          title="Click to view reviews for this client"
                        >
                          {client.reviewsCount || 0}
                        </span>
                      </td>

                      {/* Actions: View, Customer Data, Edit, Delete */}
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {/* View Button */}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 11px', fontSize: '0.78rem', color: '#38BDF8', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => setViewingClient(client)}
                            title="View all details & options"
                            id={`btn-view-client-${client.id}`}
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          {/* Customer Data Quick Action */}
                          {onNavigateToClient && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px 9px', fontSize: '0.78rem', color: '#34D399', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => onNavigateToClient('customer-data', client.id)}
                              title="Directly view customer review data for this client"
                              id={`btn-customer-data-client-${client.id}`}
                            >
                              <MessageSquareText size={13} />
                              <span>Reviews</span>
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 11px', fontSize: '0.78rem', color: '#A5B4FC', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => setEditingClient(client)}
                            title="Edit client details"
                            id={`btn-edit-client-${client.id}`}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 11px', fontSize: '0.78rem', color: '#F87171', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => {
                              setDeleteError('');
                              setDeletingClient(client);
                            }}
                            title="Delete this client"
                            id={`btn-delete-client-${client.id}`}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Standee Modal */}
      {printQr && (
        <PrintModal
          qr={printQr}
          client={printQr}
          onClose={() => setPrintQr(null)}
        />
      )}

      {/* Edit & Unlock Client Modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSaveSuccess={handleEditSaved}
        />
      )}

      {/* Client Credentials & WhatsApp Modal */}
      {credentialModalClient && createPortal(
        <div className="modal-overlay" onClick={() => setCredentialModalClient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.15)', color: '#34D399' }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Client Portal Login</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{credentialModalClient.name}</p>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCredentialModalClient(null)}
                style={{ borderRadius: '50%', padding: '6px' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '18px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Portal URL: </span>
                  <code style={{ color: 'var(--text-primary)' }}>{window.location.origin}</code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Login Username (Phone): </span>
                  <CopyablePhone
                    phone={credentialModalClient.username || credentialModalClient.phone}
                    displayText={formatPhoneNumber(credentialModalClient.username || credentialModalClient.phone)}
                    style={{ fontWeight: 700, color: 'var(--success)' }}
                  />
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Current Password: </span>
                  <strong style={{ color: 'var(--warning)' }}>{credentialModalClient.password || 'admin@123'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Linked QR ID: </span>
                  <code style={{ color: 'var(--primary)', fontWeight: 700 }}>{credentialModalClient.qrId}</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  background: '#25D366',
                  color: '#FFF',
                  fontWeight: 600,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => handleShareWhatsApp(credentialModalClient)}
                id="btn-modal-share-whatsapp"
              >
                <Share2 size={15} />
                <span>Share via WhatsApp</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleCopyCredentials(credentialModalClient)}
                id="btn-modal-copy-creds"
              >
                {copiedCreds ? <Check size={15} style={{ color: 'var(--success)' }} /> : <Copy size={15} />}
                <span>{copiedCreds ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setCredentialModalClient(null)}
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Comprehensive View Client Details Modal */}
      {viewingClient && createPortal(
        <div className="modal-overlay" onClick={() => setViewingClient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {viewingClient.logoUrl ? (
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '3px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    flexShrink: 0
                  }}>
                    <img
                      src={getImageUrl(viewingClient.logoUrl)}
                      alt={viewingClient.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}>
                    {viewingClient.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                    {viewingClient.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                      {viewingClient.businessType || 'Partner'}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      QR: <strong style={{ color: '#A5B4FC' }}>{viewingClient.qrId}</strong>
                    </span>
                    {viewingClient.phone && (
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CopyablePhone
                          phone={viewingClient.phone}
                          displayText={formatPhoneNumber(viewingClient.phone)}
                          style={{ fontSize: '0.76rem' }}
                        />
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.74rem', color: '#34D399' }}>
                      <Check size={11} /> Assigned
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setViewingClient(null)}
                style={{ borderRadius: '50%', padding: '6px' }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Quick Super Admin Actions Strip */}
              {onNavigateToClient && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(147, 51, 234, 0.1) 100%)',
                  border: '1px solid rgba(167, 139, 250, 0.35)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Admin Controls for this Client:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => {
                        const targetId = viewingClient.id;
                        setViewingClient(null);
                        onNavigateToClient('customer-data', targetId);
                      }}
                      title="Open Customer Review Data for this client"
                    >
                      <MessageSquareText size={13} style={{ color: '#38BDF8' }} />
                      <span>Customer Data</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => {
                        const targetId = viewingClient.id;
                        setViewingClient(null);
                        onNavigateToClient('keywords', targetId);
                      }}
                      title="Open & Edit AI Keywords for this client"
                    >
                      <Sparkles size={13} style={{ color: '#F59E0B' }} />
                      <span>Keywords</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => {
                        const targetId = viewingClient.id;
                        setViewingClient(null);
                        onNavigateToClient('profile', targetId);
                      }}
                      title="Open Client Profile for this client"
                    >
                      <Building2 size={13} style={{ color: '#A5B4FC' }} />
                      <span>Profile</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Location & Address */}
              <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <MapPin size={15} style={{ color: 'var(--accent)' }} />
                    <span>Physical Address & Location</span>
                  </div>
                  {viewingClient.googleMapUrl && (
                    <a
                      href={viewingClient.googleMapUrl.startsWith('http') ? viewingClient.googleMapUrl : `https://${viewingClient.googleMapUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#38BDF8', textDecoration: 'none' }}
                    >
                      <ExternalLink size={11} />
                      <span>Google Maps</span>
                    </a>
                  )}
                </div>

                {viewingClient.businessLocation && (
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                    {viewingClient.businessLocation}
                  </div>
                )}
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {viewingClient.address || <span style={{ color: 'var(--text-muted)' }}>No physical address provided</span>}
                </div>
              </div>

              {/* 2. Public Review URLs & Customer Feedback */}
              <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={15} style={{ color: 'var(--primary)' }} />
                  <span>Review URLs & Feedback</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                  {/* Direct Customer Link */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Customer Review Page: </span>
                      <strong style={{ color: '#A855F7' }}>/{viewingClient.slug || generateSlug(viewingClient.name)}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                      onClick={() => onTestReview(viewingClient.slug || generateSlug(viewingClient.name) || viewingClient.qrId)}
                    >
                      <ExternalLink size={11} />
                      <span>Test Page</span>
                    </button>
                  </div>

                  {/* Google Review Place ID */}
                  {(() => {
                    const resolvedPid = viewingClient.placeId || extractPlaceId(viewingClient.googleReviewUrl);
                    const reviewUrl = resolvedPid
                      ? buildGoogleReviewUrl(resolvedPid)
                      : (viewingClient.googleReviewUrl ? (viewingClient.googleReviewUrl.startsWith('http') ? viewingClient.googleReviewUrl : `https://${viewingClient.googleReviewUrl}`) : null);
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Google Review Link: </span>
                          <span style={{ color: resolvedPid ? '#10B981' : 'var(--text-secondary)' }}>
                            {resolvedPid ? `Place ID: ${resolvedPid}` : (reviewUrl ? 'Direct URL' : 'None')}
                          </span>
                        </div>
                        {reviewUrl && (
                          <a
                            href={reviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#10B981', textDecoration: 'none' }}
                          >
                            <ExternalLink size={11} />
                            <span>Open Google Review</span>
                          </a>
                        )}
                      </div>
                    );
                  })()}

                  {/* Reviews Stats & Excel Export */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Feedback Count:</span>
                      <span className={`badge ${viewingClient.reviewsCount > 0 ? 'badge-success' : 'badge-muted'}`}>
                        {viewingClient.reviewsCount || 0} reviews
                      </span>
                    </div>

                    <a
                      href={`${config.API_BASE_URL}/api/reviews/export/${viewingClient.id}`}
                      download
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FileSpreadsheet size={13} />
                      <span>Export Reviews (.xlsx)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* 3. Portal Login Credentials */}
              <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '14px 16px'
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <KeyRound size={15} style={{ color: '#34D399' }} />
                  <span>Client Portal Login Credentials</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Login Username (Phone): </span>
                    <CopyablePhone
                      phone={viewingClient.username || viewingClient.phone}
                      displayText={formatPhoneNumber(viewingClient.username || viewingClient.phone) || '—'}
                      style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Password: </span>
                    <strong style={{ color: 'var(--warning)' }}>{viewingClient.password || 'admin@123'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: '#25D366', color: '#FFF', fontWeight: 600, border: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                    onClick={() => handleShareWhatsApp(viewingClient)}
                  >
                    <Share2 size={13} />
                    <span>Share via WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleCopyCredentials(viewingClient)}
                  >
                    {copiedCreds ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                    <span>{copiedCreds ? 'Copied!' : 'Copy Login Details'}</span>
                  </button>
                </div>
              </div>

              {/* 4. Standee & QR Actions */}
              <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={viewingClient?.qrDetails?.filePath ? getImageUrl(viewingClient.qrDetails.filePath) : getImageUrl(`/uploads/qr-codes/${viewingClient.qrId}.png`)}
                    alt={`QR for ${viewingClient.name}`}
                    style={{
                      width: '42px',
                      height: '42px',
                      background: '#FFFFFF',
                      padding: '2px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1'
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Standee & QR File</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Dynamic QR ({viewingClient.qrId})</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                    onClick={() => {
                      const clientObj = viewingClient;
                      setViewingClient(null);
                      setPrintQr({
                        qrId: clientObj.qrId,
                        filename: `${clientObj.qrId}.png`,
                        name: clientObj.name,
                        address: clientObj.address,
                        businessLocation: clientObj.businessLocation || clientObj.address,
                        logoUrl: clientObj.logoUrl
                      });
                    }}
                  >
                    <Printer size={13} />
                    <span>Print Standee</span>
                  </button>

                  <a
                    href={viewingClient?.qrDetails?.filePath ? getImageUrl(viewingClient.qrDetails.filePath) : getImageUrl(`/uploads/qr-codes/${viewingClient.qrId}.png`)}
                    download={`${viewingClient.qrId}.png`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Download size={13} />
                    <span>Download QR</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ color: '#A5B4FC', display: 'flex', alignItems: 'center', gap: '5px' }}
                onClick={() => {
                  const clientToEdit = viewingClient;
                  setViewingClient(null);
                  setEditingClient(clientToEdit);
                }}
              >
                <Edit2 size={13} />
                <span>Edit Client</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setViewingClient(null)}
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Remove ALL Clients Confirmation Modal */}
      {deletingAllModal && createPortal(
        <div className="modal-overlay" onClick={() => !isDeleting && setDeletingAllModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                  Remove All Clients?
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                  Are you sure you want to permanently remove all <strong>{clients.length} onboarded client(s)</strong>?
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 600, color: '#F87171', marginBottom: '4px' }}>
                ⚠️ The following actions will take place:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li>All client records will be deleted from the database.</li>
                <li>All assigned QR codes will be permanently removed.</li>
                <li>All customer reviews and spreadsheets will be deleted.</li>
                <li>Unassigned catalog standees will remain untouched and ready for new clients.</li>
              </ul>
            </div>

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
                onClick={() => setDeletingAllModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleRemoveAllClients}
                disabled={isDeleting}
                id="btn-confirm-remove-all-clients"
                style={{
                  background: '#DC2626',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Remove All Clients</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Single Client Confirmation Modal */}
      {deletingClient && createPortal(
        <div className="modal-overlay" onClick={() => !isDeleting && setDeletingClient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.18rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                  Delete Client?
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
                  Are you sure you want to remove <strong>"{deletingClient.name}"</strong>?
                </p>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '18px'
            }}>
              <div>QR Standee: <strong style={{ color: 'var(--primary)' }}>{deletingClient.qrId}</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span>Registered Phone: </span>
                <CopyablePhone
                  phone={deletingClient.phone}
                  displayText={formatPhoneNumber(deletingClient.phone)}
                  style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                />
              </div>
              <div>Feedback Count: <strong style={{ color: 'var(--warning)' }}>{deletingClient.reviewsCount || 0} reviews</strong></div>
            </div>

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
                onClick={() => setDeletingClient(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteSingleClient(deletingClient)}
                disabled={isDeleting}
                id="btn-confirm-delete-client"
              >
                {isDeleting ? 'Deleting...' : 'Delete Client'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
