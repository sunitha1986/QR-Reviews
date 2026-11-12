import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { LOGOS_DIR } from '../config/constants.js';

/**
 * Downloads an external image from a URL and saves it into backend/uploads/logos
 * Returns the local relative public URL (e.g. /uploads/logos/logo_downloaded_1731139000_a1b2c3d4.png)
 *
 * If the URL is already a local upload URL or data URL, handles appropriately without redundant downloading.
 * If downloading fails, returns the original URL as a safe fallback.
 *
 * @param {string} imageUrl
 * @returns {Promise<string>} local URL (e.g. /uploads/logos/xyz.png) or original URL
 */
export async function downloadAndSaveExternalLogo(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;

  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  // 1. If it's already a relative /uploads/ path, return as is
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // 2. If it's a full URL that already points to our local /uploads/logos/
  const localMatch = trimmed.match(/\/uploads\/logos\/([^?#]+)/i);
  if (localMatch) {
    return `/uploads/logos/${localMatch[1]}`;
  }

  // 3. If it's a data URI (Base64), convert and save it as a file directly
  if (trimmed.startsWith('data:image/')) {
    try {
      if (!fs.existsSync(LOGOS_DIR)) {
        fs.mkdirSync(LOGOS_DIR, { recursive: true });
      }

      let ext = 'png';
      let buffer;
      const matches = trimmed.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1].toLowerCase();
        if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
        else if (mime.includes('svg')) ext = 'svg';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(trimmed.replace(/^data:[^;]+;base64,/, ''), 'base64');
      }

      const safeName = `logo_${Date.now()}_${uuidv4().slice(0, 8)}.${ext}`;
      const targetPath = path.join(LOGOS_DIR, safeName);
      fs.writeFileSync(targetPath, buffer);
      return `/uploads/logos/${safeName}`;
    } catch (e) {
      console.warn('[ImageDownloader] Failed to save data URI:', e.message);
      return trimmed;
    }
  }

  // 4. Must be an http or https URL
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Prevent SSRF / internal IP loopback calls
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.16.') ||
      host === '169.254.169.254'
    ) {
      // Don't fetch private networks unless explicitly developing locally with a port
      if (!parsed.port || (parsed.port !== '5000' && parsed.port !== '5173')) {
        console.warn(`[ImageDownloader] Skipped fetching private internal host: ${host}`);
        return trimmed;
      }
    }
  } catch (e) {
    return trimmed;
  }

  try {
    if (!fs.existsSync(LOGOS_DIR)) {
      fs.mkdirSync(LOGOS_DIR, { recursive: true });
    }

    // Set a 12-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(trimmed, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[ImageDownloader] Server responded with HTTP ${res.status} for ${trimmed}`);
      return trimmed;
    }

    // Determine extension from Content-Type header or URL
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    let ext = 'png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
    else if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('svg')) ext = 'svg';
    else if (contentType.includes('gif')) ext = 'gif';
    else {
      try {
        const parsed = new URL(trimmed);
        const pathExt = path.extname(parsed.pathname).toLowerCase().replace('.', '');
        if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(pathExt)) {
          ext = pathExt === 'jpeg' ? 'jpg' : pathExt;
        }
      } catch (e) {
        ext = 'png';
      }
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanity check: must be at least 100 bytes and at most 15 MB
    if (buffer.length < 50) {
      console.warn(`[ImageDownloader] Image too small (${buffer.length} bytes) from ${trimmed}`);
      return trimmed;
    }
    if (buffer.length > 15 * 1024 * 1024) {
      console.warn(`[ImageDownloader] Image exceeds 15MB limit from ${trimmed}`);
      return trimmed;
    }

    const safeFilename = `logo_downloaded_${Date.now()}_${uuidv4().slice(0, 8)}.${ext}`;
    const destinationPath = path.join(LOGOS_DIR, safeFilename);

    fs.writeFileSync(destinationPath, buffer);
    console.log(`[ImageDownloader] Successfully downloaded and stored external logo: ${safeFilename} (${(buffer.length / 1024).toFixed(1)} KB)`);

    return `/uploads/logos/${safeFilename}`;
  } catch (err) {
    console.warn(`[ImageDownloader] Failed to download logo from "${trimmed}": ${err.message}. Using original URL as fallback.`);
    return trimmed;
  }
}

