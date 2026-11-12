import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Building2,
  Phone,
  MapPin,
  QrCode,
  CheckCircle2,
  Sparkles,
  Lock,
  ArrowRight,
  Printer,
  ExternalLink,
  Copy,
  Check,
  Image as ImageIcon,
  Upload,
  Trash2,
  Share2,
  Camera,
  X,
  ChevronDown,
  Search,
  Edit,
  Loader2
} from 'lucide-react';
import PrintModal from '../../components/PrintModal';
import EditClientModal from '../../components/EditClientModal';
import QrCameraScannerModal from '../../components/QrCameraScannerModal';
import { generateSlug, getClientReviewUrl } from '../../utils/slug';
import { extractPlaceId, buildGoogleReviewUrl } from '../../utils/placeId';
import { formatPhoneNumber, cleanPhoneNumber } from '../../utils/phone';
import config, { getImageUrl } from '../../config';
import CopyablePhone from '../../components/CopyablePhone';
import vasmiIcon from '../../assets/vasmi_icon.png';

/**
 * Searchable Category Dropdown with live filtering & high-contrast selection
 */
function SearchableCategoryDropdown({ categories, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const defaultCategories = [
    { name: 'Hotel & Resort', label: 'Hotel & Resort' },
    { name: 'Boutique & Retail', label: 'Boutique & Fashion Apparel' },
    { name: 'Restaurant & Cafe', label: 'Restaurant, Bar & Cafe' },
    { name: 'Salon & Spa', label: 'Luxury Salon & Spa' },
    { name: 'Healthcare & Clinic', label: 'Healthcare & Wellness Clinic' },
    { name: 'Supermarket / Grocery', label: 'Supermarket / Retail Store' },
    { name: 'Other Business', label: 'Other Commercial Establishment' }
  ];

  const allCats = categories && categories.length > 0 ? categories : defaultCategories;

  const filtered = allCats.filter(cat => {
    const term = search.toLowerCase();
    const nameMatch = (cat.name || '').toLowerCase().includes(term);
    const labelMatch = (cat.label || '').toLowerCase().includes(term);
    return nameMatch || labelMatch;
  });

  const selectedCategory = allCats.find(c => c.name === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (catName) => {
    onChange(catName);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        id="btn-category-dropdown"
        className={`form-input searchable-select-trigger ${isOpen ? 'active' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px 0 34px',
          height: '36px',
          fontSize: '0.84rem',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          boxSizing: 'border-box'
        }}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          fontWeight: value ? 600 : 400
        }}>
          {selectedCategory ? (selectedCategory.label || selectedCategory.name) : (value || '-- Select Category --')}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
            marginLeft: '6px'
          }}
        />
      </button>

      <Building2
        size={15}
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: value ? '#8B5CF6' : 'var(--text-muted)',
          pointerEvents: 'none'
        }}
      />

      <input
        type="text"
        value={value}
        required
        tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
        onChange={() => {}}
      />

      {isOpen && (
        <div className="searchable-dropdown-menu">
          <div className="searchable-dropdown-search-wrapper">
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search category..."
                className="form-input"
                style={{
                  height: '28px',
                  paddingLeft: '26px',
                  paddingRight: '22px',
                  fontSize: '0.78rem',
                  borderRadius: '5px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                  if (e.key === 'Enter' && filtered.length > 0) {
                    e.preventDefault();
                    handleSelect(filtered[0].name);
                  }
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex'
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filtered.length > 0 ? (
              filtered.map(cat => {
                const isSelected = cat.name === value;
                return (
                  <div
                    key={cat.id || cat.name}
                    className={`searchable-dropdown-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(cat.name)}
                  >
                    <span>{cat.label || cat.name}</span>
                    {isSelected && <Check size={14} style={{ color: '#8B5CF6' }} />}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No categories matching "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Searchable QR Dropdown with high-contrast visible text, badges & instant filter
 */
function SearchableQrDropdown({ unassignedQrs, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const filteredQrs = unassignedQrs.filter(qr => {
    const term = search.toLowerCase();
    const idMatch = (qr.qrId || '').toLowerCase().includes(term);
    const noteMatch = (qr.note || '').toLowerCase().includes(term);
    return idMatch || noteMatch;
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (qrId) => {
    onChange(qrId);
    setIsOpen(false);
    setSearch('');
  };

  const selectedQr = unassignedQrs.find(q => q.qrId === value);
  const isAuto = value === 'auto';
  const isCustomScanned = value && value !== 'auto' && !selectedQr;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        id="btn-qr-dropdown"
        className={`form-input searchable-select-trigger ${isOpen ? 'active' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px 0 34px',
          height: '36px',
          fontSize: '0.84rem',
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
          boxSizing: 'border-box'
        }}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1
        }}>
          {isAuto && (
            <>
              <span style={{ color: '#8B5CF6', fontWeight: 700 }}>+ Auto-Generate Instant QR</span>
              <span style={{
                background: 'rgba(109, 36, 186, 0.14)',
                color: '#8B5CF6',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 700
              }}>Auto</span>
            </>
          )}
          {selectedQr && (
            <>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{selectedQr.qrId}</span>
              {selectedQr.note && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>({selectedQr.note})</span>
              )}
              <span style={{
                background: 'rgba(16, 185, 129, 0.14)',
                color: '#10B981',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 600
              }}>Standee</span>
            </>
          )}
          {isCustomScanned && (
            <>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{value}</span>
              <span style={{
                background: 'rgba(99, 102, 241, 0.14)',
                color: '#6366F1',
                padding: '1px 5px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 600
              }}>Scanned</span>
            </>
          )}
          {!value && (
            <span style={{ color: 'var(--text-muted)' }}>-- Select QR or Auto-Assign --</span>
          )}
        </div>

        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
            marginLeft: '6px'
          }}
        />
      </button>

      <QrCode
        size={15}
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: value ? '#8B5CF6' : 'var(--text-muted)',
          pointerEvents: 'none'
        }}
      />

      <input
        type="text"
        value={value}
        required
        tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
        onChange={() => {}}
      />

      {isOpen && (
        <div className="searchable-dropdown-menu">
          <div className="searchable-dropdown-search-wrapper">
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search QR ID (e.g. 00042) or note..."
                className="form-input"
                style={{
                  height: '28px',
                  paddingLeft: '26px',
                  paddingRight: '22px',
                  fontSize: '0.78rem',
                  borderRadius: '5px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsOpen(false);
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (search.toLowerCase().includes('auto')) {
                      handleSelect('auto');
                    } else if (filteredQrs.length > 0) {
                      handleSelect(filteredQrs[0].qrId);
                    }
                  }
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex'
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div style={{ maxHeight: '210px', overflowY: 'auto' }}>
            {(!search || 'auto-generate instant qr'.includes(search.toLowerCase())) && (
              <div
                className={`searchable-dropdown-item ${value === 'auto' ? 'selected' : ''}`}
                onClick={() => handleSelect('auto')}
                style={{ borderBottom: '1px solid rgba(109, 36, 186, 0.1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} style={{ color: '#8B5CF6' }} />
                  <span style={{ fontWeight: 700, color: '#8B5CF6' }}>+ Auto-Generate Instant QR</span>
                </div>
                {value === 'auto' && <Check size={14} style={{ color: '#8B5CF6' }} />}
              </div>
            )}

            {filteredQrs.length > 0 ? (
              filteredQrs.map(qr => {
                const isSelected = qr.qrId === value;
                return (
                  <div
                    key={qr.qrId}
                    className={`searchable-dropdown-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(qr.qrId)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{qr.qrId}</span>
                      {qr.note && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>({qr.note})</span>
                      )}
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#10B981',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontSize: '0.66rem',
                        fontWeight: 600
                      }}>
                        Standee
                      </span>
                    </div>
                    {isSelected && <Check size={14} style={{ color: '#8B5CF6' }} />}
                  </div>
                );
              })
            ) : (
              !('auto-generate instant qr'.includes(search.toLowerCase())) && (
                <div style={{ padding: '12px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No available QR matching "{search}"
                </div>
              )
            )}

            {isCustomScanned && (
              <div
                className="searchable-dropdown-item selected"
                onClick={() => handleSelect(value)}
                style={{ borderTop: '1px dashed rgba(109, 36, 186, 0.2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
                  <span style={{
                    background: 'rgba(99, 102, 241, 0.14)',
                    color: '#6366F1',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontSize: '0.66rem',
                    fontWeight: 600
                  }}>
                    Scanned
                  </span>
                </div>
                <Check size={14} style={{ color: '#8B5CF6' }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingClient({ preselectedQrId, onOnboardSuccess, onTestReview }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [categories, setCategories] = useState([]);
  const [googleMapUrl, setGoogleMapUrl] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFileName, setLogoFileName] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState('file'); // 'file' | 'url'
  const [selectedQrId, setSelectedQrId] = useState(preselectedQrId || '');
  const [customPassword, setCustomPassword] = useState('admin@123');
  const [isPhoneMandatory, setIsPhoneMandatory] = useState(false);

  const [unassignedQrs, setUnassignedQrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successClient, setSuccessClient] = useState(null);
  const [error, setError] = useState('');
  const [printModalData, setPrintModalData] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [copiedItem, setCopiedItem] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [downloadingExternalLogo, setDownloadingExternalLogo] = useState(false);
  const [savedLocalLogoPath, setSavedLocalLogoPath] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState(null);

  const handleScanQrSuccess = (scannedId, rawData, meta) => {
    if (!scannedId) return;
    if (meta && meta.isAssigned) {
      setSelectedQrId(scannedId);
      setScannedFeedback({
        type: 'error',
        isAssigned: true,
        clientName: meta.clientName,
        message: `Standee ${scannedId} is ALREADY ASSIGNED to ${meta.clientName || 'another business'}!`
      });
      return;
    }
    const found = unassignedQrs.find(q => q.qrId.toUpperCase() === scannedId.toUpperCase());
    if (found) {
      setSelectedQrId(found.qrId);
      setScannedFeedback({
        type: 'success',
        isAssigned: false,
        message: `Scanned & matched available standee: ${found.qrId}${found.note ? ` (${found.note})` : ''}`
      });
    } else {
      setSelectedQrId(scannedId);
      setScannedFeedback({
        type: 'error',
        isAssigned: true,
        message: `Standee ${scannedId} is already assigned and cannot be re-used.`
      });
    }
    setShowScanner(false);
  };

  const handleShareWhatsApp = (client) => {
    if (!client) return;
    const rawPhone = client.phone ? client.phone.toString().replace(/\D/g, '') : '';
    const portalUrl = window.location.origin;
    const reviewUrl = getClientReviewUrl(client, client.qrId);
    const message = `👋 Hello ${client.name}!\n\nWelcome to QR-Reviews! Your dynamic customer review standee has been activated.\n\n🌐 *Your Client Portal Login Details*:\n🔗 Portal: ${portalUrl}\n👤 Username (Phone): ${formatPhoneNumber(client.phone)}\n🔑 Password: ${client.password}\n\n⭐ *Your Direct Customer Review Link*:\n${reviewUrl}\n\nLog in anytime to track your real-time customer feedback, phone numbers, and download Excel reports!`;
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
    const text = `Business: ${client.name}\nPortal URL: ${portalUrl}\nUsername (Phone): ${formatPhoneNumber(client.phone)}\nPassword: ${client.password}\nReview Link: ${reviewUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  const handleCopyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedItem(key);
    setTimeout(() => setCopiedItem(''), 2000);
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

  // Fetch dynamic categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/categories`);
      const data = await res.json();
      if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to load dynamic categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch unassigned QRs
  const fetchUnassigned = async () => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/qr/unassigned`);
      const data = await res.json();
      if (data.qrs) {
        setUnassignedQrs(data.qrs);
        return data.qrs;
      }
    } catch (err) {
      console.error('Failed to load unassigned QRs:', err);
    }
    return [];
  };

  useEffect(() => {
    const init = async () => {
      const qrs = await fetchUnassigned();
      if (!selectedQrId) {
        if (preselectedQrId) {
          setSelectedQrId(preselectedQrId);
        } else if (qrs.length > 0) {
          setSelectedQrId(qrs[0].qrId);
        } else {
          setSelectedQrId('');
        }
      }
    };
    init();
  }, [preselectedQrId]);

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
      setError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo image file must be smaller than 5MB.');
      return;
    }

    setLogoFileName(file.name);
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
    setLogoFileName('');
    setSavedLocalLogoPath('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!name.trim() || !cleanPhone || !address.trim() || !placeId.trim() || !businessType.trim()) {
      setError('Client / Business Name, Phone Number, Google Place ID, Full address, and Business Category are all mandatory for onboarding.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    // Verify standee is not already assigned to another business
    if (selectedQrId && selectedQrId !== 'auto') {
      const isUnassigned = unassignedQrs.some(q => q.qrId.toUpperCase() === selectedQrId.toUpperCase());
      if (!isUnassigned) {
        setError(`QR Standee ${selectedQrId} is already assigned to another business. Please choose an unassigned standee from the list or scan another QR.`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const qrToUse = selectedQrId && selectedQrId !== '' ? selectedQrId : 'auto';
      const logoToSubmit = (savedLocalLogoPath || logoUrl || '').trim();
      const res = await fetch(`${config.API_BASE_URL}/api/clients/onboard`, {
        method: 'POST',
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
          logoUrl: logoToSubmit,
          qrId: qrToUse,
          customPassword: customPassword || 'admin@123',
          isPhoneMandatory: Boolean(isPhoneMandatory)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Onboarding failed');

      setSuccessClient(data.client);

      // Reset all form field values to empty
      setName('');
      setPhone('');
      setAddress('');
      setBusinessLocation('');
      setGoogleMapUrl('');
      setPlaceId('');
      setGoogleReviewUrl('');
      setLogoUrl('');
      setLogoPreview('');
      setLogoFileName('');
      setSavedLocalLogoPath('');
      setSelectedQrId('');
      setBusinessType('');
      setCustomPassword('admin@123');
      setIsPhoneMandatory(false);

      // Refresh unassigned QRs so the assigned QR is removed immediately
      await fetchUnassigned();

      if (onOnboardSuccess) {
        onOnboardSuccess();
      }
    } catch (err) {
      setError(err.message || 'Error occurred while onboarding client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Client Onboarded Cross-Verification Popup Modal */}
      {successClient && (
        <div className="modal-overlay" style={{ zIndex: 1050 }} onClick={() => setSuccessClient(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '620px',
              width: '100%',
              padding: 0,
              overflow: 'hidden',
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
              background: 'var(--bg-surface)'
            }}
          >
            {/* Top Accent Gradient */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #10B981, #6366F1, #8B5CF6)' }} />

            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Client Onboarded Successfully
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    Cross-verify details below. Use <strong>Edit</strong> to modify if any detail needs change.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessClient(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex'
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Cross-Verification Grid */}
            <div style={{ padding: '18px 20px', maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Business Identity Card */}
              <div style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    padding: '2px'
                  }}>
                    {successClient.logoUrl ? (
                      <img src={getImageUrl(successClient.logoUrl)} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Building2 size={22} style={{ color: 'var(--primary)' }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {successClient.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.66rem', padding: '1px 7px' }}>
                        {successClient.businessType}
                      </span>
                      {(successClient.businessLocation || successClient.address) && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} style={{ color: 'var(--accent)' }} />
                          {successClient.businessLocation || successClient.address?.split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                    Live & Linked
                  </span>
                </div>
              </div>

              {/* 2-Column Cross-Verification Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '10px',
                marginBottom: '12px'
              }}>
                {/* 1. Registered Phone */}
                <div style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '3px' }}>
                    Registered Phone (Login ID)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                      +91 {cleanPhoneNumber(successClient.phone || successClient.username)}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopyText(`+91${cleanPhoneNumber(successClient.phone || successClient.username)}`, 'phone')}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 7px', fontSize: '0.7rem', height: '22px' }}
                      title="Copy Phone Number"
                    >
                      {copiedItem === 'phone' ? <Check size={12} style={{ color: '#10B981' }} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* 2. Portal Password */}
                <div style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '3px' }}>
                    Portal Password
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--warning)', fontFamily: 'monospace' }}>
                      {successClient.password || 'admin@123'}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopyText(successClient.password || 'admin@123', 'pass')}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 7px', fontSize: '0.7rem', height: '22px' }}
                      title="Copy Password"
                    >
                      {copiedItem === 'pass' ? <Check size={12} style={{ color: '#10B981' }} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* 3. Linked Dynamic QR ID */}
                <div style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '3px' }}>
                    Linked Dynamic QR ID
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <QrCode size={14} style={{ color: '#6366F1' }} />
                    <code style={{ fontSize: '0.84rem', fontWeight: 700, color: '#4F46E5' }}>
                      {successClient.qrId}
                    </code>
                  </div>
                </div>

                {/* 4. Google Place ID */}
                <div style={{
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '3px' }}>
                    Google Place ID
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <code style={{ fontSize: '0.78rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                      {successClient.placeId || 'Linked'}
                    </code>
                    {successClient.googleReviewUrl && (
                      <a
                        href={successClient.googleReviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', flexShrink: 0 }}
                        title="Test Google Review Page"
                      >
                        <ExternalLink size={12} />
                        <span>Test</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* 5. Customer Review Link (Full Width) */}
                <div style={{
                  gridColumn: '1 / -1',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '3px' }}>
                    Customer Review URL
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <a
                      href={`/${successClient.slug || generateSlug(successClient.name) || successClient.qrId}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}
                    >
                      {getClientReviewUrl(successClient, successClient.qrId)}
                    </a>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleCopyText(getClientReviewUrl(successClient, successClient.qrId), 'link')}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.7rem', height: '24px' }}
                        title="Copy Customer Review Link"
                      >
                        {copiedItem === 'link' ? <Check size={12} style={{ color: '#10B981' }} /> : <Copy size={12} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onTestReview ? onTestReview(successClient.slug || generateSlug(successClient.name) || successClient.qrId) : window.open(`/${successClient.slug || generateSlug(successClient.name) || successClient.qrId}`, '_blank')}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.7rem', height: '24px' }}
                        title="Open Review Page in New Tab"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 6. Full Address (Full Width) */}
                <div style={{
                  gridColumn: '1 / -1',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 12px'
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '2px' }}>
                    Full Address
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    {successClient.address || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer: Edit Details, Share WhatsApp, Print Standee, Done */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              {/* EDIT OPTION: Click to edit any field if change is needed */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowEditModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: 'rgba(109, 36, 186, 0.4)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  padding: '6px 12px',
                  height: '32px'
                }}
                id="btn-verify-edit-client"
                title="Edit client details if any change is needed"
              >
                <Edit size={14} style={{ color: 'var(--primary)' }} />
                <span>Edit Details</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    color: '#FFF',
                    fontWeight: 600,
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)',
                    height: '32px',
                    padding: '0 12px'
                  }}
                  onClick={() => handleShareWhatsApp(successClient)}
                >
                  <Share2 size={13} />
                  <span>Share via WhatsApp</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #6d24ba 0%, #491480 100%)',
                    color: '#FFF',
                    fontWeight: 600,
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    height: '32px',
                    padding: '0 12px'
                  }}
                  onClick={() => setPrintModalData({
                    qrId: successClient.qrId,
                    filename: `${successClient.qrId}.png`,
                    name: successClient.name,
                    address: successClient.address,
                    businessLocation: successClient.businessLocation || successClient.address
                  })}
                >
                  <Printer size={13} />
                  <span>Print Standee</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{
                    fontWeight: 700,
                    height: '32px',
                    padding: '0 14px'
                  }}
                  onClick={() => setSuccessClient(null)}
                >
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal opened from Cross-Verification popup */}
      {showEditModal && successClient && (
        <EditClientModal
          client={successClient}
          onClose={() => setShowEditModal(false)}
          onSaveSuccess={(updatedClient) => {
            setSuccessClient(updatedClient);
            setShowEditModal(false);
          }}
        />
      )}

      {/* Main Form Layout */}
      {(() => {
        const selectedQrItem = unassignedQrs.find(q => q.qrId === selectedQrId);
        return (
          <div className="onboarding-main-layout" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 310px',
            gap: '18px',
            alignItems: 'start'
          }}>
            {/* Compact Onboarding Form */}
            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '7px', borderRadius: '8px', background: 'rgba(109, 36, 186, 0.12)', color: 'var(--primary)', display: 'flex' }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Client Onboarding</h3>
                </div>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#F87171',
                  fontSize: '0.82rem',
                  marginBottom: '14px'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="onboarding-fields-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px 14px'
                }}>
                  {/* 1. Client / Business Name */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="client-name" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                      Business Name <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="client-name"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '34px', height: '36px', fontSize: '0.84rem' }}
                        placeholder="e.g. Skyline Grand Hotel, Bloom Cafe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                      <Building2 size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  {/* 2. Phone Number */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" htmlFor="client-phone" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                        Phone Number <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {phone.length === 10 && (
                          <CopyablePhone phone={phone} showText={false} btnStyle={{ padding: '2px 5px', fontSize: '10px' }} />
                        )}
                        <span style={{ fontSize: '0.7rem', color: phone.length === 10 ? 'var(--success)' : 'var(--text-muted)' }}>
                          {phone.length}/10
                        </span>
                      </div>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Phone size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      <span className="input-phone-prefix">+91</span>
                      <input
                        id="client-phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        autoComplete="tel"
                        className="form-input form-input-phone"
                        style={{ height: '36px', fontSize: '0.84rem', letterSpacing: '0.04em' }}
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

                  {/* 3. Business Category (Searchable Dropdown) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', height: '24px' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                        Business Category <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                    </div>
                    <SearchableCategoryDropdown
                      categories={categories}
                      value={businessType}
                      onChange={(catName) => setBusinessType(catName)}
                    />
                  </div>

                  {/* 4. Business Location / Branch / Area */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', height: '24px' }}>
                      <label className="form-label" htmlFor="client-location" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                        Business Location <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>(Optional)</span>
                      </label>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="client-location"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '34px', height: '36px', fontSize: '0.84rem' }}
                        placeholder="e.g. Jubilee Hills, Whitefield, Indiranagar"
                        value={businessLocation}
                        onChange={(e) => setBusinessLocation(e.target.value)}
                      />
                      <MapPin size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  {/* 5. Brand Logo (Optional) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', height: '24px' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                        Brand Logo <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(Optional)</span>
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setLogoInputMode('file')}
                          className="btn btn-sm"
                          style={{
                            padding: '1px 8px',
                            fontSize: '0.7rem',
                            height: '22px',
                            fontWeight: 600,
                            borderRadius: '5px',
                            background: logoInputMode === 'file' ? 'linear-gradient(135deg, #6d24ba 0%, #8B5CF6 100%)' : 'rgba(109, 36, 186, 0.08)',
                            color: logoInputMode === 'file' ? '#FFFFFF' : 'var(--text-primary)',
                            border: logoInputMode === 'file' ? 'none' : '1px solid rgba(109, 36, 186, 0.25)',
                            boxShadow: logoInputMode === 'file' ? '0 2px 8px rgba(109, 36, 186, 0.3)' : 'none'
                          }}
                        >
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoInputMode('url')}
                          className="btn btn-sm"
                          style={{
                            padding: '1px 8px',
                            fontSize: '0.7rem',
                            height: '22px',
                            fontWeight: 600,
                            borderRadius: '5px',
                            background: logoInputMode === 'url' ? 'linear-gradient(135deg, #6d24ba 0%, #8B5CF6 100%)' : 'rgba(109, 36, 186, 0.08)',
                            color: logoInputMode === 'url' ? '#FFFFFF' : 'var(--text-primary)',
                            border: logoInputMode === 'url' ? 'none' : '1px solid rgba(109, 36, 186, 0.25)',
                            boxShadow: logoInputMode === 'url' ? '0 2px 8px rgba(109, 36, 186, 0.3)' : 'none'
                          }}
                        >
                          URL
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
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                            minHeight: '62px'
                          }}>
                            {/* Small Logo Preview Div */}
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
                                    <Check size={14} style={{ strokeWidth: 3 }} /> Logo Uploaded
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={logoFileName || 'Image ready'}>
                                {logoFileName || 'Image ready for review card & standee'}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <label
                                htmlFor="client-logo-upload-change"
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
                                  id="client-logo-upload-change"
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
                            htmlFor="client-logo-upload"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              padding: '0 12px',
                              height: '42px',
                              border: '1.5px dashed rgba(109, 36, 186, 0.4)',
                              borderRadius: '8px',
                              background: 'var(--bg-main)',
                              cursor: 'pointer',
                              boxSizing: 'border-box',
                              fontSize: '0.82rem',
                              color: 'var(--text-secondary)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Upload size={16} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontWeight: 500 }}>Upload Logo (PNG, JPG, WebP)</span>
                            <input
                              id="client-logo-upload"
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
                              style={{ paddingLeft: '34px', height: '36px', fontSize: '0.84rem' }}
                              placeholder="https://example.com/logo.png"
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
                            <ImageIcon size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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
                      </div>
                    )}
                  </div>

                  {/* 6. Full Address */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', height: '24px' }}>
                      <label className="form-label" htmlFor="client-address" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                        Full Address <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="client-address"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '34px', height: '36px', fontSize: '0.84rem' }}
                        placeholder="Door #, Street, Area, City, Pin Code"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                      <MapPin size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  {/* 7. Google Place ID */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', height: '24px' }}>
                      <label className="form-label" htmlFor="client-place-id" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                        Google Place ID <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <a
                        href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.72rem', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        Find Place ID <ExternalLink size={10} />
                      </a>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="client-place-id"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '34px', height: '36px', fontSize: '0.84rem' }}
                        placeholder="Paste ChIJ... Place ID or Review URL"
                        value={placeId}
                        onChange={(e) => handlePlaceIdChange(e.target.value)}
                        required
                      />
                      <ExternalLink size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  {/* 8. Assign Dynamic QR (Searchable Dropdown with High-Contrast Visible Value) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                        Assign Dynamic QR <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setShowScanner(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 9px',
                          fontSize: '0.72rem',
                          height: '24px',
                          color: '#FFFFFF',
                          background: 'linear-gradient(135deg, #6d24ba 0%, #8B5CF6 100%)',
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(109, 36, 186, 0.3)',
                          borderRadius: '5px',
                          fontWeight: 600
                        }}
                        id="btn-open-camera-scanner"
                        title="Scan physical QR standee"
                      >
                        <Camera size={12} />
                        <span>Scan</span>
                      </button>
                    </div>

                    <SearchableQrDropdown
                      unassignedQrs={unassignedQrs}
                      value={selectedQrId}
                      onChange={(qrId) => {
                        setSelectedQrId(qrId);
                        setScannedFeedback(null);
                      }}
                    />

                    {scannedFeedback && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        marginTop: '6px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: scannedFeedback.isAssigned || scannedFeedback.type === 'error'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(16, 185, 129, 0.12)',
                        border: `1px solid ${
                          scannedFeedback.isAssigned || scannedFeedback.type === 'error'
                            ? 'rgba(239, 68, 68, 0.35)'
                            : 'rgba(16, 185, 129, 0.25)'
                        }`,
                        color: scannedFeedback.isAssigned || scannedFeedback.type === 'error'
                          ? '#F87171'
                          : '#34D399',
                        fontSize: '0.74rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {scannedFeedback.isAssigned || scannedFeedback.type === 'error' ? (
                            <AlertCircle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                          ) : (
                            <CheckCircle2 size={13} style={{ color: '#10B981', flexShrink: 0 }} />
                          )}
                          <span style={{ fontWeight: scannedFeedback.isAssigned ? 600 : 500 }}>
                            {scannedFeedback.message}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setScannedFeedback(null)}
                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '1px', display: 'flex' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 10. Client Portal Password (spans 2 columns) */}
                  <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                    <label className="form-label" htmlFor="client-password" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                      Client Portal Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="client-password"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '34px', height: '36px', fontSize: '0.84rem' }}
                        placeholder="Default: admin@123"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                      />
                      <Lock size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  {/* 11. Customer Phone Requirement on Review Page (Radio Buttons) */}
                  <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Phone size={13} style={{ color: 'var(--primary)' }} />
                        <span>Customer Mobile Number on Review Page</span>
                      </label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Control whether scanning customers must enter their mobile number
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
                          name="onboardingIsPhoneMandatory"
                          checked={!isPhoneMandatory}
                          onChange={() => setIsPhoneMandatory(false)}
                          style={{ accentColor: '#8B5CF6', cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Optional (Default)
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Customers can leave reviews without entering phone
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
                          name="onboardingIsPhoneMandatory"
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
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Customer must enter a 10-digit mobile number to proceed
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Submit Button (spans 2 columns with purple gradient) */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      gridColumn: '1 / -1',
                      height: '42px',
                      marginTop: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      background: 'linear-gradient(135deg, #6d24ba 0%, #8B5CF6 50%, #491480 100%)',
                      border: 'none',
                      boxShadow: '0 4px 18px rgba(109, 36, 186, 0.4)',
                      color: '#FFFFFF'
                    }}
                    disabled={loading}
                    id="btn-submit-client-onboarding"
                  >
                    {loading ? (
                      <span>Integrating Client & QR...</span>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>Complete Client Onboarding</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Compact Live Standee Preview (Right Column) */}
            <div className="glass-panel" style={{ padding: '18px', position: 'sticky', top: '90px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Live Standee Preview
                </span>
                <span className={`badge ${selectedQrId && selectedQrId !== 'auto' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                  {selectedQrId === 'auto' ? 'Auto Dynamic' : (selectedQrId || 'QR Pending')}
                </span>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'var(--bg-main)',
                border: '1px solid rgba(109, 36, 186, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                {/* Logo or Category Icon Avatar */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(109, 36, 186, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '3px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  marginBottom: '8px'
                }}>
                  {logoPreview || logoUrl ? (
                    <img src={logoPreview || logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Building2 size={24} style={{ color: 'var(--primary)', opacity: name ? 1 : 0.4 }} />
                  )}
                </div>

                {/* Business Name */}
                <div style={{
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  color: name ? 'var(--text-primary)' : 'var(--text-muted)',
                  marginBottom: '2px',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {name || 'Business Name'}
                </div>

                {/* Location */}
                {(businessLocation || address) && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '6px' }}>
                    <MapPin size={11} style={{ color: 'var(--accent)' }} />
                    <span>{businessLocation || address.split(',')[0]}</span>
                  </div>
                )}

                {/* QR Scanner / Standee Code Preview */}
                <div style={{
                  background: '#FFFFFF',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '1px solid rgba(109, 36, 186, 0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
                  marginTop: '10px'
                }}>
                  {selectedQrItem?.filePath ? (
                    <img
                      src={getImageUrl(selectedQrItem.filePath)}
                      alt="QR Standee Code"
                      style={{ width: '170px', height: '170px', objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '170px', height: '170px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: '8px' }}>
                      <QrCode size={96} style={{ opacity: 0.65, color: '#8B5CF6' }} />
                      <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Scan Standee QR</span>
                    </div>
                  )}
                </div>

                {/* Developed By Vasmi Group Standee Footer */}
                <div style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  fontSize: '0.72rem'
                }}>
                  <a
                    href="https://vasmigroup.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vasmi-dev-link"
                    style={{ textDecoration: 'none' }}
                    title="Developed by Vasmi Group - https://vasmigroup.com"
                  >
                    <span className="vasmi-dev-text" style={{ fontSize: '0.72rem' }}>Developed by</span>
                    <span className="vasmi-brand-name" style={{ fontSize: '0.72rem' }}>
                      <span className="vasmi-brand-white">Vasmi</span>
                      <span className="vasmi-brand-orange">Group</span>
                    </span>
                    <span className="vasmi-logo-wrapper">
                      <img
                        src={vasmiIcon}
                        alt="Vasmi Group"
                        className="vasmi-logo-img"
                        width="15"
                        height="13"
                      />
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Standee Modal */}
      {printModalData && (
        <PrintModal
          qr={printModalData}
          client={printModalData}
          onClose={() => setPrintModalData(null)}
        />
      )}

      {/* QR Camera Scanner Modal */}
      <QrCameraScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanQrSuccess}
        availableQrs={unassignedQrs}
        title="Scan Dynamic QR Standee"
      />
    </div>
  );
}
