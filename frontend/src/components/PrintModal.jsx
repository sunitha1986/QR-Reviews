import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, Sparkles, MapPin } from 'lucide-react';
import { getImageUrl } from '../config';
import vasmiIcon from '../assets/vasmi_icon.png';

export default function PrintModal({ qr, client, onClose }) {
  if (!qr) return null;

  const clientName = client?.name || qr?.assignedClient?.name || (qr?.status === 'unassigned' ? 'Dynamic Review Standee' : 'Valued Business Partner');
  const clientLocation = client?.businessLocation || client?.address || qr?.assignedClient?.businessLocation || qr?.assignedClient?.address || '';
  const clientAddress = client?.address || clientLocation || qr?.assignedClient?.address || '';
  const clientLogo = client?.logoUrl || qr?.assignedClient?.logoUrl || null;
  const qrUrl = qr?.filePath ? getImageUrl(qr.filePath) : getImageUrl(`/uploads/qr-codes/${qr.filename || `${qr.qrId}.png`}`);

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Official Review Standee</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Display this counter card at reception, checkout, or dining tables</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ borderRadius: '50%', padding: '6px' }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Standee Preview Card (Compact, White Background & Large QR) */}
        <div className="standee-card" id="printable-standee" style={{ background: '#FFFFFF', color: '#0F172A', padding: '18px 16px' }}>


          {clientLogo && (
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '10px',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              margin: '0 auto 6px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}>
              <img
                src={getImageUrl(clientLogo)}
                alt={clientName}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          )}

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0 0 2px 0', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            {clientName}
          </h2>

          {clientLocation ? (
            <p style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '300px', margin: '0 auto 6px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', lineHeight: 1.2 }}>
              <MapPin size={13} style={{ color: '#4F46E5', flexShrink: 0 }} />
              <span>{clientLocation}</span>
            </p>
          ) : null}

          <div className="standee-qr-frame">
            <img
              src={qrUrl}
              alt={`QR Code ${qr.qrId}`}
              style={{ width: '235px', height: '235px', display: 'block' }}
              onError={(e) => {
                // Fallback to uploads/qr-codes directly
                e.target.onerror = null;
                e.target.src = getImageUrl(`/uploads/qr-codes/${qr.qrId}.png`);
              }}
            />
          </div>

          <div style={{ margin: '4px 0 2px 0', fontSize: '1rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
            Scan with your Phone Camera
          </div>

          {/* Standee Footer: Developed By Vasmi Group with Logo */}
          <div style={{
            marginTop: '12px',
            paddingTop: '8px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <a
              href="https://vasmigroup.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="vasmi-dev-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              title="Developed by Vasmi Group - https://vasmigroup.com"
            >
              <span style={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 500 }}>
                Developed by
              </span>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.3px', display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ color: '#0F172A' }}>Vasmi</span>
                <span style={{ color: '#EA580C', marginLeft: '1px' }}>Group</span>
              </span>
              <span className="vasmi-logo-wrapper" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '2px' }}>
                <img
                  src={vasmiIcon}
                  alt="Vasmi Group"
                  className="vasmi-logo-img"
                  width="16"
                  height="14"
                />
              </span>
            </a>
          </div>

        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '18px' }}>
          <a
            href={qrUrl}
            download={`${qr.qrId}.png`}
            className="btn btn-secondary"
            id="btn-modal-download-png"
          >
            <Download size={16} />
            <span>Download PNG</span>
          </a>

          <button
            className="btn btn-primary"
            onClick={handlePrint}
            id="btn-modal-print-standee"
          >
            <Printer size={16} />
            <span>Print Standee</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
