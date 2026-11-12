/**
 * Universal Phone Number Utilities for QR-Reviews (+91 India country code)
 */

/**
 * Clean any phone input to extract the standard 10-digit number.
 * Strips '+91', '91' prefix (if 12-13 chars), spaces, dashes, parentheses.
 * 
 * @param {string|number} phone 
 * @returns {string} 10-digit phone string or original cleaned digits
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  const str = String(phone).trim();
  // Strip non-digits
  const digits = str.replace(/\D/g, '');

  // If starts with 91 and has 12 digits (e.g. 919876543210)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  // If already 10 digits
  if (digits.length === 10) {
    return digits;
  }

  // If more than 10 digits, take the last 10 digits
  if (digits.length > 10) {
    return digits.slice(-10);
  }

  return digits;
}

/**
 * Format any phone number into standard Indian display format: "+91 98765 43210"
 * 
 * @param {string|number} phone 
 * @param {boolean} spaced Whether to space the 10 digits as "XXXXX XXXXX" (default: true)
 * @returns {string} Formatted "+91 XXXXX XXXXX" or fallback
 */
export function formatPhoneNumber(phone, spaced = true) {
  if (!phone) return '';
  const cleaned = cleanPhoneNumber(phone);

  if (cleaned.length === 10) {
    if (spaced) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return `+91 ${cleaned}`;
  }

  // If raw string already has +91, clean whitespace
  const rawStr = String(phone).trim();
  if (rawStr.startsWith('+91')) {
    return rawStr;
  }

  return rawStr ? `+91 ${rawStr}` : '';
}

export default {
  cleanPhoneNumber,
  formatPhoneNumber
};

