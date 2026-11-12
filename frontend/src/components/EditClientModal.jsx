import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, AlertCircle, Save, Building2, Phone, MapPin, QrCode, ExternalLink, Image as ImageIcon, Upload, Trash2, Map, Camera, Loader2 } from 'lucide-react';
import QrCameraScannerModal from './QrCameraScannerModal';
import { extractPlaceId, buildGoogleReviewUrl } from '../utils/placeId';
import { cleanPhoneNumber, formatPhoneNumber } from '../utils/phone';
import config, { getImageUrl } from '../config';
import CopyablePhone from './CopyablePhone';

export default function EditClientModal({ client, onClose, onSaveSuccess }) {
  // Edit fields
  const [name, setName] = useState(client.name || '');
  const [phone, setPhone] = useState(client.phone || '');
  const [address, setAddress] = useState(client.address || '');
  const [businessLocation, setBusinessLocation] = useState(client.businessLocation || client.address || '');
  const [businessType, setBusinessType] = useState(client.businessType || '');
  const [googleMapUrl, setGoogleMapUrl] = useState(client.googleMapUrl || '');
  const [placeId, setPlaceId] = useState(client.placeId || extractPlaceId(client.googleReviewUrl) || '');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(client.googleReviewUrl || '');
  const [logoUrl, setLogoUrl] = useState(client.logoUrl || '');
  const [logoPreview, setLogoPreview] = useState(client.logoUrl || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState('file');
  const [downloadingExternalLogo, setDownloadingExternalLogo] = useState(false);
  const [savedLocalLogoPath, setSavedLocalLogoPath] = useState('');
  const [isPhoneMandatory, setIsPhoneMandatory] = useState(Boolean(client.isPhoneMandatory));
  const [qrId, setQrId] = useState(client.qrId || '');
  const [availableQrs, setAvailableQrs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleScanQrSuccess = (scannedId, rawData, meta) => {
    if (!scannedId) return;
    if (meta && meta.isAssigned && meta.client?.id !== client.id) {
      setSaveError(`Standee ${scannedId} is already assigned to ${meta.clientName || 'another business'}. It cannot be reassigned.`);
      return;
    }
    setQrId(scannedId);
    setSaveError('');
    setShowScanner(false);
  };

  // Fetch unassigned QRs and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qrRes, catRes] = await Promise.all([
          fetch(`${config.API_BASE_URL}/api/qr/unassigned`),
          fetch(`${config.API_BASE_URL}/api/categories`)
        ]);
        const qrData = await qrRes.json();
        if (qrData.qrs) setAvailableQrs(qrData.qrs);

        const catData = await catRes.json();
        if (catData.categories) setCategories(catData.categories);
      } catch (err) {
        console.error('Failed to load edit modal dependencies:', err);
      }
    };
    fetchData();
  }, []);

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handlePhoneKeyDown = (e) => {
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) ||
      ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z', 'A', 'C', 'V', 'X', 'Z'].includes(e.key))
    ) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhonePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const digits = pasted.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handlePlaceIdChange = (val) => {
    const clean = extractPlaceId(val);
    setPlaceId(clean || val);
    if (clean) {
      setGoogleReviewUrl(buildGoogleReviewUrl(clean));
    } else {
      setGoogleReviewUrl(val);
    }
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setLogoPreview(base64);
      setUploadingLogo(true);
      try {
        const res = await fetch(`${config.API_BASE_URL}/api/upload/logo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            filename: file.name
          })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setLogoUrl(getImageUrl(data.url));
        } else {
          setLogoUrl(base64);
        }
      } catch (err) {
        setLogoUrl(base64);
      } finally {
        setUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setLogoPreview('');
    setSavedLocalLogoPath('');
  };

  const handleDownloadExternalLogo = async (urlToDownload) => {
    const target = (urlToDownload || logoUrl || '').trim();
    if (!target || (!target.startsWith('http://') && !target.startsWith('https://'))) return;
    if (target.includes('/uploads/logos/')) return;

    setDownloadingExternalLogo(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/upload/logo-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target })
      });
      const data = await res.json();
      if (data.success && data.url) {
        setSavedLocalLogoPath(data.url);
        setLogoPreview(data.url);
      }
    } catch (err) {
      console.warn('Failed to pre-download external logo:', err);
    } finally {
      setDownloadingExternalLogo(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!name.trim() || !cleanPhone || !address.trim() || !placeId.trim() || !businessType.trim()) {
      setSaveError('Name, phone, Google Place ID, Full address, and Business Category are required.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setSaveError('Phone number must be exactly 10 digits.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      const logoToSave = (savedLocalLogoPath || logoUrl || '').trim();
      const res = await fetch(`${config.API_BASE_URL}/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          address: address.trim(),
          businessLocation: (businessLocation && businessLocation.trim()) ? businessLocation.trim() : address.trim(),
          businessType: businessType.trim(),
          googleMapUrl: googleMapUrl.trim(),
          placeId: extractPlaceId(placeId || googleReviewUrl),
          googleReviewUrl: buildGoogleReviewUrl(extractPlaceId(placeId || googleReviewUrl)) || googleReviewUrl.trim(),
          logoUrl: logoToSave,
          qrId: qrId.trim(),
          isPhoneMandatory: Boolean(isPhoneMandatory)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update client');

      if (onSaveSuccess) {
        onSaveSuccess(data.client);
      }
      onClose();
    } catch (err) {
      setSaveError(err.message || 'Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(109, 36, 186, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                Edit Client & QR Assignment
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Modify business details and dynamic QR assignment
              </p>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', padding: '6px' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* EDIT CLIENT & QR FORM */}
        <form onSubmit={handleSave} className="fade-in">
            {saveError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#F87171',
                fontSize: '0.86rem',
                marginBottom: '16px'
              }}>
                {saveError}
              </div>
            )}

            {/* 1. Client / Business Name * */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-name">
                Client / Business Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="edit-name"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* 2. Phone Number * */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="edit-phone">
                  Phone Number <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {phone.length === 10 && (
                    <CopyablePhone phone={phone} showText={false} btnStyle={{ padding: '2px 5px', fontSize: '10px' }} />
                  )}
                  <span style={{ fontSize: '0.74rem', color: phone.length === 10 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {phone.length}/10 digits
                  </span>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <span className="input-phone-prefix">+91</span>
                <input
                  id="edit-phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  autoComplete="tel"
                  className="form-input form-input-phone"
                  style={{ letterSpacing: '0.04em' }}
                  placeholder="98765 43210"
                  maxLength={10}
                  value={phone}
                  onChange={handlePhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                  onPaste={handlePhonePaste}
                  required
                />
              </div>
            </div>

            {/* 3. Business Location */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="edit-business-location">Business Location</label>
                <span style={{ fontSize: '0.74rem', color: 'var(--accent)' }}>Displayed below business name</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="edit-business-location"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="e.g. Srikakulam"
                  value={businessLocation}
                  onChange={(e) => setBusinessLocation(e.target.value)}
                />
                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* 4. Business Category (default to select) */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-category">
                Business Category <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                id="edit-category"
                className="form-select"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                required
              >
                <option value="">-- Select Category --</option>
                {businessType && !categories.some(c => c.name === businessType) && (
                  <option value={businessType}>{businessType}</option>
                )}
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.label || cat.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Hotel & Resort">Hotel & Resort</option>
                    <option value="Boutique & Retail">Boutique & Fashion Apparel</option>
                    <option value="Restaurant & Cafe">Restaurant, Bar & Cafe</option>
                    <option value="Salon & Spa">Luxury Salon & Spa</option>
                    <option value="Healthcare & Clinic">Healthcare & Wellness Clinic</option>
                    <option value="Supermarket / Grocery">Supermarket / Retail Store</option>
                    <option value="Other Business">Other Commercial Establishment</option>
                  </>
                )}
              </select>
            </div>

            {/* 5. Google Place ID * (Mandatory) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="edit-place-id">
                  Google Place ID <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>Direct Write-Review Modal</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="edit-place-id"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px', fontFamily: 'monospace' }}
                  placeholder="e.g. ChIJ... (Google Place ID or writereview link)"
                  value={placeId}
                  onChange={(e) => handlePlaceIdChange(e.target.value)}
                  required
                />
                <ExternalLink size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Place ID connects directly to the Google Review write modal: <code style={{ color: 'var(--primary)' }}>{buildGoogleReviewUrl(placeId) || 'https://search.google.com/local/writereview?placeid=...'}</code>
              </p>
            </div>

            {/* 6. Full address * (Mandatory) */}
            <div className="form-group">
              <label className="form-label" htmlFor="edit-address">
                Full address <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  id="edit-address"
                  className="form-textarea"
                  style={{ paddingLeft: '38px', minHeight: '70px' }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '16px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* 7. Business Brand Logo (Optional) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Business Brand Logo <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('file')}
                    className={`btn btn-sm ${logoInputMode === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '2px 8px', fontSize: '0.72rem', height: '24px' }}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('url')}
                    className={`btn btn-sm ${logoInputMode === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '2px 8px', fontSize: '0.72rem', height: '24px' }}
                  >
                    Paste URL
                  </button>
                </div>
              </div>

              {logoInputMode === 'file' ? (
                <div>
                  {logoPreview || logoUrl ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      background: 'rgba(109, 36, 186, 0.05)',
                      border: '1.5px solid rgba(109, 36, 186, 0.35)',
                      borderRadius: '10px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                    }}>
                      {/* Logo Preview Box */}
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '8px',
                        background: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: '3px',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}>
                        <img
                          src={logoPreview || logoUrl}
                          alt="Logo Preview"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          {uploadingLogo ? (
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <Loader2 size={13} className="spin-refresh" />
                              Uploading logo...
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={14} style={{ strokeWidth: 3 }} /> Logo Configured
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Shown on customer review page & printable standee.
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <label
                          htmlFor="edit-logo-upload-change"
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '4px 9px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            margin: 0,
                            fontWeight: 500
                          }}
                          title="Change logo image"
                        >
                          <Upload size={12} />
                          <span>Change</span>
                          <input
                            id="edit-logo-upload-change"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleLogoFileChange}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#F87171', padding: '4px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center' }}
                          title="Remove logo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="edit-logo-upload"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        border: '2px dashed var(--border-subtle)',
                        borderRadius: '8px',
                        background: 'var(--bg-main)',
                        cursor: 'pointer'
                      }}
                    >
                      <Upload size={20} style={{ color: 'var(--primary)', marginBottom: '4px' }} />
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Upload business logo
                      </div>
                      <input
                        id="edit-logo-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleLogoFileChange}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ position: 'relative', display: 'flex', gap: '6px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '38px' }}
                        placeholder="e.g. https://example.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => {
                          setLogoUrl(e.target.value);
                          setLogoPreview(e.target.value);
                          setSavedLocalLogoPath('');
                        }}
                        onBlur={() => {
                          if (logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) && !logoUrl.includes('/uploads/')) {
                            handleDownloadExternalLogo(logoUrl);
                          }
                        }}
                      />
                      <ImageIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                    {logoUrl && (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) && !savedLocalLogoPath && !logoUrl.includes('/uploads/') && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadExternalLogo(logoUrl)}
                        disabled={downloadingExternalLogo}
                        style={{ height: '36px', padding: '0 10px', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
                        title="Download and cache image locally"
                      >
                        {downloadingExternalLogo ? 'Saving...' : 'Save Locally'}
                      </button>
                    )}
                  </div>

                  {/* URL Mode Preview Div */}
                  {(logoPreview || logoUrl) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      marginTop: '8px',
                      background: 'rgba(109, 36, 186, 0.05)',
                      border: '1.5px solid rgba(109, 36, 186, 0.35)',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '6px',
                        background: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        padding: '2px',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                      }}>
                        <img
                          src={logoPreview || logoUrl}
                          alt="Logo Preview"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={13} style={{ strokeWidth: 3 }} /> Logo Preview Ready
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {savedLocalLogoPath || (logoUrl && logoUrl.startsWith('/uploads/logos/'))
                            ? 'Saved locally to app storage'
                            : 'External image loaded'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#F87171', padding: '3px 8px', fontSize: '0.7rem' }}
                        title="Clear logo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}

                  {(savedLocalLogoPath || (logoUrl && logoUrl.startsWith('/uploads/logos/'))) && (
                    <div style={{ fontSize: '0.72rem', color: '#10B981', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} />
                        <span>Saved locally to app storage</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLogoUrl('');
                          setLogoPreview('');
                          setSavedLocalLogoPath('');
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem', padding: '0', textDecoration: 'underline' }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Phone Requirement on Review Page (Radio Buttons) */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={13} style={{ color: 'var(--primary)' }} />
                  <span>Customer Mobile Number on Review Page</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Control customer phone requirement on review form
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: !isPhoneMandatory ? 'rgba(109, 36, 186, 0.08)' : 'var(--bg-main)',
                  border: !isPhoneMandatory ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="editIsPhoneMandatory"
                    checked={!isPhoneMandatory}
                    onChange={() => setIsPhoneMandatory(false)}
                    style={{ accentColor: '#8B5CF6', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Optional (Default)
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Phone entry is optional for customers
                    </div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isPhoneMandatory ? 'rgba(109, 36, 186, 0.08)' : 'var(--bg-main)',
                  border: isPhoneMandatory ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="editIsPhoneMandatory"
                    checked={isPhoneMandatory}
                    onChange={() => setIsPhoneMandatory(true)}
                    style={{ accentColor: '#8B5CF6', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Mandatory</span>
                      <span style={{ fontSize: '0.66rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontWeight: 700 }}>
                        Required
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      10-digit number required to continue
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Reassign / Change QR Code */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" htmlFor="edit-qr" style={{ marginBottom: 0 }}>
                  Assigned Dynamic QR Code
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowScanner(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '2px 8px',
                    fontSize: '0.74rem',
                    color: 'var(--primary)',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    background: 'rgba(99, 102, 241, 0.08)'
                  }}
                  title="Open Camera to scan new standee"
                >
                  <Camera size={13} />
                  <span>Open Camera</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <select
                    id="edit-qr"
                    className="form-select"
                    style={{ paddingLeft: '38px' }}
                    value={qrId}
                    onChange={(e) => setQrId(e.target.value)}
                  >
                    <option value={client.qrId}>{client.qrId} (Current Assigned QR)</option>
                    {availableQrs.map((q) => (
                      <option key={q.qrId} value={q.qrId}>
                        {q.qrId} - Generic Empty QR
                      </option>
                    ))}
                    {qrId && qrId !== client.qrId && !availableQrs.some(q => q.qrId === qrId) && (
                      <option value={qrId}>{qrId} (Scanned QR)</option>
                    )}
                  </select>
                  <QrCode size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowScanner(true)}
                  style={{ height: '42px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                  title="Scan with Camera"
                >
                  <Camera size={16} />
                  <span style={{ fontSize: '0.8rem' }}>Scan</span>
                </button>
              </div>

              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                If you change the QR code, the previous QR code will be released and returned to the generic empty pool.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                id="btn-save-client-edits"
              >
                {saving ? 'Saving Changes...' : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>

      </div>

      {/* QR Camera Scanner Modal */}
      <QrCameraScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanQrSuccess}
        availableQrs={availableQrs}
        title="Scan New QR Standee"
      />
    </div>,
    document.body
  );
}
