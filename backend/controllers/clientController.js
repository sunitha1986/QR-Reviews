import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Client, Qr, Review } from '../models/index.js';
import { generateUniqueQrId, generateAndSaveQRCode, generateClientQrCode } from '../services/qrService.js';
import { LOGOS_DIR } from '../config/constants.js';
import { extractPlaceId, buildGoogleReviewUrl } from '../utils/placeId.js';
import { cleanPhoneNumber } from '../utils/phone.js';
import { downloadAndSaveExternalLogo } from '../utils/imageDownloader.js';
import { invalidateAiCache } from '../services/aiCache.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://qr.vasmigroup.com';

/**
 * Client Management Controller
 */
class ClientController {
  /**
   * Upload client business logo (Base64 data URI)
   * POST /api/upload/logo
   */
  static async uploadLogo(req, res) {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      let ext = 'png';
      let buffer;
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1].toLowerCase();
        if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
        else if (mime.includes('svg')) ext = 'svg';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(imageBase64, 'base64');
      }

      if (!fs.existsSync(LOGOS_DIR)) {
        fs.mkdirSync(LOGOS_DIR, { recursive: true });
      }

      const safeName = `logo_${Date.now()}_${uuidv4().slice(0, 6)}.${ext}`;
      const targetPath = path.join(LOGOS_DIR, safeName);
      fs.writeFileSync(targetPath, buffer);

      const publicUrl = `/uploads/logos/${safeName}`;
      res.json({
        success: true,
        url: publicUrl,
        filename: safeName
      });
    } catch (err) {
      console.error('Error uploading business logo:', err);
      res.status(500).json({ error: 'Failed to upload logo: ' + err.message });
    }
  }

  /**
   * Download external logo from URL and return local public path
   * POST /api/upload/logo-url
   */
  static async downloadLogoFromUrl(req, res) {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.trim()) {
        return res.status(400).json({ error: 'Valid image URL is required' });
      }

      const localPath = await downloadAndSaveExternalLogo(url.trim());
      const isDownloaded = typeof localPath === 'string' && localPath.startsWith('/uploads/');

      res.json({
        success: true,
        url: localPath,
        isDownloaded,
        message: isDownloaded ? 'Logo successfully downloaded and saved locally' : 'Using provided URL'
      });
    } catch (err) {
      console.error('Error downloading logo from URL:', err);
      res.status(500).json({ error: 'Failed to download logo: ' + err.message });
    }
  }

  /**
   * Onboard a new client & integrate dynamic QR
   * POST /api/clients/onboard
   */
  static async onboardClient(req, res) {
    try {
      const { name, phone, address, businessLocation, businessType, qrId, customPassword, googleMapUrl, googleReviewUrl, placeId, logoUrl, isPhoneMandatory } = req.body;

      if (!name || !phone || !address || (!placeId && !googleReviewUrl) || !businessType || !businessType.trim()) {
        return res.status(400).json({ error: 'Client name, phone number, Google Place ID, full address, and business category are required' });
      }

      // Universal common logic: resolve Place ID and direct review URL
      const cleanPlaceId = extractPlaceId(placeId || googleReviewUrl);
      const formattedReviewUrl = cleanPlaceId
        ? buildGoogleReviewUrl(cleanPlaceId)
        : (googleReviewUrl ? googleReviewUrl.trim() : null);

      const cleanPhone = phone ? cleanPhoneNumber(phone) : '';
      if (!/^\d{10}$/.test(cleanPhone)) {
        return res.status(400).json({ error: 'Phone number must be a valid 10-digit mobile number.' });
      }

      let assignedQrId = qrId;

      // Prevent duplicate assignment if QR is already linked to another client
      if (assignedQrId && assignedQrId !== 'auto') {
        const existingQr = await Qr.findByQrId(assignedQrId);
        if (existingQr && existingQr.status === 'assigned') {
          const clientName = existingQr.assignedClient?.name || 'another business';
          return res.status(400).json({
            error: `QR Standee ${assignedQrId} is already assigned to ${clientName}. It cannot be assigned again.`
          });
        }
      }

      // If no qrId selected or requested auto-generate, create a new one
      if (!assignedQrId || assignedQrId === 'auto') {
        const allQrs = await Qr.getAll();
        const nextSeq = await Qr.calculateNextSequence();
        const newQrId = generateUniqueQrId(nextSeq, allQrs);
        const qrResult = await generateAndSaveQRCode(newQrId, FRONTEND_URL);
        const newQrRecord = {
          id: 'qr-' + uuidv4(),
          qrId: qrResult.qrId,
          sequence: nextSeq,
          filename: qrResult.filename,
          filePath: qrResult.relativeFilePath,
          targetUrl: qrResult.targetUrl,
          note: `Assigned to ${name.trim()}`,
          createdAt: new Date().toISOString(),
          status: 'assigned',
          isLocked: true,
          assignedClient: {
            id: null,
            name: name.trim(),
            phone: cleanPhone
          }
        };
        await Qr.insert(newQrRecord);
        assignedQrId = newQrId;
      }

      const clientId = 'client-' + uuidv4().slice(0, 8);
      const cleanUsername = cleanPhone || `client_${Date.now().toString().slice(-4)}`;
      const clientPassword = customPassword && customPassword.trim() ? customPassword.trim() : 'admin@123';

      // If logoUrl is an external link or data URI, download and store locally in uploads/logos
      let finalLogoUrl = logoUrl ? logoUrl.trim() : null;
      if (finalLogoUrl && (finalLogoUrl.startsWith('http://') || finalLogoUrl.startsWith('https://') || finalLogoUrl.startsWith('data:image/'))) {
        finalLogoUrl = await downloadAndSaveExternalLogo(finalLogoUrl);
      }

      const newClient = {
        id: clientId,
        name: name.trim(),
        phone: cleanPhone,
        address: address.trim(),
        businessLocation: (businessLocation && businessLocation.trim()) ? businessLocation.trim() : address.trim(),
        businessType: businessType.trim(),
        googleMapUrl: googleMapUrl ? googleMapUrl.trim() : null,
        googleReviewUrl: formattedReviewUrl,
        placeId: cleanPlaceId || null,
        logoUrl: finalLogoUrl || null,
        qrId: assignedQrId,
        username: cleanUsername,
        password: clientPassword,
        isLocked: true,
        isPhoneMandatory: isPhoneMandatory === true || isPhoneMandatory === 'true' || isPhoneMandatory === 1 || isPhoneMandatory === '1',
        createdAt: new Date().toISOString()
      };

      // Generate QR code encoding domain + business slug (e.g. https://qr.vasmigroup.com/mitraa-super-market)
      const qrResult = await generateClientQrCode(assignedQrId, newClient.name, FRONTEND_URL);

      // Update QR status and targetUrl in database
      await Qr.updateAssignment(assignedQrId, {
        status: 'assigned',
        assignedClientId: clientId,
        assignedClientName: newClient.name,
        assignedClientPhone: newClient.phone,
        isLocked: true,
        note: `Assigned to ${newClient.name}`,
        targetUrl: qrResult.targetUrl
      });

      const insertedClient = await Client.insert(newClient);

      res.status(201).json({
        success: true,
        message: 'Client onboarded and QR integrated successfully in DB',
        client: insertedClient
      });
    } catch (err) {
      console.error('Error onboarding client:', err);
      res.status(500).json({ error: 'Client onboarding failed: ' + err.message });
    }
  }

  /**
   * List all onboarded clients with QR and reviews statistics
   * GET /api/clients
   */
  static async getAllClients(req, res) {
    try {
      const clients = await Client.getAll();
      const qrs = await Qr.getAll();
      const allReviews = await Review.getAll();

      const clientsWithQrAndReviews = clients.map(client => {
        const qr = qrs.find(q => q.qrId.toUpperCase() === client.qrId.toUpperCase());
        const reviews = allReviews.filter(r => r.clientId === client.id || (qr && r.qrId.toUpperCase() === qr.qrId.toUpperCase()));
        const avgRating = reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
          : null;

        return {
          ...client,
          qrDetails: qr || null,
          reviewsCount: reviews.length,
          averageRating: avgRating
        };
      });

      res.json({
        total: clientsWithQrAndReviews.length,
        clients: clientsWithQrAndReviews
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch clients: ' + err.message });
    }
  }

  /**
   * Get single client details
   * GET /api/clients/:clientId
   */
  static async getClientById(req, res) {
    try {
      const { clientId } = req.params;
      const client = await Client.findByIdOrQr(clientId);

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const qr = await Qr.findByQrId(client.qrId);
      const reviews = await Review.getByClientId(client.id, client.qrId);

      res.json({
        client,
        qrDetails: qr || null,
        reviewsCount: reviews.length,
        reviews
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load client details: ' + err.message });
    }
  }

  /**
   * Get client custom keywords
   * GET /api/clients/:clientId/keywords
   */
  static async getClientKeywords(req, res) {
    try {
      const { clientId } = req.params;
      const client = await Client.findByIdOrQr(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      res.json({
        success: true,
        clientId: client.id,
        clientName: client.name,
        businessType: client.businessType,
        keywords: client.keywords || ''
      });
    } catch (err) {
      console.error('Error fetching client keywords:', err);
      res.status(500).json({ error: 'Failed to fetch keywords: ' + err.message });
    }
  }

  /**
   * Update client custom keywords for AI review generation
   * PUT /api/clients/:clientId/keywords
   */
  static async updateClientKeywords(req, res) {
    try {
      const { clientId } = req.params;
      const { keywords } = req.body;

      const client = await Client.findByIdOrQr(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const updated = await Client.updateKeywords(client.id, keywords);
      invalidateAiCache(client.id);
      invalidateAiCache(client.qrId);

      res.json({
        success: true,
        message: 'Keywords updated successfully! Review suggestions will now highlight these features.',
        keywords: updated.keywords || '',
        client: updated
      });
    } catch (err) {
      console.error('Error updating client keywords:', err);
      res.status(500).json({ error: 'Failed to update keywords: ' + err.message });
    }
  }

  /**
   * Update client details
   * PUT /api/clients/:clientId
   */
  static async updateClient(req, res) {
    try {
      const { clientId } = req.params;
      const { name, phone, address, businessLocation, businessType, qrId, googleMapUrl, googleReviewUrl, placeId, logoUrl, isPhoneMandatory } = req.body;

      const existingClient = await Client.findById(clientId);
      if (!existingClient) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const cleanPhone = phone ? cleanPhoneNumber(phone) : existingClient.phone;
      if (!/^\d{10}$/.test(cleanPhone)) {
        return res.status(400).json({ error: 'Phone number must be a valid 10-digit mobile number.' });
      }

      if (businessType !== undefined && !businessType.trim()) {
        return res.status(400).json({ error: 'Business category is required.' });
      }

      const clientName = name ? name.trim() : existingClient.name;
      const oldQrId = existingClient.qrId;
      const newQrId = (qrId && qrId.trim()) ? qrId.trim() : existingClient.qrId;

      if (newQrId && oldQrId && oldQrId !== newQrId) {
        // Check if new QR is already assigned to another client
        const targetQr = await Qr.findByQrId(newQrId);
        if (targetQr && targetQr.assignedClient && targetQr.assignedClient.id && targetQr.assignedClient.id !== existingClient.id) {
          return res.status(400).json({ error: `QR code ${newQrId} is already assigned to ${targetQr.assignedClient.name || 'another client'}.` });
        }

        // Free up old QR to unassigned/generic empty state
        try {
          const oldQrResult = await generateAndSaveQRCode(oldQrId, FRONTEND_URL);
          await Qr.updateAssignment(oldQrId, {
            status: 'unassigned',
            assignedClientId: null,
            assignedClientName: null,
            assignedClientPhone: null,
            isLocked: false,
            note: 'Generic Empty QR (Unlinked)',
            targetUrl: oldQrResult.targetUrl
          });
        } catch (oldQrErr) {
          console.warn(`[ClientController] Error resetting old QR ${oldQrId}:`, oldQrErr.message);
        }
      }

      // Re-generate assigned QR with latest business name slug
      if (newQrId) {
        const qrResult = await generateClientQrCode(newQrId, clientName, FRONTEND_URL);
        await Qr.updateAssignment(newQrId, {
          status: 'assigned',
          assignedClientId: existingClient.id,
          assignedClientName: clientName,
          assignedClientPhone: cleanPhone,
          isLocked: true,
          note: `Assigned to ${clientName}`,
          targetUrl: qrResult.targetUrl
        });
      }

      // Universal common logic: resolve Place ID and review URL
      let cleanPlaceId = existingClient.placeId;
      let formattedReviewUrl = existingClient.googleReviewUrl;

      if (placeId !== undefined || googleReviewUrl !== undefined) {
        const candidate = (placeId !== undefined && placeId !== null) ? placeId : (googleReviewUrl || '');
        const extracted = extractPlaceId(candidate);
        if (extracted) {
          cleanPlaceId = extracted;
          formattedReviewUrl = buildGoogleReviewUrl(extracted);
        } else if (placeId !== undefined && !placeId) {
          cleanPlaceId = null;
          formattedReviewUrl = googleReviewUrl !== undefined ? (googleReviewUrl ? googleReviewUrl.trim() : null) : null;
        } else if (googleReviewUrl !== undefined) {
          cleanPlaceId = null;
          formattedReviewUrl = googleReviewUrl ? googleReviewUrl.trim() : null;
        }
      }

      // If logoUrl is an external link or data URI, download and store locally in uploads/logos
      let finalLogoUrl = logoUrl !== undefined ? (logoUrl ? logoUrl.trim() : null) : existingClient.logoUrl;
      if (finalLogoUrl && (finalLogoUrl.startsWith('http://') || finalLogoUrl.startsWith('https://') || finalLogoUrl.startsWith('data:image/'))) {
        finalLogoUrl = await downloadAndSaveExternalLogo(finalLogoUrl);
      }

      const updated = await Client.update(clientId, {
        name: name ? name.trim() : existingClient.name,
        phone: cleanPhone,
        address: address ? address.trim() : existingClient.address,
        businessLocation: businessLocation !== undefined ? (businessLocation ? businessLocation.trim() : null) : existingClient.businessLocation,
        businessType: businessType ? businessType.trim() : existingClient.businessType,
        googleMapUrl: googleMapUrl !== undefined ? (googleMapUrl ? googleMapUrl.trim() : null) : existingClient.googleMapUrl,
        googleReviewUrl: formattedReviewUrl,
        placeId: cleanPlaceId || null,
        logoUrl: finalLogoUrl,
        qrId: newQrId,
        isPhoneMandatory: isPhoneMandatory !== undefined ? (isPhoneMandatory === true || isPhoneMandatory === 'true' || isPhoneMandatory === 1 || isPhoneMandatory === '1') : existingClient.isPhoneMandatory,
        isLocked: true
      });

      invalidateAiCache(clientId);
      if (existingClient.qrId) invalidateAiCache(existingClient.qrId);
      if (newQrId) invalidateAiCache(newQrId);

      res.json({
        success: true,
        message: 'Client and QR assignment successfully updated and locked in DB.',
        client: updated
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update client: ' + err.message });
    }
  }

  /**
   * Delete a single client by ID
   * DELETE /api/clients/:clientId
   */
  static async deleteClientById(req, res) {
    try {
      const { clientId } = req.params;
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      // Delete logo file if present
      if (client.logoUrl) {
        const logoPath = path.join(LOGOS_DIR, path.basename(client.logoUrl));
        if (fs.existsSync(logoPath)) {
          try { fs.unlinkSync(logoPath); } catch (e) {}
        }
      }

      await Client.delete(clientId);

      res.json({
        success: true,
        message: `Client "${client.name}" and associated records removed successfully.`
      });
    } catch (err) {
      console.error('Error deleting client:', err);
      res.status(500).json({ error: 'Failed to delete client: ' + err.message });
    }
  }

  /**
   * Remove ALL clients, their assigned QR codes, and reviews
   * DELETE /api/clients/all
   */
  static async removeAllClients(req, res) {
    try {
      const { deleteQrs = 'true' } = req.query;
      const shouldDeleteQrs = deleteQrs === 'true' || deleteQrs === true;

      // 1. Gather all clients and assigned QRs for file cleanup
      const clients = await Client.getAll();
      const allQrs = await Qr.getAll();
      const assignedQrs = allQrs.filter(q => q.status === 'assigned' || q.assignedClient);

      // 2. Perform DB deletion
      const result = await Client.deleteAll({ deleteAssignedQrs: shouldDeleteQrs });

      // 3. Clean up physical QR files
      const qrDir = path.join(process.cwd(), 'uploads', 'qr-codes');
      if (shouldDeleteQrs && fs.existsSync(qrDir)) {
        for (const qr of assignedQrs) {
          const filename = qr.filename || `${qr.qrId}.png`;
          const filePath = path.join(qrDir, filename);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
          }
        }
      }

      // Clean logos
      if (fs.existsSync(LOGOS_DIR)) {
        const logoFiles = fs.readdirSync(LOGOS_DIR);
        for (const f of logoFiles) {
          try { fs.unlinkSync(path.join(LOGOS_DIR, f)); } catch (e) {}
        }
      }

      // Clean review Excel files
      const dataDir = path.join(process.cwd(), 'data');
      if (fs.existsSync(dataDir)) {
        const dataFiles = fs.readdirSync(dataDir).filter(f => f.startsWith('reviews_client-') || f.startsWith('reviews_master'));
        for (const f of dataFiles) {
          try { fs.unlinkSync(path.join(dataDir, f)); } catch (e) {}
        }
      }

      res.json({
        success: true,
        message: 'All clients, assigned QR codes, and reviews have been permanently removed.',
        stats: result
      });
    } catch (err) {
      console.error('Error removing all clients:', err);
      res.status(500).json({ error: 'Failed to remove all clients: ' + err.message });
    }
  }
}

export { ClientController };
export default ClientController;
