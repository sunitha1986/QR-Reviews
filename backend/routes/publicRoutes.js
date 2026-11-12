import express from 'express';
import PublicController from '../controllers/publicController.js';
import ReviewController from '../controllers/reviewController.js';

const router = express.Router();

// GET /api/public/qr-info/:qrId
router.get('/qr-info/:qrId', PublicController.getQrInfo);

// POST /api/public/scan-hit
router.post('/scan-hit', PublicController.recordScanHit);

// POST /api/public/submit-review
router.post('/submit-review', ReviewController.submitReview);

// POST /api/public/enquiry
router.post('/enquiry', PublicController.submitEnquiry);

export default router;
