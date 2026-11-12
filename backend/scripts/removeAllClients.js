import { pool } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function removeAllClientsAndAssignedQrs() {
  console.log('--- STARTING REMOVAL OF ALL CLIENTS & ASSIGNED QRS ---');
  try {
    // 1. Fetch all clients and assigned QRs to identify files to remove
    const [clients] = await pool.query('SELECT * FROM clients');
    console.log(`Found ${clients.length} client(s) to remove.`);

    const [assignedQrs] = await pool.query(`
      SELECT * FROM qrs 
      WHERE status = 'assigned' 
         OR assignedClientId IS NOT NULL
    `);
    console.log(`Found ${assignedQrs.length} assigned QR code(s) to remove.`);

    // 2. Delete all customer reviews
    const [deletedReviews] = await pool.query('DELETE FROM reviews');
    console.log(`✔ Deleted all reviews from reviews table.`);

    // 3. Delete all assigned QRs from database
    if (assignedQrs.length > 0) {
      const assignedIds = assignedQrs.map(q => q.id);
      await pool.query('DELETE FROM qrs WHERE id IN (?)', [assignedIds]);
      console.log(`✔ Deleted ${assignedQrs.length} assigned QR record(s) from qrs table.`);
    } else {
      console.log('No assigned QRs needed deletion in qrs table.');
    }

    // Also ensure no QR still points to a client ID
    await pool.query(`
      UPDATE qrs 
      SET status = 'unassigned', assignedClientId = NULL, assignedClientName = NULL, assignedClientPhone = NULL, isLocked = 0, note = 'Generic Empty QR'
      WHERE status = 'assigned' OR assignedClientId IS NOT NULL
    `);

    // 4. Delete all clients from database
    await pool.query('DELETE FROM clients');
    console.log(`✔ Deleted all client records from clients table.`);

    // 5. Clean up non-superadmin client users
    await pool.query(`DELETE FROM users WHERE role != 'superadmin' OR clientId IS NOT NULL`);
    console.log(`✔ Cleaned client login users.`);

    // 6. Delete physical QR code image files for deleted assigned QRs
    const qrDir = path.join(__dirname, '..', 'uploads', 'qr-codes');
    if (fs.existsSync(qrDir)) {
      let removedQrFiles = 0;
      for (const qr of assignedQrs) {
        const filename = qr.filename || `${qr.qrId}.png`;
        const filePath = path.join(qrDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          removedQrFiles++;
        }
      }
      console.log(`✔ Removed ${removedQrFiles} physical QR image file(s) for assigned standees.`);
    }

    // 6b. Clean up any QR records in DB whose image files do not exist on disk
    const [allRemainingQrs] = await pool.query('SELECT * FROM qrs');
    for (const qr of allRemainingQrs) {
      const filename = qr.filename || `${qr.qrId}.png`;
      const filePath = path.join(qrDir, filename);
      if (!fs.existsSync(filePath)) {
        await pool.query('DELETE FROM qrs WHERE id = ?', [qr.id]);
        console.log(`✔ Removed orphaned QR record from DB: ${qr.qrId} (no file on disk)`);
      }
    }

    // 7. Delete physical client logo files
    const logosDir = path.join(__dirname, '..', 'uploads', 'logos');
    if (fs.existsSync(logosDir)) {
      const logoFiles = fs.readdirSync(logosDir);
      for (const f of logoFiles) {
        try {
          fs.unlinkSync(path.join(logosDir, f));
        } catch (e) {
          // ignore
        }
      }
      console.log(`✔ Cleaned ${logoFiles.length} client logo files.`);
    }

    // 8. Clean up review Excel export files
    const dataDir = path.join(__dirname, '..', 'data');
    if (fs.existsSync(dataDir)) {
      const dataFiles = fs.readdirSync(dataDir).filter(f => f.startsWith('reviews_client-') || f.startsWith('reviews_master'));
      for (const f of dataFiles) {
        try {
          fs.unlinkSync(path.join(dataDir, f));
        } catch (e) {
          // ignore
        }
      }
      console.log(`✔ Cleaned ${dataFiles.length} Excel export files.`);
    }

    // 9. Synchronize local db.json if present
    const dbJsonPath = path.join(dataDir, 'db.json');
    if (fs.existsSync(dbJsonPath)) {
      try {
        const raw = fs.readFileSync(dbJsonPath, 'utf8');
        const dbData = JSON.parse(raw);
        dbData.clients = [];
        dbData.reviews = [];
        if (Array.isArray(dbData.qrs)) {
          dbData.qrs = dbData.qrs.filter(q => q.status === 'unassigned');
        }
        if (Array.isArray(dbData.users)) {
          dbData.users = dbData.users.filter(u => u.role === 'superadmin');
        }
        fs.writeFileSync(dbJsonPath, JSON.stringify(dbData, null, 2), 'utf8');
        console.log('✔ Synchronized local db.json.');
      } catch (e) {
        console.warn('Could not sync db.json:', e.message);
      }
    }

    // Verification
    const [remClients] = await pool.query('SELECT COUNT(*) as c FROM clients');
    const [remQrs] = await pool.query('SELECT COUNT(*) as c FROM qrs WHERE status = "assigned"');
    const [availQrs] = await pool.query('SELECT COUNT(*) as c FROM qrs WHERE status = "unassigned"');
    const [remReviews] = await pool.query('SELECT COUNT(*) as c FROM reviews');

    console.log('\n--- VERIFICATION STATUS ---');
    console.log(`Remaining clients: ${remClients[0].c}`);
    console.log(`Remaining assigned QRs: ${remQrs[0].c}`);
    console.log(`Available unassigned standees in pool: ${availQrs[0].c}`);
    console.log(`Remaining customer reviews: ${remReviews[0].c}`);
    console.log('--- ALL CLIENTS & ASSIGNED QRS REMOVED SUCCESSFULLY! ---');

    return {
      success: true,
      removedClients: clients.length,
      removedAssignedQrs: assignedQrs.length,
      availableUnassignedQrs: availQrs[0].c
    };
  } catch (err) {
    console.error('Error during client removal:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

// Execute if run directly
removeAllClientsAndAssignedQrs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
