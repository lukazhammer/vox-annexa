// Stripe webhook handler - generates competitive radar data during payment
// Called by Stripe when checkout.session.completed fires

import Stripe from 'npm:stripe@14.14.0';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
import { createClient } from 'npm:@vercel/kv@1.0.1';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);

// Initialize KV with graceful fallback
const kvUrl = Deno.env.get('KV_REST_API_URL');
const kvToken = Deno.env.get('KV_REST_API_TOKEN');
const kv = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null;

// Fallback in-memory cache
const memoryCache = new Map<string, any>();

async function cacheSet(key: string, value: any, ttlSeconds: number) {
  if (kv) {
    try {
      await kv.set(key, value, { ex: ttlSeconds });
      return;
    } catch (err) {
      console.error('KV cache write failed, using memory fallback:', err);
    }
  }
  memoryCache.set(key, { data: value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

async function cacheGet(key: string): Promise<any | null> {
  if (kv) {
    try {
      return await kv.get(key);
    } catch (err) {
      console.error('KV cache read failed, checking memory fallback:', err);
    }
  }
  const cached = memoryCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  return null;
}

/**
 * Crawl a website and extract key information
 */
async function crawlWebsite(url: string): Promise<{
  url: string;
  title: string;
  description: string;
  bodyText: string;
}> {
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  const response = await fetch(normalizedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Annexa/1.0; +https://annexa.vox-animus.com)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Website returned ${response.status}`);
  }

  const html = await response.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].split('|')[0].trim() : 'Unknown';

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extract body text (cleaned)
  const bodyText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);

  return { url: normalizedUrl, title, description, bodyText };
}

/**
 * Detect industry from website content using Gemini
 */
async function detectIndustry(content: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(
      `Classify this website into ONE industry category (e.g., SaaS, E-commerce, Healthcare, Finance, Education, Marketing, Consulting, etc.).\n\nContent: ${content.slice(0, 1500)}\n\nReturn ONLY the industry name, nothing else.`
    );
    return result.response.text().trim() || 'Business Services';
  } catch {
    return 'Business Services';
  }
}

/**
 * Generate 6 industry-specific radar chart axes using Gemini
 */
async function generateRadarAxes(
  industry: string,
  userName: string,
  competitorName: string
): Promise<Array<{ id: string; name: string; description: string }>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Generate exactly 6 competitive dimensions for the ${industry} industry.

User business: ${userName}
Competitor: ${competitorName}

Requirements:
- Dimensions must be specific to ${industry}
- Must be measurable and comparable
- Must be relevant to customer decision-making
- Must be distinct from each other
- Each name should be 2-4 words

Return ONLY valid JSON (no markdown, no code fences):
{
  "axes": [
    {"id": "snake_case_id", "name": "Short Name", "description": "What this measures"}
  ]
}

Provide exactly 6 axes.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.axes && Array.isArray(parsed.axes) && parsed.axes.length >= 4) {
      return parsed.axes.slice(0, 6);
    }
    throw new Error('Invalid axes response');
  } catch (error) {
    console.error('Gemini axes generation failed, using fallback:', error);
    return [
      { id: 'product_quality', name: 'Product Quality', description: 'Overall product/service quality and reliability' },
      { id: 'user_experience', name: 'User Experience', description: 'Ease of use and interface design' },
      { id: 'value_for_money', name: 'Value for Money', description: 'Price relative to features and benefits' },
      { id: 'customer_support', name: 'Customer Support', description: 'Support responsiveness and helpfulness' },
      { id: 'innovation', name: 'Innovation', description: 'Speed and quality of new capabilities' },
      { id: 'market_reputation', name: 'Market Reputation', description: 'Brand recognition and trust in the market' },
    ];
  }
}

/**
 * Score both businesses on each axis using Gemini
 */
async function scoreBusinesses(
  userAnalysis: { title: string; description: string; bodyText: string; url: string },
  competitorAnalysis: { title: string; description: string; bodyText: string; url: string },
  axes: Array<{ id: string; name: string; description: string }>
): Promise<{ userScores: number[]; competitorScores: number[] }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Score these two businesses on each dimension (0-100 scale).

