/**
 * Universal Place ID extraction and Google Review URL generator for Frontend
 */

/**
 * Extracts a clean Google Place ID from any input:
 * - Raw Place ID (e.g. "ChIJca8rOThDOToRu9ZACvsXYzw", "ChIJKYOcHAjjpikR8xKhtVq_pm8")
 * - URL with placeid parameter (e.g. "https://search.google.com/local/writereview?placeid=ChIJ...")
 * - URL or text containing ChIJ...
 *
 * @param {string} input
 * @returns {string} clean Place ID or empty string
 */
export function extractPlaceId(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // 1. URL with placeid parameter
  if (trimmed.includes('placeid=')) {
    const after = trimmed.split('placeid=')[1];
    return after.split('&')[0].split('#')[0].trim();
  }

  // 2. Contains standard Google Place ID pattern (starts with ChIJ)
  const match = trimmed.match(/ChIJ[a-zA-Z0-9_-]{10,}/);
  if (match) {
    return match[0].trim();
  }

  // 3. If raw string with no slashes/protocol
  if (!trimmed.includes('/') && !trimmed.includes('http') && !trimmed.includes('.')) {
    return trimmed;
  }

  return '';
}

/**
 * Builds the canonical Google direct write-review URL for a Place ID
 *
 * @param {string} placeId
 * @param {string} [fallbackSearchQuery]
 * @returns {string}
 */
export function buildGoogleReviewUrl(placeId, fallbackSearchQuery = '') {
  const cleanId = extractPlaceId(placeId);
  if (cleanId) {
    return `https://search.google.com/local/writereview?placeid=${cleanId}`;
  }
  if (fallbackSearchQuery && typeof fallbackSearchQuery === 'string') {
    return `https://www.google.com/search?q=${encodeURIComponent(fallbackSearchQuery.trim())}+reviews`;
  }
  return '';
}

/**
 * Verified Place Knowledge Registry (Known clients/places mapped to verified addresses)
 */
export const KNOWN_PLACES = {
  'ChIJca8rOThDOToRu9ZACvsXYzw': {
    name: "Varsha's Kitchen",
    address: "Shop No. 6 1st Floor, ASN city centre, Opposite Hotel Sarovar, Dwaraka Nagar, Visakhapatnam, Andhra Pradesh 530016",
    city: "Dwaraka Nagar, Visakhapatnam",
    phone: "8332023333"
  }
};

/**
 * Resolve verified place details from input Place ID or review URL
 *
 * @param {string} input
 * @returns {object|null}
 */
export function getKnownPlaceDetails(input) {
  if (!input || typeof input !== 'string') return null;
  const cleanId = extractPlaceId(input) || input.trim();
  if (!cleanId) return null;

  for (const [id, details] of Object.entries(KNOWN_PLACES)) {
    if (id.toLowerCase() === cleanId.toLowerCase()) {
      return {
        placeId: id,
        ...details,
        found: true
      };
    }
  }
  return null;
}
