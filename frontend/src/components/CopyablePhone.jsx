import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Reusable component to render a phone number with an inline copy button.
 * Cleans the phone number (strips spaces, dashes, formatting) when copying to clipboard,
 * and shows visual feedback (Checkmark icon and Copied state) for 2 seconds.
 */
export const cleanPhoneNumber = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  // Strip non-digits except a leading +
  if (str.startsWith('+')) {
    return '+' + str.slice(1).replace(/\D/g, '');
  }
  return str.replace(/\D/g, '');
};

export const formatDisplayPhone = (val) => {
  if (!val) return '—';
  const clean = cleanPhoneNumber(val);
  // If 10 digits, format nicely as XXXXX XXXXX or +91 XXXXX XXXXX
  if (clean.length === 10) {
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  return val;
};

export default function CopyablePhone({
  phone,
  displayText,
  className = '',
  style = {},
  btnStyle = {},
  copyValue,
  showText = true,
  fallback = '—'
}) {
  const [copied, setCopied] = useState(false);

  if (!phone && !copyValue && !displayText) {
    return <span style={{ color: 'var(--text-muted, #94a3b8)', ...style }}>{fallback}</span>;
  }

  const valueToCopy = copyValue || cleanPhoneNumber(phone || displayText);
  const textToShow = displayText || (phone ? formatDisplayPhone(phone) : valueToCopy);

  const handleCopy = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!valueToCopy) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(valueToCopy);
      } else {
        // Fallback for non-https or older environments
        const textArea = document.createElement('textarea');
        textArea.value = valueToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy phone number:', err);
    }
  };

  return (
    <span
      className={`copyable-phone-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        verticalAlign: 'middle',
        ...style
      }}
    >
      {showText && <span>{textToShow}</span>}
      <button
        type="button"
        className={`btn-copy-phone ${copied ? 'copied' : ''}`}
        onClick={handleCopy}
        title={copied ? 'Phone copied!' : `Copy phone (${valueToCopy})`}
        aria-label={copied ? 'Phone copied' : `Copy phone number ${valueToCopy}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3px 4px',
          borderRadius: '4px',
          border: '1px solid transparent',
          background: copied ? 'rgba(34, 197, 94, 0.12)' : 'rgba(148, 163, 184, 0.12)',
          color: copied ? '#16a34a' : 'inherit',
          cursor: 'pointer',
          lineHeight: 1,
          transition: 'all 0.18s ease',
          fontSize: '11px',
          ...btnStyle
        }}
      >
        {copied ? (
          <Check size={12} strokeWidth={2.5} style={{ color: '#16a34a' }} />
        ) : (
          <Copy size={11} strokeWidth={2} style={{ opacity: 0.7 }} />
        )}
      </button>
    </span>
  );
}

