import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Subscription Plan Model
 */
class SubscriptionPlanModel {
  static formatRow(r) {
    if (!r) return null;
    let parsedFeatures = [];
    if (Array.isArray(r.features)) {
      parsedFeatures = r.features;
    } else if (typeof r.features === 'string') {
      try {
        parsedFeatures = JSON.parse(r.features);
      } catch {
        parsedFeatures = r.features.split('\n').map(s => s.trim()).filter(Boolean);
      }
    }

    return {
      id: r.id,
      name: r.name,
      tagline: r.tagline || '',
      price: Number(r.price || 0),
      billingCycle: r.billingCycle || 'monthly',
      periodLabel: r.periodLabel || '',
      description: r.description || '',
      badge: r.badge || '',
      features: parsedFeatures,
      hardwareIncluded: r.hardwareIncluded || '',
      isDefault: Boolean(r.isDefault),
      isActive: Boolean(r.isActive !== 0 && r.isActive !== false),
      showOnLandingPage: Boolean(r.showOnLandingPage !== 0 && r.showOnLandingPage !== false),
      displayOrder: Number(r.displayOrder || 1),
      clientCount: Number(r.clientCount || 0),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
    };
  }

  /**
   * Get plans featured on the public landing page (strictly max 3)
   */
  static async getLandingPlans() {
    const [rows] = await pool.query(`
      SELECT sp.*, COUNT(cl.id) as clientCount
      FROM subscription_plans sp
      LEFT JOIN clients cl ON LOWER(TRIM(cl.subscriptionPlan)) = LOWER(TRIM(sp.name))
      WHERE sp.isActive = 1 AND sp.showOnLandingPage = 1
      GROUP BY sp.id
      ORDER BY sp.displayOrder ASC, sp.createdAt ASC
      LIMIT 3
    `);
    if (rows.length > 0) {
      return rows.map(r => this.formatRow(r));
    }
    const allActive = await this.getActive();
    return allActive.slice(0, 3);
  }

  /**
   * Get all plans with dynamic counts of onboarded clients
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT sp.*, COUNT(cl.id) as clientCount
      FROM subscription_plans sp
      LEFT JOIN clients cl ON LOWER(TRIM(cl.subscriptionPlan)) = LOWER(TRIM(sp.name))
      GROUP BY sp.id
      ORDER BY sp.displayOrder ASC, sp.createdAt ASC
    `);
    return rows.map(r => this.formatRow(r));
  }

  /**
   * Get only active plans for public/onboarding consumption
   */
  static async getActive() {
    const [rows] = await pool.query(`
      SELECT sp.*, COUNT(cl.id) as clientCount
      FROM subscription_plans sp
      LEFT JOIN clients cl ON LOWER(TRIM(cl.subscriptionPlan)) = LOWER(TRIM(sp.name))
      WHERE sp.isActive = 1
      GROUP BY sp.id
      ORDER BY sp.displayOrder ASC, sp.createdAt ASC
    `);
    return rows.map(r => this.formatRow(r));
  }

