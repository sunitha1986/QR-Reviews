import { Qr, Client, Review, Scan } from '../models/index.js';
import { generateSlug } from '../utils/slug.js';

/**
 * Public Access Controller (QR Scan & Standee Info)
 */
class PublicController {
  /**
   * Public info when customer scans QR code or visits /review/:slug
   * GET /api/public/qr-info/:qrId
   */
  static async getQrInfo(req, res) {
    try {
      const { qrId } = req.params;
      let qr = await Qr.findByQrId(qrId);
      if (!qr && qrId && qrId.includes('-')) {
        qr = await Qr.findByQrId(qrId.replace(/^QR-/i, 'QR'));
      }
      let client = null;

      if (qr) {
        if (qr.assignedClient && qr.assignedClient.id) {
          client = await Client.findById(qr.assignedClient.id);
        }
        if (!client) {
          client = await Client.findByIdOrQr(qr.qrId);
        }
      } else {
        // If not a QR ID, check if it's a client slug, name, or client ID
        client = await Client.findByIdOrQrOrSlug(qrId);
        if (client && client.qrId) {
          qr = await Qr.findByQrId(client.qrId);
        }
      }

      if (!qr && !client) {
        return res.status(404).json({
          error: 'Review target or QR Code not found',
          valid: false
        });
      }

      // Record customer scan hit asynchronously
      const activeQrId = qr ? qr.qrId : (client?.qrId || qrId);
      Scan.recordScan({
        qrId: activeQrId,
        clientId: client?.id || null,
        clientName: client?.name || null,
        ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip,
        userAgent: req.headers['user-agent']
      }).catch(scanErr => {
        console.warn('[PublicController] Scan tracking notice:', scanErr.message);
      });

      const isAssigned = (qr?.status === 'assigned' || !!client) && !!client;
      const clientSlug = client ? (client.slug || generateSlug(client.name)) : null;

      if (!isAssigned) {
        return res.json({
          valid: true,
          isAssigned: false,
          status: 'unassigned',
          qrId: qr ? qr.qrId : qrId,
          slug: null,
          message: 'This dynamic QR code is generic and empty. Please onboard a client to activate this review standee.'
        });
      }

      // Load all previous review comments for this business to ensure suggestions are never repeated
      let usedReviews = [];
      try {
        usedReviews = await Review.getUsedComments(client.id, qr ? qr.qrId : client.qrId);
      } catch (e) {
        console.warn('Could not fetch usedReviews for qr-info:', e.message);
      }

      res.json({
        valid: true,
        isAssigned: true,
        qrId: qr ? qr.qrId : client.qrId,
        slug: clientSlug,
        status: qr ? qr.status : 'assigned',
        usedReviews: usedReviews || [],
        client: {
          id: client.id,
          name: client.name,
          slug: clientSlug,
          phone: client.phone,
          address: client.address,
          businessLocation: client.businessLocation || client.address || '',
          businessType: client.businessType,
          googleMapUrl: client.googleMapUrl || null,
          googleReviewUrl: client.googleReviewUrl || null,
          logoUrl: client.logoUrl || null,
          keywords: client.keywords || '',
          isPhoneMandatory: Boolean(client.isPhoneMandatory)
        }
      });
    } catch (err) {
      console.error('Error in /api/public/qr-info:', err);
      res.status(500).json({ error: 'Failed to load QR info: ' + err.message });
    }
  }

  /**
   * Explicit scan hit trigger
   * POST /api/public/scan-hit
   */
  static async recordScanHit(req, res) {
    try {
      const { qrId, clientId } = req.body;
      if (!qrId && !clientId) {
        return res.status(400).json({ error: 'qrId or clientId is required' });
      }
      const result = await Scan.recordScan({
        qrId,
        clientId,
        ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip,
        userAgent: req.headers['user-agent']
      });
      res.json({ success: true, scanId: result?.id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to record scan hit: ' + err.message });
    }
  }

  /**
   * Submit business enquiry from landing page
   * POST /api/public/enquiry
   */
  static async submitEnquiry(req, res) {
    try {
      const { businessName, contactPerson, phone, email, location, businessCategory, message } = req.body;
      if (!businessName || !phone) {
        return res.status(400).json({ error: 'Business name and phone number are required.' });
      }

      const { pool } = await import('../config/db.js');
      const enquiryId = `enq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        await pool.execute(
          `INSERT INTO enquiries (id, businessName, contactPerson, phone, email, location, businessCategory, message, status, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', NOW())`,
          [
            enquiryId,
            String(businessName).trim().slice(0, 200),
            contactPerson ? String(contactPerson).trim().slice(0, 150) : null,
            String(phone).trim().slice(0, 20),
            email ? String(email).trim().slice(0, 150) : null,
            location ? String(location).trim().slice(0, 150) : null,
            businessCategory ? String(businessCategory).trim().slice(0, 100) : null,
            message ? String(message).trim().slice(0, 2000) : null
          ]
        );
      } catch (dbErr) {
        console.warn('[PublicController] Enquiries table insert notice:', dbErr.message);
      }

      res.status(201).json({
        success: true,
        enquiryId,
        message: 'Thank you! Your enquiry has been received. Our team will contact you shortly.'
      });
    } catch (err) {
      console.error('Error submitting enquiry:', err);
      res.status(500).json({ error: 'Failed to submit enquiry: ' + err.message });
    }
  }
}

export { PublicController };
export default PublicController;
