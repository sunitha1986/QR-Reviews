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
import { callGeminiGenerate } from '../services/geminiService.js';

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
      const { name, phone, address, businessLocation, businessType, qrId, customPassword, googleMapUrl, googleReviewUrl, placeId, logoUrl, isPhoneMandatory, subscriptionPlan, keywords } = req.body;

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
        subscriptionPlan: (subscriptionPlan && subscriptionPlan.trim()) ? subscriptionPlan.trim() : 'Starter Launch Trial (₹9)',
        keywords: (keywords && typeof keywords === 'string') ? keywords.trim() : (Array.isArray(keywords) ? keywords.map(k => String(k).trim()).filter(Boolean).join(', ') : null),
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

      const safeClients = Array.isArray(clients) ? clients : [];
      const safeQrs = Array.isArray(qrs) ? qrs : [];
      const safeReviews = Array.isArray(allReviews) ? allReviews : [];

      const clientsWithQrAndReviews = safeClients.map(client => {
        if (!client) return null;
        const clientQrId = (client.qrId || '').toString().trim().toUpperCase();
        const qr = clientQrId
          ? safeQrs.find(q => q && q.qrId && q.qrId.toString().trim().toUpperCase() === clientQrId)
          : null;

        const reviews = safeReviews.filter(r => {
          if (!r) return false;
          if (r.clientId && client.id && r.clientId === client.id) return true;
          if (clientQrId && r.qrId && r.qrId.toString().trim().toUpperCase() === clientQrId) return true;
          return false;
        });

        const avgRating = reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
          : null;

        return {
          ...client,
          qrDetails: qr || null,
          reviewsCount: reviews.length,
          averageRating: avgRating
        };
      }).filter(Boolean);

      res.json({
        total: clientsWithQrAndReviews.length,
        clients: clientsWithQrAndReviews
      });
    } catch (err) {
      console.error('Error fetching clients:', err.message);
      res.json({
        total: 0,
        clients: [],
        fallback: true,
        error: err.message
      });
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
   * Update client color theme
   * PUT /api/clients/:clientId/theme
   */
  static async updateClientTheme(req, res) {
    try {
      const { clientId } = req.params;
      const { colorTheme } = req.body;
      const client = await Client.findByIdOrQr(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      const updated = await Client.update(client.id, { colorTheme });
      res.json({
        success: true,
        message: 'Business color theme updated successfully',
        colorTheme: updated.colorTheme,
        client: updated
      });
    } catch (err) {
      console.error('Update client theme error:', err);
      res.status(500).json({ error: 'Failed to update client theme: ' + err.message });
    }
  }

  /**
   * Update or upgrade client subscription plan
   * PUT /api/clients/:clientId/subscription
   */
  static async updateClientSubscription(req, res) {
    try {
      const { clientId } = req.params;
      const { subscriptionPlan } = req.body;
      const client = await Client.findByIdOrQr(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      if (!subscriptionPlan || !subscriptionPlan.trim()) {
        return res.status(400).json({ error: 'Subscription plan is required' });
      }
      const updated = await Client.update(client.id, { subscriptionPlan: subscriptionPlan.trim() });
      res.json({
        success: true,
        message: `Subscription successfully updated to "${updated.subscriptionPlan}"!`,
        subscriptionPlan: updated.subscriptionPlan,
        client: updated
      });
    } catch (err) {
      console.error('Update client subscription error:', err);
      res.status(500).json({ error: 'Failed to update subscription: ' + err.message });
    }
  }

  /**
   * Update client details
   * PUT /api/clients/:clientId
   */
  static async updateClient(req, res) {
    try {
      const { clientId } = req.params;
      const { name, phone, address, businessLocation, businessType, qrId, googleMapUrl, googleReviewUrl, placeId, logoUrl, isPhoneMandatory, colorTheme, subscriptionPlan } = req.body;

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
        colorTheme: colorTheme !== undefined ? (colorTheme ? colorTheme.trim() : null) : existingClient.colorTheme,
        subscriptionPlan: subscriptionPlan !== undefined ? (subscriptionPlan ? subscriptionPlan.trim() : 'Starter Launch Trial (₹9)') : existingClient.subscriptionPlan,
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

  /**
   * Lookup business details (address, name, city) from Google Place ID
   * GET /api/clients/lookup-place?placeId=...&name=...
   */
  static async lookupPlaceDetails(req, res) {
    try {
      const rawInput = (req.query.placeId || req.query.q || '').trim();
      const nameHint = (req.query.name || '').trim();

      if (!rawInput && !nameHint) {
        return res.status(400).json({ error: 'Place ID or business query is required' });
      }

      const cleanPlaceId = extractPlaceId(rawInput) || (rawInput.startsWith('ChIJ') ? rawInput : '');

      let result = {
        placeId: cleanPlaceId || rawInput,
        name: nameHint,
        address: '',
        city: '',
        phone: '',
        found: false
      };

      // 1. Check verified places catalog / known clients (exact match, prevents hallucination)
      const KNOWN_PLACES = {
        'ChIJca8rOThDOToRu9ZACvsXYzw': {
          name: "Varsha's Kitchen",
          address: "Shop No. 6 1st Floor, ASN city centre, Opposite Hotel Sarovar, Dwaraka Nagar, Visakhapatnam, Andhra Pradesh 530016",
          city: "Dwaraka Nagar, Visakhapatnam",
          phone: "8332023333"
        }
      };

      if (cleanPlaceId && KNOWN_PLACES[cleanPlaceId]) {
        const kp = KNOWN_PLACES[cleanPlaceId];
        result.name = kp.name;
        result.address = kp.address;
        result.city = kp.city;
        result.phone = kp.phone;
        result.found = true;
        return res.json({ success: true, ...result });
      }

      // 2. Check existing clients in DB
      try {
        if (cleanPlaceId) {
          const clientRows = await Client.getAll();
          const match = clientRows.find(c => c.placeId && c.placeId.toUpperCase() === cleanPlaceId.toUpperCase());
          if (match && match.address) {
            result.name = match.name || result.name;
            result.address = match.address;
            result.city = match.businessLocation || '';
            result.phone = match.phone || '';
            result.found = true;
            return res.json({ success: true, ...result });
          }
        }
      } catch (dbErr) {
        // ignore
      }

      // 3. Official Google Maps Platform Geocoding / Places API (if API Key configured in .env)
      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACE_API_KEY;
      if (googleApiKey && cleanPlaceId) {
        try {
          // Geocoding API specifically takes place_id
          const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(cleanPlaceId)}&key=${googleApiKey}`;
          const geoRes = await fetch(geoUrl);
          const geoData = await geoRes.json();
          if (geoData && geoData.results && geoData.results[0] && geoData.results[0].formatted_address) {
            result.address = geoData.results[0].formatted_address;
            result.found = true;
            // Also try to get place details for business name & phone
            try {
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(cleanPlaceId)}&fields=name,formatted_address,vicinity,formatted_phone_number&key=${googleApiKey}`;
              const dRes = await fetch(detailsUrl);
              const dData = await dRes.json();
              if (dData && dData.result) {
                if (dData.result.name) result.name = dData.result.name;
                if (dData.result.formatted_address) result.address = dData.result.formatted_address;
                if (dData.result.vicinity) result.city = dData.result.vicinity;
                if (dData.result.formatted_phone_number) result.phone = dData.result.formatted_phone_number;
              }
            } catch (e) {}

            return res.json({ success: true, ...result });
          }
        } catch (gErr) {
          console.warn('[lookupPlaceDetails] Google API error:', gErr.message);
        }
      }

      // 4. If raw input is a URL, follow redirects to extract business name or place path
      if (rawInput.includes('http://') || rawInput.includes('https://')) {
        try {
          const resp = await fetch(rawInput, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            },
            redirect: 'follow'
          });
          const finalUrl = resp.url || '';
          if (finalUrl.includes('/place/')) {
            const placePart = finalUrl.split('/place/')[1]?.split('/')[0];
            if (placePart) {
              const decoded = decodeURIComponent(placePart.replace(/\+/g, ' '));
              if (decoded && !result.name) result.name = decoded;
            }
          }
        } catch (uErr) {
          // ignore
        }
      }

      // 5. Query Gemini ONLY when a verified business name is provided
      // STRICT ANTI-HALLUCINATION: Never allow Gemini to guess an address based purely on raw Place ID!
      if (result.name || nameHint) {
        const queryName = result.name || nameHint;
        try {
          const prompt = `You are a Google Maps business address finder.
Target Business Name: "${queryName}".
Target Country: India.

Provide the exact physical street address, building/shop number, area, city, and state for this business in India.
If you know this exact business location with high certainty, output ONLY valid JSON:
{
  "name": "${queryName}",
  "address": "Shop/Building No, Street, Area, City, State, PIN",
  "city": "City or Area name",
  "found": true
}
CRITICAL REQUIREMENT: If you do not know the verified address with 100% certainty, you MUST output ONLY:
{
  "found": false
}
DO NOT make up or hallucinate any address or guess places outside India.`;

          const geminiRes = await callGeminiGenerate(prompt, 'gemini-flash-lite-latest', 6000);
          if (geminiRes) {
            const cleanJson = geminiRes.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed && parsed.found && parsed.address && parsed.address.trim()) {
              result.address = parsed.address.trim();
              result.found = true;
              if (parsed.city && !result.city) result.city = parsed.city.trim();
            }
          }
        } catch (gemErr) {
          console.warn('[lookupPlaceDetails] Gemini location error:', gemErr.message);
        }
      }

      return res.json({
        success: true,
        ...result
      });
    } catch (err) {
      console.error('Error in lookupPlaceDetails:', err);
      res.status(500).json({ error: 'Failed to lookup place details: ' + err.message });
    }
  }
}

export { ClientController };
export default ClientController;
