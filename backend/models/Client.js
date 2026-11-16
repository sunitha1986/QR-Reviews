import { pool } from '../config/db.js';
import { generateSlug } from '../utils/slug.js';

/**
 * Client (Business) Model
 */
class ClientModel {
  /**
   * Normalizes Client database row
   */
  static formatRow(row) {
    if (!row) return null;
    const name = row.name || '';
    const slug = generateSlug(name);
    return {
      id: row.id,
      name: row.name,
      slug: slug,
      phone: row.phone,
      address: row.address,
      businessLocation: row.businessLocation || row.address || '',
      businessType: row.businessType,
      googleMapUrl: row.googleMapUrl || null,
      googleReviewUrl: row.googleReviewUrl || null,
      logoUrl: row.logoUrl || null,
      qrId: row.qrId,
      username: row.username,
      password: row.password,
      keywords: row.keywords || '',
      colorTheme: row.colorTheme || null,
      subscriptionPlan: row.subscriptionPlan || 'Starter Launch Trial (₹9)',
      isLocked: Boolean(row.isLocked),
      isPhoneMandatory: Boolean(row.isPhoneMandatory),
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null
    };
  }

  /**
   * Get all clients
   */
  static async getAll() {
    const [rows] = await pool.query('SELECT * FROM clients ORDER BY createdAt DESC');
    return rows.map(this.formatRow);
  }

  /**
   * Find client by primary ID
   */
  static async findById(clientId) {
    if (!clientId) return null;
    const [rows] = await pool.execute(
      'SELECT * FROM clients WHERE id = ? LIMIT 1',
      [clientId]
    );
    return rows[0] ? this.formatRow(rows[0]) : null;
  }

  /**
   * Find client by ID or QR ID
   */
  static async findByIdOrQr(idOrQr) {
    return this.findByIdOrQrOrSlug(idOrQr);
  }

  /**
   * Find client by ID, QR ID, business name, or slug
   */
  static async findByIdOrQrOrSlug(identifier) {
    if (!identifier) return null;
    const clean = identifier.toString().trim();

    // 1. Direct match by id or qrId
    const [rows] = await pool.execute(
      'SELECT * FROM clients WHERE id = ? OR UPPER(qrId) = UPPER(?) LIMIT 1',
      [clean, clean]
    );
    if (rows[0]) return this.formatRow(rows[0]);

    // 2. Direct match by name or slug
    const allClients = await this.getAll();
    const targetSlug = generateSlug(clean);
    const matched = allClients.find(c => {
      if (!c.name) return false;
      const cSlug = generateSlug(c.name);
      return cSlug === targetSlug || c.name.toLowerCase() === clean.toLowerCase();
    });

    return matched || null;
  }

  /**
   * Find client by login username or phone number
   */
  static async findByUsernameOrPhone(userOrPhone) {
    if (!userOrPhone) return null;
    const clean = userOrPhone.toString().trim().toLowerCase();
    const digits = clean.replace(/\D/g, '');
    const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
    const [rows] = await pool.execute(
      `SELECT * FROM clients 
       WHERE LOWER(username) = ? 
          OR phone = ? 
          OR REPLACE(phone, " ", "") = ? 
          OR REPLACE(phone, " ", "") = ? 
          OR RIGHT(REPLACE(phone, " ", ""), 10) = ? 
       LIMIT 1`,
      [clean, clean, digits || clean, last10 || clean, last10 || clean]
    );
    return rows[0] ? this.formatRow(rows[0]) : null;
  }

