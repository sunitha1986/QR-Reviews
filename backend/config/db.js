import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { generateSlug } from '../utils/slug.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'auth-db984.hstgr.io',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'u597277762_qr_reviews',
  password: process.env.DB_PASSWORD || 'Vasmi@2026',
  database: process.env.DB_NAME || 'u597277762_qr_reviews',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

/**
 * Initialize database tables and migrate initial data if empty
 */
async function initDatabase() {
  try {
    const conn = await pool.getConnection();
    console.log('[MySQL] Connected to database: ' + (process.env.DB_NAME || 'u597277762_qr_reviews'));

    // 1. Users Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        clientId VARCHAR(64) NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure phone column exists in users table
    try {
      await conn.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL');
    } catch (colErr) { }

    try {
      const superPhone = process.env.SUPERADMIN_PHONE || '9999999999';
      await conn.execute("UPDATE users SET phone = ? WHERE role = 'superadmin' AND (phone IS NULL OR phone = '')", [superPhone]);
    } catch (e) { }

    // 2. QRs Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS qrs (
        id VARCHAR(64) PRIMARY KEY,
        qrId VARCHAR(64) NOT NULL UNIQUE,
        sequence INT NOT NULL DEFAULT 1,
        filename VARCHAR(255) NOT NULL,
        filePath VARCHAR(255) NOT NULL,
        targetUrl VARCHAR(500) NOT NULL,
        note VARCHAR(255) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'unassigned',
        assignedClientId VARCHAR(64) NULL,
        assignedClientName VARCHAR(150) NULL,
        assignedClientPhone VARCHAR(20) NULL,
        isLocked BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Clients Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address VARCHAR(255) NOT NULL,
        businessLocation VARCHAR(255) NULL,
        businessType VARCHAR(100) NOT NULL DEFAULT 'General Retail / Service',
        googleMapUrl TEXT NULL,
        googleReviewUrl TEXT NULL,
        logoUrl TEXT NULL,
        qrId VARCHAR(64) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL DEFAULT 'admin@123',
        isLocked BOOLEAN DEFAULT TRUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure googleMapUrl, googleReviewUrl, logoUrl, and businessLocation columns exist
    try {
      await conn.query('ALTER TABLE clients ADD COLUMN googleMapUrl TEXT NULL');
    } catch (colErr) {
      try { await conn.query('ALTER TABLE clients MODIFY COLUMN googleMapUrl TEXT NULL'); } catch (e) { }
    }

    try {
      await conn.query('ALTER TABLE clients ADD COLUMN googleReviewUrl TEXT NULL');
    } catch (colErr) {
      try { await conn.query('ALTER TABLE clients MODIFY COLUMN googleReviewUrl TEXT NULL'); } catch (e) { }
    }

    try {
      await conn.query('ALTER TABLE clients ADD COLUMN logoUrl TEXT NULL');
    } catch (colErr) {
      try { await conn.query('ALTER TABLE clients MODIFY COLUMN logoUrl TEXT NULL'); } catch (e) { }
    }

    try {
      await conn.query('ALTER TABLE clients ADD COLUMN placeId VARCHAR(255) NULL');
    } catch (colErr) {
      try { await conn.query('ALTER TABLE clients MODIFY COLUMN placeId VARCHAR(255) NULL'); } catch (e) { }
    }

    try {
      await conn.query('ALTER TABLE clients ADD COLUMN businessLocation VARCHAR(255) NULL');
    } catch (colErr) {
      try { await conn.query('ALTER TABLE clients MODIFY COLUMN businessLocation VARCHAR(255) NULL'); } catch (e) { }
    }

    try {
      await conn.query('ALTER TABLE clients ADD COLUMN keywords TEXT NULL');
    } catch (colErr) {
      try { await conn.query('ALTER TABLE clients MODIFY COLUMN keywords TEXT NULL'); } catch (e) { }
    }

    try {
      await conn.query('ALTER TABLE clients ADD COLUMN isPhoneMandatory BOOLEAN DEFAULT FALSE');
    } catch (colErr) {
      try { await conn.query('ALTER TABLE clients MODIFY COLUMN isPhoneMandatory BOOLEAN DEFAULT FALSE'); } catch (e) { }
    }

    try {
      await conn.query('ALTER TABLE clients ADD COLUMN cachedAiReviews LONGTEXT NULL');
    } catch (colErr) {
      try { await conn.query('ALTER TABLE clients MODIFY COLUMN cachedAiReviews LONGTEXT NULL'); } catch (e) { }
    }

    try {
      await conn.query('ALTER TABLE clients ADD COLUMN colorTheme VARCHAR(64) NULL DEFAULT NULL');
    } catch (colErr) {
      try { await conn.query('ALTER TABLE clients MODIFY COLUMN colorTheme VARCHAR(64) NULL DEFAULT NULL'); } catch (e) { }
    }

    try {
      await conn.query("ALTER TABLE clients ADD COLUMN subscriptionPlan VARCHAR(100) NOT NULL DEFAULT 'Starter Launch Trial (₹9)'");
    } catch (colErr) {
      try { await conn.query("ALTER TABLE clients MODIFY COLUMN subscriptionPlan VARCHAR(100) NOT NULL DEFAULT 'Starter Launch Trial (₹9)'"); } catch (e) { }
    }

    // Common logic: Extract placeId for any client whose review URL already has placeid=
    try {
      await conn.query(`
        UPDATE clients 
        SET placeId = SUBSTRING_INDEX(SUBSTRING_INDEX(googleReviewUrl, 'placeid=', -1), '&', 1)
        WHERE (placeId IS NULL OR TRIM(placeId) = '') 
          AND googleReviewUrl LIKE '%placeid=%'
      `);
    } catch (e) {}

    // Backfill businessLocation with address for existing clients where businessLocation is null or empty
    try {
      await conn.query(`
        UPDATE clients 
        SET businessLocation = address 
        WHERE (businessLocation IS NULL OR TRIM(businessLocation) = '') 
          AND address IS NOT NULL AND TRIM(address) != ''
      `);
      console.log('[MySQL] Backfilled businessLocation from address for existing clients');
    } catch (backfillErr) {
      console.warn('[MySQL] Migration backfill businessLocation notice:', backfillErr.message);
    }

    // 4. Reviews Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(64) PRIMARY KEY,
        qrId VARCHAR(64) NOT NULL,
        clientId VARCHAR(64) NOT NULL,
        clientName VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NULL DEFAULT '',
        comments TEXT NOT NULL,
        rating INT NULL DEFAULT 5,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try {
      await conn.query("ALTER TABLE reviews MODIFY COLUMN phone VARCHAR(20) NULL DEFAULT ''");
      await conn.query("ALTER TABLE reviews MODIFY COLUMN rating INT NULL DEFAULT 5");
    } catch (alterReviewErr) { }

    // 5. Business Categories Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        label VARCHAR(150) NULL,
        description VARCHAR(255) NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [catCount] = await conn.query('SELECT COUNT(*) as count FROM categories');
    if (catCount[0].count === 0) {
      const defaultCategories = [
        ['cat-1', 'Hotel & Resort', 'Hotel & Resort', 'Luxury stays, boutique rooms, and hospitality'],
        ['cat-2', 'Boutique & Retail', 'Boutique & Fashion Apparel', 'Designer apparel, sarees, and clothing stores'],
        ['cat-3', 'Restaurant & Cafe', 'Restaurant, Bar & Cafe', 'Dine-in, bistros, bakeries, and food points'],
        ['cat-4', 'Salon & Spa', 'Luxury Salon & Spa', 'Hair styling, beauty parlor, and wellness care'],
        ['cat-5', 'Healthcare & Clinic', 'Healthcare & Wellness Clinic', 'Doctors, diagnostic centers, dental & medical'],
        ['cat-6', 'Supermarket / Grocery', 'Supermarket / Retail Store', 'Daily provisions, departmental stores & mart'],
        ['cat-7', 'Gym & Fitness Center', 'Gym & Fitness Center', 'Fitness training, bodybuilding & yoga centers'],
        ['cat-8', 'Automotive & Garage', 'Automotive & Garage', 'Auto repair, car wash & accessories'],
        ['cat-9', 'Education & Coaching', 'Education & Coaching', 'Institutes, tuition centers & academies'],
        ['cat-10', 'Other Business', 'Other Commercial Establishment', 'General commercial services and businesses']
      ];
      for (const [id, name, label, desc] of defaultCategories) {
        await conn.execute(
          'INSERT IGNORE INTO categories (id, name, label, description) VALUES (?, ?, ?, ?)',
          [id, name, label, desc]
        );
      }
      console.log('[MySQL] Seeded default business categories');
    }

    // 6. Scans Table (Tracks each customer scan on standees or review page access)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id VARCHAR(64) PRIMARY KEY,
        qrId VARCHAR(64) NOT NULL,
        clientId VARCHAR(64) NULL,
        clientName VARCHAR(150) NULL,
        ipAddress VARCHAR(64) NULL,
        userAgent TEXT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_qrId (qrId),
        INDEX idx_clientId (clientId),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure scansCount columns exist in qrs and clients tables
    try {
      await conn.query('ALTER TABLE qrs ADD COLUMN scansCount INT NOT NULL DEFAULT 0');
    } catch (colErr) { }

    try {
      await conn.query('ALTER TABLE clients ADD COLUMN scansCount INT NOT NULL DEFAULT 0');
    } catch (colErr) { }

    // 7. Enquiries Table (Business leads from landing page)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id VARCHAR(64) PRIMARY KEY,
        businessName VARCHAR(200) NOT NULL,
        contactPerson VARCHAR(150) NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(150) NULL,
        location VARCHAR(150) NULL,
        businessCategory VARCHAR(100) NULL,
        message TEXT NULL,
        status VARCHAR(30) DEFAULT 'new',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Subscription Plans Table (Customizable tiers for onboarding & portal)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(150) NOT NULL UNIQUE,
        tagline VARCHAR(255) NULL,
        price INT NOT NULL DEFAULT 0,
        billingCycle VARCHAR(50) NOT NULL DEFAULT 'monthly',
        periodLabel VARCHAR(100) NULL,
        description TEXT NULL,
        badge VARCHAR(100) NULL,
        features TEXT NULL,
        hardwareIncluded VARCHAR(255) NULL,
        isDefault BOOLEAN DEFAULT FALSE,
        isActive BOOLEAN DEFAULT TRUE,
        showOnLandingPage BOOLEAN DEFAULT TRUE,
        displayOrder INT NOT NULL DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_isActive (isActive),
        INDEX idx_isDefault (isDefault),
        INDEX idx_showOnLandingPage (showOnLandingPage)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure showOnLandingPage column exists in subscription_plans
    try {
      await conn.query('ALTER TABLE subscription_plans ADD COLUMN showOnLandingPage BOOLEAN DEFAULT TRUE');
    } catch (colErr) { }

    try {
      await conn.query('UPDATE subscription_plans SET showOnLandingPage = 1 WHERE showOnLandingPage IS NULL');
    } catch (e) { }

    const [planCount] = await conn.query('SELECT COUNT(*) as count FROM subscription_plans');
    if (planCount[0].count === 0) {
      const defaultPlans = [
        {
          id: 'plan-starter-trial',
          name: 'Starter Launch Trial (₹9)',
          tagline: 'Experience the full power of AI Google Reviews with zero commitment.',
          price: 9,
          billingCycle: 'trial',
          periodLabel: '7-day trial',
          description: 'Ideal for testing AI review generation and instant Google Place ID redirection.',
          badge: 'SPECIAL LAUNCH OFFER',
          features: JSON.stringify([
            '1 Dynamic QR Code generated instantly',
            'AI Review Generation (English & Tenglish)',
            'Direct Google Maps Place ID link',
            'Auto-Copy Review to customer clipboard',
            '7-Day full access to Client Admin Portal'
          ]),
          hardwareIncluded: 'None (Hardware included in Pro)',
          isDefault: true,
          isActive: true,
          displayOrder: 1
        },
        {
          id: 'plan-pro-yearly',
          name: 'Business Pro Yearly (₹259/mo)',
          tagline: 'Complete turnkey setup with physical acrylic standee hardware and unlimited reviews.',
          price: 259,
          billingCycle: 'yearly',
          periodLabel: 'Billed annually at ₹3,108/yr (Save ₹1,680)',
          description: 'Turnkey plan featuring doorstep delivery of your custom Acrylic QR Standee and unlimited AI reviews.',
          badge: 'MOST POPULAR • ALL-IN-ONE',
          features: JSON.stringify([
            '1 Premium Acrylic QR Standee delivered to door',
            'Unlimited AI 5-Star Reviews generated',
            'Custom Keyword Seeding (up to 10 specialties)',
            'Customer Mobile Capture for WhatsApp offers',
            'Private Feedback Firewall protects 5★ rating',
            '1-Click Excel Reports Export (.xlsx)',
            'Priority WhatsApp support & onboarding'
          ]),
          hardwareIncluded: '1 Premium Acrylic QR Standee (Worth ₹599)',
          isDefault: false,
          isActive: true,
          displayOrder: 2
        },
        {
          id: 'plan-pro-monthly',
          name: 'Business Pro Monthly (₹399/mo)',
          tagline: 'Flexible month-to-month growth setup with acrylic standee and unlimited reviews.',
          price: 399,
          billingCycle: 'monthly',
          periodLabel: 'Billed monthly • Cancel anytime',
          description: 'Full featured plan with monthly billing flexibility and acrylic QR standee.',
          badge: 'FLEXIBLE MONTHLY',
          features: JSON.stringify([
            '1 Premium Acrylic QR Standee delivered to door',
            'Unlimited AI 5-Star Reviews generated',
            'Custom Keyword Seeding (up to 10 specialties)',
            'Customer Mobile Capture for WhatsApp offers',
            'Private Feedback Firewall protects 5★ rating',
            '1-Click Excel Reports Export (.xlsx)'
          ]),
          hardwareIncluded: '1 Premium Acrylic QR Standee',
          isDefault: false,
          isActive: true,
          displayOrder: 3
        },
        {
          id: 'plan-multi-outlet',
          name: 'Multi-Outlet Customizer',
          tagline: 'Scale your local presence across multiple billing counters or store branches.',
          price: 999,
          billingCycle: 'custom',
          periodLabel: 'Custom Multi-branch tailored pricing',
          description: 'Customized multi-location package including custom acrylic standees and centralized master dashboard.',
          badge: 'FRANCHISES & MULTI-BRANCH',
          features: JSON.stringify([
            'Multi-branch Acrylic Standees (1 per counter)',
            'Centralized Master Dashboard for all branches',
            'Consolidated & branch-wise analytics reports',
            'Custom branded standee print with your logo',
            'Dedicated Vasmi Group account manager'
          ]),
          hardwareIncluded: 'Custom Acrylic Standees for all branches',
          isDefault: false,
          isActive: true,
          displayOrder: 4
        }
      ];

      for (const p of defaultPlans) {
        await conn.execute(
          `INSERT IGNORE INTO subscription_plans 
           (id, name, tagline, price, billingCycle, periodLabel, description, badge, features, hardwareIncluded, isDefault, isActive, displayOrder) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.name,
            p.tagline,
            p.price,
            p.billingCycle,
            p.periodLabel,
            p.description,
            p.badge,
            p.features,
            p.hardwareIncluded,
            p.isDefault ? 1 : 0,
            p.isActive ? 1 : 0,
            p.displayOrder
          ]
        );
      }
      console.log('[MySQL] Seeded default customizable subscription plans');
    }

    // Check if initial users exist, seed default if empty
    const [userRows] = await conn.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      await conn.query(`
        INSERT INTO users (id, username, password, name, role, clientId) VALUES
        ('user-superadmin-1', 'sadmin', 'sadmin@123', 'Super Admin', 'superadmin', NULL),
        ('user-client-1', 'admin', 'admin@123', 'Client Admin', 'admin', NULL)
      `);
      console.log('[MySQL] Seeded default superadmin and admin accounts');
    }

    // Migrate any existing clients from db.json if MySQL clients table is empty
    const [clientRows] = await conn.query('SELECT COUNT(*) as count FROM clients');
    const dbJsonPath = path.join(__dirname, '..', 'data', 'db.json');
    if (clientRows[0].count === 0 && fs.existsSync(dbJsonPath)) {
      try {
        const dbJson = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
        if (Array.isArray(dbJson.clients) && dbJson.clients.length > 0) {
          for (const c of dbJson.clients) {
            await conn.execute(
              `INSERT IGNORE INTO clients (id, name, phone, address, businessType, qrId, username, password, isLocked, createdAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                c.id,
                c.name,
                c.phone,
                c.address,
                c.businessType || 'General Retail / Service',
                c.qrId,
                c.username || c.phone,
                c.password || 'admin@123',
                c.isLocked ? 1 : 0,
                c.createdAt ? new Date(c.createdAt) : new Date()
              ]
            );
          }
          console.log(`[MySQL] Migrated ${dbJson.clients.length} existing clients from db.json`);
        }

        // Migrate any existing QRs from db.json if MySQL qrs table is empty
        const [qrRows] = await conn.query('SELECT COUNT(*) as count FROM qrs');
        if (qrRows[0].count === 0 && Array.isArray(dbJson.qrs) && dbJson.qrs.length > 0) {
          for (const q of dbJson.qrs) {
            await conn.execute(
              `INSERT IGNORE INTO qrs (id, qrId, sequence, filename, filePath, targetUrl, note, status, assignedClientId, assignedClientName, assignedClientPhone, isLocked, createdAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                q.id,
                q.qrId,
                q.sequence || 1,
                q.filename,
                q.filePath.replace('new-QRs', 'qr-codes'),
                q.targetUrl,
                q.note || 'Dynamic Standee',
                q.status || 'unassigned',
                q.assignedClient ? q.assignedClient.id : null,
                q.assignedClient ? q.assignedClient.name : null,
                q.assignedClient ? q.assignedClient.phone : null,
                q.isLocked ? 1 : 0,
                q.createdAt ? new Date(q.createdAt) : new Date()
              ]
            );
          }
          console.log(`[MySQL] Migrated ${dbJson.qrs.length} existing QRs from db.json`);
        }
      } catch (migErr) {
        console.warn('[MySQL] Migration from db.json notice:', migErr.message);
      }
    }

    // 6. Auto-migrate any existing localhost targetUrls to production domain + business name format
    try {
      const frontendUrl = (process.env.FRONTEND_URL || 'https://qr.vasmigroup.com').replace(/\/+$/, '');
      const [allQrs] = await conn.query('SELECT q.id, q.qrId, c.name as clientName FROM qrs q LEFT JOIN clients c ON q.assignedClientId = c.id');
      for (const q of allQrs) {
        if (q.clientName) {
          const slug = generateSlug(q.clientName);
          await conn.execute('UPDATE qrs SET targetUrl = ? WHERE id = ?', [`${frontendUrl}/${slug}`, q.id]);
        }
      }
    } catch (qrUrlErr) {
      console.warn('[MySQL] Migration update qr targetUrl notice:', qrUrlErr.message);
    }

    conn.release();
    console.log('[MySQL] Database tables and schemas ready!');
  } catch (err) {
    console.error('[MySQL] Database initialization error:', err.message);
    throw err;
  }
}

export {
  pool,
  query,
  initDatabase
};

export default {
  pool,
  query,
  initDatabase
};
