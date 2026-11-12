import express from 'express';
import AiController from '../controllers/aiController.js';

const router = express.Router();

// POST /api/public/ai/suggestions
router.post('/suggestions', AiController.generateSuggestions);

// POST /api/public/ai/polish
router.post('/polish', AiController.polishComment);

export default router;
