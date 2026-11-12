import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Phone,
  Globe,
  Database,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Server,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Sliders,
  Sparkles
} from 'lucide-react';
import config from '../../config';
import { formatPhoneNumber, cleanPhoneNumber } from '../../utils/phone';
import CopyablePhone from '../../components/CopyablePhone';

export default function Settings({ user, theme, onToggleTheme }) {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  // Superadmin phone number state
  const [adminPhone, setAdminPhone] = useState(user?.phone || user?.username || '9999999999');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState({ type: '', text: '' });

  const handleAdminPhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAdminPhone(digits);
  };

  const handleAdminPhonePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const digits = cleanPhoneNumber(pasted).slice(0, 10);
    setAdminPhone(digits);
  };

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    const cleanNum = cleanPhoneNumber(adminPhone);
    if (!cleanNum || cleanNum.length !== 10) {
      setPhoneMessage({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    setPhoneLoading(true);
    setPhoneMessage({ type: '', text: '' });
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?.id || 'user-superadmin-1',
          phone: cleanNum
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update phone number');
      setPhoneMessage({ type: 'success', text: 'Registered phone number updated successfully!' });
      const saved = localStorage.getItem('qr_review_user');
      if (saved) {
        const u = JSON.parse(saved);
        u.phone = cleanNum;
        u.username = cleanNum;
        localStorage.setItem('qr_review_user', JSON.stringify(u));
      }
    } catch (err) {
      setPhoneMessage({ type: 'error', text: err.message });
    } finally {
      setPhoneLoading(false);
    }
  };

  // Database maintenance state
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [adminPasswordForClear, setAdminPasswordForClear] = useState('');
  const [clearingDb, setClearingDb] = useState(false);
  const [clearMessage, setClearMessage] = useState({ type: '', text: '' });

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassMessage({ type: '', text: '' });

    if (!currentPassword || !newPassword) {
      setPassMessage({ type: 'error', text: 'Please fill in both current and new password.' });
      return;
    }

    if (newPassword.length < 6) {
      setPassMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/clients/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user?.username || 'sadmin',
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPassMessage({ type: 'success', text: 'Password successfully updated! Please remember your new password.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassMessage({ type: 'error', text: err.message });
    } finally {
      setPassLoading(false);
    }
  };

  const handleClearAllClients = async (e) => {
    e.preventDefault();
    setClearMessage({ type: '', text: '' });

    if (adminPasswordForClear.trim() !== 'sadmin@123') {
      setClearMessage({ type: 'error', text: 'Incorrect superadmin authorization password.' });
      return;
    }

    setClearingDb(true);
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/clients/all?deleteQrs=true`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to clear clients');

      setClearMessage({ type: 'success', text: 'All clients and reviews successfully cleared. Database reset.' });
      setClearModalOpen(false);
      setAdminPasswordForClear('');
    } catch (err) {
      setClearMessage({ type: 'error', text: err.message });
    } finally {
      setClearingDb(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Portal & Security Settings</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Manage your credentials, platform defaults, and system database maintenance
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Card 1: Superadmin Security Credentials */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <KeyRound size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Security & Credentials</h4>
              <div style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                <span>Registered Number:</span>
                <CopyablePhone
                  phone={user?.phone || user?.username || '9999999999'}
                  displayText={formatPhoneNumber(user?.phone || user?.username || '9999999999')}
                  style={{ fontWeight: 700, color: 'var(--text-primary)' }}
                />
                <span>({user?.name || 'Super Admin'})</span>
              </div>
            </div>
          </div>

          {/* Registered Phone Form */}
          <form onSubmit={handleUpdatePhone} style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', margin: 0 }}>
                  Super Admin Registered Phone Number
                </label>
                <span style={{ fontSize: '0.72rem', color: adminPhone.length === 10 ? 'var(--success, #10B981)' : 'var(--text-muted)' }}>
                  {adminPhone.length}/10 digits
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Phone size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <span className="input-phone-prefix">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    className="form-input form-input-phone"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={adminPhone}
                    onChange={handleAdminPhoneChange}
                    onPaste={handleAdminPhonePaste}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-secondary btn-sm"
                  disabled={phoneLoading}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {phoneLoading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  <span>Save Number</span>
                </button>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Use this registered mobile number to log in to the portal as Super Admin.
              </span>
            </div>
            {phoneMessage.text && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: phoneMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${phoneMessage.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                color: phoneMessage.type === 'success' ? '#34D399' : '#F87171'
              }}>
                {phoneMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                <span>{phoneMessage.text}</span>
              </div>
            )}
          </form>

          {passMessage.text && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: passMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${passMessage.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              color: passMessage.type === 'success' ? '#34D399' : '#F87171'
            }}>
              {passMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{passMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                New Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                Confirm New Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={passLoading}
            >
              {passLoading ? <RefreshCw size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
              <span>Update Password</span>
            </button>
          </form>
        </div>

        {/* Card 2: Platform & Review Configurations */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Globe size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Platform Configuration</h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Production domain & review link settings
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Production Base Domain</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                https://qr.vasmigroup.com
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Customer Review Standee Link Format</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                https://qr.vasmigroup.com/:business-name
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Fallback format: <code>/review/:qrId</code>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Google Review Integration</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} />
                <span>Direct Google Place ID Write-Review URL Active</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Visual Theme</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current mode: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onToggleTheme}
              >
                <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Database & Maintenance */}
        <div className="glass-panel" style={{ padding: '24px', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Database size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Database & Maintenance</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Hostinger MySQL Cloud Database: <code>u597277762_qr_reviews</code>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => window.open(`${config.API_BASE_URL}/api/reviews/export-master`, '_blank')}
              >
                <Download size={14} />
                <span>Backup Master Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  color: '#EF4444'
                }}
                onClick={() => setClearModalOpen(true)}
              >
                <Trash2 size={14} />
                <span>Reset All Clients Data</span>
              </button>
            </div>
          </div>

          {clearMessage.text && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: clearMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${clearMessage.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              color: clearMessage.type === 'success' ? '#34D399' : '#F87171'
            }}>
              {clearMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{clearMessage.text}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '10px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Database Host</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                auth-db984.hstgr.io (Port 3306)
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Connection Pool</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#10B981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                <span>Active & Healthy</span>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Excel Backup Sync</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                Direct XLSX Export Available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Database */}
      {clearModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#EF4444', marginBottom: '14px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Confirm System Reset</h3>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              This will permanently delete all onboarded clients, customer reviews, and release assigned QR codes back to the pool.
              Please type your superadmin password to confirm.
            </p>

            <form onSubmit={handleClearAllClients}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                  Superadmin Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter sadmin@123"
                  value={adminPasswordForClear}
                  onChange={(e) => setAdminPasswordForClear(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setClearModalOpen(false);
                    setAdminPasswordForClear('');
                  }}
                  disabled={clearingDb}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm"
                  style={{ background: '#EF4444', color: '#FFFFFF', border: 'none' }}
                  disabled={clearingDb || !adminPasswordForClear}
                >
                  {clearingDb ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  <span>Confirm & Reset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