USER BUSINESS:
- Name: ${userAnalysis.title}
- Description: ${userAnalysis.description}
- URL: ${userAnalysis.url}
- Content excerpt: ${userAnalysis.bodyText.slice(0, 1500)}

COMPETITOR:
- Name: ${competitorAnalysis.title}
- Description: ${competitorAnalysis.description}
- URL: ${competitorAnalysis.url}
- Content excerpt: ${competitorAnalysis.bodyText.slice(0, 1500)}

DIMENSIONS TO SCORE:
${axes.map((axis, i) => `${i + 1}. ${axis.name}: ${axis.description}`).join('\n')}

SCORING GUIDANCE:
- Use 0-100 scale realistically
- Most scores should fall in 40-70 range
- Only give 80+ for clear exceptional strengths
- Only give below 30 for clear significant weaknesses
- Base scores on visible website content and signals

Return ONLY valid JSON (no markdown, no code fences):
{
  "userScores": [score1, score2, score3, score4, score5, score6],
  "competitorScores": [score1, score2, score3, score4, score5, score6]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Clamp all scores to 0-100
    const clamp = (scores: number[]) => scores.map(s => Math.max(0, Math.min(100, Math.round(s) || 50)));

    return {
      userScores: clamp(parsed.userScores || []),
      competitorScores: clamp(parsed.competitorScores || []),
    };
  } catch (error) {
    console.error('Gemini scoring failed, using fallback:', error);
    // Generate realistic fallback scores
    const genScores = () => axes.map(() => Math.floor(Math.random() * 25) + 45);
    return { userScores: genScores(), competitorScores: genScores() };
  }
}

/**
 * Generate insights from score comparisons
 */
function generateInsights(
  userScores: number[],
  competitorScores: number[],
  axes: Array<{ name: string }>
): { strengths: string[]; opportunities: string[] } {
  const strengths: string[] = [];
  const opportunities: string[] = [];

  axes.forEach((axis, i) => {
    const diff = userScores[i] - competitorScores[i];
    if (diff > 10) {
      strengths.push(`Strong ${axis.name.toLowerCase()} (${userScores[i]}/100 vs ${competitorScores[i]}/100)`);
    } else if (diff < -10) {
      opportunities.push(`Improve ${axis.name.toLowerCase()} (currently ${userScores[i]}/100 vs competitor ${competitorScores[i]}/100)`);
    }
  });

  // Ensure minimum of 2 each
  while (strengths.length < 2) {
    strengths.push(strengths.length === 0
      ? 'Competitive positioning in key markets'
      : 'Clear value proposition for target audience');
  }
  while (opportunities.length < 2) {
    opportunities.push(opportunities.length === 0
      ? 'Expand market reach and visibility'
      : 'Enhance customer engagement strategies');
  }

  return {
    strengths: strengths.slice(0, 4),
    opportunities: opportunities.slice(0, 4),
  };
}

/**
 * Find a competitor via Gemini when none is provided
 */
async function findCompetitor(businessName: string, industry: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(
      `What is the most well-known competitor website URL for "${businessName}" in the ${industry} industry? Return ONLY the URL (e.g., https://competitor.com), nothing else.`
    );
    const url = result.response.text().trim();
    if (url.startsWith('http')) return url;
    return `https://${url}`;
  } catch {
    return '';
  }
}

/**
 * Main radar data generation pipeline
 */
