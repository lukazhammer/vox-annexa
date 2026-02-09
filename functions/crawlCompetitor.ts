interface CrawlRequest {
  url: string;
  depth?: 'basic' | 'deep';
}

interface CrawlResult {
  success: boolean;
  data?: {
    businessName: string;
    industry: string;
    positioning: string;
    features: string[];
    pricing: {
      model: string;
      range: string;
    };
    messaging: {
      headline: string;
      value_props: string[];
    };
    crawledAt: string;
  };
  error?: string;
}

export default async function handler(req: Request): Promise<Response> {
  console.log('=== crawlCompetitor START ===');

  try {
    const { url, depth = 'basic' }: CrawlRequest = await req.json();

    if (!url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'URL is required',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    console.log('Crawling:', url);

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Validate URL
    try {
      new URL(normalizedUrl);
    } catch {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid URL format',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Fetch website
    let response;
    try {
      response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(15000),
      });
    } catch (fetchError) {
      console.error('Fetch failed:', fetchError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Unable to access website. Check if URL is correct and publicly accessible.',
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `Website returned ${response.status} status`,
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const html = await response.text();
    console.log('HTML fetched, length:', html.length);

    // Extract data from HTML
    const businessName = extractBusinessName(html);
    const messaging = extractMessaging(html);
    const features = extractFeatures(html);
    const pricing = extractPricing(html);

    // Use Gemini to classify industry and positioning
    const { GoogleGenerativeAI } = await import('npm:@google/generative-ai');
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const analysisPrompt = `Analyze this website content and provide:
1. Industry classification (e.g., "SaaS - Project Management", "E-commerce - Fashion")
2. Positioning statement (one sentence describing their market position)

Website: ${businessName}
Headline: ${messaging.headline}
Value props: ${messaging.value_props.join(', ')}

OUTPUT (JSON only, no markdown):
{
  "industry": "classification here",
  "positioning": "one sentence positioning"
}`;

    let industry = 'Business Software';
    let positioning = 'Market positioning unclear';

    try {
      const result = await model.generateContent(analysisPrompt);
      const text = result.response.text().replace(/```json\s?|\s?```/g, '').trim();
      const analysis = JSON.parse(text);
      industry = analysis.industry;
      positioning = analysis.positioning;
    } catch (aiError) {
      console.warn('Gemini analysis failed, using defaults:', aiError);
    }

    const crawlResult: CrawlResult = {
      success: true,
      data: {
        businessName,
        industry,
        positioning,
        features,
        pricing,
        messaging,
        crawledAt: new Date().toISOString(),
      },
    };

    console.log('=== crawlCompetitor SUCCESS ===');

    return new Response(JSON.stringify(crawlResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('crawlCompetitor error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error during crawl',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// Helper: Extract business name
function extractBusinessName(html: string): string {
  // Try og:site_name
  const ogMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  if (ogMatch) return ogMatch[1];

  // Try title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    return title.split(/[|\-\u2013\u2014]/)[0].trim();
  }

  return 'Unknown Business';
}

// Helper: Extract messaging
function extractMessaging(html: string): { headline: string; value_props: string[] } {
  // Try to find main headline (h1)
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const headline = h1Match ? h1Match[1].trim() : 'No headline found';

  // Extract meta description as value prop
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const value_props = descMatch ? [descMatch[1].trim()] : [];

  return { headline, value_props };
}

// Helper: Extract features
function extractFeatures(html: string): string[] {
  const features: string[] = [];

  // Look for common feature list patterns
  const featureRegex = /<(?:li|div|p)[^>]*>([^<]{20,100})<\/(?:li|div|p)>/gi;
  let match;
  let count = 0;

  while ((match = featureRegex.exec(html)) && count < 10) {
    const text = match[1].trim();
    if (text.length > 20 && text.length < 100 && !text.includes('<')) {
      features.push(text);
      count++;
    }
  }

  return features;
}

// Helper: Extract pricing
function extractPricing(html: string): { model: string; range: string } {
  // Look for pricing indicators
  const hasSubscription = /\b(?:month|monthly|year|yearly|subscription)\b/i.test(html);
  const hasOneTime = /\b(?:one[- ]?time|forever|lifetime)\b/i.test(html);

  // Try to find dollar amounts
  const priceMatches = html.match(/\$\d+/g);
  const prices = priceMatches ? priceMatches.map(p => parseInt(p.slice(1))) : [];

  let model = 'Unknown';
  if (hasSubscription) model = 'Subscription';
  else if (hasOneTime) model = 'One-time';

  let range = 'Unknown';
  if (prices.length > 0) {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    range = min === max ? `$${min}` : `$${min} - $${max}`;
  }

  return { model, range };
}
