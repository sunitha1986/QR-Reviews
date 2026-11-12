import { pool } from '../config/db.js';

/**
 * User Model
 */
class UserModel {
  /**
   * Find user by username or phone (case-insensitive)
   */
  static async findByUsername(username) {
    if (!username) return null;
    const clean = username.trim().toLowerCase();
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE LOWER(username) = ? OR phone = ? OR id = ? LIMIT 1',
      [clean, clean, clean]
    );
    return rows[0] || null;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    if (!id) return null;
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }
}

export { UserModel };
export default UserModel;
