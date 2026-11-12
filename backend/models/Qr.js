import { pool } from '../config/db.js';
import { generateSlug } from '../utils/slug.js';

/**
 * QR Code Model
 */
class QrModel {
  /**
   * Normalizes QR database row to API response contract
   */
  static formatRow(row) {
    if (!row) return null;
    const assignedClientId = row.client_id || row.assignedClientId;
    const assignedClientName = row.client_name || row.assignedClientName;
    const assignedClientPhone = row.client_phone || row.assignedClientPhone;

    return {
      id: row.id,
      qrId: row.qrId,
      sequence: row.sequence,
      filename: row.filename,
      filePath: row.filePath || `uploads/qr-codes/${row.filename}`,
      targetUrl: row.targetUrl,
      note: row.note,
      status: row.status,
      isLocked: Boolean(row.isLocked),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      assignedClient: assignedClientId ? {
        id: assignedClientId,
        name: assignedClientName,
        slug: generateSlug(assignedClientName),
        phone: assignedClientPhone
      } : null
    };
  }

  /**
   * Get all QR codes with associated client details
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT q.*, 
             c.id as client_id, 
             c.name as client_name, 
             c.phone as client_phone
      FROM qrs q
      LEFT JOIN clients c ON (q.assignedClientId = c.id OR UPPER(q.qrId) = UPPER(c.qrId))
      ORDER BY q.createdAt DESC, q.sequence DESC
    `);
    return rows.map(this.formatRow);
  }

  /**
   * Get unassigned QR codes available for onboarding
   */
  static async getUnassigned() {
    const [rows] = await pool.query(`
      SELECT q.*, 
             c.id as client_id, 
             c.name as client_name, 
             c.phone as client_phone
      FROM qrs q
      LEFT JOIN clients c ON (q.assignedClientId = c.id OR UPPER(q.qrId) = UPPER(c.qrId))
      WHERE q.status = 'unassigned' AND c.id IS NULL
      ORDER BY q.sequence ASC
    `);
    return rows.map(this.formatRow);
  }

  /**
   * Find QR by QR ID
   */
  static async findByQrId(qrId) {
    if (!qrId) return null;
    const [rows] = await pool.execute(`
      SELECT q.*, 
             c.id as client_id, 
             c.name as client_name, 
             c.phone as client_phone
      FROM qrs q
      LEFT JOIN clients c ON (q.assignedClientId = c.id OR UPPER(q.qrId) = UPPER(c.qrId))
      WHERE UPPER(q.qrId) = UPPER(?) LIMIT 1
    `, [qrId.trim()]);
    return rows[0] ? this.formatRow(rows[0]) : null;
  }

  /**
   * Find QR by QR ID or Client Slug / Name
   */
  static async findByQrIdOrSlug(identifier) {
    if (!identifier) return null;
    const clean = identifier.toString().trim();

    // 1. Direct match on QR ID
    const [rows] = await pool.execute(
      'SELECT * FROM qrs WHERE UPPER(qrId) = UPPER(?) LIMIT 1',
      [clean]
    );
    if (rows[0]) return this.formatRow(rows[0]);

    // 2. Check by client slug or name
    const [clientRows] = await pool.query('SELECT * FROM clients');
    const targetSlug = generateSlug(clean);
    const matchedClient = clientRows.find(c => {
      if (!c.name) return false;
      return generateSlug(c.name) === targetSlug || c.name.toLowerCase() === clean.toLowerCase();
    });

    if (matchedClient && matchedClient.qrId) {
      const [clientQrRows] = await pool.execute(
        'SELECT * FROM qrs WHERE UPPER(qrId) = UPPER(?) LIMIT 1',
        [matchedClient.qrId.trim()]
      );
      if (clientQrRows[0]) return this.formatRow(clientQrRows[0]);
    }

    return null;
  }

  /**
   * Insert a new QR record
   */
  static async insert(qr) {
    const filePath = (qr.filePath || `uploads/qr-codes/${qr.filename}`).replace('new-QRs', 'qr-codes');
    await pool.execute(
      `INSERT INTO qrs (id, qrId, sequence, filename, filePath, targetUrl, note, status, assignedClientId, assignedClientName, assignedClientPhone, isLocked, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        qr.id,
        qr.qrId,
        qr.sequence || 1,
        qr.filename,
        filePath,
        qr.targetUrl,
        qr.note || 'Dynamic Standee',
        qr.status || 'unassigned',
        qr.assignedClient ? qr.assignedClient.id : null,
        qr.assignedClient ? qr.assignedClient.name : null,
        qr.assignedClient ? qr.assignedClient.phone : null,
        qr.isLocked ? 1 : 0,
        new Date(qr.createdAt || Date.now())
      ]
    );
    return this.formatRow({ ...qr, filePath });
  }

  /**
   * Insert batch QRs
   */
  static async insertBatch(qrsList) {
    const results = [];
    for (const qr of qrsList) {
      const inserted = await this.insert(qr);
      results.push(inserted);
    }
    return results;
  }

  /**
   * Update QR assignment status and target URL
   */
  static async updateAssignment(qrId, { status, assignedClientId, assignedClientName, assignedClientPhone, isLocked, note, targetUrl }) {
    await pool.execute(
      `UPDATE qrs
       SET status = ?, assignedClientId = ?, assignedClientName = ?, assignedClientPhone = ?, isLocked = ?, note = COALESCE(?, note), targetUrl = COALESCE(?, targetUrl)
       WHERE UPPER(qrId) = UPPER(?)`,
      [
        status,
        assignedClientId || null,
        assignedClientName || null,
        assignedClientPhone || null,
        isLocked ? 1 : 0,
        note || null,
        targetUrl || null,
        qrId.trim()
      ]
    );
  }

  /**
   * Calculate next sequence number from max sequence in DB and all existing qrId numbers
   */
  static async calculateNextSequence() {
    let maxSeq = 0;
    try {
      const [rows] = await pool.query('SELECT MAX(sequence) as maxSeq FROM qrs');
      if (rows[0] && rows[0].maxSeq) {
        maxSeq = Number(rows[0].maxSeq);
      }
    } catch (e) {
      // fallback
    }

    try {
      const [allRows] = await pool.query('SELECT qrId, sequence FROM qrs');
      for (const r of allRows) {
        if (r.sequence && Number(r.sequence) > maxSeq) {
          maxSeq = Number(r.sequence);
        }
        if (r.qrId) {
          const directMatch = r.qrId.match(/^QR-?(\d+)$/i);
          if (directMatch) {
            const num = parseInt(directMatch[1], 10);
            if (!isNaN(num) && num > maxSeq) maxSeq = num;
          }
          const legacyMatch = r.qrId.match(/^QR-[a-z0-9]+-(\d+)$/i);
          if (legacyMatch) {
            const num = parseInt(legacyMatch[1], 10);
            if (!isNaN(num) && num > maxSeq) maxSeq = num;
          }
        }
      }
    } catch (e) {
      // fallback
    }

    return maxSeq + 1;
  }
}

export { QrModel };
export default QrModel;
