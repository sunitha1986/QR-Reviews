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
import { resolveCategory, CATEGORY_DATA, POPULAR_CATEGORY_KEYWORDS } from '../../data/aiSuggestions';
import { ClientProfileShimmer } from '../../components/Shimmer';

export default function ClientKeywords({ user, onTestReview, selectedClientId, onSelectClient, hideClientSelector = false }) {
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

      {/* 1. Header Card */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '18px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(109, 36, 186, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)',
                color: '#A855F7',
                padding: '7px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Keywords & Highlights
              </h2>
              <span className="badge badge-purple" style={{ fontSize: '0.74rem', padding: '3px 9px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={12} />
                <span>{categoryMeta.categoryLabel}</span>
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Customize your specialties and amenities. AI highlights these features when customers scan your QR standee.
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', fontSize: '0.82rem' }}
              >
                <ExternalLink size={14} />
                <span>Test Live Form</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Keywords Workspace Card */}
      <div className="glass-panel" style={{ padding: '22px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Active Keywords Section Header */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={15} style={{ color: 'var(--primary, #8B5CF6)' }} />
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Keywords
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: keywords.length > 0 ? 'rgba(139, 92, 246, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                color: keywords.length > 0 ? '#C084FC' : 'var(--text-muted)'
              }}>
                {keywords.length}
              </span>
            </div>

            {keywords.length > 0 && (
              <button
                type="button"
                style={{
                  fontSize: '0.75rem',
                  color: '#EF4444',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => {
                  if (window.confirm('Remove all configured keywords?')) {
                    setKeywords([]);
                    setSaveSuccess('');
                  }
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Active Keywords Chips Container */}
          <div style={{
            minHeight: '64px',
            padding: '12px 14px',
            background: 'rgba(0, 0, 0, 0.18)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center'
          }}>
            {keywords.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={14} style={{ opacity: 0.7 }} />
                <span>No keywords added yet. Type a specialty below or pick from recommended suggestions.</span>
              </div>
            ) : (
              keywords.map((kw, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, rgba(109, 36, 186, 0.25) 0%, rgba(139, 92, 246, 0.18) 100%)',
                    border: '1px solid rgba(167, 139, 250, 0.35)',
                    color: 'var(--text-primary)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600
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
        </div>

        {/* Quick Add Input Bar */}
        <form onSubmit={handleAddKeyword} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            className="form-control"
            placeholder={`Add a specialty or amenity (e.g. ${suggestedKeywords[0] || 'Fast service'}, ${suggestedKeywords[1] || 'Friendly staff'})...`}
            value={newKeywordInput}
            onChange={(e) => setNewKeywordInput(e.target.value)}
            id="input-new-keyword"
            style={{ height: '40px', fontSize: '0.86rem', flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={!newKeywordInput.trim()}
            style={{ height: '40px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
            id="btn-add-keyword"
          >
            <Plus size={15} />
            <span>Add</span>
          </button>
        </form>

        {/* Recommended Category Suggestions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Lightbulb size={14} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Suggested for {categoryMeta.categoryLabel}:
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {suggestedKeywords.map((sug) => {
              const isAdded = keywords.some(k => k.toLowerCase() === sug.toLowerCase());
              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleAddSuggested(sug)}
                  disabled={isAdded}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 500,
                    cursor: isAdded ? 'default' : 'pointer',
                    background: isAdded ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    border: isAdded ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isAdded ? '#10B981' : 'var(--text-primary)',
                    transition: 'all 0.15s ease',
                    opacity: isAdded ? 0.7 : 1
                  }}
                >
                  {isAdded ? <Check size={11} /> : <Plus size={11} style={{ opacity: 0.5 }} />}
                  <span>{sug}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions (Save button & Status Feedback) */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
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
            style={{ minWidth: '140px', height: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '0.86rem' }}
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
    </div>
  );
}

