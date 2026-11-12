import express from 'express';
import AuthController from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', AuthController.login);

// PUT /api/auth/profile
router.put('/profile', AuthController.updateProfile);

export default router;
