import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
import { createClient } from 'npm:@vercel/kv@1.0.1';

const kvUrl = Deno.env.get('KV_REST_API_URL');
const kvToken = Deno.env.get('KV_REST_API_TOKEN');
const kv = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null;
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_SECONDS = 60 * 60 * 24;

type LandingPatchRequest = {
  websiteUrl?: string;
  productName?: string;
  oneLiner?: string;
  audience?: string;
  differentiators?: string[];
  tier?: 'free' | 'edge' | string;
};

type LandingPatchVariant = {
  id: string;
  headline: string;
  subhead: string;
  bullets: string[];
  cta: string;
  alternates: {
    headline: string[];
    subhead: string[];
    cta: string[];
  };
  whyThisWorks?: string;
};

function sanitizeText(input: unknown, fallback = ''): string {
  if (typeof input !== 'string') return fallback;
  return input.trim();
}

function getCacheKey(input: LandingPatchRequest, tier: 'free' | 'edge'): string {
  const payload = JSON.stringify({
    websiteUrl: sanitizeText(input.websiteUrl),
    productName: sanitizeText(input.productName),
    oneLiner: sanitizeText(input.oneLiner),
    audience: sanitizeText(input.audience),
    differentiators: Array.isArray(input.differentiators) ? input.differentiators.map((x) => sanitizeText(x)).filter(Boolean) : [],
    tier,
  });
  return `landing_patch_${btoa(payload)}`;
}

function normalizeVariant(raw: unknown, idx: number, includeRationale: boolean): LandingPatchVariant {
  const source = (raw || {}) as Record<string, unknown>;
  const headline = sanitizeText(source.headline, 'Clear headline');
  const subhead = sanitizeText(source.subhead, 'Clear subhead');
  const cta = sanitizeText(source.cta, 'Start here');
  const bullets = Array.isArray(source.bullets)
    ? source.bullets.map((x) => sanitizeText(x)).filter(Boolean).slice(0, 4)
    : [];

  const rawAlternates = (source.alternates || {}) as Record<string, unknown>;
  const alternates = {
    headline: Array.isArray(rawAlternates.headline) ? rawAlternates.headline.map((x) => sanitizeText(x)).filter(Boolean).slice(0, 3) : [],
    subhead: Array.isArray(rawAlternates.subhead) ? rawAlternates.subhead.map((x) => sanitizeText(x)).filter(Boolean).slice(0, 3) : [],
    cta: Array.isArray(rawAlternates.cta) ? rawAlternates.cta.map((x) => sanitizeText(x)).filter(Boolean).slice(0, 3) : [],
  };

  return {
    id: `variant_${idx + 1}`,
    headline,
    subhead,
    bullets: bullets.length ? bullets : ['State the user problem clearly', 'Show how the product helps', 'Keep the next action direct'],
    cta,
    alternates,
    ...(includeRationale ? { whyThisWorks: sanitizeText(source.whyThisWorks, 'This version keeps the value proposition specific and direct.') } : {}),
  };
}

function buildPrompt(input: LandingPatchRequest, tier: 'free' | 'edge'): string {
  const variantCount = tier === 'edge' ? 3 : 1;
  const includeRationale = tier === 'edge';
  const differentiators = Array.isArray(input.differentiators) ? input.differentiators.map((x) => sanitizeText(x)).filter(Boolean) : [];

  return `You write conversion copy for indie SaaS landing pages.

VOICE RULES:
- Direct, specific, low-friction language.
- No hype words.
- Never use: unlock, seamless, powerful, robust, leverage, game-changer, cutting-edge.
- Short sentences.
- Keep claims realistic.

INPUT:
- Website URL: ${sanitizeText(input.websiteUrl, 'Not provided')}
- Product name: ${sanitizeText(input.productName, 'Product')}
- One-liner: ${sanitizeText(input.oneLiner, 'Not provided')}
- Audience: ${sanitizeText(input.audience, 'SaaS builders')}
- Differentiators: ${differentiators.length ? differentiators.join(' | ') : 'Not provided'}

TASK:
Generate ${variantCount} hero copy variant(s).
Each variant must include:
1. headline (max 10 words)
2. subhead (1 sentence)
3. bullets (3 short bullets)
4. cta (single line)
5. alternates: 2 headline alternates, 2 subhead alternates, 2 cta alternates
${includeRationale ? '6. whyThisWorks (1 short sentence)' : ''}

Return ONLY valid JSON:
{
  "variants": [
    {
      "headline": "...",
      "subhead": "...",
      "bullets": ["...", "...", "..."],
      "cta": "...",
      "alternates": {
        "headline": ["...", "..."],
        "subhead": ["...", "..."],
        "cta": ["...", "..."]
      }${includeRationale ? ',\n      "whyThisWorks": "..."' : ''}
    }
  ]
}`;
}

async function readCache(cacheKey: string): Promise<unknown | null> {
  if (kv) {
    try {
      const cached = await kv.get(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.error('KV cache read failed:', error);
    }
  }

  const memCached = memoryCache.get(cacheKey);
  if (memCached && Date.now() < memCached.expiresAt) {
    return memCached.data;
  }

  return null;
}

async function writeCache(cacheKey: string, data: unknown): Promise<void> {
  if (kv) {
    try {
      await kv.set(cacheKey, data, { ex: CACHE_TTL_SECONDS });
      return;
    } catch (error) {
      console.error('KV cache write failed:', error);
    }
  }

  memoryCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
  });
}

Deno.serve(async (req) => {
  try {
    createClientFromRequest(req);

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return Response.json({ success: false, error: 'GEMINI_API_KEY is missing.' }, { status: 500 });
    }

    const body = (await req.json()) as LandingPatchRequest;
    const tier: 'free' | 'edge' = body.tier === 'edge' ? 'edge' : 'free';
    const cacheKey = getCacheKey(body, tier);

    const cached = await readCache(cacheKey);
    if (cached) {
      return Response.json({
        success: true,
        tier,
        cached: true,
        ...cached,
      });
    }

    const model = new GoogleGenerativeAI(geminiKey).getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(buildPrompt(body, tier));
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as { variants?: unknown[] };

    const variantCount = tier === 'edge' ? 3 : 1;
    const includeRationale = tier === 'edge';
    const normalizedVariants = (Array.isArray(parsed.variants) ? parsed.variants : [])
      .slice(0, variantCount)
      .map((variant, idx) => normalizeVariant(variant, idx, includeRationale));

    const fallbackVariants: LandingPatchVariant[] = [];
    for (let i = normalizedVariants.length; i < variantCount; i += 1) {
      fallbackVariants.push(normalizeVariant({}, i, includeRationale));
    }

    const payload = {
      schemaVersion: '1.0',
      variants: [...normalizedVariants, ...fallbackVariants],
    };

    await writeCache(cacheKey, payload);

    return Response.json({
      success: true,
      tier,
      cached: false,
      ...payload,
    });
  } catch (error) {
    console.error('Landing patch creation failed:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Landing patch creation failed.',
      },
      { status: 500 },
    );
  }
});
