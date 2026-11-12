import { pool } from '../config/db.js';

/**
 * System Statistics Model
 */
class StatModel {
  /**
   * Aggregate statistics for dashboard KPI cards
   */
  static async getSystemStats() {
    const [qrRows] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'unassigned' THEN 1 ELSE 0 END) as unassigned,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned
      FROM qrs
    `);
    const [clientRows] = await pool.query('SELECT COUNT(*) as totalClients FROM clients');
    const [reviewRows] = await pool.query('SELECT COUNT(*) as totalReviews FROM reviews');

    let totalScans = 0;
    try {
      const [scanRows] = await pool.query('SELECT COUNT(*) as totalScans FROM scans');
      totalScans = Number(scanRows[0]?.totalScans || 0);
    } catch (e) {
      try {
        const [qrScanRows] = await pool.query('SELECT COALESCE(SUM(scansCount), 0) as totalScans FROM qrs');
        totalScans = Number(qrScanRows[0]?.totalScans || 0);
      } catch (err) { }
    }

    return {
      totalQrs: Number(qrRows[0]?.total || 0),
      unassignedQrs: Number(qrRows[0]?.unassigned || 0),
      assignedQrs: Number(qrRows[0]?.assigned || 0),
      totalClients: Number(clientRows[0]?.totalClients || 0),
      totalReviews: Number(reviewRows[0]?.totalReviews || 0),
      totalScans: Number(totalScans || 0)
    };
  }
}

export { StatModel };
export default StatModel;