  /**
   * Insert a new client
   */
  static async insert(client) {
    await pool.execute(
      `INSERT INTO clients (id, name, phone, address, businessLocation, businessType, googleMapUrl, googleReviewUrl, logoUrl, qrId, username, password, isLocked, isPhoneMandatory, subscriptionPlan, keywords, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client.id,
        client.name.trim(),
        client.phone.trim(),
        client.address.trim(),
        (client.businessLocation && client.businessLocation.trim()) ? client.businessLocation.trim() : client.address.trim(),
        client.businessType || 'General Retail / Service',
        client.googleMapUrl ? client.googleMapUrl.trim() : null,
        client.googleReviewUrl ? client.googleReviewUrl.trim() : null,
        client.logoUrl ? client.logoUrl.trim() : null,
        client.qrId,
        client.username,
        client.password || 'admin@123',
        client.isLocked ? 1 : 0,
        client.isPhoneMandatory ? 1 : 0,
        client.subscriptionPlan ? client.subscriptionPlan.trim() : 'Starter Launch Trial (₹9)',
        client.keywords ? client.keywords.trim() : null,
        new Date(client.createdAt || Date.now())
      ]
    );
    return this.formatRow(client);
  }

  /**
   * Update client fields and synchronize linked tables (qrs, reviews)
   */
  static async update(clientId, fields) {
    const updates = [];
    const values = [];

    if (fields.name !== undefined) {
      updates.push('name = ?');
      values.push(fields.name.trim());
    }
    if (fields.phone !== undefined) {
      updates.push('phone = ?');
      values.push(fields.phone.trim());
    }
    if (fields.address !== undefined) {
      updates.push('address = ?');
      values.push(fields.address.trim());
    }
    if (fields.businessLocation !== undefined) {
      updates.push('businessLocation = ?');
      values.push(fields.businessLocation ? fields.businessLocation.trim() : null);
    }
    if (fields.businessType !== undefined) {
      updates.push('businessType = ?');
      values.push(fields.businessType.trim());
    }
    if (fields.googleMapUrl !== undefined) {
      updates.push('googleMapUrl = ?');
      values.push(fields.googleMapUrl ? fields.googleMapUrl.trim() : null);
    }
    if (fields.googleReviewUrl !== undefined) {
      updates.push('googleReviewUrl = ?');
      values.push(fields.googleReviewUrl ? fields.googleReviewUrl.trim() : null);
    }
    if (fields.logoUrl !== undefined) {
      updates.push('logoUrl = ?');
      values.push(fields.logoUrl ? fields.logoUrl.trim() : null);
    }
    if (fields.qrId !== undefined) {
      updates.push('qrId = ?');
      values.push(fields.qrId.trim());
    }
    if (fields.isLocked !== undefined) {
      updates.push('isLocked = ?');
      values.push(fields.isLocked ? 1 : 0);
    }
    if (fields.isPhoneMandatory !== undefined) {
      updates.push('isPhoneMandatory = ?');
      values.push(fields.isPhoneMandatory ? 1 : 0);
    }
    if (fields.password !== undefined) {
      updates.push('password = ?');
      values.push(fields.password.trim());
    }
    if (fields.keywords !== undefined) {
      updates.push('keywords = ?');
      values.push(fields.keywords ? fields.keywords.trim() : null);
    }
    if (fields.colorTheme !== undefined) {
      updates.push('colorTheme = ?');
      values.push(fields.colorTheme ? fields.colorTheme.trim() : null);
    }
    if (fields.subscriptionPlan !== undefined) {
      updates.push('subscriptionPlan = ?');
      values.push(fields.subscriptionPlan ? fields.subscriptionPlan.trim() : 'Starter Launch Trial (₹9)');
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(clientId);

    await pool.execute(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Automatically synchronize qrs and reviews tables with updated client name/phone
    if (fields.name || fields.phone || fields.qrId) {
      const updatedClient = await this.findById(clientId);
      if (updatedClient) {
        await pool.execute(
          `UPDATE qrs
           SET assignedClientName = ?, assignedClientPhone = ?, note = ?
           WHERE UPPER(qrId) = UPPER(?) OR assignedClientId = ?`,
          [
            updatedClient.name,
            updatedClient.phone,
            `Assigned to ${updatedClient.name}`,
            updatedClient.qrId,
            updatedClient.id
          ]
        );
        if (fields.name) {
          await pool.execute(
            `UPDATE reviews SET clientName = ? WHERE clientId = ?`,
            [updatedClient.name, updatedClient.id]
          );
        }
      }
    }

    return this.findById(clientId);
  }

  /**
   * Update client custom keywords for review generation
   */
  static async updateKeywords(clientId, keywords) {
    const cleanKeywords = typeof keywords === 'string'
      ? keywords.trim()
      : (Array.isArray(keywords) ? keywords.map(k => String(k).trim()).filter(Boolean).join(', ') : '');

    await pool.execute(
      'UPDATE clients SET keywords = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [cleanKeywords, clientId]
    );

    return this.findById(clientId);
  }

  /**
   * Delete a single client by ID, cleaning reviews and linked assigned QR
   */
  static async delete(clientId) {
    if (!clientId) return false;
    const client = await this.findById(clientId);
    if (!client) return false;

    // Delete reviews for this client
    await pool.execute('DELETE FROM reviews WHERE clientId = ?', [clientId]);

    // Delete assigned QR
    await pool.execute(
      `DELETE FROM qrs WHERE assignedClientId = ? OR UPPER(qrId) = UPPER(?)`,
      [clientId, client.qrId || '']
    );

    // Delete client user login
    await pool.execute('DELETE FROM users WHERE clientId = ?', [clientId]);

    // Delete client record
    await pool.execute('DELETE FROM clients WHERE id = ?', [clientId]);
    return true;
  }

  /**
   * Get cached AI reviews JSON from DB
   */
  static async getCachedAiReviews(clientIdOrQr) {
    if (!clientIdOrQr) return null;
    const clean = clientIdOrQr.toString().trim();
    const [rows] = await pool.execute(
      'SELECT id, cachedAiReviews FROM clients WHERE id = ? OR UPPER(qrId) = UPPER(?) LIMIT 1',
      [clean, clean]
    );
    if (!rows[0] || !rows[0].cachedAiReviews) return null;
    try {
      return typeof rows[0].cachedAiReviews === 'string'
        ? JSON.parse(rows[0].cachedAiReviews)
        : rows[0].cachedAiReviews;
    } catch {
      return null;
    }
  }

  /**
   * Save cached AI reviews JSON to DB
   */
  static async saveCachedAiReviews(clientIdOrQr, reviewsData) {
    if (!clientIdOrQr || !reviewsData) return false;
    const clean = clientIdOrQr.toString().trim();
    const jsonStr = typeof reviewsData === 'string' ? reviewsData : JSON.stringify(reviewsData);
    await pool.execute(
      'UPDATE clients SET cachedAiReviews = ? WHERE id = ? OR UPPER(qrId) = UPPER(?)',
      [jsonStr, clean, clean]
    );
    return true;
  }

  /**
   * Clear cached AI reviews in DB (e.g. when keywords change)
   */
  static async clearCachedAiReviews(clientIdOrQr) {
    if (!clientIdOrQr) return false;
    const clean = clientIdOrQr.toString().trim();
    await pool.execute(
      'UPDATE clients SET cachedAiReviews = NULL WHERE id = ? OR UPPER(qrId) = UPPER(?)',
      [clean, clean]
    );
    return true;
  }

  /**
   * Delete all clients and their assigned QRs & reviews
   */
  static async deleteAll({ deleteAssignedQrs = true } = {}) {
    const [clients] = await pool.query('SELECT * FROM clients');
    const [assignedQrs] = await pool.query(`
      SELECT * FROM qrs WHERE status = 'assigned' OR assignedClientId IS NOT NULL
    `);

    // 1. Delete all reviews
    await pool.query('DELETE FROM reviews');

    // 2. Delete or unassign assigned QRs
    if (deleteAssignedQrs) {
      if (assignedQrs.length > 0) {
        const assignedIds = assignedQrs.map(q => q.id);
        await pool.query('DELETE FROM qrs WHERE id IN (?)', [assignedIds]);
      }
    } else {
      await pool.query(`
        UPDATE qrs 
        SET status = 'unassigned', assignedClientId = NULL, assignedClientName = NULL, assignedClientPhone = NULL, isLocked = 0, note = 'Generic Empty QR'
        WHERE status = 'assigned' OR assignedClientId IS NOT NULL
      `);
    }

    // 3. Delete all clients
    await pool.query('DELETE FROM clients');

    // 4. Delete client users
    await pool.query("DELETE FROM users WHERE role != 'superadmin' OR clientId IS NOT NULL");

    return {
      deletedClientsCount: clients.length,
      deletedAssignedQrsCount: assignedQrs.length
    };
  }
}

export { ClientModel };
export default ClientModel;