  /**
   * Find plan by ID
   */
  static async findById(id) {
    if (!id) return null;
    const [rows] = await pool.execute('SELECT * FROM subscription_plans WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? this.formatRow(rows[0]) : null;
  }

  /**
   * Find plan by Name
   */
  static async findByName(name) {
    if (!name) return null;
    const [rows] = await pool.execute(
      'SELECT * FROM subscription_plans WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
      [name.trim()]
    );
    return rows[0] ? this.formatRow(rows[0]) : null;
  }

  /**
   * Insert new customizable plan
   */
  static async insert(data) {
    const id = data.id || 'plan-' + uuidv4().slice(0, 8);
    const cleanName = String(data.name || '').trim();
    const cleanTagline = String(data.tagline || '').trim();
    const cleanPrice = parseInt(data.price, 10) || 0;
    const cleanCycle = String(data.billingCycle || 'monthly').trim();
    const cleanPeriod = String(data.periodLabel || '').trim();
    const cleanDesc = String(data.description || '').trim();
    const cleanBadge = String(data.badge || '').trim();
    const featuresJson = JSON.stringify(Array.isArray(data.features) ? data.features : []);
    const cleanHardware = String(data.hardwareIncluded || '').trim();
    const isDefault = Boolean(data.isDefault) ? 1 : 0;
    const isActive = data.isActive !== undefined ? (Boolean(data.isActive) ? 1 : 0) : 1;
    const showOnLandingPage = data.showOnLandingPage !== undefined ? (Boolean(data.showOnLandingPage) ? 1 : 0) : 1;
    const displayOrder = parseInt(data.displayOrder, 10) || 1;

    // Check max 3 landing plans
    if (showOnLandingPage) {
      const [countRow] = await pool.query('SELECT COUNT(*) as count FROM subscription_plans WHERE showOnLandingPage = 1');
      if (countRow[0].count >= 3) {
        throw new Error('Maximum 3 plans can be featured on the landing page at a time. Please uncheck another plan first.');
      }
    }

    // If marked default, unset others first
    if (isDefault) {
      await pool.execute('UPDATE subscription_plans SET isDefault = 0');
    }

    await pool.execute(
      `INSERT INTO subscription_plans 
       (id, name, tagline, price, billingCycle, periodLabel, description, badge, features, hardwareIncluded, isDefault, isActive, showOnLandingPage, displayOrder) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cleanName,
        cleanTagline,
        cleanPrice,
        cleanCycle,
        cleanPeriod,
        cleanDesc,
        cleanBadge,
        featuresJson,
        cleanHardware,
        isDefault,
        isActive,
        showOnLandingPage,
        displayOrder
      ]
    );

    return this.findById(id);
  }

  /**
   * Update existing plan
   */
  static async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updates = [];
    const values = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(String(data.name).trim());
    }
    if (data.tagline !== undefined) {
      updates.push('tagline = ?');
      values.push(String(data.tagline).trim());
    }
    if (data.price !== undefined) {
      updates.push('price = ?');
      values.push(parseInt(data.price, 10) || 0);
    }
    if (data.billingCycle !== undefined) {
      updates.push('billingCycle = ?');
      values.push(String(data.billingCycle).trim());
    }
    if (data.periodLabel !== undefined) {
      updates.push('periodLabel = ?');
      values.push(String(data.periodLabel).trim());
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(String(data.description).trim());
    }
    if (data.badge !== undefined) {
      updates.push('badge = ?');
      values.push(String(data.badge).trim());
    }
    if (data.features !== undefined) {
      updates.push('features = ?');
      values.push(JSON.stringify(Array.isArray(data.features) ? data.features : []));
    }
    if (data.hardwareIncluded !== undefined) {
      updates.push('hardwareIncluded = ?');
      values.push(String(data.hardwareIncluded).trim());
    }
    if (data.isDefault !== undefined) {
      const isDef = Boolean(data.isDefault) ? 1 : 0;
      if (isDef) {
        await pool.execute('UPDATE subscription_plans SET isDefault = 0');
      }
      updates.push('isDefault = ?');
      values.push(isDef);
    }
    if (data.isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(Boolean(data.isActive) ? 1 : 0);
    }
    if (data.showOnLandingPage !== undefined) {
      const isShow = Boolean(data.showOnLandingPage) ? 1 : 0;
      if (isShow && !existing.showOnLandingPage) {
        const [countRow] = await pool.execute(
          'SELECT COUNT(*) as count FROM subscription_plans WHERE showOnLandingPage = 1 AND id != ?',
          [id]
        );
        if (countRow[0].count >= 3) {
          throw new Error('Maximum 3 plans can be featured on the landing page at a time. Please remove another plan first.');
        }
      }
      updates.push('showOnLandingPage = ?');
      values.push(isShow);
    }
    if (data.displayOrder !== undefined) {
      updates.push('displayOrder = ?');
      values.push(parseInt(data.displayOrder, 10) || 1);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.execute(
        `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    return this.findById(id);
  }

  /**
   * Toggle landing page visibility (enforcing max 3)
   */
  static async toggleLandingPage(id) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const targetVal = !existing.showOnLandingPage;
    if (targetVal) {
      const [countRow] = await pool.execute(
        'SELECT COUNT(*) as count FROM subscription_plans WHERE showOnLandingPage = 1 AND id != ?',
        [id]
      );
      if (countRow[0].count >= 3) {
        throw new Error('Maximum 3 plans can be shown on the landing page at a time. Please uncheck or hide another plan first.');
      }
    }
    await pool.execute('UPDATE subscription_plans SET showOnLandingPage = ? WHERE id = ?', [targetVal ? 1 : 0, id]);
    return this.findById(id);
  }

  /**
   * Set specific plan as default
   */
  static async setDefault(id) {
    await pool.execute('UPDATE subscription_plans SET isDefault = 0');
    await pool.execute('UPDATE subscription_plans SET isDefault = 1 WHERE id = ?', [id]);
    return this.findById(id);
  }

  /**
   * Delete plan
   */
  static async delete(id) {
    const existing = await this.findById(id);
    if (!existing) return false;

    // Check if any client is currently on this plan
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE LOWER(TRIM(subscriptionPlan)) = LOWER(TRIM(?)) LIMIT 1',
      [existing.name]
    );

    if (clients.length > 0) {
      throw new Error(`Cannot delete plan "${existing.name}" because it is currently assigned to one or more active clients. You can mark it Inactive instead.`);
    }

    await pool.execute('DELETE FROM subscription_plans WHERE id = ?', [id]);
    return true;
  }
}

export default SubscriptionPlanModel;

