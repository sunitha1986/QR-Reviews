import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  MapPin,
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Calendar,
  Lock,
  KeyRound,
  AlertCircle,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import PrintModal from '../../components/PrintModal';
import { generateSlug, getClientReviewUrl } from '../../utils/slug';
import { extractPlaceId, buildGoogleReviewUrl } from '../../utils/placeId';
import { formatPhoneNumber } from '../../utils/phone';
import config, { getImageUrl } from '../../config';
import { ClientProfileShimmer } from '../../components/Shimmer';
import CopyablePhone from '../../components/CopyablePhone';
import { applyColorTheme, getSavedThemeId } from '../../utils/colorThemes';

export default function ClientProfile({ user, onTestReview, selectedClientId, onSelectClient, onNavigate, hideClientSelector = false }) {
  const isSuperAdmin = user?.role === 'superadmin';
  const [allClients, setAllClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState(selectedClientId || '');
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedPlaceId, setCopiedPlaceId] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Change Password State
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  // If superadmin, fetch all clients list
  useEffect(() => {
    if (!isSuperAdmin) return;
    const fetchAll = async () => {
      try {
        const res = await fetch(`${config.API_BASE_URL}/api/clients`);
        const data = await res.json();
        if (data.clients && data.clients.length > 0) {
          setAllClients(data.clients);
          if (!activeClientId) {
            setActiveClientId(data.clients[0].id);
            if (onSelectClient) onSelectClient(data.clients[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load clients list in profile:', err);
      }
    };
    fetchAll();
  }, [isSuperAdmin]);

  // Sync activeClientId if prop changes
  useEffect(() => {
    if (selectedClientId && selectedClientId !== activeClientId) {
      setActiveClientId(selectedClientId);
    }
  }, [selectedClientId]);

  // Fetch client details
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        let targetId = user?.clientId || user?.qrId;
        if (isSuperAdmin) {
          targetId = activeClientId;
        }

        if (!targetId) {
          const clientsRes = await fetch(`${config.API_BASE_URL}/api/clients`);
          const clientsData = await clientsRes.json();
          if (clientsData.clients && clientsData.clients.length > 0) {
            setAllClients(clientsData.clients);
            const first = clientsData.clients[0];
            setActiveClientId(first.id);
            setClientData({ client: first });
          }
          return;
        }

        const res = await fetch(`${config.API_BASE_URL}/api/clients/${targetId}`);
        const data = await res.json();
        if (data.client) {
          setClientData(data);
          if (!isSuperAdmin) {
            const bTheme = data.client.colorTheme || getSavedThemeId(data.client.id);
            if (bTheme) {
              applyColorTheme(bTheme, data.client.id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load client profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, activeClientId, isSuperAdmin]);

  const handleClientChange = (newId) => {
    setActiveClientId(newId);
    if (onSelectClient) onSelectClient(newId);
    setShowPwForm(false);
    setPwSuccess('');
    setPwError('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword) {
      setPwError('Please enter your current password');
      return;
    }
    if (newPassword.length < 4) {
      setPwError('New password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirm password do not match');
      return;
    }

    const client = clientData?.client;
    const targetClientId = client?.id || user?.clientId || user?.id || 'admin';

    setPwLoading(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/clients/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: targetClientId,
          currentPassword,
          newPassword
        })
      });

      let data = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Backend server route not updated. Please restart your backend server terminal (Ctrl+C then node server.js).');
          }
          throw new Error(`Server returned error (${res.status}): ${text.slice(0, 80)}`);
        }
      }

      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setPwSuccess(data.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPwForm(false);
    } catch (err) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return <ClientProfileShimmer />;
  }

  const client = clientData?.client || null;

  if (!client) {
    return (
      <div className="glass-panel" style={{ padding: '50px 24px', textAlign: 'center' }}>
        <Building2 size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto' }} />
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.3rem', marginBottom: '8px' }}>No Client Onboarded Yet</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto', fontSize: '0.9rem' }}>
          This client portal is fresh and clean. Log in as Super Admin with your registered number to generate a dynamic QR standee and onboard your first business client.
        </p>
      </div>
    );
  }

  const qrId = client.qrId;
  const clientSlug = client.slug || generateSlug(client.name) || qrId;
  const qrUrl = client?.qrDetails?.filePath ? getImageUrl(client.qrDetails.filePath) : getImageUrl(`/uploads/qr-codes/${qrId}.png`);
  const reviewLink = getClientReviewUrl(client, qrId);

  // Universal Place ID and Google Maps URL resolution
  const cleanPlaceId = client.placeId || extractPlaceId(client.googleReviewUrl);
  const directGoogleMapsUrl = cleanPlaceId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.name)}&query_place_id=${encodeURIComponent(cleanPlaceId)}`
    : (client.googleMapUrl ? (client.googleMapUrl.startsWith('http') ? client.googleMapUrl : `https://${client.googleMapUrl}`) : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${client.name} ${client.businessLocation || client.address || ''}`)}`);

  // Target query that pinpoints the specific business at its physical location on the map
  const locationParts = [client.name];
  if (client.businessLocation && !client.address?.toLowerCase().includes(client.businessLocation.toLowerCase())) {
    locationParts.push(client.businessLocation);
  }
  if (client.address) {
    locationParts.push(client.address);
  }
  const businessMapQuery = locationParts.filter(Boolean).join(', ');
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(businessMapQuery)}&t=m&z=16&output=embed`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reviewLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyPhone = () => {
    if (!client?.phone) return;
    const cleanPhone = client.phone.toString().trim();
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
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyPlaceId = () => {
    if (!cleanPlaceId) return;
    navigator.clipboard.writeText(cleanPlaceId);
    setCopiedPlaceId(true);
    setTimeout(() => setCopiedPlaceId(false), 2000);
  };

  return (
    <div className="fade-in">
      {/* Super Admin Client Switcher */}
      {isSuperAdmin && !hideClientSelector && (
        <div className="glass-panel" style={{
          padding: '16px 22px',
          marginBottom: '20px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(147, 51, 234, 0.08) 100%)',
          border: '1px solid rgba(167, 139, 250, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              flexShrink: 0
            }}>
              <Building2 size={19} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Viewing Client Profile: <span style={{ color: '#A5B4FC' }}>{client?.name || 'Select Client'}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Super Admin can inspect details, standee, QR, Place ID & settings for any client
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="superadmin-profile-client-select" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
              Select Client:
            </label>
            <select
              id="superadmin-profile-client-select"
              value={activeClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="form-control"
              style={{
                width: 'auto',
                minWidth: '240px',
                padding: '8px 14px',
                fontSize: '0.86rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'var(--bg-card, #1E1B4B)',
                color: 'var(--text-primary)',
                border: '1.5px solid rgba(167, 139, 250, 0.4)',
                cursor: 'pointer'
              }}
            >
              {allClients.map((c) => (
                <option key={c.id} value={c.id} style={{ background: '#1E1B4B', color: '#FFF' }}>
                  {c.name} ({c.qrId || c.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="client-profile-grid">

        {/* Left Column: Business Profile Info & Security */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. Main Business Profile Information Card */}
          <div className="glass-panel" style={{ padding: '22px 24px' }}>
            <div style={{ marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                Business Profile:
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.92rem' }}>
              {/* Phone */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(124, 58, 237, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Phone size={17} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Registered Phone Number
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {formatPhoneNumber(client.phone)}
                    </div>
                    {client.phone && (
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        title={copiedPhone ? 'Copied!' : 'Copy phone number'}
                        id="btn-copy-client-phone"
                        style={{
                          background: copiedPhone ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid ' + (copiedPhone ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.1)'),
                          padding: '3px 7px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: copiedPhone ? 'var(--success)' : 'var(--text-muted)',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {copiedPhone ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                        <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Location & Address */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MapPin size={17} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Business Location & Address
                  </div>
                  {client.businessLocation && (
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', marginBottom: '2px', fontSize: '0.92rem' }}>
                      {client.businessLocation}
                    </div>
                  )}
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.45, fontSize: '0.86rem' }}>
                    {client.address}
                  </div>
                  {(client.googleMapUrl || cleanPlaceId) && (
                    <div style={{ marginTop: '6px' }}>
                      <a
                        href={directGoogleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.74rem', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#38BDF8' }}
                      >
                        <span>Open in Google Maps</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Onboarding Date & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Calendar size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      Onboarding Date
                    </div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.86rem', marginTop: '2px' }}>
                      {new Date(client.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      Account Status
                    </div>
                    <div style={{ color: '#10B981', fontWeight: 700, fontSize: '0.86rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      <span>Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Plan */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.12)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CreditCard size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Subscription Plan
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                      {client.subscriptionPlan || 'Starter Launch Trial (₹9)'}
                    </span>
                    <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>
                      Active Plan
                    </span>
                  </div>
                  {onNavigate && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => onNavigate('subscriptions')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.76rem', padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Sparkles size={12} />
                        <span>Change / Upgrade Plan</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Connected Google Review Destination */}
              {(() => {
                const resolvedPid = client.placeId || extractPlaceId(client.googleReviewUrl);
                const reviewDestination = resolvedPid
                  ? buildGoogleReviewUrl(resolvedPid)
                  : (client.googleReviewUrl ? (client.googleReviewUrl.startsWith('http') ? client.googleReviewUrl : `https://${client.googleReviewUrl}`) : buildGoogleReviewUrl('', `${client.name} ${client.businessLocation || client.address || ''}`));
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'rgba(66, 133, 244, 0.1)',
                      color: '#4285F4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ExternalLink size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                        Connected Google Review Destination
                      </div>
                      {resolvedPid ? (
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>
                          Place ID: <code style={{ color: 'var(--primary)', fontWeight: 700 }}>{resolvedPid}</code>
                        </div>
                      ) : null}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <a
                          href={reviewDestination}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.76rem', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#60A5FA' }}
                        >
                          <span>Open Google Review Page</span>
                          <ExternalLink size={12} />
                        </a>
                        {resolvedPid ? (
                          <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Place ID (Reliable)</span>
                        ) : client.googleReviewUrl ? (
                          <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Direct Link</span>
                        ) : (
                          <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>Smart Google Search</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 2. Portal Login & Security Card */}
          <div className="glass-panel" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={17} style={{ color: 'var(--primary)' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Portal Login & Security
                </h4>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                onClick={() => {
                  setShowPwForm(!showPwForm);
                  setPwError('');
                  setPwSuccess('');
                }}
              >
                {showPwForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Login Username: </span>
                <CopyablePhone
                  phone={client.username || client.phone}
                  displayText={formatPhoneNumber(client.username || client.phone)}
                  style={{ fontWeight: 700, color: 'var(--success)' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(Registered Phone)</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Account Access: </span>
                <span style={{ color: 'var(--text-secondary)' }}>Protected client portal for customer feedback and Excel reports</span>
              </div>
            </div>

            {pwSuccess && (
              <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '8px', color: 'var(--success)', fontSize: '0.82rem', marginBottom: '14px' }}>
                {pwSuccess}
              </div>
            )}

            {pwError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '14px' }}>
                {pwError}
              </div>
            )}

            {showPwForm && (
              <form onSubmit={handleChangePassword} style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    style={{ fontSize: '0.85rem', padding: '7px 12px' }}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    style={{ fontSize: '0.85rem', padding: '7px 12px' }}
                    placeholder="Enter new password (min 4 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    style={{ fontSize: '0.85rem', padding: '7px 12px' }}
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', height: '38px', fontSize: '0.84rem' }}
                  disabled={pwLoading}
                >
                  <Lock size={14} />
                  <span>{pwLoading ? 'Updating Password...' : 'Save New Password'}</span>
                </button>
              </form>
            )}
          </div>

          {/* 3. Quick Best Practices Tips */}
          <div className="glass-panel" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Sparkles size={16} style={{ color: 'var(--warning)' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Standee Placement Tips
              </h4>
            </div>
            <ul style={{ paddingLeft: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: 1.5, margin: 0 }}>
              <li>Place the printed QR standee near your billing counter or dining tables.</li>
              <li>Encourage customers to scan before departing for instant reviews.</li>
              <li>Customer reviews are securely logged directly into your dedicated Excel workbook.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Assigned QR Display & Verified Google Maps Card */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. Dynamic QR Standee Card */}
          <div className="glass-panel" style={{ padding: '22px 24px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Your Assigned Dynamic QR Standee
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                  Unique QR code generated and assigned specifically to {client.name}
                </p>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                Assigned & Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
              <div className="qr-preview-container" style={{ width: '250px', maxWidth: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={qrUrl}
                  alt="Dynamic QR Code"
                  className="qr-preview-img"
                  style={{ width: '195px', height: '195px', maxWidth: '100%', objectFit: 'contain' }}
                />
                {isSuperAdmin && (
                  <div className="qr-code-label">
                    {qrId}
                  </div>
                )}
              </div>
            </div>

            {/* Review Link Bar */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                Direct Customer Review Link
              </label>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <input
                  type="text"
                  className="form-input"
                  readOnly
                  value={reviewLink}
                  style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'default', flex: 1, minWidth: 0 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopyLink}
                  title="Copy Review URL"
                  id="btn-copy-review-url"
                  style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  {copiedLink ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={qrUrl}
                download={`${client.name ? client.name.replace(/[^a-zA-Z0-9]/g, '_') : 'qr'}_review_standee.png`}
                className="btn btn-primary"
                id="btn-profile-download-qr"
                style={{ width: '100%', justifyContent: 'center', height: '42px', fontWeight: 700, fontSize: '0.88rem' }}
              >
                <Download size={16} />
                <span>Download Standee QR (PNG)</span>
              </a>

              <div className="profile-action-buttons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPrintModalOpen(true)}
                  id="btn-profile-print-standee"
                  style={{ justifyContent: 'center', height: '40px', fontSize: '0.82rem', padding: '0 8px' }}
                >
                  <Printer size={16} />
                  <span>Print Table Standee</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onTestReview(clientSlug)}
                  id="btn-profile-test-form"
                  style={{ justifyContent: 'center', height: '40px', fontSize: '0.82rem', padding: '0 8px' }}
                >
                  <ExternalLink size={16} />
                  <span>Preview Review Screen</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Verified Google Maps Location Card (Using Place ID) */}
          <div className="glass-panel" style={{ padding: '22px 24px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.02rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                    Live Google Maps Location
                  </h4>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: 0 }}>
                    Mapped to official Google Place ID
                  </p>
                </div>
              </div>

              {cleanPlaceId ? (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', padding: '3px 8px' }}>
                  <ShieldCheck size={12} />
                  <span>Place Verified</span>
                </span>
              ) : (
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Location Pin</span>
              )}
            </div>

            {/* Embedded Live Google Map */}
            <div style={{
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(0, 0, 0, 0.25)',
              position: 'relative',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
              marginBottom: '14px'
            }}>
              <iframe
                title={`Google Maps Location - ${client.name}`}
                src={mapEmbedUrl}
                width="100%"
                height="220"
                style={{ border: 0, display: 'block', width: '100%', height: '220px' }}
                loading="lazy"
                allowFullScreen={false}
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Place ID & Action Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    Place ID:
                  </span>
                  {cleanPlaceId ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                      <code style={{
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        background: 'rgba(124, 58, 237, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(124, 58, 237, 0.25)',
                        maxWidth: '160px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block'
                      }} title={cleanPlaceId}>
                        {cleanPlaceId}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyPlaceId}
                        title={copiedPlaceId ? 'Copied!' : 'Copy Google Place ID'}
                        id="btn-copy-place-id"
                        style={{
                          background: copiedPlaceId ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid ' + (copiedPlaceId ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.1)'),
                          padding: '2px 5px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: copiedPlaceId ? 'var(--success)' : 'var(--text-muted)',
                          borderRadius: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {copiedPlaceId ? <Check size={11} style={{ color: 'var(--success)' }} /> : <Copy size={11} />}
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Not linked</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={directGoogleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38BDF8', whiteSpace: 'nowrap' }}
                    id="btn-profile-open-gmaps"
                  >
                    <span>Google Maps</span>
                    <ExternalLink size={11} />
                  </a>

                  {cleanPlaceId && (
                    <a
                      href={buildGoogleReviewUrl(cleanPlaceId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                      id="btn-profile-test-review-gmaps"
                    >
                      <Sparkles size={11} />
                      <span>Review Dialog</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Verified Address Ribbon */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 10px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                fontSize: '0.76rem',
                color: 'var(--text-secondary)',
                minWidth: 0,
                boxSizing: 'border-box'
              }}>
                <MapPin size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.35, minWidth: 0 }}>
                  {client.businessLocation ? <strong>{client.businessLocation} — </strong> : ''}{client.address}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Standee Modal */}
      {printModalOpen && (
        <PrintModal
          qr={{ qrId, filename: `${qrId}.png` }}
          client={client}
          onClose={() => setPrintModalOpen(false)}
        />
      )}
    </div>
  );
}
