import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Review, Qr, Client, Stat } from '../models/index.js';
import { recordReviewInExcel, getClientExcelPath, getMasterExcelPath } from '../services/excelService.js';
import { extractPlaceId, buildGoogleReviewUrl } from '../utils/placeId.js';

/**
 * Reviews & Customer Feedback Controller
 */
class ReviewController {
  /**
   * Submit customer review -> saves to DB + records in Excel sheet
   * POST /api/public/submit-review or POST /api/reviews/submit
   */
  static async submitReview(req, res) {
    try {
      const { qrId, phone, comments, rating } = req.body;

      if (!comments || !comments.trim()) {
        return res.status(400).json({ error: 'Customer review comments are required.' });
      }

      let cleanPhone = '';
      if (phone && phone.toString().trim()) {
        cleanPhone = phone.toString().replace(/\D/g, '');
        if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
          return res.status(400).json({ error: 'Customer phone number must be exactly 10 digits if provided.' });
        }
      }

      let qr = await Qr.findByQrId(qrId);
      let client = null;
      if (qr && qr.assignedClient && qr.assignedClient.id) {
        client = await Client.findById(qr.assignedClient.id);
      }
      if (!client && qr) {
        client = await Client.findByIdOrQr(qr.qrId);
      }

      // In case qrId was passed as a client slug
      if (!qr || !client) {
        client = await Client.findByIdOrQrOrSlug(qrId);
        if (client && client.qrId) {
          qr = await Qr.findByQrId(client.qrId);
        }
      }

      // Must be assigned to accept reviews
      if (!qr || qr.status !== 'assigned' || !client) {
        return res.status(400).json({
          error: 'This QR code is generic and unassigned. Please onboard a client before customer reviews can be submitted.'
        });
      }

      // Enforce mandatory phone number if configured by business admin
      if (client.isPhoneMandatory) {
        if (!cleanPhone || cleanPhone.length !== 10) {
          return res.status(400).json({ error: 'Customer mobile number (10 digits) is mandatory for this business.' });
        }
      }

      const reviewRecord = {
        id: 'rev-' + uuidv4().slice(0, 8),
        qrId: qr.qrId,
        clientId: client.id,
        clientName: client.name,
        phone: cleanPhone,
        comments: comments.trim(),
        rating: rating ? Number(rating) : 5,
        createdAt: new Date().toISOString()
      };

      // 1. Save customer review directly to MySQL database
      await Review.insert(reviewRecord);

      // 2. Also record in Excel sheet via ExcelJS (reviews_<clientId>.xlsx and reviews_master.xlsx)
      try {
        await recordReviewInExcel(reviewRecord);
      } catch (excelErr) {
        console.warn('[Excel Warning] Could not append to Excel file:', excelErr.message);
      }

      // Universal common logic to resolve Google Review URL
      const clientLoc = client.businessLocation || client.address || '';
      const resolvedPlaceId = client.placeId || extractPlaceId(client.googleReviewUrl);
      let targetGoogleUrl = null;

      if (resolvedPlaceId) {
        targetGoogleUrl = buildGoogleReviewUrl(resolvedPlaceId);
      } else if (client.googleReviewUrl && client.googleReviewUrl.trim()) {
        targetGoogleUrl = client.googleReviewUrl.trim();
        if (!/^https?:\/\//i.test(targetGoogleUrl)) {
          targetGoogleUrl = 'https://' + targetGoogleUrl;
        }
      } else {
        targetGoogleUrl = buildGoogleReviewUrl('', `${client.name} ${clientLoc}`);
      }

      res.status(201).json({
        success: true,
        message: 'Review successfully recorded into Database and Excel sheet!',
        review: reviewRecord,
        googleReviewUrl: targetGoogleUrl
      });
    } catch (err) {
      console.error('Error submitting review to DB:', err);
      res.status(500).json({ error: 'Failed to record review: ' + err.message });
    }
  }

  /**
   * Get all reviews across all clients
   * GET /api/reviews
   */
  static async getAllReviews(req, res) {
    try {
      const reviews = await Review.getAll();
      res.json({
        count: reviews.length,
        reviews
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch all reviews: ' + err.message });
    }
  }

  /**
   * Get reviews for a specific client
   * GET /api/reviews/client/:clientId
   */
  static async getClientReviews(req, res) {
    try {
      const { clientId } = req.params;
      const client = await Client.findByIdOrQr(clientId);
      const reviews = await Review.getByClientId(client ? client.id : clientId, client ? client.qrId : clientId);

      res.json({
        count: reviews.length,
        reviews
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch reviews: ' + err.message });
    }
  }

  /**
   * Export client reviews to Excel file
   * GET /api/reviews/export/:clientId
   */
  static async exportClientReviews(req, res) {
    const { clientId } = req.params;
    const filePath = getClientExcelPath(clientId);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Excel sheet not found for this client. No reviews logged yet.' });
    }

    const ext = filePath.toLowerCase().endsWith('.csv') ? 'csv' : 'xlsx';
    const filename = `Reviews_${clientId}_${new Date().toISOString().slice(0, 10)}.${ext}`;
    res.download(filePath, filename);
  }

  /**
   * Export all reviews to master Excel file
   * GET /api/reviews/export-master
   */
  static async exportMasterReviews(req, res) {
    const filePath = getMasterExcelPath();

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Master Excel sheet not found. No reviews logged yet.' });
    }

    const ext = filePath.toLowerCase().endsWith('.csv') ? 'csv' : 'xlsx';
    const filename = `Master_Reviews_${new Date().toISOString().slice(0, 10)}.${ext}`;
    res.download(filePath, filename);
  }

  /**
   * Summary dashboard statistics
   * GET /api/stats
   */
  static async getStats(req, res) {
    try {
      const stats = await Stat.getSystemStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch stats: ' + err.message });
    }
  }
}

export { ReviewController };
export default ReviewController;
