import { generateReviewSuggestions, polishReviewComment } from '../services/geminiService.js';
import { Review } from '../models/index.js';
import { buildAiCacheKey, getCachedSuggestions, setCachedSuggestions } from '../services/aiCache.js';

/**
 * Google Gemini AI Controller
 */
class AiController {
  /**
   * Generate 8 review suggestions with Google Gemini (with Server-Side Caching)
   * POST /api/public/ai/suggestions
   */
  static async generateSuggestions(req, res) {
    try {
      const { businessName, businessType, rating, keywords, clientId, qrId, excludeReviews, language } = req.body;

      let allExcludes = Array.isArray(excludeReviews) ? [...excludeReviews] : [];
      if (clientId || qrId) {
        try {
          const used = await Review.getUsedComments(clientId, qrId);
          allExcludes = [...new Set([...allExcludes, ...used])];
        } catch (e) {
          // ignore error if DB lookup fails
        }
      }

      // 1. Check Server-Side Cache (In-Memory + MySQL DB)
      const targetLang = language || 'tenglish';
      const clientIdOrQr = clientId || qrId;
      const cacheKey = buildAiCacheKey({ clientId, qrId, businessName, language: targetLang, keywords });
      const cached = await getCachedSuggestions(cacheKey, allExcludes, 8, clientIdOrQr, targetLang);

      if (cached) {
        console.log(`[AI Cache HIT] Served 8 rotated reviews from DB cache for ${cacheKey} (Hits: ${cached.hits})`);
        return res.json({
          success: true,
          source: cached.source || 'gemini-db-cache',
          suggestions: cached.suggestions
        });
      }

      // 2. Cache miss or insufficient fresh pool: Query Google Gemini API
      console.log(`[AI Cache MISS] Querying Google Gemini API for ${cacheKey}...`);
      const result = await generateReviewSuggestions({
        businessName: businessName || 'Valued Business Partner',
        businessType: businessType || 'General Business',
        rating: rating ? Number(rating) : 5,
        keywords: keywords ? String(keywords).trim() : '',
        excludeReviews: allExcludes,
        language: targetLang
      });

      // 3. Save newly generated reviews into in-memory and MySQL DB cache pool
      if (result.success && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
        await setCachedSuggestions(cacheKey, result.suggestions, clientIdOrQr, targetLang);
      }

      res.json(result);
    } catch (err) {
      console.error('Error generating AI review suggestions:', err);
      res.status(500).json({ error: 'Failed to generate suggestions', message: err.message });
    }
  }

  /**
   * Polish rough draft or keywords into a fluent review sentence
   * POST /api/public/ai/polish
   */
  static async polishComment(req, res) {
    try {
      const { text, businessName, businessType, rating, language } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Comment text is required to polish' });
      }
      const result = await polishReviewComment({
        text: text.trim(),
        businessName: businessName || 'Valued Business Partner',
        businessType: businessType || 'General Business',
        rating: rating ? Number(rating) : 5,
        language: language || 'tenglish'
      });
      res.json(result);
    } catch (err) {
      console.error('Error polishing comment with Gemini:', err);
      res.status(500).json({ error: 'Failed to polish comment', message: err.message });
    }
  }
}

export { AiController };
export default AiController;
