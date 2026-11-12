import express from 'express';
import ReviewController from '../controllers/reviewController.js';

const router = express.Router();

// GET /api/reviews
router.get('/', ReviewController.getAllReviews);

// POST /api/reviews/submit
router.post('/submit', ReviewController.submitReview);

// GET /api/reviews/client/:clientId
router.get('/client/:clientId', ReviewController.getClientReviews);

// GET /api/reviews/export/:clientId
router.get('/export/:clientId', ReviewController.exportClientReviews);

// GET /api/reviews/export-master
router.get('/export-master', ReviewController.exportMasterReviews);

export default router;
