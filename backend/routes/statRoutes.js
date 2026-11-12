import express from 'express';
import ReviewController from '../controllers/reviewController.js';

const router = express.Router();

// GET /api/stats
router.get('/', ReviewController.getStats);

export default router;