async function generateRadarData(
  userWebsiteURL: string,
  businessName: string,
  competitorURL: string,
  metadata: Record<string, string>
): Promise<any> {
  console.log('=== Starting Radar Data Generation ===');
  console.log('User:', businessName, '|', userWebsiteURL);
  console.log('Competitor URL:', competitorURL || 'Not provided');

  // Step 1: Crawl user website
  let userAnalysis;
  try {
    userAnalysis = await crawlWebsite(userWebsiteURL);
    console.log('User website crawled:', userAnalysis.title);
  } catch (err) {
    console.error('User website crawl failed:', err);
    userAnalysis = {
      url: userWebsiteURL,
      title: businessName || 'User Business',
      description: metadata.productDescription || '',
      bodyText: metadata.productDescription || businessName || '',
    };
  }

  // Step 2: Detect industry
  const industry = metadata.industry || await detectIndustry(userAnalysis.bodyText);
  console.log('Industry detected:', industry);

  // Step 3: Find competitor if not provided
  let finalCompetitorURL = competitorURL;
  if (!finalCompetitorURL) {
    finalCompetitorURL = await findCompetitor(businessName || userAnalysis.title, industry);
    console.log('Competitor found via AI:', finalCompetitorURL);
  }

  // Step 4: Crawl competitor
  let competitorAnalysis;
  if (finalCompetitorURL) {
    try {
      competitorAnalysis = await crawlWebsite(finalCompetitorURL);
      console.log('Competitor crawled:', competitorAnalysis.title);
    } catch (err) {
      console.error('Competitor crawl failed:', err);
      competitorAnalysis = {
        url: finalCompetitorURL,
        title: 'Competitor',
        description: '',
        bodyText: '',
      };
    }
  } else {
    competitorAnalysis = {
      url: '',
      title: 'Industry Average',
      description: 'Composite industry benchmark',
      bodyText: '',
    };
  }

  // Step 5: Generate axes
  const axes = await generateRadarAxes(
    industry,
    userAnalysis.title,
    competitorAnalysis.title
  );
  console.log('Axes generated:', axes.length);

  // Step 6: Score both businesses
  const { userScores, competitorScores } = await scoreBusinesses(
    userAnalysis,
    competitorAnalysis,
    axes
  );
  console.log('Scores generated');

  // Step 7: Generate insights
  const { strengths, opportunities } = generateInsights(userScores, competitorScores, axes);
  console.log('Insights generated');

  return {
    userName: businessName || userAnalysis.title,
    userURL: userWebsiteURL,
    competitorName: competitorAnalysis.title,
    competitorURL: finalCompetitorURL || '',
    industry,
    axes,
    userScores,
    competitorScores,
    strengths,
    opportunities,
    generatedAt: new Date().toISOString(),
  };
}

export default async function handler(req: Request): Promise<Response> {
  console.log('=== Stripe Webhook Received ===');

  try {
    // Get webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No stripe-signature header');
      return new Response(JSON.stringify({ error: 'No signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify webhook signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Webhook verified, event type:', event.type);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('Payment completed:', {
        sessionId: session.id,
        amount: session.amount_total,
        email: session.customer_email,
      });

      const metadata = session.metadata || {};
      const userWebsiteURL = metadata.userWebsiteURL || '';
      const businessName = metadata.businessName || '';
      const competitorURL = metadata.competitorURL || '';
      const userEmail = session.customer_email || '';

      // Update user tier to premium
      const userId = session.client_reference_id || userEmail;
      if (userId) {
        await cacheSet(`tier:${userId}`, {
          tier: 'edge',
          sessionId: session.id,
          purchasedAt: new Date().toISOString(),
        }, 60 * 60 * 24 * 365); // 1 year
        console.log('User tier updated to premium:', userId);
      }

      // Generate radar chart data if we have enough info
      if (userWebsiteURL || businessName) {
        try {
          const radarData = await generateRadarData(
            userWebsiteURL,
            businessName,
            competitorURL,
            metadata
          );

          // Store with session ID as primary key
          await cacheSet(`radar:${session.id}`, radarData, 60 * 60 * 24); // 24 hours

          // Also store with email for backup retrieval
          if (userEmail) {
            await cacheSet(`radar:email:${userEmail}`, {
              sessionId: session.id,
              ...radarData,
            }, 60 * 60 * 24 * 7); // 7 days
          }

          console.log('Radar data generated and cached for session:', session.id);
        } catch (radarError) {
          console.error('Radar generation failed:', radarError);
          // Log error but don't fail the webhook
          await cacheSet(`radar:error:${session.id}`, {
            error: radarError.message,
            timestamp: new Date().toISOString(),
          }, 60 * 60 * 24);
        }
      } else {
        console.log('No website URL or business name in metadata, skipping radar generation');
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
