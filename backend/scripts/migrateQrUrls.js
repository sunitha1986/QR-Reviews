import path from 'path';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import { pool } from '../config/db.js';
import { QR_DIR } from '../config/constants.js';
import { generateSlug } from '../utils/slug.js';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function migrateQrUrls() {
  const targetBaseUrl = (process.env.FRONTEND_URL || 'https://qr.vasmigroup.com').replace(/\/+$/, '');
  console.log(`Migrating QR codes to target base URL: ${targetBaseUrl}`);

  try {
    const [qrs] = await pool.query('SELECT * FROM qrs');
    const [clients] = await pool.query('SELECT * FROM clients');

    console.log(`Found ${qrs.length} QR records and ${clients.length} clients in MySQL database.`);

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

    let updatedCount = 0;

    for (const qr of qrs) {
      // Find assigned client
      const assignedClient = clients.find(c => 
        (qr.assignedClientId && c.id === qr.assignedClientId) ||
        (c.qrId && c.qrId.toUpperCase() === qr.qrId.toUpperCase())
      );

      let targetSlug = '';
      if (assignedClient && assignedClient.name) {
        targetSlug = generateSlug(assignedClient.name);
      } else if (qr.assignedClientName) {
        targetSlug = generateSlug(qr.assignedClientName);
      }

      // Expected URL format:
      // If assigned to a client: domain + '/' + business_name (e.g. https://qr.vasmigroup.com/mitraa-super-market)
      // If unassigned: domain + '/' + qrId (e.g. https://qr.vasmigroup.com/QR-axwia-0006)
      const newTargetUrl = targetSlug 
        ? `${targetBaseUrl}/${encodeURIComponent(targetSlug)}`
        : `${targetBaseUrl}/${encodeURIComponent(qr.qrId)}`;

      const filename = `${qr.qrId}.png`;
      const filePath = path.join(QR_DIR, filename);

      console.log(`[Updating] ${qr.qrId} (${assignedClient ? assignedClient.name : 'Unassigned'}):`);
      console.log(`  Old URL: ${qr.targetUrl}`);
      console.log(`  New URL: ${newTargetUrl}`);

      // 1. Update MySQL row
      await pool.execute('UPDATE qrs SET targetUrl = ? WHERE id = ?', [newTargetUrl, qr.id]);

      // 2. Regenerate QR image file on disk
      await QRCode.toFile(filePath, newTargetUrl, qrOptions);
      console.log(`  Re-generated QR image at: ${filePath}`);

      updatedCount++;
    }

    console.log(`\nSuccessfully updated and re-generated ${updatedCount} QR codes!`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit(0);
  }
}

migrateQrUrls();
