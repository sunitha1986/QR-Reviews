import React, { useState, useEffect } from 'react';
import {
  Building2,
  Sparkles,
  MessageSquareText,
  MapPin,
  Phone,
  QrCode,
  CreditCard,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import ClientProfile from '../admin/ClientProfile';
import ClientKeywords from '../admin/ClientKeywords';
import CustomerData from '../admin/CustomerData';
import config, { getImageUrl } from '../../config';
import { formatPhoneNumber } from '../../utils/phone';
import { getClientReviewUrl } from '../../utils/slug';

export default function ClientManagement({
  user,
  selectedClientId,
  onSelectClient,
  onTestReview,
  initialTab = 'profile',
  onTabChange,
  onNavigate
}) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeClientId, setActiveClientId] = useState(selectedClientId || '');
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');

  // Fetch all onboarded clients for the dropdown
  useEffect(() => {
    let isMounted = true;
    const fetchClients = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${config.API_BASE_URL}/api/clients`);
        const data = await res.json();
        if (isMounted && data.clients && Array.isArray(data.clients)) {
          setClients(data.clients);
          if (!activeClientId && data.clients.length > 0) {
            const firstId = data.clients[0].id;
            setActiveClientId(firstId);
            if (onSelectClient) onSelectClient(firstId);
          }
        }
      } catch (err) {
        console.error('[ClientManagement] Failed to fetch clients list:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchClients();
    return () => { isMounted = false; };
  }, []);

  // Sync activeClientId with prop changes
  useEffect(() => {
    if (selectedClientId && selectedClientId !== activeClientId) {
      setActiveClientId(selectedClientId);
    }
  }, [selectedClientId]);

  // Sync activeTab with initialTab prop changes
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectCompany = (clientId) => {
    setActiveClientId(clientId);
    if (onSelectClient) {
      onSelectClient(clientId);
    }
  };

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    if (onTabChange) {
      onTabChange(tabKey);
    }
  };

  const selectedClient = clients.find(c => String(c.id) === String(activeClientId) || String(c.qrId) === String(activeClientId)) || clients[0] || null;

  const reviewUrl = selectedClient ? getClientReviewUrl(selectedClient, selectedClient.qrId) : '';

  return (
    <div className="client-management-page fade-in" style={{ paddingBottom: '32px' }}>
      {/* 1. TOP HEADER & COMPANY SELECTOR CARD */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        marginBottom: '20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.14) 0%, rgba(147, 51, 234, 0.1) 100%)',
        border: '1px solid rgba(167, 139, 250, 0.35)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Row 1: Label & Big Dropdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: selectedClient ? '16px' : 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6d24ba 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 4px 14px rgba(109, 36, 186, 0.4)',
              flexShrink: 0
            }}>
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Client Management
                </h2>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#C4B5FD',
                  fontWeight: 700,
                  border: '1px solid rgba(139, 92, 246, 0.35)'
                }}>
                  {clients.length} Clients
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Select a company below to manage its profile, AI keywords, and customer data in one unified dashboard.
              </p>
            </div>
          </div>

          {/* Company Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '320px', flex: '1 1 360px', justifyContent: 'flex-end' }}>
            <label
              htmlFor="client-management-company-select"
              style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', margin: 0 }}
            >
              Select Company:
            </label>
            <select
              id="client-management-company-select"
              value={activeClientId || (selectedClient?.id || '')}
              onChange={(e) => handleSelectCompany(e.target.value)}
              className="form-select"
              style={{
                height: '42px',
                minWidth: '280px',
                maxWidth: '440px',
                padding: '0 14px',
                fontSize: '0.88rem',
                fontWeight: 700,
                borderRadius: '10px',
                color: '#F8FAFC',
                background: 'var(--bg-card, #1E1B4B)',
                border: '1.5px solid rgba(167, 139, 250, 0.45)',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} style={{ background: '#1E1B4B', color: '#F8FAFC' }}>
                  {c.name} {c.businessLocation ? `— ${c.businessLocation}` : ''} ({c.qrId})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Selected Company Quick Info Bar */}
        {selectedClient && (
          <div style={{
            paddingTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Logo / Avatar */}
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {selectedClient.logoUrl ? (
                  <img
                    src={getImageUrl(selectedClient.logoUrl)}
                    alt={selectedClient.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <strong style={{ fontSize: '1rem', color: '#A5B4FC' }}>
                    {selectedClient.name.charAt(0).toUpperCase()}
                  </strong>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                    {selectedClient.name}
                  </strong>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#A5B4FC',
                    border: '1px solid rgba(99, 102, 241, 0.35)'
                  }}>
                    {selectedClient.qrId}
                  </span>
                  {selectedClient.businessType && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {selectedClient.businessType}
                    </span>
                  )}
                  {selectedClient.subscriptionPlan && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <CreditCard size={11} />
                      <span>{selectedClient.subscriptionPlan}</span>
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '4px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {selectedClient.businessLocation && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} style={{ color: '#C4B5FD' }} />
                      <span>{selectedClient.businessLocation}</span>
                    </span>
                  )}
                  {selectedClient.phone && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} style={{ color: '#10B981' }} />
                      <span>{formatPhoneNumber(selectedClient.phone)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Test Review Button */}
            {reviewUrl && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (onTestReview) {
                    onTestReview(selectedClient.qrId);
                  } else {
                    window.open(reviewUrl, '_blank');
                  }
                }}
                style={{
                  fontSize: '0.76rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  color: 'var(--accent)'
                }}
                title="Test review page for this client"
              >
                <span>Preview Review Portal</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. THREE TABS NAVIGATION (UNDER THE COMPANY SELECTOR) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '18px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Tab 1: Client Profile */}
        <button
          type="button"
          onClick={() => handleTabClick('profile')}
          id="tab-client-profile"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'profile' ? '1.5px solid #8B5CF6' : '1px solid var(--border-subtle)',
            background: activeTab === 'profile'
              ? 'linear-gradient(135deg, rgba(109, 36, 186, 0.3) 0%, rgba(139, 92, 246, 0.22) 100%)'
              : 'var(--bg-card, rgba(255, 255, 255, 0.03))',
            color: activeTab === 'profile' ? '#FFFFFF' : 'var(--text-muted)',
            fontWeight: activeTab === 'profile' ? 700 : 500,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'profile' ? '0 4px 12px rgba(109, 36, 186, 0.25)' : 'none'
          }}
        >
          <Building2 size={16} style={{ color: activeTab === 'profile' ? '#A78BFA' : 'inherit' }} />
          <span>Client Profile</span>
        </button>

        {/* Tab 2: Client Keywords */}
        <button
          type="button"
          onClick={() => handleTabClick('keywords')}
          id="tab-client-keywords"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'keywords' ? '1.5px solid #8B5CF6' : '1px solid var(--border-subtle)',
            background: activeTab === 'keywords'
              ? 'linear-gradient(135deg, rgba(109, 36, 186, 0.3) 0%, rgba(139, 92, 246, 0.22) 100%)'
              : 'var(--bg-card, rgba(255, 255, 255, 0.03))',
            color: activeTab === 'keywords' ? '#FFFFFF' : 'var(--text-muted)',
            fontWeight: activeTab === 'keywords' ? 700 : 500,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'keywords' ? '0 4px 12px rgba(109, 36, 186, 0.25)' : 'none'
          }}
        >
          <Sparkles size={16} style={{ color: activeTab === 'keywords' ? '#F59E0B' : 'inherit' }} />
          <span>Client Keywords</span>
        </button>

        {/* Tab 3: Customer Data */}
        <button
          type="button"
          onClick={() => handleTabClick('customer-data')}
          id="tab-customer-data"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'customer-data' ? '1.5px solid #8B5CF6' : '1px solid var(--border-subtle)',
            background: activeTab === 'customer-data'
              ? 'linear-gradient(135deg, rgba(109, 36, 186, 0.3) 0%, rgba(139, 92, 246, 0.22) 100%)'
              : 'var(--bg-card, rgba(255, 255, 255, 0.03))',
            color: activeTab === 'customer-data' ? '#FFFFFF' : 'var(--text-muted)',
            fontWeight: activeTab === 'customer-data' ? 700 : 500,
            fontSize: '0.86rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'customer-data' ? '0 4px 12px rgba(109, 36, 186, 0.25)' : 'none'
          }}
        >
          <MessageSquareText size={16} style={{ color: activeTab === 'customer-data' ? '#34D399' : 'inherit' }} />
          <span>Customer Data</span>
        </button>
      </div>

      {/* 3. ACTIVE TAB CONTENT (FILTERED BY SELECTED COMPANY) */}
      <div className="client-management-content">
        {activeTab === 'profile' && (
          <ClientProfile
            user={user}
            selectedClientId={activeClientId}
            onSelectClient={handleSelectCompany}
            onTestReview={onTestReview}
            onNavigate={onNavigate}
            hideClientSelector={true}
          />
        )}

        {activeTab === 'keywords' && (
          <ClientKeywords
            user={user}
            selectedClientId={activeClientId}
            onSelectClient={handleSelectCompany}
            onTestReview={onTestReview}
            hideClientSelector={true}
          />
        )}

        {activeTab === 'customer-data' && (
          <CustomerData
            user={user}
            selectedClientId={activeClientId}
            onSelectClient={handleSelectCompany}
            onTestReview={onTestReview}
            hideClientSelector={true}
          />
        )}
      </div>
    </div>
  );
}

