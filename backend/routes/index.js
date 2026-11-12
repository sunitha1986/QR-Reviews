import express from 'express';
import authRoutes from './authRoutes.js';
import qrRoutes from './qrRoutes.js';
import clientRoutes from './clientRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import publicRoutes from './publicRoutes.js';
import aiRoutes from './aiRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import statRoutes from './statRoutes.js';
import ClientController from '../controllers/clientController.js';

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: process.env.DB_NAME || 'u597277762_qr_reviews',
    storage: 'backend/uploads/qr-codes',
    time: new Date().toISOString()
  });
});

// Logo upload routes
router.post('/upload/logo', ClientController.uploadLogo);
router.post('/upload/logo-url', ClientController.downloadLogoFromUrl);
router.post('/upload/logo-from-url', ClientController.downloadLogoFromUrl);

// Mount feature routes
router.use('/auth', authRoutes);
router.use('/qr', qrRoutes);
router.use('/clients', clientRoutes);
router.use('/categories', categoryRoutes);
router.use('/public/ai', aiRoutes);
router.use('/public', publicRoutes);
router.use('/reviews', reviewRoutes);
router.use('/stats', statRoutes);

export default router;
