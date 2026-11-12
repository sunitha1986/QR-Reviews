// Frontend API Configuration
// Production domain: https://qr.vasmigroup.com

// Detect if running locally (localhost, 127.0.0.1, or local network IP e.g. 192.168.x.x)
const isLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.startsWith('192.168.') ||
   window.location.hostname.startsWith('10.') ||
   window.location.hostname.startsWith('172.') ||
   window.location.hostname.endsWith('.local') ||
   window.location.port === '5173' ||
   window.location.port === '3000');

const config = {
  API_BASE_URL: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : (isLocal ? `http://${window.location.hostname}:5000` : "https://qr.vasmigroup.com"),
};

export const getImageUrl = (url) => {
  if (!url) return "";
  const normalizedUrl = url.replace(/\\/g, "/");
  if (normalizedUrl.startsWith("http")) return normalizedUrl;
  const base = config.API_BASE_URL.replace(/\/+$/, "");
  return `${base}${normalizedUrl.startsWith("/") ? "" : "/"}${normalizedUrl}`;
};

export default config;
