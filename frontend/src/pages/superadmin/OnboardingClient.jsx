import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Building2,
  Phone,
  MapPin,
  QrCode,
  CheckCircle2,
  AlertCircle,
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
  Loader2,
  CreditCard,
  Tag,
  Plus,
  Lightbulb,
  RotateCcw
} from 'lucide-react';
import PrintModal from '../../components/PrintModal';
import EditClientModal from '../../components/EditClientModal';
import QrCameraScannerModal, { extractQrIdFromText } from '../../components/QrCameraScannerModal';
import { generateSlug, getClientReviewUrl } from '../../utils/slug';
import { extractPlaceId, buildGoogleReviewUrl } from '../../utils/placeId';
import { formatPhoneNumber, cleanPhoneNumber } from '../../utils/phone';
import { resolveCategory, CATEGORY_DATA, POPULAR_CATEGORY_KEYWORDS } from '../../data/aiSuggestions';
import config, { getImageUrl } from '../../config';
import CopyablePhone from '../../components/CopyablePhone';
import vasmiFullLogo from '../../assets/vasmi_full_logo.png';
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

  const selectedQr = (Array.isArray(unassignedQrs) ? unassignedQrs : []).find(q => q && q.qrId === value);
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

const ONBOARDING_DRAFT_KEY = 'qr_reviews_onboarding_form_draft';

