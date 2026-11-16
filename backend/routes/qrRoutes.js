import express from 'express';
import QrController from '../controllers/qrController.js';

const router = express.Router();

// POST /api/qr/generate
router.post('/generate', QrController.generateQr);

// POST /api/qr/generate-batch
router.post('/generate-batch', QrController.generateBatchQrs);

// GET /api/qr/all
router.get('/all', QrController.getAllQrs);

// DELETE /api/qr/all (Clear all generated QR codes)
router.delete('/all', QrController.removeAllQrs);

// GET /api/qr/unassigned
router.get('/unassigned', QrController.getUnassignedQrs);

// GET /api/qr (alias)
router.get('/', QrController.getAllQrs);

// GET /api/qr/:qrId
router.get('/:qrId', QrController.getQrById);

// DELETE /api/qr/:qrId (Delete single QR code)
router.delete('/:qrId', QrController.deleteQrById);

export default router;
