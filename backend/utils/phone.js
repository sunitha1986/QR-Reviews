/**
 * Phone Number Utilities for Backend (+91 India country code)
 */

export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  const str = String(phone).trim();
  const digits = str.replace(/\D/g, '');

  if (digits.length === 13 && digits.startsWith('091')) {
    return digits.slice(3);
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  if (digits.length === 10) {
    return digits;
  }

  if (digits.length > 10) {
    return digits.slice(-10);
  }

  return digits;
}

export function isValidIndianMobile(phone) {
  if (!phone) return false;
  const cleaned = cleanPhoneNumber(phone);
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function formatPhoneNumber(phone, spaced = true) {
  if (!phone) return '';
  const cleaned = cleanPhoneNumber(phone);

  if (cleaned.length === 10) {
    if (spaced) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return `+91 ${cleaned}`;
  }

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