const loadSavedDraft = () => {
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

export default function OnboardingClient({ preselectedQrId, onOnboardSuccess, onTestReview }) {
  const [draft] = useState(() => loadSavedDraft());

  const [name, setName] = useState(draft?.name || '');
  const [phone, setPhone] = useState(draft?.phone || '');
  const [address, setAddress] = useState(draft?.address || '');
  const [businessLocation, setBusinessLocation] = useState(draft?.businessLocation || '');
  const [businessType, setBusinessType] = useState(draft?.businessType || '');
  const [categories, setCategories] = useState([]);
  const [googleMapUrl, setGoogleMapUrl] = useState(draft?.googleMapUrl || '');
  const [placeId, setPlaceId] = useState(draft?.placeId || '');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(draft?.googleReviewUrl || '');
  const [logoUrl, setLogoUrl] = useState(draft?.logoUrl || '');
  const [logoPreview, setLogoPreview] = useState(draft?.logoPreview || draft?.logoUrl || '');
  const [logoFileName, setLogoFileName] = useState(draft?.logoFileName || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState(draft?.logoInputMode || 'file'); // 'file' | 'url'
  const [savedLocalLogoPath, setSavedLocalLogoPath] = useState(draft?.savedLocalLogoPath || '');
  const [selectedQrId, setSelectedQrId] = useState(preselectedQrId || draft?.selectedQrId || '');
  const [selectedQrDetails, setSelectedQrDetails] = useState(null);
  const [customPassword, setCustomPassword] = useState(draft?.customPassword !== undefined ? draft.customPassword : 'admin@123');
  const [isPhoneMandatory, setIsPhoneMandatory] = useState(draft?.isPhoneMandatory !== undefined ? Boolean(draft.isPhoneMandatory) : false);
  const [subscriptionPlan, setSubscriptionPlan] = useState(draft?.subscriptionPlan || 'Starter Launch Trial (₹9)');
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [keywords, setKeywords] = useState(Array.isArray(draft?.keywords) ? draft.keywords : []);
  const [keywordInput, setKeywordInput] = useState('');
  const [unassignedQrs, setUnassignedQrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successClient, setSuccessClient] = useState(null);
  const [error, setError] = useState('');
  const [printModalData, setPrintModalData] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [copiedItem, setCopiedItem] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [downloadingExternalLogo, setDownloadingExternalLogo] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState(null);

  // Auto-update selectedQrId if preselectedQrId prop changes (e.g. from New QR Generation action)
  useEffect(() => {
    if (preselectedQrId && preselectedQrId !== selectedQrId) {
      setSelectedQrId(preselectedQrId);
    }
  }, [preselectedQrId]);

  // Keep live standee QR details synced for immediate image preview
  useEffect(() => {
    if (!selectedQrId || selectedQrId === 'auto') {
      setSelectedQrDetails(null);
      return;
    }
    const found = Array.isArray(unassignedQrs)
      ? unassignedQrs.find(q => q && q.qrId && q.qrId.toUpperCase() === selectedQrId.toUpperCase())
      : null;
    if (found) {
      setSelectedQrDetails(found);
    } else {
      fetch(`${config.API_BASE_URL}/api/public/qr-info/${encodeURIComponent(selectedQrId)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.qr) {
            setSelectedQrDetails(data.qr);
          } else if (data && data.filePath) {
            setSelectedQrDetails(data);
          }
        })
        .catch(() => {});
    }
  }, [selectedQrId, unassignedQrs]);

  // Persist form data to localStorage so it is retained across tab switches until completed or cleared
  useEffect(() => {
    try {
      const dataToSave = {
        name,
        phone,
        address,
        businessLocation,
        businessType,
        googleMapUrl,
        placeId,
        googleReviewUrl,
        logoUrl,
        logoPreview,
        logoFileName,
        savedLocalLogoPath,
        logoInputMode,
        selectedQrId,
        customPassword,
        isPhoneMandatory,
        subscriptionPlan,
        keywords
      };

      const hasContent = Boolean(
        (name || '').trim() ||
        (phone || '').trim() ||
        (address || '').trim() ||
        (businessLocation || '').trim() ||
        (businessType || '').trim() ||
        (placeId || '').trim() ||
        (logoUrl || '').trim() ||
        (selectedQrId || '').trim() ||
        (Array.isArray(keywords) && keywords.length > 0)
      );

      if (hasContent) {
        localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(dataToSave));
      }
    } catch (err) {
      console.warn('Failed to save onboarding draft:', err);
    }
  }, [
    name,
    phone,
    address,
    businessLocation,
    businessType,
    googleMapUrl,
    placeId,
    googleReviewUrl,
    logoUrl,
    logoPreview,
    logoFileName,
    savedLocalLogoPath,
    logoInputMode,
    selectedQrId,
    customPassword,
    isPhoneMandatory,
    subscriptionPlan,
    keywords
  ]);

  const hasAnyData = Boolean(
    (name || '').trim() ||
    (phone || '').trim() ||
    (address || '').trim() ||
    (businessLocation || '').trim() ||
    (businessType || '').trim() ||
    (placeId || '').trim() ||
    (logoUrl || '').trim() ||
    (selectedQrId || '').trim() ||
    (Array.isArray(keywords) && keywords.length > 0)
  );

  const handleClearForm = () => {
    if (window.confirm('Clear all entered onboarding fields and start fresh?')) {
      try {
        localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      } catch (err) {}
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
      setKeywords([]);
      setKeywordInput('');
      setError('');
    }
  };

  // Resolved category metadata for live keyword suggestions during onboarding
  const resolvedCategoryKey = resolveCategory(businessType, name);
  const categoryMeta = CATEGORY_DATA[resolvedCategoryKey] || CATEGORY_DATA['General Business'];
  const suggestedCategoryKeywords = POPULAR_CATEGORY_KEYWORDS[resolvedCategoryKey] || POPULAR_CATEGORY_KEYWORDS['General Business'];

  const handleAddKeyword = () => {
    const clean = keywordInput.trim().replace(/^[#,]+/, '');
    if (!clean) return;
    const parts = clean.split(',').map(s => s.trim()).filter(Boolean);
    setKeywords(prev => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.some(k => k.toLowerCase() === p.toLowerCase())) {
          next.push(p);
        }
      }
      return next;
    });
    setKeywordInput('');
  };

  const handleAddSuggestedKeyword = (sug) => {
    if (!keywords.some(k => k.toLowerCase() === sug.toLowerCase())) {
      setKeywords(prev => [...prev, sug]);
    }
  };

  const handleRemoveKeyword = (indexToRemove) => {
    setKeywords(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleScanQrSuccess = async (scannedId, rawData, meta) => {
    if (!scannedId) return;
    setShowScanner(false);

    const cleanId = extractQrIdFromText(scannedId) || scannedId;

    if (meta && meta.isAssigned) {
      setSelectedQrId(cleanId);
      setScannedFeedback({
        type: 'error',
        isAssigned: true,
        clientName: meta.clientName,
        message: `Standee ${cleanId} is ALREADY ASSIGNED to ${meta.clientName || 'another business'}!`
      });
      return;
    }

    // Refresh unassigned QRs from backend to ensure latest list
    const freshQrs = await fetchUnassigned();
    const list = Array.isArray(freshQrs) && freshQrs.length > 0 ? freshQrs : (unassignedQrs || []);
    const found = list.find(q => q && q.qrId && q.qrId.toUpperCase() === cleanId.toUpperCase());

    if (found) {
      setSelectedQrId(found.qrId);
      setSelectedQrDetails(found);
      setScannedFeedback({
        type: 'success',
        isAssigned: false,
        message: `Scanned & matched available standee: ${found.qrId}${found.note ? ` (${found.note})` : ''}`
      });
    } else {
      setSelectedQrId(cleanId);
      setScannedFeedback({
        type: 'success',
        isAssigned: false,
        message: `Scanned dynamic standee: ${cleanId}`
      });
    }
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

  // Fetch dynamic customizable subscription plans
  const fetchSubscriptionPlans = async () => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/subscription-plans?activeOnly=true`);
      const data = await res.json();
      if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
        setSubscriptionPlans(data.plans);
        const def = data.plans.find(p => p.isDefault) || data.plans[0];
        if (def && (!subscriptionPlan || subscriptionPlan === 'Starter Launch Trial (₹9)')) {
          setSubscriptionPlan(def.name);
        }
      }
    } catch (err) {
      console.error('Failed to load customizable subscription plans:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubscriptionPlans();
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
          isPhoneMandatory: Boolean(isPhoneMandatory),
          subscriptionPlan: subscriptionPlan || 'Starter Launch Trial (₹9)',
          keywords: keywords.join(', ')
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Onboarding failed');

      try {
        localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      } catch (err) {}

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
      setKeywords([]);
      setKeywordInput('');
      const def = subscriptionPlans.find(p => p.isDefault) || subscriptionPlans[0];
      setSubscriptionPlan(def ? def.name : 'Starter Launch Trial (₹9)');

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
      {/* Simple Custom Success Dialog */}
      {successClient && (
        <div className="modal-overlay" style={{ zIndex: 1050 }} onClick={() => setSuccessClient(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '92%',
              padding: '24px 22px',
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.15)',
              background: 'var(--bg-card)',
              position: 'relative',
              textAlign: 'center'
            }}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setSuccessClient(null)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Close Dialog"
            >
              <X size={15} />
            </button>

            {/* Glowing Success Celebration Icon */}
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1.5px solid rgba(16, 185, 129, 0.45)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.28)'
            }}>
              <CheckCircle2 size={30} />
            </div>

            {/* Header Titles */}
            <h3 style={{ fontSize: '1.22rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              Client Onboarded Successfully!
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{successClient.name}</strong> is now live and linked to Standee <strong style={{ color: '#8B5CF6' }}>{successClient.qrId}</strong>.
            </p>

            {/* Concise Summary Card */}
            <div style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '12px 14px',
              textAlign: 'left',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {/* Business Identity Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
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
                    <Building2 size={20} style={{ color: 'var(--primary)' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {successClient.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.64rem', padding: '1px 6px' }}>
                      {successClient.businessType}
                    </span>
                    {(successClient.businessLocation || successClient.address) && (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        • {successClient.businessLocation || successClient.address?.split(',')[0]}
                      </span>
                    )}
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 7px', flexShrink: 0 }}>
                  Active
                </span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 0' }} />

              {/* Login Credentials */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                {/* Phone */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '7px 9px', borderRadius: '7px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    Login (Phone)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                      +91 {cleanPhoneNumber(successClient.phone || successClient.username)}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopyText(`+91${cleanPhoneNumber(successClient.phone || successClient.username)}`, 'phone')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: copiedItem === 'phone' ? '#10B981' : 'var(--text-muted)' }}
                      title="Copy phone"
                    >
                      {copiedItem === 'phone' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '7px 9px', borderRadius: '7px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    Password
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <strong style={{ color: 'var(--warning)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {successClient.password || 'admin@123'}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopyText(successClient.password || 'admin@123', 'pass')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', color: copiedItem === 'pass' ? '#10B981' : 'var(--text-muted)' }}
                      title="Copy password"
                    >
                      {copiedItem === 'pass' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Review Link Row */}
              <div style={{ background: 'rgba(99, 102, 241, 0.06)', padding: '7px 9px', borderRadius: '7px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                    Customer Review Link
                  </span>
                  <a
                    href={`/${successClient.slug || generateSlug(successClient.name) || successClient.qrId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.76rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                  >
                    {getClientReviewUrl(successClient, successClient.qrId)}
                  </a>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleCopyText(getClientReviewUrl(successClient, successClient.qrId), 'link')}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '3px 7px', fontSize: '0.7rem', height: '24px' }}
                    title="Copy Link"
                  >
                    {copiedItem === 'link' ? <Check size={12} style={{ color: '#10B981' }} /> : <Copy size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onTestReview ? onTestReview(successClient.slug || generateSlug(successClient.name) || successClient.qrId) : window.open(`/${successClient.slug || generateSlug(successClient.name) || successClient.qrId}`, '_blank')}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '3px 7px', fontSize: '0.7rem', height: '24px' }}
                    title="Open in new tab"
                  >
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {/* Share WhatsApp */}
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
                    justifyContent: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)',
                    height: '34px',
                    fontSize: '0.8rem',
                    borderRadius: '8px'
                  }}
                  onClick={() => handleShareWhatsApp(successClient)}
                >
                  <Share2 size={13} />
                  <span>WhatsApp</span>
                </button>

                {/* Print Standee */}
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
                    justifyContent: 'center',
                    gap: '5px',
                    height: '34px',
                    fontSize: '0.8rem',
                    borderRadius: '8px'
                  }}
                  onClick={() => setPrintModalData({
                    qrId: successClient.qrId,
                    filename: `${successClient.qrId}.png`,
                    filePath: successClient.filePath || successClient.qrFilePath,
                    logoUrl: successClient.logoUrl,
                    name: successClient.name,
                    address: successClient.address,
                    businessLocation: successClient.businessLocation || successClient.address
                  })}
                  title="Configure QRs per A4 sheet setting and print standees/cards for this client"
                >
                  <Printer size={13} />
                  <span>Print Standee / Cards</span>
                </button>
              </div>

              {/* Done Button */}
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{
                  fontWeight: 700,
                  height: '36px',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onClick={() => setSuccessClient(null)}
              >
                <Check size={14} />
                <span>Done</span>
              </button>

              {/* Edit Details Link */}
              <div style={{ marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    textDecoration: 'underline'
                  }}
                  title="Need to modify something?"
                >
                  <Edit size={11} />
                  <span>Need to change details? Edit Client</span>
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
        const selectedQrItem = selectedQrDetails || (Array.isArray(unassignedQrs) ? unassignedQrs.find(q => q && q.qrId === selectedQrId) : null);
        return (
          <div className="onboarding-main-layout" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 310px',
            gap: '18px',
            alignItems: 'start'
          }}>
            {/* Compact Onboarding Form */}
            <div className="glass-panel" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ padding: '7px', borderRadius: '8px', background: 'rgba(109, 36, 186, 0.12)', color: 'var(--primary)', display: 'flex' }}>
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Client Onboarding</h3>
                  </div>
                </div>

                {hasAnyData && (
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: '0.74rem',
                      color: '#EF4444',
                      height: '28px',
                      padding: '0 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      borderColor: 'rgba(239, 68, 68, 0.3)'
                    }}
                    title="Clear all entered onboarding fields and start fresh"
                  >
                    <RotateCcw size={12} />
                    <span>Clear Form</span>
                  </button>
                )}
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

                  {/* 6. Google Place ID */}
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

                  {/* 7. Full Address */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', height: '24px' }}>
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

                  {/* 10. Client Portal Password (Left Column) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', height: '24px' }}>
                      <label className="form-label" htmlFor="client-password" style={{ fontSize: '0.78rem', marginBottom: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Lock size={13} style={{ color: 'var(--primary)' }} />
                        <span>Client Portal Password</span>
                      </label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Default: admin@123
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="client-password"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '34px', height: '38px', fontSize: '0.84rem' }}
                        placeholder="Default: admin@123"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                      />
                      <Lock size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    </div>
                  </div>

                  {/* 11. Subscription Plan (Right Column - Next to Portal Password) */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', height: '24px' }}>
                      <label className="form-label" htmlFor="onboard-subscription-plan" style={{ fontSize: '0.78rem', marginBottom: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CreditCard size={13} style={{ color: 'var(--primary)' }} />
                        <span>Subscription Plan</span>
                      </label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>
                        Default Opt-In Plan
                      </span>
                    </div>
                    <select
                      id="onboard-subscription-plan"
                      className="form-select"
                      value={subscriptionPlan}
                      onChange={(e) => setSubscriptionPlan(e.target.value)}
                      style={{
                        height: '38px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        borderRadius: '8px',
                        color: 'var(--text-primary, #F8FAFC)',
                        background: 'var(--bg-card, rgba(30, 27, 75, 0.6))',
                        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
                        width: '100%',
                        padding: '0 10px'
                      }}
                    >
                      {subscriptionPlans.length > 0 ? (
                        subscriptionPlans.map((p) => (
                          <option key={p.id} value={p.name} style={{ background: '#1E1B4B', color: '#F8FAFC' }}>
                            {p.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Starter Launch Free Trial" style={{ background: '#1E1B4B', color: '#F8FAFC' }}>
                            Starter Launch Free Trial
                          </option>
                          <option value="Business Pro Monthly (₹150/mo)" style={{ background: '#1E1B4B', color: '#F8FAFC' }}>
                            Business Pro Monthly (₹150/mo)
                          </option>
                          <option value="Multi-Outlet Customizer" style={{ background: '#1E1B4B', color: '#F8FAFC' }}>
                            Multi-Outlet Customizer
                          </option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* 12. Keywords & Specialties (AI Review Advantage - spans 2 columns) */}
                  <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} style={{ color: '#8B5CF6' }} />
                        <span>Business Keywords & Specialties</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Optional - AI Review Advantage)</span>
                      </label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>
                        AI will weave these into customer review options
                      </span>
                    </div>

                    {/* Keywords Tags Chips */}
                    {keywords.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginBottom: '8px',
                        padding: '8px 10px',
                        background: 'var(--bg-main)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {keywords.map((kw, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, rgba(109, 36, 186, 0.25) 0%, rgba(139, 92, 246, 0.18) 100%)',
                              border: '1px solid rgba(167, 139, 250, 0.35)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <span>{kw}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                              title={`Remove "${kw}"`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Keyword Add Input Bar */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Type a specialty (e.g. Rooftop seating, Fast service, Friendly staff) & press Enter..."
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                          style={{ paddingLeft: '32px', height: '36px', fontSize: '0.82rem' }}
                        />
                        <Tag size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        disabled={!keywordInput.trim()}
                        className="btn btn-secondary btn-sm"
                        style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    </div>

                    {/* Quick Suggested Keywords for the Category */}
                    {suggestedCategoryKeywords.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                          <Lightbulb size={12} style={{ color: '#F59E0B' }} />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Quick Add for {categoryMeta?.categoryLabel || businessType || 'Business'}:
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {suggestedCategoryKeywords.slice(0, 8).map((sug) => {
                            const isAdded = keywords.some(k => k.toLowerCase() === sug.toLowerCase());
                            return (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => handleAddSuggestedKeyword(sug)}
                                disabled={isAdded}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  borderRadius: '5px',
                                  fontSize: '0.72rem',
                                  fontWeight: 500,
                                  cursor: isAdded ? 'default' : 'pointer',
                                  background: isAdded ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-main)',
                                  border: isAdded ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                                  color: isAdded ? '#10B981' : 'var(--text-secondary)',
                                  opacity: isAdded ? 0.7 : 1,
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {isAdded ? <Check size={10} /> : <Plus size={10} style={{ opacity: 0.5 }} />}
                                <span>{sug}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 13. Customer Phone Requirement on Review Page (Radio Buttons - spans 2 columns) */}
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

              <div
                className="standee-live-card"
                style={{
                  padding: '18px 16px 14px',
                  borderRadius: '16px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  color: '#0F172A'
                }}
              >
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
                  color: name ? '#0F172A' : '#94A3B8',
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
                  <div style={{ fontSize: '0.74rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '6px' }}>
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
                  paddingTop: '8px',
                  borderTop: '1px solid #E2E8F0',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.72rem'
                }}>
                  <a
                    href="https://vasmigroup.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="standee-dev-link"
                    style={{ textDecoration: 'none' }}
                    title="Designed and Developed by Vasmi Group - https://vasmigroup.com"
                  >
                    <span className="standee-dev-text">
                      Designed and Developed by
                    </span>
                    <span className="standee-logo-wrapper">
                      <img
                        src={vasmiFullLogo}
                        alt="Vasmi Group - Creating Your Identity"
                        className="standee-full-logo-img"
                      />
                    </span>
                  </a>
                </div>
              </div>

              {/* Quick Print Button from Live Preview */}
              {selectedQrItem && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPrintModalData({
                    qrId: selectedQrItem.qrId,
                    filename: `${selectedQrItem.qrId}.png`,
                    filePath: selectedQrItem.filePath,
                    logoUrl: logoPreview || logoUrl,
                    name: name || 'Business Name',
                    address: address,
                    businessLocation: businessLocation || address
                  })}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    height: '32px',
                    background: 'rgba(109, 36, 186, 0.12)',
                    border: '1px solid rgba(109, 36, 186, 0.3)',
                    color: 'var(--text-primary)'
                  }}
                  title="Configure QRs per A4 sheet and print cards"
                >
                  <Printer size={13} style={{ color: '#8B5CF6' }} />
                  <span>Print Standee / Cards (A4 Setting)</span>
                </button>
              )}
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
