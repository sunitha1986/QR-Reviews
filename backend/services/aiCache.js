/**
 * Database-Persistent Server-Side Caching & Scan-by-Scan Rotation for Google Gemini AI Suggestions
 *
 * Prevents redundant calls to Google Gemini API when multiple visitors scan
 * the same business QR standee.
 *
 * 1. PERSISTENCE: Caches pools of authentic review suggestions in MySQL database
 *    so they survive server restarts and reboots.
 * 2. ROTATION: On each customer scan, rotates and shuffles 8 distinct reviews from
 *    the cached pool in < 1ms with ZERO Gemini API quota consumed.
 * 3. DEDUPLICATION: Automatically filters out any review that a customer has already submitted.
 */

import { Client } from '../models/index.js';

// In-Memory Fast-Lookup Cache: key -> { suggestions: string[], cachedAt: number, hits: number }
const aiSuggestionsCache = new Map();

// Maximum cached pool per language (to rotate fresh variety across scans)
const MAX_CACHED_ITEMS_PER_KEY = 32;

/**
 * Builds normalized cache key
 */
export function buildAiCacheKey({ clientId, qrId, businessName, language, keywords }) {
  const primaryId = (clientId || qrId || businessName || 'global').toString().toLowerCase().trim();
  const lang = (language || 'tenglish').toLowerCase().trim();
  const kw = (keywords || '').toLowerCase().trim();
  return `${primaryId}:${lang}:${kw}`;
}

/**
 * Helper to normalize review strings for deduplication comparison
 */
function normalizeReview(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if candidate suggestion matches any previously submitted review
 */
function isSimilarOrExcluded(candidate, excludes = []) {
  const normCandidate = normalizeReview(candidate);
  if (!normCandidate || normCandidate.length < 5) return true;
  for (const ex of excludes) {
    const normEx = normalizeReview(ex);
    if (!normEx) continue;
    if (normCandidate === normEx) return true;
    if (normCandidate.includes(normEx) || normEx.includes(normCandidate)) {
      if (Math.min(normCandidate.length, normEx.length) > 18) return true;
    }
  }
  return false;
}

/**
 * Fisher-Yates array shuffle
 */
function shuffleArray(arr) {
  if (!Array.isArray(arr)) return [];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Rotates and selects 8 distinct suggestions from a pool on each scan.
 * Guarantees that Position 2 (index 1) is a detailed/comprehensive review.
 */
function rotateAndPick8(pool) {
  if (!Array.isArray(pool) || pool.length <= 8) {
    return Array.isArray(pool) ? shuffleArray(pool) : [];
  }

  // Find detailed reviews (length > 120 chars or multiple sentences)
  const detailedReviews = pool.filter(r => r.length > 120 || (r.match(/[.!?]/g) || []).length >= 3);

  // Pick 1 detailed review for Position 2 (index 1)
  const chosenDetailed = detailedReviews.length > 0
    ? detailedReviews[Math.floor(Math.random() * detailedReviews.length)]
    : null;

  // Remaining pool shuffled
  const remaining = shuffleArray(pool.filter(r => r !== chosenDetailed));

  const result = [];
  // Slot 0 (1st review)
  if (remaining.length > 0) result.push(remaining.pop());

  // Slot 1 (2nd review: 4-liner / detailed)
  if (chosenDetailed) {
    result.push(chosenDetailed);
  } else if (remaining.length > 0) {
    result.push(remaining.pop());
  }

  // Slots 2 through 7 (6 more reviews)
  while (result.length < 8 && remaining.length > 0) {
    result.push(remaining.pop());
  }

  return result;
}

/**
 * Retrieves valid cached suggestions from in-memory cache or MySQL database.
 * Filters out any submitted/used reviews, rotates them, and returns 8 items.
 */
export async function getCachedSuggestions(cacheKey, excludes = [], minRequired = 8, clientIdOrQr = null, language = 'english') {
  let entry = aiSuggestionsCache.get(cacheKey);

  // 1. If not in memory, query MySQL database
  if (!entry && clientIdOrQr) {
    try {
      const dbCached = await Client.getCachedAiReviews(clientIdOrQr);
      if (dbCached && Array.isArray(dbCached[language]) && dbCached[language].length > 0) {
        entry = {
          suggestions: dbCached[language],
          cachedAt: dbCached.updatedAt || Date.now(),
          hits: 0
        };
        aiSuggestionsCache.set(cacheKey, entry);
        console.log(`[AI Cache] Loaded ${dbCached[language].length} reviews from MySQL DB for ${clientIdOrQr} (${language})`);
      }
    } catch (e) {
      console.warn('[AI Cache] DB lookup notice:', e.message);
    }
  }

  if (!entry) return null;

  // 2. Filter out any review that has been used/submitted
  const fresh = entry.suggestions.filter(item => !isSimilarOrExcluded(item, excludes));

  // 3. If we have at least minRequired (8) fresh reviews, rotate and serve!
  if (fresh.length >= minRequired) {
    entry.hits = (entry.hits || 0) + 1;
    const rotated8 = rotateAndPick8(fresh);
    return {
      suggestions: rotated8,
      totalCached: entry.suggestions.length,
      hits: entry.hits,
      source: 'gemini-db-cache'
    };
  }

  return null;
}

/**
 * Saves fresh Gemini suggestions into in-memory cache and persists to MySQL database
 */
export async function setCachedSuggestions(cacheKey, newSuggestions, clientIdOrQr = null, language = 'english') {
  if (!Array.isArray(newSuggestions) || newSuggestions.length === 0) return;

  const existing = aiSuggestionsCache.get(cacheKey);
  const seen = new Set();
  const merged = [];

  const prior = existing ? existing.suggestions : [];
  for (const item of [...newSuggestions, ...prior]) {
    const norm = normalizeReview(item);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      merged.push(item);
    }
    if (merged.length >= MAX_CACHED_ITEMS_PER_KEY) break;
  }

  aiSuggestionsCache.set(cacheKey, {
    suggestions: merged,
    cachedAt: Date.now(),
    hits: existing?.hits || 0
  });

  // Persist to MySQL Database
  if (clientIdOrQr) {
    try {
      const dbData = (await Client.getCachedAiReviews(clientIdOrQr)) || {};
      dbData[language] = merged;
      dbData.updatedAt = Date.now();
      await Client.saveCachedAiReviews(clientIdOrQr, dbData);
      console.log(`[AI Cache] Persisted ${merged.length} reviews (${language}) to MySQL DB for client ${clientIdOrQr}`);
    } catch (dbErr) {
      console.warn('[AI Cache] Failed to persist reviews to DB:', dbErr.message);
    }
  }
}

/**
 * Invalidate cache for a specific client in memory and MySQL DB
 */
export async function invalidateAiCache(clientIdOrQr) {
  if (!clientIdOrQr) return;
  const prefix = clientIdOrQr.toString().toLowerCase().trim();
  for (const key of aiSuggestionsCache.keys()) {
    if (key.startsWith(prefix) || key.includes(prefix)) {
      aiSuggestionsCache.delete(key);
    }
  }

  // Clear from MySQL DB
  try {
    await Client.clearCachedAiReviews(clientIdOrQr);
    console.log(`[AI Cache] Cleared cached reviews from DB for client ${clientIdOrQr}`);
  } catch (e) {
    console.warn('[AI Cache] DB clear notice:', e.message);
  }
}

/**
 * Clear all cache
 */
export function clearAllAiCache() {
  aiSuggestionsCache.clear();
}
