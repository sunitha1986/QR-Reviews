import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { Qr } from '../models/index.js';
import { generateUniqueQrId, generateAndSaveQRCode, QR_DIR } from '../services/qrService.js';

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
      let nextSeq = 1;
      try {
        nextSeq = await Qr.calculateNextSequence();
      } catch (seqErr) {
        console.warn('Could not calculate next sequence from DB, falling back to count:', seqErr.message);
        nextSeq = (qrs.length || 0) + 1;
      }

      res.json({
        total: Array.isArray(qrs) ? qrs.length : 0,
        nextSequence: nextSeq,
        nextSequenceFormatted: String(nextSeq).padStart(6, '0'),
        unassignedCount: Array.isArray(qrs) ? qrs.filter(q => q && q.status === 'unassigned').length : 0,
        assignedCount: Array.isArray(qrs) ? qrs.filter(q => q && q.status === 'assigned').length : 0,
        qrs: Array.isArray(qrs) ? qrs : []
      });
    } catch (err) {
      console.error('Error in getAllQrs:', err.message);
      res.json({
        total: 0,
        nextSequence: 1,
        nextSequenceFormatted: '000001',
        unassignedCount: 0,
        assignedCount: 0,
        qrs: [],
        fallback: true,
        error: err.message
      });
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

  /**
   * Delete all QR codes, clean up storage, and reset sequence
   * DELETE /api/qr/all
   */
  static async removeAllQrs(req, res) {
    try {
      const result = await Qr.deleteAll();

      // Clean up physical files from disk
      try {
        if (Array.isArray(result.qrs)) {
          for (const qr of result.qrs) {
            if (qr && qr.filename) {
              const p = path.join(QR_DIR, qr.filename);
              if (fs.existsSync(p)) {
                try { fs.unlinkSync(p); } catch (e) {}
              }
            }
          }
        }
        // Cleanup any remaining png files in QR_DIR to ensure a clean slate
        if (fs.existsSync(QR_DIR)) {
          const files = fs.readdirSync(QR_DIR);
          for (const file of files) {
            if (file.toLowerCase().endsWith('.png')) {
              try {
                fs.unlinkSync(path.join(QR_DIR, file));
              } catch (e) {}
            }
          }
        }
      } catch (fileErr) {
        console.warn('[QrController] Error removing QR image files:', fileErr.message);
      }

      res.json({
        success: true,
        message: `Successfully cleared all QR codes (${result.deletedCount || 0} removed). Sequence reset to QR000001.`,
        deletedCount: result.deletedCount || 0
      });
    } catch (err) {
      console.error('Error clearing all QRs:', err);
      res.status(500).json({ error: 'Failed to clear all QR codes: ' + err.message });
    }
  }

  /**
   * Delete single QR code by qrId
   * DELETE /api/qr/:qrId
   */
  static async deleteQrById(req, res) {
    try {
      const { qrId } = req.params;
      const deletedQr = await Qr.deleteByQrId(qrId);
      if (!deletedQr) {
        return res.status(404).json({ error: 'QR Code not found' });
      }

      // Delete physical file
      if (deletedQr.filename) {
        const p = path.join(QR_DIR, deletedQr.filename);
        if (fs.existsSync(p)) {
          try {
            fs.unlinkSync(p);
          } catch (e) {}
        }
      }

      res.json({
        success: true,
        message: `QR code ${qrId} deleted successfully`,
        qr: deletedQr
      });
    } catch (err) {
      console.error('Error deleting QR:', err);
      res.status(500).json({ error: 'Failed to delete QR code: ' + err.message });
    }
  }
}

export { QrController };
export default QrController;
