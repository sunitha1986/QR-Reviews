import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Tag,
  Plus,
  X,
  Check,
  Save,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Building2,
  Lightbulb,
  Info
} from 'lucide-react';
import config from '../../config';
import { resolveCategory, CATEGORY_DATA } from '../../data/aiSuggestions';
import { ClientProfileShimmer } from '../../components/Shimmer';

// Pre-curated, high-converting keyword suggestions by commercial category
const POPULAR_CATEGORY_KEYWORDS = {
  'Restaurant & Cafe': [
    'Rooftop ambiance',
    'Wood-fired pizza',
    'Delicious food',
    'Fast service',
    'Cozy seating',
    'Courteous staff',
    'Fresh coffee',
    'Hygienic kitchen',
    'Generous portions',
    'Family friendly',
    'Tasty desserts',
    'Prompt billing'
  ],
  'Healthcare & Clinic': [
    'Gentle doctors',
    'Minimal waiting time',
    'Clean & sterile clinic',
    'Caring nurses',
    'Modern diagnostics',
    'Painless treatment',
    'Helpful reception',
    'Transparent consultation fees',
    'Patient guidance',
    'Family health care'
  ],
  'Hotel & Resort': [
    'Spacious rooms',
    'Comfortable beds',
    'Peaceful stay',
    'Delicious breakfast buffet',
    'Helpful front desk',
    'Clean swimming pool',
    'Fast Wi-Fi',
    'Prompt room service',
    'Scenic views',
    'Hassle-free check-in'
  ],
  'Retail & Shopping': [
    'Trendy collection',
    'Top quality merchandise',
    'Fast billing counter',
    'Affordable prices',
    'Helpful store staff',
    'Neat aisles',
    'Great discount offers',
    'Wide product variety',
    'Easy exchange policy',
    'Pleasant shopping vibe'
  ],
  'Salon & Spa': [
    'Expert hair stylists',
    'Relaxing massage',
    'Top hygiene standards',
    'Soothing ambiance',
    'Premium beauty products',
    'Punctual appointments',
    'Skin rejuvenation',
    'Attentive personal care',
    'Great hair makeover',
    'Pampering experience'
  ],
  'Automotive & Garage': [
    'Honest estimates',
    'Skilled mechanics',
    'Timely vehicle delivery',
    'Genuine spare parts',
    'Fair & transparent billing',
    'Prompt oil service',
    'Clean workshop',
    'Accurate diagnostics',
    'Helpful service advisors'
  ],
  'Gym & Fitness Center': [
    'Modern equipment',
    'Certified personal trainers',
    'Clean locker rooms',
    'Motivating energy',
    'Spacious workout floor',
    'Personalized fitness plan',
    'Great workout playlist',
    'Hygienic weights area',
    'Positive community vibe'
  ],
  'Education & Coaching': [
    'Dedicated faculty',
    'Clear concept explanation',
    'Patient doubt clearing',
    'Well-planned study material',
    'Inspiring mentors',
    'Interactive classes',
    'Confidence building',
    'Regular test reviews',
    'Friendly learning environment'
  ],
  'General Business': [
    'Professional team',
    'Prompt response',
    'Transparent pricing',
    'Dependable service',
    'Friendly customer care',
    'Top quality workmanship',
    'Hassle-free experience',
    'Honest communication',
    'Fast turnaround time'
  ]
};

