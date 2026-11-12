import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Business Category Model
 */
class CategoryModel {
  /**
   * Get all categories with dynamic count of onboarded businesses
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT c.*, COUNT(cl.id) as clientCount
      FROM categories c
      LEFT JOIN clients cl ON LOWER(cl.businessType) = LOWER(c.name)
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      label: r.label || r.name,
      description: r.description || '',
      clientCount: Number(r.clientCount || 0),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
    }));
  }

  /**
   * Find category by primary ID
   */
  static async findById(id) {
    if (!id) return null;
    const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  /**
   * Find category by name (case-insensitive)
   */
  static async findByName(name) {
    if (!name) return null;
    const [rows] = await pool.execute(
      'SELECT * FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [name.trim()]
    );
    return rows[0] || null;
  }

  /**
   * Insert new category
   */
  static async insert({ id, name, label, description }) {
    const catId = id || 'cat-' + uuidv4().slice(0, 8);
    const cleanName = name.trim();
    const cleanLabel = (label && label.trim()) || cleanName;
    const cleanDesc = description ? description.trim() : null;

    await pool.execute(
      'INSERT INTO categories (id, name, label, description) VALUES (?, ?, ?, ?)',
      [catId, cleanName, cleanLabel, cleanDesc]
    );
    return {
      id: catId,
      name: cleanName,
      label: cleanLabel,
      description: cleanDesc,
      clientCount: 0,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Update category
   */
  static async update(id, { name, label, description }) {
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (label !== undefined) {
      updates.push('label = ?');
      values.push(label.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description ? description.trim() : null);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.execute(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    return this.findById(id);
  }

  /**
   * Delete category by ID
   */
  static async delete(id) {
    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }
}

export { CategoryModel };
export default CategoryModel;
