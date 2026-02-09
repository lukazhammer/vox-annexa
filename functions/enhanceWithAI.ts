import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import { createClient } from 'npm:@vercel/kv@1.0.1';

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY'));

// Initialize Vercel KV client with graceful fallback
const kvUrl = Deno.env.get("KV_REST_API_URL");
const kvToken = Deno.env.get("KV_REST_API_TOKEN");
const kv = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null;

// Fallback in-memory cache when KV is unavailable
const memoryCache = new Map();

// Generate cache key from form data
function getCacheKey(data: Record<string, unknown>) {
  const key = JSON.stringify({
    name: data.company_name,
    desc: data.product_description,
    country: data.country,
    services: data.services_used,
    cookies: data.cookie_level
  });
  return `enhance_${btoa(key)}`;
}


Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      company_name,
      product_description,
      company_lead,
      country,
      contact_email,
      services_used,
      cookie_level,
      jurisdiction
    } = body;

    // Check cache first (try KV, fallback to memory)
    const cacheKey = getCacheKey(body);
    let cachedData = null;

    if (kv) {
      try {
        cachedData = await kv.get(cacheKey);
      } catch (error) {
        console.error('KV cache read failed:', error);
      }
    }

    // Fallback to memory cache if KV miss
    if (!cachedData && memoryCache.has(cacheKey)) {
      const memoryCached = memoryCache.get(cacheKey);
      if (Date.now() - memoryCached.timestamp < 24 * 60 * 60 * 1000) {
        cachedData = memoryCached.data;
      }
    }

    if (cachedData) {
      base44.analytics.track({
        eventName: 'ai_enhancement_cached',
        properties: { cache_hit: true }
      });
      return Response.json({
        success: true,
        enhancements: cachedData,
        cached: true
      });
    }

    // Rate limiting check (basic IP-based)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `ai_ratelimit_${ip}`;

    // Rate limiting with KV persistence (fallback to memory)
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let rateLimitData: { date: string; count: number } = { date: today, count: 0 };

    if (kv) {
      try {
        const storedLimit = await kv.get<{ date: string; count: number }>(rateLimitKey);
        if (storedLimit) rateLimitData = storedLimit;
      } catch (error) {
        console.error('KV rate limit read failed:', error);
      }
    } else {
      const memLimit = memoryCache.get(rateLimitKey);
      if (memLimit) rateLimitData = memLimit;
    }

    if (rateLimitData.date !== today) {
      rateLimitData.date = today;
      rateLimitData.count = 0;
    }

    if (rateLimitData.count >= 10) {
      base44.analytics.track({
        eventName: 'ai_enhancement_rate_limited',
        properties: { ip }
      });
      return Response.json({
        success: false,
        error: 'Rate limit exceeded. Try again tomorrow or upgrade to EDGE.',
        rate_limited: true
      }, { status: 429 });
    }

    // Track AI enhancement request
    const startTime = Date.now();
    base44.analytics.track({
      eventName: 'ai_enhancement_requested',
      properties: { product: company_name }
    });

    // Prepare prompt
    const prompt = `You write clear, professional legal documents for SaaS products. Your style is direct and factual - no marketing fluff, no corporate jargon, no vague language.

CRITICAL REQUIREMENTS:
1. Use ONLY information provided below. Do not invent founder backstories, company histories, or product details.
2. If information is missing, use neutral language - do not create fictional details.
3. Use direct, factual legal language (not marketing copy like "we're passionate" or "we believe")
4. Be specific to THIS exact product and data practices - not generic SaaS boilerplate
5. Keep sentences short and clear
6. Format dates as 'Month DD, YYYY' (e.g., 'February 6, 2026')

ACTUAL COMPANY DATA:
Product Name: ${company_name}
Product Description: ${product_description}
Founder/Lead: ${company_lead || 'Not provided'}
Country: ${country}
Jurisdiction: ${jurisdiction || 'generic'}
Services Used: ${services_used || 'none specified'}
Cookie Level: ${cookie_level}
Contact Email: ${contact_email}

Generate these personalized sections in JSON format:

{
  "privacy_intro": "100-150 word introduction explaining what ${company_name} does, why this policy exists, and what it covers. Be specific to their product, not generic SaaS language.",
  "data_collection": "150-200 word explanation of what data is collected and why, connected to their actual product features. Be specific.",
  "cookie_explanation": "100-150 word explanation of their cookie usage based on '${cookie_level}' level. Explain what cookies do and why they're used. Specific, not vague.",
  "service_explanations": "For each service in '${services_used}', explain in 50-75 words why they use it and what data it accesses. Return as object with service names as keys.",
  "terms_intro": "75-100 word introduction to terms explaining what they cover. Professional but approachable.",
  "about_content": "200-250 word About page for ${company_name}. Explain: what the product does (based on '${product_description}'), what problem it solves, who it's for. ${company_lead ? `Mention founder ${company_lead} briefly - do NOT invent their backstory or credentials. Only state facts from the form data.` : 'Focus on the product since no founder info was provided.'}",
  "support_intro": "100-150 word Support page introduction explaining how users get help. Warm but professional.",
  "data_retention": "75-100 word explanation of how long data is kept and why. Adapt to ${jurisdiction || 'generic'} jurisdiction.",
  "user_rights": "100-150 word explanation of user rights under ${jurisdiction === 'eu' ? 'GDPR' : jurisdiction === 'california' ? 'CCPA' : 'applicable privacy laws'}. Specific to jurisdiction."
}

Adapt language to their jurisdiction - if EU, reference GDPR. If California, reference CCPA. If elsewhere, use generic privacy language.

Output ONLY valid JSON, no markdown, no code blocks, just JSON.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let enhancements;
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      enhancements = JSON.parse(cleanText);
    } catch (parseError) {
      throw new Error('Failed to parse AI response');
    }

    // Update rate limit (persist to KV or fallback to memory)
    rateLimitData.count += 1;
    if (kv) {
      try {
        // Calculate seconds until midnight for rate limit TTL
        const secondsUntilMidnight = Math.ceil((new Date(today + 'T23:59:59Z').getTime() - Date.now()) / 1000);
        await kv.set(rateLimitKey, rateLimitData, { ex: secondsUntilMidnight });
      } catch (error) {
        console.error('KV rate limit write failed:', error);
        memoryCache.set(rateLimitKey, rateLimitData);
      }
    } else {
      memoryCache.set(rateLimitKey, rateLimitData);
    }

    // Cache the result (persist to KV or fallback to memory)
    if (kv) {
      try {
        await kv.set(cacheKey, enhancements, { ex: 86400 }); // 24 hours
      } catch (error) {
        console.error('KV cache write failed:', error);
        memoryCache.set(cacheKey, { data: enhancements, timestamp: Date.now() });
      }
    } else {
      memoryCache.set(cacheKey, { data: enhancements, timestamp: Date.now() });
    }

    // Track success
    const duration = Date.now() - startTime;
    base44.analytics.track({
      eventName: 'ai_enhancement_succeeded',
      properties: {
        duration_ms: duration,
        product: company_name
      }
    });

    return Response.json({
      success: true,
      enhancements,
      cached: false
    });

  } catch (error) {
    console.error('AI enhancement error:', error);

    const base44 = createClientFromRequest(req);
    base44.analytics.track({
      eventName: 'ai_enhancement_failed',
      properties: { error: error.message }
    });

    return Response.json({
      success: false,
      error: error.message,
      fallback: true
    }, { status: 500 });
  }
});
