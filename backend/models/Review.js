import { pool } from '../config/db.js';

/**
 * Review Model
 */
class ReviewModel {
  /**
   * Insert a new customer review
   */
  static async insert(review) {
    await pool.execute(
      `INSERT INTO reviews (id, qrId, clientId, clientName, phone, comments, rating, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        review.id,
        review.qrId,
        review.clientId,
        review.clientName,
        review.phone || '',
        review.comments,
        Number(review.rating) || 5,
        new Date(review.createdAt || Date.now())
      ]
    );
    return review;
  }

  /**
   * Get reviews for a specific client (or QR ID)
   */
  static async getByClientId(clientId, qrId = null) {
    let rows;
    if (qrId) {
      [rows] = await pool.execute(
        'SELECT * FROM reviews WHERE clientId = ? OR UPPER(qrId) = UPPER(?) ORDER BY createdAt DESC',
        [clientId, qrId.trim()]
      );
    } else {
      [rows] = await pool.execute(
        'SELECT * FROM reviews WHERE clientId = ? ORDER BY createdAt DESC',
        [clientId]
      );
    }
    return rows.map(r => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
    }));
  }

  /**
   * Get all reviews across all businesses
   */
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM reviews ORDER BY createdAt DESC');
    return rows.map(r => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
    }));
  }

  /**
   * Get list of already submitted review comments for a specific client or QR code
   * Used to ensure review suggestions are never repeated across customers
   */
  static async getUsedComments(clientId, qrId = null) {
    try {
      let rows = [];
      if (clientId && qrId) {
        [rows] = await pool.execute(
          'SELECT comments FROM reviews WHERE clientId = ? OR UPPER(qrId) = UPPER(?)',
          [clientId, qrId.trim()]
        );
      } else if (clientId) {
        [rows] = await pool.execute(
          'SELECT comments FROM reviews WHERE clientId = ?',
          [clientId]
        );
      } else if (qrId) {
        [rows] = await pool.execute(
          'SELECT comments FROM reviews WHERE UPPER(qrId) = UPPER(?)',
          [qrId.trim()]
        );
      }
      return rows.map(r => (r.comments || '').trim()).filter(Boolean);
    } catch (err) {
      console.warn('[ReviewModel] Could not fetch used comments:', err.message);
      return [];
    }
  }
}

export { ReviewModel };
export default ReviewModel;
