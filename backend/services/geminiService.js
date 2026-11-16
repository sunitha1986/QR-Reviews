/**
 * Google Gemini AI Service for Customer Reviews
 * Uses Google Gemini API (gemini-flash-latest / gemini-flash-lite-latest)
 * Forces IPv4 (family: 4) to prevent Windows socket reset (wsarecv) errors.
 * No hardcoded suggestions: Pure AI-generated feedback only.
 * Configured with dual alternating API keys with auto-failover.
 */

import https from 'https';

/**
 * Dual Google Gemini API Keys configured to alternate round-robin across requests.
 * Read securely from environment variables (process.env.GEMINI_API_KEYS).
 */
const DEFAULT_GEMINI_KEYS = [];

/**
 * Helper to get available API keys (from environment variables or defaults)
 */
function getGeminiApiKeys() {
  const envKeys = [];
  if (process.env.GEMINI_API_KEYS) {
    envKeys.push(...process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean));
  }
  if (process.env.GEMINI_API_KEY_1) envKeys.push(process.env.GEMINI_API_KEY_1.trim());
  if (process.env.GEMINI_API_KEY_2) envKeys.push(process.env.GEMINI_API_KEY_2.trim());
  if (process.env.GEMINI_API_KEY) envKeys.push(process.env.GEMINI_API_KEY.trim());

  const list = [...new Set([...envKeys, ...DEFAULT_GEMINI_KEYS])].filter(Boolean);
  return list.length > 0 ? list : DEFAULT_GEMINI_KEYS;
}

let currentKeyIndex = 0;

/**
 * Returns the next API key in alternating round-robin sequence
 */
function getNextApiKey() {
  const keys = getGeminiApiKeys();
  const selected = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return selected;
}

/**
 * Returns the other keys in the pool (excluding the specified key) for fallback
 */
function getAlternativeKeys(failedKey) {
  const keys = getGeminiApiKeys();
  return keys.filter(k => k !== failedKey);
}

/**
 * Execute generateContent call to Gemini API
 */
