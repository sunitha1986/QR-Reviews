import { pool } from '../config/db.js';
import crypto from 'crypto';

/**
 * Scan Model for tracking customer QR standee scans & page visits
 */
class ScanModel {
  /**
   * Record a scan event when a customer scans a QR standee or visits review page
   */
  static async recordScan({ qrId, clientId = null, clientName = null, ipAddress = null, userAgent = null }) {
    if (!qrId) return null;
    const scanId = `scan-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    try {
      // 1. Insert detailed scan log entry
      await pool.execute(
        `INSERT INTO scans (id, qrId, clientId, clientName, ipAddress, userAgent, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          scanId,
          String(qrId),
          clientId ? String(clientId) : null,
          clientName ? String(clientName) : null,
          ipAddress ? String(ipAddress).slice(0, 64) : null,
          userAgent ? String(userAgent).slice(0, 500) : null
        ]
      );

      // 2. Increment aggregate counter in qrs table
      try {
        await pool.execute(`UPDATE qrs SET scansCount = COALESCE(scansCount, 0) + 1 WHERE qrId = ?`, [qrId]);
      } catch (e) { }

      // 3. Increment aggregate counter in clients table if linked
      if (clientId) {
        try {
          await pool.execute(`UPDATE clients SET scansCount = COALESCE(scansCount, 0) + 1 WHERE id = ?`, [clientId]);
        } catch (e) { }
      }

      return { id: scanId, qrId, clientId, success: true };
    } catch (err) {
      console.error('[ScanModel] Failed to record scan:', err.message);
      return null;
    }
  }

  /**
   * Get total scans count across the system
   */
  static async getTotalScans() {
    try {
      const [rows] = await pool.query('SELECT COUNT(*) as totalScans FROM scans');
      return Number(rows[0]?.totalScans || 0);
    } catch (err) {
      try {
        const [qrRows] = await pool.query('SELECT COALESCE(SUM(scansCount), 0) as totalScans FROM qrs');
        return Number(qrRows[0]?.totalScans || 0);
      } catch (fallbackErr) {
        return 0;
      }
    }
  }

  /**
   * Get scans count for a specific client
   */
  static async getClientScans(clientId) {
    if (!clientId) return 0;
    try {
      const [rows] = await pool.execute('SELECT COUNT(*) as scans FROM scans WHERE clientId = ?', [clientId]);
      return Number(rows[0]?.scans || 0);
    } catch (err) {
      return 0;
    }
  }

  /**
   * Get scans count for a specific QR ID
   */
  static async getQrScans(qrId) {
    if (!qrId) return 0;
    try {
      const [rows] = await pool.execute('SELECT COUNT(*) as scans FROM scans WHERE qrId = ?', [qrId]);
      return Number(rows[0]?.scans || 0);
    } catch (err) {
      return 0;
    }
  }
}

export { ScanModel };
export default ScanModel;

