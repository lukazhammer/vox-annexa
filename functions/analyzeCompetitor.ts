import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
import { createClient } from 'npm:@vercel/kv@1.0.1';

const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY"));

// Initialize Vercel KV client with graceful fallback
const kvUrl = Deno.env.get("KV_REST_API_URL");
const kvToken = Deno.env.get("KV_REST_API_TOKEN");
const kv = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null;

// Fallback in-memory cache when KV is unavailable
const memoryCache = new Map();


async function crawlWebsite(url) {
  try {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Annexa/1.0; +https://annexa.vox-animus.com)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Extract text content, meta tags, headings
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

    const metaKeywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    const metaKeywords = metaKeywordsMatch ? metaKeywordsMatch[1].trim() : '';

    // Extract headings
    const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
    const h1s = h1Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

    const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
    const h2s = h2Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

    // Extract body text (simplified)
    let bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000); // Limit content length

    return {
      url: normalizedUrl,
      title,
      metaDescription,
      metaKeywords,
      headings: { h1s: h1s.slice(0, 5), h2s: h2s.slice(0, 10) },
      bodyText
    };
  } catch (error) {
    console.error('Crawl error:', error);
    throw new Error(`Could not crawl website: ${error.message}`);
  }
}

async function extractCompetitorData(crawledData) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Analyze this competitor's homepage and extract structured data.

COMPETITOR URL: ${crawledData.url}
PAGE TITLE: ${crawledData.title}
META DESCRIPTION: ${crawledData.metaDescription}
META KEYWORDS: ${crawledData.metaKeywords}
HEADINGS: ${JSON.stringify(crawledData.headings)}
CONTENT EXCERPT: ${crawledData.bodyText}

Extract and return JSON only (no markdown):
{
  "productName": "Their official product name",
  "positioning": "Their one-sentence positioning from hero/headline",
  "targetAudience": "Who they target (inferred from copy)",
  "keyFeatures": ["Top 3-5 features they emphasize"],
  "seoKeywords": ["5-8 keywords from their meta tags and headings"],
  "valueProps": ["Main 3-4 benefits they highlight"],
  "pricingModel": "Pricing structure if visible, or 'Not visible' if not"
}

Only extract facts from the page content. Don't invent details.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse competitor data');
  }

  return JSON.parse(jsonMatch[0]);
}

async function generateSearchTerms(userProduct, competitor, differentiation) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Generate search terms people would use to find this product.

USER'S PRODUCT: ${userProduct.productName}
DESCRIPTION: ${userProduct.productDescription}
TARGET AUDIENCE: ${userProduct.targetAudience || 'General users'}

MAIN COMPETITOR: ${competitor.productName}
COMPETITOR KEYWORDS: ${competitor.seoKeywords.join(', ')}
HOW USER IS DIFFERENT: ${differentiation}

Generate 8 search phrases:
- 3 PRIMARY (specific to this product's unique value)
- 3 PROBLEM-BASED (problems users are trying to solve)
- 2 COMPARISON (vs competitor, e.g. "X alternative for Y")

Return as JSON array only (no markdown): ["phrase 1", "phrase 2", ...]

Base these on actual search behavior, not marketing jargon.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse search terms');
  }

  return JSON.parse(jsonMatch[0]);
}

async function generateRecommendationScenarios(userProduct, competitor, differentiation) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are helping AI assistants understand when to recommend ${userProduct.productName}.

CONTEXT:
Product: ${userProduct.productName}
Description: ${userProduct.productDescription}
Target: ${userProduct.targetAudience || 'General users'}
Different from ${competitor.productName}: ${differentiation}

Generate 5 specific scenarios where AI SHOULD recommend this product.
Generate 3 specific scenarios where AI should NOT recommend (competitor is better fit).

Be specific about use cases, team sizes, constraints. Be realistic.

Return JSON only (no markdown):
{
  "recommend_when": ["scenario 1", "scenario 2", ...],
  "do_not_recommend_when": ["scenario 1", "scenario 2", ...]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse recommendations');
  }

  return JSON.parse(jsonMatch[0]);
}

Deno.serve(async (req) => {
  try {
    const { action, competitorUrl, userProduct, competitor, differentiation } = await req.json();

    if (action === 'crawl') {
      // Step 1: Crawl and extract competitor data
      if (!competitorUrl) {
        return Response.json({ error: 'Competitor URL is required' }, { status: 400 });
      }

      // Generate cache key from normalized URL
      const normalizedUrl = competitorUrl.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      const cacheKey = `competitor_${btoa(normalizedUrl)}`;

      // Try to get from cache first
      let competitorData = null;

      if (kv) {
        try {
          competitorData = await kv.get(cacheKey);
          if (competitorData) {
            return Response.json({
              success: true,
              competitor: competitorData,
              cached: true
            });
          }
        } catch (error) {
          console.error('KV cache read failed:', error);
        }
      } else if (memoryCache.has(cacheKey)) {
        const cached = memoryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
          return Response.json({
            success: true,
            competitor: cached.data,
            cached: true
          });
        }
      }

      // Cache miss - crawl and analyze
      const crawledData = await crawlWebsite(competitorUrl);
      competitorData = await extractCompetitorData(crawledData);

      // Store in cache
      if (kv) {
        try {
          await kv.set(cacheKey, competitorData, { ex: 86400 }); // 24 hours
        } catch (error) {
          console.error('KV cache write failed:', error);
          memoryCache.set(cacheKey, { data: competitorData, timestamp: Date.now() });
        }
      } else {
        memoryCache.set(cacheKey, { data: competitorData, timestamp: Date.now() });
      }

      return Response.json({
        success: true,
        competitor: competitorData
      });
    }

    if (action === 'generate') {
      // Step 2: Generate search terms and recommendations
      if (!userProduct || !competitor || !differentiation) {
        return Response.json({ error: 'Missing required data' }, { status: 400 });
      }

      const [searchTerms, recommendations] = await Promise.all([
        generateSearchTerms(userProduct, competitor, differentiation),
        generateRecommendationScenarios(userProduct, competitor, differentiation)
      ]);

      return Response.json({
        success: true,
        searchTerms,
        recommendations
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Analyze competitor error:', error);
    return Response.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
});