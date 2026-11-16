import React, { useState, useEffect } from 'react';
import {
  Tag,
  Sparkles,
  Check,
  ArrowRight,
  Flame,
  Gift,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  CreditCard,
  Building2,
  Phone,
  MessageSquare,
  BadgeCheck,
  Zap,
  HelpCircle,
  Truck,
  Loader2,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Star,
  Eye,
  ToggleLeft,
  ToggleRight,
  X,
  RefreshCw,
  Layers,
  Users,
  Globe
} from 'lucide-react';
import config from '../../config';

export default function Subscriptions({ user, onNavigate, onUpdatePlan }) {
  const isSuperAdmin = String(user?.role || '').toLowerCase().trim() === 'superadmin';

  // Plans State
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activePlan, setActivePlan] = useState(user?.subscriptionPlan || 'Starter Launch Trial (₹9)');
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Client view interactive state
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' | 'yearly'
  const [customOutlets, setCustomOutlets] = useState(3);
  const [customKeywords, setCustomKeywords] = useState(15);
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);

  // Super Admin Management Mode
  const [adminViewMode, setAdminViewMode] = useState('manager'); // 'manager' | 'preview'
  const [editingPlan, setEditingPlan] = useState(null); // null or plan object
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    tagline: '',
    price: 0,
    billingCycle: 'monthly',
    periodLabel: '',
    badge: '',
    description: '',
    hardwareIncluded: '',
    featuresText: '',
    isDefault: false,
    isActive: true,
    showOnLandingPage: true,
    displayOrder: 1
  });

  // Fetch plans from backend API
  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await fetch(`${config.API_BASE_URL}/api/subscription-plans`);
      const data = await res.json();
      if (data.plans && Array.isArray(data.plans)) {
        setPlans(data.plans);
      }
    } catch (err) {
      console.error('Failed to load subscription plans:', err);
      setFeedback({ type: 'error', message: 'Could not load subscription plans from server.' });
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (user?.subscriptionPlan && user.subscriptionPlan !== activePlan) {
      setActivePlan(user.subscriptionPlan);
    }
  }, [user?.subscriptionPlan]);

  // Dynamic pricing calculation for Multi-Outlet Customizer
  const calculateCustomPrice = () => {
    const basePerOutlet = billingCycle === 'yearly' ? 229 : 299;
    const pricePerKeyword = billingCycle === 'yearly' ? 10 : 15;
    return (customOutlets * basePerOutlet) + (customKeywords * pricePerKeyword);
  };

  // Open modal to create a new plan
  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    const currentlyFeaturedCount = plans.filter(p => p.showOnLandingPage).length;
    setPlanForm({
      name: '',
      tagline: '',
      price: 299,
      billingCycle: 'monthly',
      periodLabel: 'Billed monthly',
      badge: '',
      description: '',
      hardwareIncluded: '1 Premium Acrylic Standee',
      featuresText: '1 Dynamic QR Code\nUnlimited AI 5★ Reviews\nPrivate Firewall Rating Protection',
      isDefault: false,
      isActive: true,
      showOnLandingPage: currentlyFeaturedCount < 3,
      displayOrder: plans.length + 1
    });
    setShowPlanModal(true);
  };

  // Open modal to edit existing plan
  const handleOpenEditModal = (p) => {
    setEditingPlan(p);
    setPlanForm({
      name: p.name || '',
      tagline: p.tagline || '',
      price: p.price || 0,
      billingCycle: p.billingCycle || 'monthly',
      periodLabel: p.periodLabel || '',
      badge: p.badge || '',
      description: p.description || '',
      hardwareIncluded: p.hardwareIncluded || '',
      featuresText: Array.isArray(p.features) ? p.features.join('\n') : '',
      isDefault: Boolean(p.isDefault),
      isActive: Boolean(p.isActive),
      showOnLandingPage: Boolean(p.showOnLandingPage),
      displayOrder: p.displayOrder || 1
    });
    setShowPlanModal(true);
  };

  // Save or update plan (Super Admin)
  const handleSavePlanSubmit = async (e) => {
    e.preventDefault();
    if (!planForm.name || !planForm.name.trim()) {
      setFeedback({ type: 'error', message: 'Plan name is required.' });
      return;
    }

    if (planForm.showOnLandingPage) {
      const otherFeatured = plans.filter(p => p.showOnLandingPage && p.id !== editingPlan?.id).length;
      if (otherFeatured >= 3) {
        setFeedback({
          type: 'error',
          message: 'Maximum 3 plans can be featured on the landing page at a time. Please uncheck another plan first.'
        });
        return;
      }
    }

    setModalSaving(true);
    try {
      const featuresArray = planForm.featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

      const payload = {
        name: planForm.name.trim(),
        tagline: planForm.tagline.trim(),
        price: parseInt(planForm.price, 10) || 0,
        billingCycle: planForm.billingCycle,
        periodLabel: planForm.periodLabel.trim(),
        badge: planForm.badge.trim(),
        description: planForm.description.trim(),
        hardwareIncluded: planForm.hardwareIncluded.trim(),
        features: featuresArray,
        isDefault: Boolean(planForm.isDefault),
        isActive: Boolean(planForm.isActive),
        showOnLandingPage: Boolean(planForm.showOnLandingPage),
        displayOrder: parseInt(planForm.displayOrder, 10) || 1
      };

      const url = editingPlan
        ? `${config.API_BASE_URL}/api/subscription-plans/${editingPlan.id}`
        : `${config.API_BASE_URL}/api/subscription-plans`;

      const method = editingPlan ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save plan');

      setFeedback({
        type: 'success',
        message: editingPlan
          ? `Plan "${data.plan?.name || payload.name}" updated successfully!`
          : `New plan "${data.plan?.name || payload.name}" created successfully!`
      });

      setShowPlanModal(false);
      await fetchPlans();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error saving plan' });
    } finally {
      setModalSaving(false);
    }
  };

  // Quick action: Toggle landing page visibility (Max 3)
  const handleToggleLanding = async (p) => {
    if (!p.showOnLandingPage) {
      const currentFeatured = plans.filter(item => item.showOnLandingPage && item.id !== p.id).length;
      if (currentFeatured >= 3) {
        setFeedback({
          type: 'error',
          message: 'Maximum 3 plans can be featured on the landing page at a time. Please remove one first.'
        });
        return;
      }
    }
    try {
      setUpdating(true);
      setFeedback({ type: '', message: '' });
      const res = await fetch(`${config.API_BASE_URL}/api/subscription-plans/${p.id}/landing`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update landing page status');

      setFeedback({
        type: 'success',
        message: data.message || `Landing page visibility updated for "${p.name}".`
      });
      await fetchPlans();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update landing page status' });
    } finally {
      setUpdating(false);
    }
  };

  // Quick action: Set plan as default for onboarding
  const handleSetDefault = async (planId, planName) => {
    try {
      setUpdating(true);
      const res = await fetch(`${config.API_BASE_URL}/api/subscription-plans/${planId}/default`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set default plan');

      setFeedback({
        type: 'success',
        message: `"${planName}" is now the default pre-selected plan during business onboarding!`
      });
      await fetchPlans();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to set default plan' });
    } finally {
      setUpdating(false);
    }
  };

  // Quick action: Toggle active status
  const handleToggleActive = async (p) => {
    try {
      setUpdating(true);
      const res = await fetch(`${config.API_BASE_URL}/api/subscription-plans/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle status');

      setFeedback({
        type: 'success',
        message: `Plan "${p.name}" is now ${!p.isActive ? 'Active (available for onboarding)' : 'Inactive (hidden from onboarding)'}.`
      });
      await fetchPlans();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to toggle status' });
    } finally {
      setUpdating(false);
    }
  };

  // Delete plan
  const handleDeletePlan = async (p) => {
    if (p.clientCount > 0) {
      alert(`Cannot delete "${p.name}" because it is currently assigned to ${p.clientCount} active client(s). You can mark it Inactive instead.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete plan "${p.name}"?`)) {
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch(`${config.API_BASE_URL}/api/subscription-plans/${p.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete plan');

      setFeedback({ type: 'success', message: `Plan "${p.name}" deleted successfully.` });
      await fetchPlans();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete plan' });
    } finally {
      setUpdating(false);
    }
  };

  // Admin client actions
  const handleSelectPlan = (planDetails) => {
    setSelectedPlanModal(planDetails);
    setFeedback({ type: '', message: '' });
  };

  const handlePortalUpgrade = async (planTitle) => {
    const targetId = user?.clientId || user?.id || user?.qrId;
    if (!targetId) {
      setFeedback({ type: 'error', message: 'Unable to identify client account for plan update.' });
      return;
    }
    setUpdating(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/clients/${targetId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionPlan: planTitle })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription');
      const updatedPlan = data.subscriptionPlan || planTitle;
      setActivePlan(updatedPlan);
      if (onUpdatePlan) {
        onUpdatePlan(updatedPlan);
      }
      setFeedback({
        type: 'success',
        message: `Plan successfully updated to "${updatedPlan}"!`
      });
      setSelectedPlanModal(null);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update subscription' });
    } finally {
      setUpdating(false);
    }
  };

  const handleWhatsAppUpgrade = (planTitle) => {
    const bizName = user?.name || 'My Business';
    const bizPhone = user?.phone || '';
    const message = encodeURIComponent(
      `Hello Vasmi QR Reviews Team! I would like to activate/upgrade the "${planTitle}" for my business: ${bizName} (${bizPhone}). Please guide me through the activation.`
    );
    window.open(`https://wa.me/919999999999?text=${message}`, '_blank');
  };

  // Active onboarding default plan
  const defaultPlanObj = plans.find(p => p.isDefault) || plans[0];
  const activePlansCount = plans.filter(p => p.isActive).length;
  const totalSubscribers = plans.reduce((acc, curr) => acc + (curr.clientCount || 0), 0);

  return (
    <div className="fade-in subscriptions-page-container" style={{ paddingBottom: '50px' }}>
      
      {/* 1. TOP HEADER & DASHBOARD BANNER */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        marginBottom: '26px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(109, 36, 186, 0.14) 0%, rgba(30, 27, 75, 0.45) 100%)',
        border: '1px solid var(--theme-card-border, rgba(167, 139, 250, 0.28))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D24BA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 16px rgba(109, 36, 186, 0.4)',
              flexShrink: 0
            }}>
              <CreditCard size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {isSuperAdmin ? 'Subscription Plans Manager & Customizer' : 'Active Subscription Status'}
                </h2>
                <span className="badge badge-success" style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <BadgeCheck size={12} />
                  <span>{isSuperAdmin ? 'Onboarding Sync Active' : 'Active & Enrolled'}</span>
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {isSuperAdmin
                  ? 'Customize the subscription plans, pricing tiers, and default options populated dynamically during business onboarding.'
                  : `Enrolled for ${user?.name || 'your business'} • Includes dynamic QR management and Google Reviews generation.`}
              </p>
            </div>
          </div>

          {/* Superadmin Top Actions */}
          {isSuperAdmin ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '3px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <button
                  type="button"
                  className={`btn btn-sm ${adminViewMode === 'manager' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: '8px' }}
                  onClick={() => setAdminViewMode('manager')}
                >
                  <Layers size={13} />
                  <span>Manage Plans</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${adminViewMode === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: '8px' }}
                  onClick={() => setAdminViewMode('preview')}
                >
                  <Eye size={13} />
                  <span>Public View</span>
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenCreateModal}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '7px 14px' }}
                id="btn-superadmin-add-plan"
              >
                <Plus size={15} />
                <span>Add New Plan</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleSelectPlan({
                  title: 'Business Pro Yearly (₹259/mo)',
                  canonicalTitle: 'Business Pro Yearly (₹259/mo)',
                  price: '₹259/month',
                  period: 'Billed annually at ₹3,108/yr',
                  description: 'Turnkey plan featuring doorstep delivery of your custom Acrylic QR Standee and unlimited AI reviews.'
                })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Zap size={14} />
                <span>Instant Upgrade</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Feedback Alert */}
        {feedback.message && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: feedback.type === 'success' ? '#10B981' : '#EF4444',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {feedback.type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback({ type: '', message: '' })}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Superadmin Summary KPI Bar */}
        {isSuperAdmin && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '14px',
            marginTop: '20px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Plans</div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>{plans.length} Configured</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active in Onboarding</div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#10B981' }}>{activePlansCount} Active Options</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Default Onboarding Opt-In</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F59E0B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                  {defaultPlanObj?.name || 'None'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Landing Page Sync</div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#06B6D4' }}>{plans.filter(p => p.showOnLandingPage).length}/3 Featured</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Enrolled Clients</div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalSubscribers} Businesses</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. SUPER ADMIN: PLANS MANAGER VIEW */}
      {isSuperAdmin && adminViewMode === 'manager' && (
        <div className="superadmin-plans-manager-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Configured Subscription Plans ({plans.length})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Edit plan details, seed keywords, hardware offerings, and default opt-in status. Changes automatically reflect in the onboarding dropdown.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchPlans}
              disabled={loadingPlans}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <RefreshCw size={13} className={loadingPlans ? 'animate-spin' : ''} />
              <span>Refresh Plans</span>
            </button>
          </div>

          {loadingPlans && plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--primary)' }} />
              <div>Loading customizable subscription plans...</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    borderRadius: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    border: p.isDefault
                      ? '1.5px solid rgba(245, 158, 11, 0.6)'
                      : p.isActive
                        ? '1px solid var(--theme-card-border, rgba(167, 139, 250, 0.3))'
                        : '1px dashed rgba(255, 255, 255, 0.15)',
                    opacity: p.isActive ? 1 : 0.65,
                    background: p.isDefault
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(30, 27, 75, 0.4) 100%)'
                      : 'var(--bg-card, rgba(30, 27, 75, 0.3))'
                  }}
                >
                  {/* Top Badges */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {p.isDefault && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#F59E0B',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Star size={10} fill="#F59E0B" />
                            <span>DEFAULT OPT-IN</span>
                          </span>
                        )}
                        {p.showOnLandingPage && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: 'rgba(6, 182, 212, 0.18)',
                            color: '#06B6D4',
                            border: '1px solid rgba(6, 182, 212, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Globe size={10} />
                            <span>LANDING PAGE</span>
                          </span>
                        )}
                        {p.badge && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: 'rgba(124, 58, 237, 0.18)',
                            color: 'var(--primary)',
                            border: '1px solid rgba(124, 58, 237, 0.35)'
                          }}>
                            {p.badge}
                          </span>
                        )}
                      </div>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: p.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                        color: p.isActive ? '#10B981' : 'var(--text-muted)',
                        border: `1px solid ${p.isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.12)'}`
                      }}>
                        {p.isActive ? 'Active Option' : 'Inactive'}
                      </span>
                    </div>

                    {/* Plan Title & Price */}
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {p.name}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        ₹{p.price.toLocaleString()}
                      </span>
                      {p.periodLabel && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          • {p.periodLabel}
                        </span>
                      )}
                    </div>

                    {p.tagline && (
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {p.tagline}
                      </p>
                    )}

                    {/* Hardware included info */}
                    {p.hardwareIncluded && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.76rem',
                        color: 'var(--accent)',
                        marginBottom: '14px'
                      }}>
                        <Gift size={13} style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 600 }}>{p.hardwareIncluded}</span>
                      </div>
                    )}

                    {/* Features list */}
                    {Array.isArray(p.features) && p.features.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
                        {p.features.map((feat, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <Check size={14} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Footer: Stats & Actions */}
                  <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      <span>Enrolled Businesses:</span>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{p.clientCount} clients</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEditModal(p)}
                        style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.76rem' }}
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>

                      {!p.isDefault && p.isActive && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSetDefault(p.id, p.name)}
                          disabled={updating}
                          title="Set as the default option during new client onboarding"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#F59E0B' }}
                        >
                          <Star size={12} />
                          <span>Set Default</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggleLanding(p)}
                        disabled={updating}
                        title={p.showOnLandingPage ? 'Remove from Landing Page' : 'Show on Landing Page (Max 3)'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.74rem',
                          color: p.showOnLandingPage ? '#06B6D4' : 'var(--text-muted)',
                          borderColor: p.showOnLandingPage ? 'rgba(6, 182, 212, 0.4)' : undefined,
                          background: p.showOnLandingPage ? 'rgba(6, 182, 212, 0.08)' : undefined
                        }}
                      >
                        <Globe size={13} />
                        <span>{p.showOnLandingPage ? 'Landing: ON' : 'Landing: OFF'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggleActive(p)}
                        disabled={updating}
                        title={p.isActive ? 'Hide from onboarding options' : 'Make available in onboarding'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem' }}
                      >
                        {p.isActive ? <ToggleRight size={14} style={{ color: '#10B981' }} /> : <ToggleLeft size={14} />}
                        <span>{p.isActive ? 'Active' : 'Enable'}</span>
                      </button>

                      {p.clientCount === 0 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDeletePlan(p)}
                          disabled={updating}
                          title="Delete unused plan"
                          style={{ color: '#EF4444', padding: '0 8px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. CLIENT VIEW (OR SUPER ADMIN PREVIEW VIEW) */}
      {(!isSuperAdmin || adminViewMode === 'preview') && (
        <div className="subscriptions-plans-wrapper">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 30px auto' }}>
            <div className="section-eyebrow" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              borderRadius: '999px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#F59E0B',
              fontSize: '0.76rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '12px'
            }}>
              <Tag size={13} style={{ color: '#F59E0B' }} />
              <span>Transparent & High-ROI Plans</span>
            </div>

            <h2 style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 10px 0',
              lineHeight: 1.25
            }}>
              Simple INR Pricing For The Best Google Review Platform
            </h2>

            <p style={{
              fontSize: '0.92rem',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              margin: '0 auto'
            }}>
              Select the ideal package for your business. All plans feature dynamic Google review redirection, AI review generation, and private negative review prevention.
            </p>

            {/* Monthly / Yearly Billing Toggle */}
            <div className="pricing-billing-toggle-wrap" style={{ marginTop: '22px' }}>
              <div className="pricing-billing-toggle" role="radiogroup" aria-label="Billing Cycle">
                <button
                  type="button"
                  className={`billing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`billing-toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('yearly')}
                >
                  <span>Yearly</span>
                  <span className="billing-save-pill">Save 35% + Free Standee</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3 Pricing Cards Grid */}
          <div className="pricing-cards-grid">
            
            {/* CARD 1: STARTER TRIAL (INITIAL ₹9) */}
            <div className="pricing-card glass-panel starter-card">
              <div className="pricing-card-badge starter-badge">
                <Sparkles size={12} />
                <span>{String(activePlan || '').toLowerCase().includes('starter') ? 'ACTIVE CURRENT PLAN' : 'SPECIAL LAUNCH OFFER'}</span>
              </div>

              <div className="pricing-card-header">
                <div className="pricing-plan-category">STARTER</div>
                <h3 className="pricing-plan-name">Launch Trial</h3>
                <p className="pricing-plan-tagline">
                  Experience the full power of AI Google Reviews with zero commitment.
                </p>
              </div>

              <div className="pricing-price-box">
                <div className="pricing-currency-row">
                  <span className="pricing-currency">₹</span>
                  <span className="pricing-amount">9</span>
                </div>
                <div className="pricing-period">introductory 7-day trial access</div>
                <div className="pricing-note">Instant QR activation • No card required</div>
              </div>

              <div className="pricing-divider" />

              <div className="pricing-features-list">
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span><strong>1 Dynamic QR Code</strong> generated instantly</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span><strong>AI Review Generation</strong> (English & Tenglish)</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span><strong>Direct Google Maps</strong> Place ID link</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span><strong>Auto-Copy Review</strong> to customer clipboard</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span>7-Day full access to Client Admin Portal</span>
                </div>
                <div className="pricing-feature-item muted">
                  <span className="feature-cross-icon">✕</span>
                  <span>Physical acrylic standee hardware (included in Pro)</span>
                </div>
              </div>

              {String(activePlan || '').toLowerCase().includes('starter') ? (
                <button
                  type="button"
                  className="btn btn-secondary pricing-cta-btn"
                  disabled
                  style={{ opacity: 0.9, cursor: 'default', border: '1.5px solid rgba(16, 185, 129, 0.5)', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={16} />
                  <span>Current Active Plan</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelectPlan({
                    title: 'Starter Launch Trial (₹9)',
                    canonicalTitle: 'Starter Launch Trial (₹9)',
                    price: '₹9',
                    period: '7-day trial',
                    description: 'Ideal for testing AI review generation and instant Google Place ID redirection.'
                  })}
                  className="btn btn-secondary pricing-cta-btn"
                  id="btn-sub-starter"
                >
                  <span>Choose ₹9 Launch Trial</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>

            {/* CARD 2: BUSINESS PRO (MOST POPULAR) */}
            <div className="pricing-card glass-panel pro-card featured-card">
              <div className="pricing-card-badge pro-badge">
                <Flame size={13} fill="#FFF" />
                <span>{String(activePlan || '').toLowerCase().includes('business pro') ? 'ACTIVE CURRENT PLAN' : 'MOST POPULAR • ALL-IN-ONE'}</span>
              </div>

              <div className="pricing-card-header">
                <div className="pricing-plan-category" style={{ color: '#A855F7' }}>GROWTH & LOCAL SEO</div>
                <h3 className="pricing-plan-name">Business Pro</h3>
                <p className="pricing-plan-tagline">
                  Complete turnkey setup with physical acrylic standee hardware and unlimited reviews.
                </p>
              </div>

              <div className="pricing-price-box">
                <div className="pricing-currency-row">
                  <span className="pricing-currency">₹</span>
                  <span className="pricing-amount">{billingCycle === 'yearly' ? '259' : '399'}</span>
                  <span className="pricing-unit">/month</span>
                </div>
                <div className="pricing-period">
                  {billingCycle === 'yearly' ? 'Billed annually at ₹3,108/yr (Save ₹1,680)' : 'Billed monthly • Cancel anytime'}
                </div>
                <div className="pricing-banner-perk">
                  <Gift size={13} />
                  <span>Includes Premium Acrylic QR Standee (Worth ₹599)</span>
                </div>
              </div>

              <div className="pricing-divider" />

              <div className="pricing-features-list">
                <div className="pricing-feature-item highlight">
                  <CheckCircle2 size={16} className="feature-check-icon gold" />
                  <span><strong>1 Premium Acrylic QR Standee</strong> delivered to door</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span><strong>Unlimited AI 5-Star Reviews</strong> generated</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span><strong>Custom Keyword Seeding</strong> (up to 10 specialties)</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span><strong>Customer Mobile Capture</strong> for WhatsApp offers</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span><strong>Private Feedback Firewall</strong> protects 5★ rating</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span><strong>1-Click Excel Reports Export</strong> (.xlsx)</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span>Priority WhatsApp support & onboarding</span>
                </div>
              </div>

              {String(activePlan || '').toLowerCase().includes('business pro') ? (
                <button
                  type="button"
                  className="btn btn-primary pricing-cta-btn"
                  disabled
                  style={{ opacity: 0.95, cursor: 'default', border: '1.5px solid rgba(16, 185, 129, 0.6)', background: 'rgba(16, 185, 129, 0.22)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={16} />
                  <span>Current Active Plan</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelectPlan({
                    title: billingCycle === 'yearly' ? 'Business Pro Yearly (₹259/mo)' : 'Business Pro Monthly (₹399/mo)',
                    canonicalTitle: billingCycle === 'yearly' ? 'Business Pro Yearly (₹259/mo)' : 'Business Pro Monthly (₹399/mo)',
                    price: billingCycle === 'yearly' ? '₹259/month' : '₹399/month',
                    period: billingCycle === 'yearly' ? 'Billed annually at ₹3,108/yr' : 'Billed monthly',
                    description: 'Turnkey plan featuring doorstep delivery of your custom Acrylic QR Standee and unlimited AI reviews.'
                  })}
                  className="btn btn-primary pricing-cta-btn glowing-cta"
                  id="btn-sub-pro"
                >
                  <span>Get Business Pro</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>

            {/* CARD 3: MULTI-OUTLET CUSTOMIZER (MOST FLEXIBLE) */}
            <div className="pricing-card glass-panel custom-card">
              <div className="pricing-card-badge custom-badge">
                <Sliders size={12} />
                <span>{String(activePlan || '').toLowerCase().includes('multi-outlet') ? 'ACTIVE CURRENT PLAN' : 'MOST FLEXIBLE • SLIDER'}</span>
              </div>

              <div className="pricing-card-header">
                <div className="pricing-plan-category" style={{ color: '#06B6D4' }}>FRANCHISES & MULTI-BRANCH</div>
                <h3 className="pricing-plan-name">Multi-Outlet</h3>
                <p className="pricing-plan-tagline">
                  Scale your local presence across multiple billing counters or store branches.
                </p>
              </div>

              <div className="pricing-price-box">
                <div className="pricing-currency-row">
                  <span className="pricing-currency">₹</span>
                  <span className="pricing-amount">{calculateCustomPrice().toLocaleString()}</span>
                  <span className="pricing-unit">/month</span>
                </div>
                <div className="pricing-period">
                  For {customOutlets} Outlets & {customKeywords} Target Keywords
                </div>
              </div>

              {/* Sliders Container */}
              <div className="pricing-sliders-box">
                {/* Outlets Slider */}
                <div className="pricing-slider-item">
                  <div className="slider-label-row">
                    <span className="slider-title">Outlets / Locations:</span>
                    <strong className="slider-val-badge">{customOutlets} Outlets</strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    value={customOutlets}
                    onChange={(e) => setCustomOutlets(Number(e.target.value))}
                    className="pricing-range-slider"
                  />
                  <div className="slider-sub-info">
                    Includes {customOutlets} physical acrylic standees
                  </div>
                </div>

                {/* Keywords Slider */}
                <div className="pricing-slider-item">
                  <div className="slider-label-row">
                    <span className="slider-title">Target SEO Keywords:</span>
                    <strong className="slider-val-badge">{customKeywords} Keywords</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={customKeywords}
                    onChange={(e) => setCustomKeywords(Number(e.target.value))}
                    className="pricing-range-slider"
                  />
                  <div className="slider-sub-info">
                    Boosts ranking for {customKeywords} specialties
                  </div>
                </div>
              </div>

              <div className="pricing-divider" />

              <div className="pricing-features-list">
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span><strong>{customOutlets} Acrylic Standees</strong> (1 per counter/outlet)</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span><strong>Centralized Master Dashboard</strong> for all branches</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span>Consolidated & branch-wise analytics reports</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span>Custom branded standee print with your logo</span>
                </div>
                <div className="pricing-feature-item">
                  <Check size={16} className="feature-check-icon" />
                  <span>Dedicated Vasmi Group account manager</span>
                </div>
              </div>

              {String(activePlan || '').toLowerCase().includes('multi-outlet') ? (
                <button
                  type="button"
                  className="btn btn-secondary pricing-cta-btn"
                  disabled
                  style={{ opacity: 0.9, cursor: 'default', border: '1.5px solid rgba(16, 185, 129, 0.5)', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={16} />
                  <span>Current Active Plan</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelectPlan({
                    title: `Multi-Outlet Customizer (${customOutlets} Outlets, ${customKeywords} Keywords)`,
                    canonicalTitle: 'Multi-Outlet Customizer',
                    price: `₹${calculateCustomPrice().toLocaleString()}/month`,
                    period: `${customOutlets} locations • ${customKeywords} keywords`,
                    description: `Customized multi-location package including ${customOutlets} custom acrylic standees and centralized branch analytics.`
                  })}
                  className="btn btn-secondary pricing-cta-btn"
                  id="btn-sub-custom"
                >
                  <span>Customize & Upgrade Plan</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>

          {/* 3. PRICING TRUST & GUARANTEE BAR */}
          <div className="pricing-trust-bar glass-panel" style={{ marginTop: '36px' }}>
            <div className="pricing-trust-item">
              <ShieldCheck size={20} style={{ color: '#10B981' }} />
              <div>
                <strong>Zero Financial Risk</strong>
                <span>Try the ₹9 starter plan with full platform features</span>
              </div>
            </div>

            <div className="pricing-trust-divider" />

            <div className="pricing-trust-item">
              <Zap size={20} style={{ color: '#F59E0B' }} />
              <div>
                <strong>Instant QR Activation</strong>
                <span>Your dynamic QR code goes live the moment you onboard</span>
              </div>
            </div>

            <div className="pricing-trust-divider" />

            <div className="pricing-trust-item">
              <Gift size={20} style={{ color: '#A855F7' }} />
              <div>
                <strong>Physical Standee Warranty</strong>
                <span>Scratch-resistant cast acrylic standee with lifetime QR warranty</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN PLAN CREATE / EDIT MODAL */}
      {showPlanModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div className="modal-content glass-panel" style={{
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            borderRadius: '20px',
            background: 'var(--bg-card, #1E1B4B)',
            border: '1.5px solid var(--theme-card-border, rgba(167, 139, 250, 0.4))'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D24BA 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                    {editingPlan ? `Edit "${editingPlan.name}"` : 'Create New Subscription Plan'}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Configured plans automatically appear in client onboarding & admin portals
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Plan Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Plan Name * (e.g. Starter Launch Trial (₹9))
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Business Pro Yearly (₹259/mo)"
                  required
                />
              </div>

              {/* Price & Billing Cycle Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Billing Cycle *
                  </label>
                  <select
                    className="form-select"
                    value={planForm.billingCycle}
                    onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}
                  >
                    <option value="trial">Trial (7 Days)</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly (Annual)</option>
                    <option value="custom">Custom / Multi-branch</option>
                  </select>
                </div>
              </div>

              {/* Period Label & Badge Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Period Label (e.g. Billed annually at ₹3,108/yr)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={planForm.periodLabel}
                    onChange={(e) => setPlanForm({ ...planForm, periodLabel: e.target.value })}
                    placeholder="e.g. 7-day trial or Billed monthly"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Card Badge (e.g. MOST POPULAR)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={planForm.badge}
                    onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                    placeholder="e.g. BEST VALUE • ALL-IN-ONE"
                  />
                </div>
              </div>

              {/* Tagline / Subtitle */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Tagline / Pitch
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={planForm.tagline}
                  onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })}
                  placeholder="e.g. Complete turnkey setup with physical acrylic standee"
                />
              </div>

              {/* Hardware Included */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Hardware Hardware Included
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={planForm.hardwareIncluded}
                  onChange={(e) => setPlanForm({ ...planForm, hardwareIncluded: e.target.value })}
                  placeholder="e.g. 1 Premium Acrylic Standee Delivered"
                />
              </div>

              {/* Features List (1 per line) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 0 }}>
                    Key Features (Enter 1 feature per line)
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bullets displayed on card</span>
                </div>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={planForm.featuresText}
                  onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                  placeholder="1 Dynamic QR Code&#10;Unlimited AI 5★ Reviews&#10;Private Feedback Firewall&#10;Doorstep delivery of Standee"
                />
              </div>

              {/* Checkboxes: isDefault & isActive */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={planForm.isDefault}
                    onChange={(e) => setPlanForm({ ...planForm, isDefault: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span>Set as Default Opt-In Plan during new client onboarding</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={planForm.isActive}
                    onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span>Active (Visible in client onboarding dropdown & subscriptions view)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={planForm.showOnLandingPage}
                    onChange={(e) => setPlanForm({ ...planForm, showOnLandingPage: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#06B6D4' }}
                  />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={14} style={{ color: '#06B6D4' }} />
                    <span>Show on Public Landing Page (Max 3 plans)</span>
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={modalSaving}
                  onClick={() => setShowPlanModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={modalSaving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {modalSaving ? <Loader2 size={15} className="spin" /> : <Check size={15} />}
                  <span>{modalSaving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAN ENROLLMENT / UPGRADE MODAL (CLIENT-FACING) */}
      {selectedPlanModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="modal-content glass-panel" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            borderRadius: '20px',
            background: 'var(--bg-card, #1E1B4B)',
            border: '1.5px solid var(--theme-card-border, rgba(167, 139, 250, 0.4))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--theme-btn-gradient, linear-gradient(135deg, #7C3AED 0%, #6D24BA 100%))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  {selectedPlanModal.title}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>
                  {selectedPlanModal.price} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({selectedPlanModal.period})</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              {selectedPlanModal.description}
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '22px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)'
            }}>
              <div><strong>Business:</strong> {user?.name || 'My Business'}</div>
              {user?.phone && <div><strong>Registered Phone:</strong> {user.phone}</div>}
              <div><strong>Activation:</strong> Instant activation with WhatsApp delivery support.</div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={updating}
                onClick={() => setSelectedPlanModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={updating}
                onClick={() => {
                  handleWhatsAppUpgrade(selectedPlanModal.title);
                  setSelectedPlanModal(null);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <MessageSquare size={15} />
                <span>WhatsApp Concierge</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={updating}
                onClick={() => handlePortalUpgrade(selectedPlanModal.canonicalTitle || selectedPlanModal.title)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {updating ? <Loader2 size={15} className="spin" /> : <Zap size={15} />}
                <span>{updating ? 'Activating...' : 'Upgrade Now in Portal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
