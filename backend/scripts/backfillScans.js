import { pool } from '../config/db.js';
import Stat from '../models/Stat.js';

async function run() {
  const [existingScans] = await pool.query('SELECT COUNT(*) as count FROM scans');
  console.log('Current scans:', existingScans[0].count);

  if (existingScans[0].count === 0) {
    const [reviews] = await pool.query('SELECT id, qrId, clientId, clientName, createdAt FROM reviews ORDER BY createdAt ASC');
    for (const rev of reviews) {
      const scanId = 'scan-hist-' + rev.id;
      await pool.execute(
        'INSERT INTO scans (id, qrId, clientId, clientName, createdAt) VALUES (?, ?, ?, ?, ?)',
        [scanId, rev.qrId, rev.clientId, rev.clientName, rev.createdAt]
      );
      await pool.execute('UPDATE qrs SET scansCount = COALESCE(scansCount, 0) + 1 WHERE qrId = ?', [rev.qrId]);
      await pool.execute('UPDATE clients SET scansCount = COALESCE(scansCount, 0) + 1 WHERE id = ?', [rev.clientId]);
    }
    console.log(`Backfilled ${reviews.length} scans from historical reviews.`);
  }

  const stats = await Stat.getSystemStats();
  console.log('Updated Stats:', stats);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

