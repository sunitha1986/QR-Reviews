import { v4 as uuidv4 } from 'uuid';
import { Qr } from '../models/index.js';
import { generateUniqueQrId, generateAndSaveQRCode } from '../services/qrService.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://qr.vasmigroup.com';

/**
 * QR Code Generation & Management Controller
 */
class QrController {
  /**
   * Generate a dynamic QR code auto-assigning sequential format: QR000001
   * POST /api/qr/generate
   */
  static async generateQr(req, res) {
    try {
      const allQrs = await Qr.getAll();
      const nextSeq = await Qr.calculateNextSequence();
      const qrId = generateUniqueQrId(nextSeq, allQrs);

      const qrResult = await generateAndSaveQRCode(qrId, FRONTEND_URL);

      const newQrRecord = {
        id: 'qr-' + uuidv4(),
        qrId: qrResult.qrId,
        sequence: nextSeq,
        filename: qrResult.filename,
        filePath: qrResult.relativeFilePath,
        targetUrl: qrResult.targetUrl,
        note: `Dynamic Standee #${String(nextSeq).padStart(6, '0')}`,
        createdAt: new Date().toISOString(),
        status: 'unassigned',
        assignedClient: null
      };

      const inserted = await Qr.insert(newQrRecord);

      res.status(201).json({
        success: true,
        message: 'Dynamic QR generated successfully and saved to DB',
        qr: inserted
      });
    } catch (err) {
      console.error('Error generating QR:', err);
      res.status(500).json({ error: 'Failed to generate dynamic QR code: ' + err.message });
    }
  }

  /**
   * Batch generate sequential QR codes
   * POST /api/qr/generate-batch
   */
  static async generateBatchQrs(req, res) {
    try {
      const { count = 3 } = req.body;
      const num = Math.min(Math.max(parseInt(count, 10) || 1, 1), 50);
      const allQrs = await Qr.getAll();
      let currentSeq = await Qr.calculateNextSequence();
      const generated = [];

      for (let i = 0; i < num; i++) {
        const qrId = generateUniqueQrId(currentSeq, [...allQrs, ...generated]);
        const qrResult = await generateAndSaveQRCode(qrId, FRONTEND_URL);
        const record = {
          id: 'qr-' + uuidv4(),
          qrId: qrResult.qrId,
          sequence: currentSeq,
          filename: qrResult.filename,
          filePath: qrResult.relativeFilePath,
          targetUrl: qrResult.targetUrl,
          note: `Dynamic Standee Batch #${String(currentSeq).padStart(6, '0')}`,
          createdAt: new Date().toISOString(),
          status: 'unassigned',
          assignedClient: null
        };
        const inserted = await Qr.insert(record);
        generated.push(inserted);
        currentSeq++;
      }

      res.status(201).json({
        success: true,
        count: generated.length,
        qrs: generated
      });
    } catch (err) {
      console.error('Batch QR generation error:', err);
      res.status(500).json({ error: 'Batch QR generation failed: ' + err.message });
    }
  }

  /**
   * List all QR codes with sequencing summary
   * GET /api/qr/all or GET /api/qr
   */
  static async getAllQrs(req, res) {
    try {
      const qrs = await Qr.getAll();
      const nextSeq = await Qr.calculateNextSequence();
      res.json({
        total: qrs.length,
        nextSequence: nextSeq,
        nextSequenceFormatted: String(nextSeq).padStart(6, '0'),
        unassignedCount: qrs.filter(q => q.status === 'unassigned').length,
        assignedCount: qrs.filter(q => q.status === 'assigned').length,
        qrs
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch QRs from DB: ' + err.message });
    }
  }

  /**
   * List unassigned QR codes for onboarding dropdown
   * GET /api/qr/unassigned
   */
  static async getUnassignedQrs(req, res) {
    try {
      const unassigned = await Qr.getUnassigned();
      res.json({
        count: unassigned.length,
        qrs: unassigned
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch unassigned QRs: ' + err.message });
    }
  }

  /**
   * Find single QR by qrId
   * GET /api/qr/:qrId
   */
  static async getQrById(req, res) {
    try {
      const { qrId } = req.params;
      const qr = await Qr.findByQrId(qrId);
      if (!qr) {
        return res.status(404).json({ error: 'QR Code not found' });
      }
      res.json({ qr });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch QR: ' + err.message });
    }
  }
}

export { QrController };
export default QrController;
