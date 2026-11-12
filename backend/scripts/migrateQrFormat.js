import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';
import { generateAndSaveQRCode } from '../services/qrService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QR_DIR = path.join(__dirname, '..', 'uploads', 'qr-codes');
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://qr.vasmigroup.com';

async function migrate() {
  console.log('--- Starting Migration of QR IDs from QR-XXXXXX to QRXXXXXX ---');

  // 1. Fetch all existing QRs
  const [qrs] = await pool.query('SELECT * FROM qrs');
  console.log(`Found ${qrs.length} total QR records in database.`);

  let updatedCount = 0;
  for (const qr of qrs) {
    if (!qr.qrId || !qr.qrId.startsWith('QR-')) continue;

    const oldQrId = qr.qrId;
    const newQrId = oldQrId.replace(/^QR-/, 'QR');
    const newFilename = `${newQrId}.png`;
    const newFilePath = `uploads/qr-codes/${newFilename}`;
    const newTargetUrl = `${FRONTEND_URL}/review/${newQrId}`;
    const newNote = qr.note ? qr.note.replace(/^QR-/, 'QR') : null;

    console.log(`Migrating ${oldQrId} -> ${newQrId}`);

    // Update qrs table
    await pool.execute(
      `UPDATE qrs 
       SET qrId = ?, filename = ?, filePath = ?, targetUrl = ?, note = ? 
       WHERE id = ?`,
      [newQrId, newFilename, newFilePath, newTargetUrl, newNote, qr.id]
    );

    // Update clients table
    await pool.execute(
      `UPDATE clients SET qrId = ? WHERE qrId = ?`,
      [newQrId, oldQrId]
    );

    // Update reviews table
    await pool.execute(
      `UPDATE reviews SET qrId = ? WHERE qrId = ?`,
      [newQrId, oldQrId]
    );

    // Update scans table
    await pool.execute(
      `UPDATE scans SET qrId = ? WHERE qrId = ?`,
      [newQrId, oldQrId]
    );

    // Generate fresh QR PNG image with new QR ID and URL
    try {
      await generateAndSaveQRCode(newQrId, FRONTEND_URL);
    } catch (qrErr) {
      console.warn(`Could not generate QR code image for ${newQrId}:`, qrErr.message);
    }

    updatedCount++;
  }

  console.log(`✔ Successfully migrated ${updatedCount} QR records to QR00000# format in DB and generated QR image files.`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

