import { pool } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function clearAll() {
  try {
    console.log('[1/4] Clearing MySQL tables...');
    await pool.query('DELETE FROM reviews');
    await pool.query('DELETE FROM clients');
    await pool.query('DELETE FROM qrs');
    await pool.query('DELETE FROM users');

    await pool.query(`
      INSERT INTO users (id, username, password, name, role, clientId) VALUES
      ('user-superadmin-1', 'sadmin', 'sadmin@123', 'Super Admin', 'superadmin', NULL),
      ('user-client-1', 'admin', 'admin@123', 'Client Admin', 'admin', NULL)
    `);
    console.log('✔ MySQL tables cleared (reviews, clients, qrs). Users reset to default sadmin & admin.');

    // Clear uploads/qr-codes
    console.log('[2/4] Clearing uploads/qr-codes directory...');
    const qrDir = path.join(__dirname, '..', 'uploads', 'qr-codes');
    if (fs.existsSync(qrDir)) {
      const files = fs.readdirSync(qrDir);
      for (const f of files) {
        fs.unlinkSync(path.join(qrDir, f));
      }
      console.log(`✔ Cleaned ${files.length} QR files from uploads/qr-codes`);
    }

    // Clear uploads/logos
    const logosDir = path.join(__dirname, '..', 'uploads', 'logos');
    if (fs.existsSync(logosDir)) {
      const logoFiles = fs.readdirSync(logosDir);
      for (const f of logoFiles) {
        fs.unlinkSync(path.join(logosDir, f));
      }
      console.log(`✔ Cleaned ${logoFiles.length} logo files from uploads/logos`);
    }

    // Clear old new-QRs
    const oldQrDir = path.join(__dirname, '..', 'uploads', 'new-QRs');
    if (fs.existsSync(oldQrDir)) {
      const oldFiles = fs.readdirSync(oldQrDir);
      for (const f of oldFiles) {
        fs.unlinkSync(path.join(oldQrDir, f));
      }
    }

    // Reset db.json
    console.log('[3/4] Resetting local db.json...');
    const dbPath = path.join(__dirname, '..', 'data', 'db.json');
    const dbData = {
      users: [
        { id: 'user-superadmin-1', username: 'sadmin', password: 'sadmin@123', name: 'Super Admin', role: 'superadmin' },
        { id: 'user-client-1', username: 'admin', password: 'admin@123', name: 'Client Admin', role: 'admin', clientId: null }
      ],
      qrs: [],
      clients: [],
      reviews: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
    console.log('✔ db.json reset to empty state');

    // Clean client & master Excel files
    console.log('[4/4] Cleaning review Excel files...');
    const dataDir = path.join(__dirname, '..', 'data');
    if (fs.existsSync(dataDir)) {
      const dataFiles = fs.readdirSync(dataDir).filter(f => f.startsWith('reviews_client-') || f.startsWith('reviews_master'));
      for (const f of dataFiles) {
        fs.unlinkSync(path.join(dataDir, f));
      }
      console.log(`✔ Cleaned ${dataFiles.length} review Excel files`);
    }

    // Verify current state
    const [qrCount] = await pool.query('SELECT COUNT(*) as c FROM qrs');
    const [clientCount] = await pool.query('SELECT COUNT(*) as c FROM clients');
    const [reviewCount] = await pool.query('SELECT COUNT(*) as c FROM reviews');
    const [userCount] = await pool.query('SELECT COUNT(*) as c FROM users');

    console.log('\n--- VERIFICATION ---');
    console.log(`MySQL QRs count: ${qrCount[0].c}`);
    console.log(`MySQL Clients count: ${clientCount[0].c}`);
    console.log(`MySQL Reviews count: ${reviewCount[0].c}`);
    console.log(`MySQL Users count: ${userCount[0].c} (sadmin, admin)`);
    console.log('--- ALL DB DATA CLEARED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Error clearing database:', err);
  } finally {
    await pool.end();
  }
}

clearAll();