function callGeminiGenerate(promptText, model = 'gemini-flash-lite-latest', timeoutMs = 12000, apiKey = null) {
  const activeKey = apiKey || getNextApiKey();
  const maskedKey = `${activeKey.slice(0, 8)}...${activeKey.slice(-4)}`;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [
        {
          parts: [{ text: promptText }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 350,
        temperature: 0.7
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      family: 4, // CRITICAL: Force IPv4 to prevent Windows socket reset (wsarecv)
      path: `/v1beta/models/${model}:generateContent`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': activeKey,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: timeoutMs
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const err = new Error(`Gemini HTTP ${res.statusCode}: ${body.slice(0, 150)}`);
          err.statusCode = res.statusCode;
          err.apiKey = activeKey;
          return reject(err);
        }
        try {
          const json = JSON.parse(body);
          const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          resolve(reply ? reply.trim() : '');
        } catch (parseErr) {
          reject(parseErr);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const err = new Error(`Gemini request to ${model} timed out after ${timeoutMs}ms (key ${maskedKey})`);
      err.apiKey = activeKey;
      reject(err);
    });

    req.on('error', (err) => {
      err.apiKey = activeKey;
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Call Gemini with alternating keys and automatic fallback between models and alternative keys
 */
async function callGeminiWithFallback(promptText, timeoutMs = 12000) {
  // Step 1: Pick the next alternating API key for this request using lightweight flash-lite
  const primaryKey = getNextApiKey();
  const maskedPrimary = `${primaryKey.slice(0, 8)}...${primaryKey.slice(-4)}`;

  try {
    return await callGeminiGenerate(promptText, 'gemini-flash-lite-latest', timeoutMs, primaryKey);
  } catch (err) {
    console.warn(`[Gemini AI] Primary attempt failed with key ${maskedPrimary} (${err.message}). Trying alternative API key...`);

    // Step 2: Try alternative API key with primary model (gemini-flash-lite-latest)
    const altKeys = getAlternativeKeys(primaryKey);
    for (const altKey of altKeys) {
      const maskedAlt = `${altKey.slice(0, 8)}...${altKey.slice(-4)}`;
      try {
        console.log(`[Gemini AI] Retrying with alternative key ${maskedAlt}...`);
        return await callGeminiGenerate(promptText, 'gemini-flash-lite-latest', timeoutMs, altKey);
      } catch (altErr) {
        console.warn(`[Gemini AI] Alternative key ${maskedAlt} failed: ${altErr.message}`);
      }
    }

    // Step 3: Fallback to standard model (gemini-flash-latest) with alternative or primary key
    const fallbackKey = altKeys[0] || primaryKey;
    const maskedFallback = `${fallbackKey.slice(0, 8)}...${fallbackKey.slice(-4)}`;
    console.warn(`[Gemini AI] Trying gemini-flash-latest with key ${maskedFallback}...`);
    return await callGeminiGenerate(promptText, 'gemini-flash-latest', timeoutMs, fallbackKey);
  }
}

/**
 * Clean JSON array from markdown codeblocks (e.g. ```json [...] ```)
 */
function extractJsonArray(text) {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map(item => String(item).trim()).filter(Boolean);
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

/**
 * Helper to randomly shuffle/jumble array items (Fisher-Yates)
 */
function shuffleArray(arr) {
  if (!Array.isArray(arr)) return arr;
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
function isSimilarOrExcluded(candidate, excludes) {
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
 * Generate 8 context-aware review suggestions with Google Gemini AI only (no hardcoding)
 * Produces short 1-liners, medium 2-liners, and detailed authentic options.
 * Excludes any previously submitted reviews to prevent duplicate reviews on Google.
 * Supports: 'mixed' (Telugu + English, e.g. "Super గా ఉంది!"), 'telugu' (pure Telugu), and 'english'.
 */
async function generateReviewSuggestions({
  businessName = 'this business',
  businessType = 'store',
  rating = 5,
  keywords = '',
  excludeReviews = [],
  language = 'mixed'
}) {
  const kwList = keywords
    ? String(keywords).split(',').map(k => k.trim()).filter(Boolean)
    : [];

  const keywordsSection = kwList.length > 0
    ? `\n\nCRITICAL REQUIREMENT - HIGHEST PREFERENCE TO BUSINESS KEYWORDS:
The business owner has specified these signature features, specialties, or services:
${kwList.map((kw, i) => `  ${i + 1}. "${kw}"`).join('\n')}

YOU MUST PRIORITIZE THESE KEYWORDS ABOVE GENERAL PRAISE:
1. At least 5 to 6 of the 8 suggestions (minimum 70-80%) MUST prominently and directly feature one or more of these exact keywords: [${kwList.map(k => `"${k}"`).join(', ')}].
2. Distribute the keywords across the suggestions so each keyword gets highlighted (e.g., recommend their "${kwList[0]}", praise the quality of their "${kwList[1] || kwList[0]}", mention "${kwList[2] || kwList[0]}", etc.).
3. DO NOT write vague, generic reviews (like "great service" or "good place") without mentioning these specific business highlights. Anchor the customer praise around these exact keywords so reviews provide strong local SEO value and authentic context.`
    : '';

  const recentExcludes = (excludeReviews || [])
    .map(r => String(r).replace(/[\r\n]+/g, ' ').trim())
    .filter(Boolean)
    .slice(-15);

  const excludeSection = recentExcludes.length > 0
    ? `\n\nCRITICAL RULE - DO NOT REPEAT ANY OF THESE PREVIOUSLY SUBMITTED REVIEWS:
Other customers have already submitted the following review texts for this business. You MUST NOT reuse, copy, or closely repeat any of these sentences:
${recentExcludes.map((r, i) => `${i + 1}. "${r}"`).join('\n')}
Generate fresh, distinct phrases with different angles so no duplicate reviews are posted to Google.`
    : '';

  let languageSection = '';
  if (language === 'telugu') {
    languageSection = `\n\nLANGUAGE REQUIREMENT (STRICT - TELUGU SCRIPT):
Write ALL 8 review suggestions in TELUGU SCRIPT (తెలుగు లిపి). You can naturally include common English words written in Telugu script (e.g. "super గా ఉంది!", "service చాలా బాగుంది!").
Examples of exact style:
- "Project work super గా చేశారు, staff response కూడా చాలా బాగుంది at ${businessName}!"
- "Food super గా ఉంది, ambiance కూడా చాలా బాగుంది!"
- "Service చాలా బాగుంది, definitely worth visiting!"
- "Staff చాలా polite గా ఉన్నారు, quick service!"
- "చాలా మంచి సర్వీస్, సిబ్బంది ఎంతో మర్యాదగా ఉన్నారు."
- "Quality super గా ఉంది, సరసమైన ధరలు మరియు సకాలంలో డెలివరీ."`;
  } else if (language === 'english') {
    languageSection = `\n\nLANGUAGE REQUIREMENT (STRICT - VERY SIMPLE, CLEAN ENGLISH):
Write ALL 8 review suggestions strictly in VERY SIMPLE, everyday conversational English.
Use short, common words that normal everyday people use in casual Google reviews.
DO NOT use fancy, formal, pompous, or complex vocabulary (NEVER use words like "culinary excellence", "exceeded expectations", "immaculate", "unmatched", "exemplary", "plethora", "rejuvenated", "bespoke").
Examples of exact simple style:
- "Great experience at ${businessName}, the food was hot, fresh, and very tasty!"
- "Staff was very polite and helpful. Quick service!"
- "Clean place and fair prices. Loved the service!"
- "Had a great time with family at ${businessName}. Highly recommend!"
- "Fast service, friendly staff, and great quality. 5 stars!"`;
  } else {
    // Default: 'tenglish' / 'mixed' (Telugu words written in English alphabet)
    languageSection = `\n\nLANGUAGE REQUIREMENT (STRICT - TENGLISH / TELUGU IN ENGLISH SCRIPT):
Write ALL 8 review suggestions in TENGLISH — which means writing Telugu words entirely using the ENGLISH ALPHABET (Romanized Telugu, no Telugu script letters). This is how local customers text on WhatsApp and post reviews online!
Examples of exact style:
- "Project work super ga chesaru, staff response kuda chala bagundi at ${businessName}!"
- "Food chala bagundi, staff service superb at ${businessName}!"
- "Service super ga undi, definitely recommend chestanu!"
- "Staff chala polite ga matladaru, quick service!"
- "Very clean premises, experience super ga undi!"
- "Quality super ga undi, reasonable prices and timely delivery."
- "Doctor garu chala patient ga explain chesaru, treatment super ga undi."
STRICT RULE: Write in Latin/English letters only. Do NOT use Telugu script characters in Tenglish mode.`;
  }

  const prompt = `You are a happy, satisfied customer writing a 5-star Google review for "${businessName}" (${businessType}).
Write exactly 8 distinct, authentic, and 100% positive customer review suggestions for a 5-star experience with structured lengths:
- Suggestion 1: 2-liner review (2 clear, simple sentences).
- Suggestion 2: MUST STRICTLY BE A SIMPLE 4-LINER REVIEW (exactly 4 simple sentences: sentence 1 general experience, sentence 2 highlight/keywords, sentence 3 staff courtesy, sentence 4 strong recommendation).
- Suggestion 3: 3-liner review (3 simple sentences).
- Suggestion 4: 2-liner review (2 simple sentences).
- Suggestion 5: 3-liner review (3 simple sentences).
- Suggestion 6: 4-liner review (4 simple sentences).
- Suggestion 7: 2-liner review (2 simple sentences).
- Suggestion 8: 3-liner review (3 simple sentences).${languageSection}${keywordsSection}${excludeSection}

STRICT RULES:
1. 100% POSITIVE PRAISE ONLY (ZERO NEGATIVE OR CRITICAL COMMENTS): Every single review suggestion MUST be 100% positive, delighted, and satisfied 5-star praise. Under NO circumstances include any negative, critical, lukewarm, hesitant, or mixed feedback (absolutely NO mentions of "crowded", "slow", "parking was tight", "could be better", "waiting time was long", or any complaints).
2. VERY SIMPLE EVERYDAY ENGLISH: Use short, simple, easy-to-understand sentences (8 to 14 words max per sentence). Everyday customers write simple praises, not complex formal essays. No flowery, robotic, or corporate words.
3. HIGHEST PREFERENCE TO KEYWORDS: When business keywords are provided, at least 70-80% of the suggestions (at least 5-6 out of 8) MUST explicitly, naturally, and simply include one or more of the specified keywords.
4. The 2nd suggestion in the JSON array MUST be a simple 4-liner review (exactly 4 simple sentences).
5. Return ONLY a valid JSON array of exactly 8 strings: ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5", "suggestion 6", "suggestion 7", "suggestion 8"].
6. Do NOT include markdown formatting, backticks, numbering, or extra commentary.`;

  try {
    const raw = await callGeminiWithFallback(prompt, 12000);
    const parsed = extractJsonArray(raw);
    if (parsed && parsed.length > 0) {
      const cleaned = parsed
        .map(item => String(item).replace(/[\r\n]+/g, ' ').replace(/^["'`]|["'`]$/g, '').trim())
        .filter(item => item.length > 5 && !isSimilarOrExcluded(item, excludeReviews));

      if (cleaned.length > 0) {
        return {
          success: true,
          source: 'gemini',
          suggestions: cleaned.slice(0, 8)
        };
      }
    }
    // If JSON array parse failed, extract line-by-line sentences
    const lines = raw.split('\n')
      .map(l => l.replace(/^[\d\-*.•\s"'`]+|["'`]+$/g, '').replace(/[\r\n]+/g, ' ').trim())
      .filter(l => l.length > 8 && !isSimilarOrExcluded(l, excludeReviews));
    if (lines.length > 0) {
      return {
        success: true,
        source: 'gemini',
        suggestions: lines.slice(0, 8)
      };
    }
  } catch (err) {
    console.error('[Gemini AI Error] Failed to generate suggestions:', err.message);
    return {
      success: false,
      error: 'Gemini AI is temporarily busy. Tap "Refresh Ideas" to retry.',
      suggestions: []
    };
  }

  return {
    success: false,
    error: 'Could not parse AI response',
    suggestions: []
  };
}

/**
 * Polish rough draft or keywords into a fluent review sentence with Google Gemini AI only
 */
async function polishReviewComment({ text, businessName = 'this business', businessType = 'store', rating = 5, language = 'mixed' }) {
  if (!text || !text.trim()) {
    return {
      success: false,
      error: 'Text is required to polish'
    };
  }

  let langInstruction = '';
  if (language === 'telugu') {
    langInstruction = 'Write the polished sentence in Telugu script (e.g. "Project work super గా చేశారు, staff response కూడా చాలా బాగుంది!").';
  } else if (language === 'english') {
    langInstruction = 'Write the polished sentence in clear natural English.';
  } else {
    langInstruction = 'Write the polished sentence in Tenglish (Telugu words written in English alphabet, e.g. "Project work super ga chesaru, staff response kuda chala bagundi!").';
  }

  const prompt = `Rewrite this customer review for "${businessName}" (${businessType}) into a simple, natural ONE-LINER (strictly 1 short sentence, 8 to 14 words max): "${text.trim()}". ${langInstruction} Rating: ${rating} stars. Use simple everyday language. Return ONLY the single polished one-liner sentence without quotes or extra text.`;

  try {
    const raw = await callGeminiWithFallback(prompt, 12000);
    if (raw && raw.length > 5) {
      const cleaned = raw.replace(/^["'`]|["'`]$/g, '').replace(/[\r\n]+/g, ' ').trim();
      return {
        success: true,
        source: 'gemini',
        polished: cleaned
      };
    }
  } catch (err) {
    console.error('[Gemini AI Error] Failed to polish comment:', err.message);
    return {
      success: false,
      error: 'Gemini AI polish timed out'
    };
  }

  return {
    success: false,
    error: 'Unable to polish review'
  };
}

export {
  callGeminiGenerate,
  generateReviewSuggestions,
  polishReviewComment
};

export default {
  callGeminiGenerate,
  generateReviewSuggestions,
  polishReviewComment
};
