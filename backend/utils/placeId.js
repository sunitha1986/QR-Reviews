/**
 * Universal Place ID extraction and Google Review URL generator
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
function extractPlaceId(input) {
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

  // 3. If raw string with no slashes/protocol, assume it might be a custom or non-standard Place ID
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
function buildGoogleReviewUrl(placeId, fallbackSearchQuery = '') {
  const cleanId = extractPlaceId(placeId);
  if (cleanId) {
    return `https://search.google.com/local/writereview?placeid=${cleanId}`;
  }
  if (fallbackSearchQuery && typeof fallbackSearchQuery === 'string') {
    return `https://www.google.com/search?q=${encodeURIComponent(fallbackSearchQuery.trim())}+reviews`;
  }
  return '';
}

export {
  extractPlaceId,
  buildGoogleReviewUrl
};
export default {
  extractPlaceId,
  buildGoogleReviewUrl
};
