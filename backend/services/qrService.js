import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generateSlug } from '../utils/slug.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const QR_DIR = path.join(UPLOADS_DIR, 'qr-codes');

// Ensure upload directory exists as requested: backend/uploads/qr-codes
if (!fs.existsSync(QR_DIR)) {
  fs.mkdirSync(QR_DIR, { recursive: true });
}

/**
 * Calculate the next sequential number for auto-generating QR codes.
 * Format is QR000001 (000001, 000002... sequential increasing without hyphen).
 * Checks existing records' `sequence` property or extracts sequential digits from `QR-?(\d+)` or `QR-[a-z0-9]+-(\d+)`.
 */
function getNextQrSequence(existingQrs = []) {
  let maxSeq = 0;
  for (const qr of existingQrs) {
    if (!qr) continue;
    if (typeof qr.sequence === 'number' && qr.sequence > maxSeq) {
      maxSeq = qr.sequence;
      continue;
    }
    if (qr.qrId) {
      // Matches QR<digits> or QR-<digits> e.g. QR000001 or legacy QR-000001
      const match = qr.qrId.match(/^QR-?(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
        continue;
      }
      // Matches legacy QR-<token>-<sequential numbers> e.g. QR-gryhf-0001
      const legacyMatch = qr.qrId.match(/^QR-[a-z0-9]+-(\d+)$/i);
      if (legacyMatch) {
        const num = parseInt(legacyMatch[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }
  return maxSeq + 1;
}

/**
 * Generate a unique dynamic QR ID with format: QR000001 (e.g. QR000001, QR000002)
 * - Prefix: QR (no hyphen)
 * - Suffix: 6-digit zero-padded sequential increasing number (000001, 000002, ...)
 */
function generateUniqueQrId(seqNumber = 1, existingQrs = []) {
  let curSeq = Math.max(1, parseInt(seqNumber, 10) || 1);
  let attempts = 0;
  let qrId = '';

  do {
    const seqPadded = String(curSeq).padStart(6, '0');
    qrId = `QR${seqPadded}`;
    curSeq++;
    attempts++;
  } while (
    existingQrs.some(q => q && q.qrId && q.qrId.toUpperCase() === qrId.toUpperCase()) &&
    attempts < 1000
  );

  return qrId;
}

/**
 * Generate QR Code file and save to backend/uploads/qr-codes/<qrId>.png
 */
async function generateAndSaveQRCode(qrId, frontendBaseUrl = process.env.FRONTEND_URL || 'https://qr.vasmigroup.com') {
  const baseUrl = (frontendBaseUrl || process.env.FRONTEND_URL || 'https://qr.vasmigroup.com').replace(/\/$/, '');
  const targetUrl = `${baseUrl}/review/${encodeURIComponent(qrId)}`;
  const filename = `${qrId}.png`;
  const filePath = path.join(QR_DIR, filename);

  const qrOptions = {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 2,
    scale: 10,
    color: {
      dark: '#0F172A', // Slate 900
      light: '#FFFFFF'
    }
  };

  await QRCode.toFile(filePath, targetUrl, qrOptions);

  return {
    qrId,
    filename,
    relativeFilePath: `uploads/qr-codes/${filename}`,
    fullFilePath: filePath,
    targetUrl
  };
}

/**
 * Generate QR code for a specific client business name/slug:
 * Format: https://qr.vasmigroup.com/mitraa-super-market (domain + business name)
 */
async function generateClientQrCode(qrId, businessNameOrSlug, frontendBaseUrl = process.env.FRONTEND_URL || 'https://qr.vasmigroup.com') {
  const slug = generateSlug(businessNameOrSlug) || qrId;
  const baseUrl = (frontendBaseUrl || process.env.FRONTEND_URL || 'https://qr.vasmigroup.com').replace(/\/+$/, '');
  const targetUrl = `${baseUrl}/${encodeURIComponent(slug)}`;
  const filename = `${qrId}.png`;
  const filePath = path.join(QR_DIR, filename);

  const qrOptions = {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 2,
    scale: 10,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF'
    }
  };

  await QRCode.toFile(filePath, targetUrl, qrOptions);

  return {
    qrId,
    slug,
    filename,
    relativeFilePath: `uploads/qr-codes/${filename}`,
    fullFilePath: filePath,
    targetUrl
  };
}

export {
  QR_DIR,
  getNextQrSequence,
  generateUniqueQrId,
  generateAndSaveQRCode,
  generateClientQrCode
};

export default {
  QR_DIR,
  getNextQrSequence,
  generateUniqueQrId,
  generateAndSaveQRCode,
  generateClientQrCode
};