export default function ClientKeywords({ user, onTestReview, selectedClientId, onSelectClient }) {
  const isSuperAdmin = user?.role === 'superadmin';
  const [allClients, setAllClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState(selectedClientId || '');
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // If superadmin, load full clients list
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
        console.error('Failed to load clients list:', err);
      }
    };
    fetchAll();
  }, [isSuperAdmin]);

  // Keep activeClientId in sync if prop changes from outside
  useEffect(() => {
    if (selectedClientId && selectedClientId !== activeClientId) {
      setActiveClientId(selectedClientId);
    }
  }, [selectedClientId]);

  // Fetch client details including current keywords
  useEffect(() => {
    const fetchKeywords = async () => {
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
            setClientData(first);
            setActiveClientId(first.id);
            const kwStr = first.keywords || '';
            const initialList = kwStr ? kwStr.split(',').map(k => k.trim()).filter(Boolean) : [];
            setKeywords(initialList);
          }
          return;
        }

        const res = await fetch(`${config.API_BASE_URL}/api/clients/${targetId}`);
        const data = await res.json();
        if (data.client) {
          setClientData(data.client);
          const kwStr = data.client.keywords || '';
          const initialList = kwStr ? kwStr.split(',').map(k => k.trim()).filter(Boolean) : [];
          setKeywords(initialList);
        }
      } catch (err) {
        console.error('Failed to load client keywords:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKeywords();
  }, [user, activeClientId, isSuperAdmin]);

  const handleClientChange = (newId) => {
    setActiveClientId(newId);
    if (onSelectClient) onSelectClient(newId);
    setSaveSuccess('');
    setSaveError('');
  };

  const client = clientData;
  const clientName = client?.name || user?.name || 'Your Business';
  const rawCategory = client?.businessType || 'General Retail / Service';
  const categoryKey = resolveCategory(rawCategory, clientName);
  const categoryMeta = CATEGORY_DATA[categoryKey] || CATEGORY_DATA['General Business'];
  const suggestedKeywords = POPULAR_CATEGORY_KEYWORDS[categoryKey] || POPULAR_CATEGORY_KEYWORDS['General Business'];

  // Add a new custom keyword from input
  const handleAddKeyword = (e) => {
    if (e) e.preventDefault();
    const clean = newKeywordInput.trim().replace(/^[#,]+/, '');
    if (!clean) return;

    // Avoid duplicates case-insensitively
    const exists = keywords.some(k => k.toLowerCase() === clean.toLowerCase());
    if (exists) {
      setNewKeywordInput('');
      return;
    }

    setKeywords(prev => [...prev, clean]);
    setNewKeywordInput('');
    setSaveSuccess('');
  };

  // Add from suggested pills
  const handleAddSuggested = (tag) => {
    const exists = keywords.some(k => k.toLowerCase() === tag.toLowerCase());
    if (!exists) {
      setKeywords(prev => [...prev, tag]);
      setSaveSuccess('');
    }
  };

  // Remove a keyword
  const handleRemoveKeyword = (indexToRemove) => {
    setKeywords(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setSaveSuccess('');
  };

  // Save keywords to DB
  const handleSaveKeywords = async () => {
    if (!client?.id && !user?.clientId && !user?.qrId) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    const targetClientId = client?.id || user?.clientId || user?.qrId;
    const keywordsString = keywords.join(', ');

    try {
      const res = await fetch(`${config.API_BASE_URL}/api/clients/${targetClientId}/keywords`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywordsString })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update keywords');

      setSaveSuccess('Keywords successfully saved! Review options will now highlight these features.');
      setTimeout(() => setSaveSuccess(''), 4500);
    } catch (err) {
      setSaveError(err.message || 'Error updating keywords in database');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ClientProfileShimmer />;
  }

  return (
    <div className="client-keywords-container fade-in" style={{ maxWidth: '980px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Super Admin Client Switcher */}
      {isSuperAdmin && (
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
                Managing Keywords for: <span style={{ color: '#A5B4FC' }}>{client?.name || 'Select Client'}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Super Admin can inspect & customize Gemini AI review highlights for any onboarded business
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="superadmin-keyword-client-select" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
              Select Client:
            </label>
            <select
              id="superadmin-keyword-client-select"
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

      {/* 1. Header Banner Card */}
      <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '22px', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{
                background: 'rgba(109, 36, 186, 0.2)',
                color: '#A855F7',
                padding: '6px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={20} />
              </span>
              <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Business Keywords & Highlights
              </h2>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Specify your unique specialties, amenities, and customer favorites. When visitors scan your QR standee, Google Gemini AI will naturally weave these highlights into genuine customer review options alongside your <strong>{categoryMeta.categoryLabel}</strong> category.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onTestReview && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onTestReview(client?.qrId || user?.qrId)}
                title="Preview Customer Review Page"
                id="btn-keywords-test-review"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} />
                <span>Test Live Form</span>
              </button>
            )}
          </div>
        </div>

        {/* Business Category Badge Pill */}
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Category:</span>
          <span className="badge badge-purple" style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={13} />
            <span>{categoryMeta.categoryLabel}</span>
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            ({keywords.length} custom highlight{keywords.length === 1 ? '' : 's'} configured)
          </span>
        </div>
      </div>

      {/* 2. Active Keywords Card & Input Form */}
      <div className="glass-panel" style={{ padding: '24px 28px', marginBottom: '22px', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={16} style={{ color: '#8B5CF6' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Configured Keywords
            </h3>
          </div>
          {keywords.length > 0 && (
            <button
              type="button"
              className="btn-link"
              style={{ fontSize: '0.76rem', color: 'var(--danger, #EF4444)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => {
                if (window.confirm('Clear all configured keywords?')) {
                  setKeywords([]);
                  setSaveSuccess('');
                }
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Display Current Keyword Tags */}
        <div style={{
          minHeight: '80px',
          padding: '14px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1.5px dashed rgba(167, 139, 250, 0.25)',
          borderRadius: '14px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          {keywords.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={15} style={{ opacity: 0.6 }} />
              <span>No custom keywords added yet. Type your specialties below or click any of the popular suggestions.</span>
            </div>
          ) : (
            keywords.map((kw, idx) => (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, rgba(109, 36, 186, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)',
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  color: 'var(--text-primary)',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(109, 36, 186, 0.15)'
                }}
              >
                <span>{kw}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(idx)}
                  title={`Remove "${kw}"`}
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
                >
                  <X size={13} />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Input to Add Custom Keyword */}
        <form onSubmit={handleAddKeyword} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder={`Type a specialty (e.g. ${suggestedKeywords[0] || 'Fast service'}, ${suggestedKeywords[1] || 'Friendly staff'})...`}
              value={newKeywordInput}
              onChange={(e) => setNewKeywordInput(e.target.value)}
              id="input-new-keyword"
              style={{ paddingLeft: '14px', height: '42px', fontSize: '0.88rem' }}
            />
          </div>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={!newKeywordInput.trim()}
            style={{ height: '42px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            id="btn-add-keyword"
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </form>

        {/* Save & Status Actions */}
        <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            {saveSuccess && (
              <span style={{ color: '#10B981', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={15} />
                <span>{saveSuccess}</span>
              </span>
            )}
            {saveError && (
              <span style={{ color: '#EF4444', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <AlertCircle size={15} />
                <span>{saveError}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveKeywords}
            disabled={saving}
            id="btn-save-keywords"
            style={{ minWidth: '150px', height: '42px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {saving ? (
              <>
                <RefreshCw size={15} className="spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Keywords</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Popular Category Suggestions Card */}
      <div className="glass-panel" style={{ padding: '22px 28px', marginBottom: '22px', borderRadius: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Lightbulb size={16} style={{ color: '#F59E0B' }} />
          <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Popular Suggestions for {categoryMeta.categoryLabel}
          </h3>
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Click any suggestion to quickly add it to your business highlights:
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {suggestedKeywords.map((sug) => {
            const isAdded = keywords.some(k => k.toLowerCase() === sug.toLowerCase());
            return (
              <button
                key={sug}
                type="button"
                onClick={() => handleAddSuggested(sug)}
                disabled={isAdded}
                className="btn-suggestion-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  cursor: isAdded ? 'default' : 'pointer',
                  background: isAdded ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  border: isAdded ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.12)',
                  color: isAdded ? '#10B981' : 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  opacity: isAdded ? 0.75 : 1
                }}
              >
                {isAdded ? <Check size={12} /> : <Plus size={12} style={{ opacity: 0.6 }} />}
                <span>{sug}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Live Review Preview Card */}
      <div className="glass-panel" style={{ padding: '22px 28px', borderRadius: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={16} style={{ color: '#8B5CF6' }} />
          <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Live Preview: Customer Review Generation
          </h3>
        </div>
        <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Here is a sample of how customer review options appear to visitors when scanning your QR code:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(167, 139, 250, 0.2)',
            fontSize: '0.84rem',
            color: 'var(--text-primary)',
            lineHeight: 1.45
          }}>
            "{keywords[0]
              ? `Great experience at ${clientName}, especially loved the ${keywords[0]}! Wonderful service and courteous team.`
              : `Had a wonderful experience at ${clientName}! Courteous staff and top-grade service.`}"
          </div>
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(167, 139, 250, 0.2)',
            fontSize: '0.84rem',
            color: 'var(--text-primary)',
            lineHeight: 1.45
          }}>
            "{keywords[1]
              ? `Highly impressed by the ${keywords[1]} and warm hospitality at ${clientName}. Will definitely be returning!`
              : `Prompt service and fresh quality every single visit. Highly recommend ${clientName}!`}"
          </div>
          {keywords[2] && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(167, 139, 250, 0.2)',
              fontSize: '0.84rem',
              color: 'var(--text-primary)',
              lineHeight: 1.45
            }}>
              "Exceptional experience at {clientName}. Loved the {keywords[2]}, clean atmosphere, and polite support. Five stars!"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

