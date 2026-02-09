import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
import { createClient } from 'npm:@vercel/kv@1.0.1';

type DraftOptionsRequest = {
  fieldKey: string;
  fieldLabel?: string;
  currentValue?: string;
  formContext?: {
    productName?: string;
    oneLiner?: string;
    audience?: string;
    differentiators?: string;
    [key: string]: unknown;
  };
  tier?: 'free' | 'edge' | string;
};

const kvUrl = Deno.env.get('KV_REST_API_URL');
const kvToken = Deno.env.get('KV_REST_API_TOKEN');
const kv = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null;

const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();
const memoryRateLimits = new Map<string, { count: number; expiresAt: number }>();

const CACHE_TTL_SECONDS = 60 * 60 * 12;
const DEFAULT_MODEL = 'gemini-2.0-flash';

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

function toTier(value: unknown): 'free' | 'edge' {
  return value === 'edge' ? 'edge' : 'free';
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getFallbackOptions(fieldLabel: string, currentValue: string): string[] {
  const cleanLabel = fieldLabel || 'this field';
  const value = currentValue || '';
  const shortValue = value.split('.').map((part) => part.trim()).filter(Boolean)[0] || value;

  return [
    shortValue ? `${shortValue}` : `Clear draft for ${cleanLabel.toLowerCase()}.`,
    `Specific draft for ${cleanLabel.toLowerCase()} with one clear outcome.`,
    `Direct draft for ${cleanLabel.toLowerCase()} using plain language.`,
  ]
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeOptions(options: unknown, fieldLabel: string, currentValue: string): string[] {
  const raw = Array.isArray(options) ? options : [];
  const clean = raw
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .filter((item) => item.length >= 8)
    .filter((item) => item.length <= 280);

  const unique = Array.from(new Set(clean));
  const capped = unique.slice(0, 6);
  if (capped.length >= 3) return capped;

  const fallback = getFallbackOptions(fieldLabel, currentValue);
  return Array.from(new Set([...capped, ...fallback])).slice(0, 6);
}

async function getCached(cacheKey: string): Promise<unknown | null> {
  if (kv) {
    try {
      const cached = await kv.get(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.error('KV cache read failed:', error);
    }
  }

  const local = memoryCache.get(cacheKey);
  if (local && Date.now() < local.expiresAt) {
    return local.data;
  }

  return null;
}

async function setCached(cacheKey: string, value: unknown): Promise<void> {
  if (kv) {
    try {
      await kv.set(cacheKey, value, { ex: CACHE_TTL_SECONDS });
      return;
    } catch (error) {
      console.error('KV cache write failed:', error);
    }
  }

  memoryCache.set(cacheKey, {
    data: value,
    expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
  });
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const real = req.headers.get('x-real-ip') || '';
  const candidate = forwarded.split(',')[0]?.trim() || real.trim() || 'unknown';
  return candidate || 'unknown';
}

function getRateLimitWindowSeconds(): number {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return Math.max(1, Math.floor((endOfDay.getTime() - now.getTime()) / 1000));
}

async function getRateLimitCount(rateLimitKey: string): Promise<number> {
  if (kv) {
    try {
      const fromKv = await kv.get<number>(rateLimitKey);
      if (typeof fromKv === 'number') return fromKv;
    } catch (error) {
      console.error('KV rate limit read failed:', error);
    }
  }

  const local = memoryRateLimits.get(rateLimitKey);
  if (local && Date.now() < local.expiresAt) {
    return local.count;
  }
  return 0;
}

async function setRateLimitCount(rateLimitKey: string, count: number): Promise<void> {
  const ttl = getRateLimitWindowSeconds();

  if (kv) {
    try {
      await kv.set(rateLimitKey, count, { ex: ttl });
      return;
    } catch (error) {
      console.error('KV rate limit write failed:', error);
    }
  }

  memoryRateLimits.set(rateLimitKey, {
    count,
    expiresAt: Date.now() + ttl * 1000,
  });
}

function buildPrompt(input: DraftOptionsRequest): string {
  const fieldKey = normalizeText(input.fieldKey);
  const fieldLabel = normalizeText(input.fieldLabel) || fieldKey;
  const currentValue = normalizeText(input.currentValue);
  const context = input.formContext || {};

  return `You write direct draft options for SaaS form fields.

Rules:
- Keep language factual and concise.
- Avoid hype.
- Do not invent product capabilities.
- Keep each option as one sentence.
- No markdown.

Field key: ${fieldKey}
Field label: ${fieldLabel}
Current value: ${currentValue || 'Not provided'}
Product name: ${normalizeText(context.productName)}
One-liner: ${normalizeText(context.oneLiner)}
Audience: ${normalizeText(context.audience)}
Differentiators: ${normalizeText(context.differentiators)}

Return JSON only:
{
  "options": [
    "option 1",
    "option 2",
    "option 3",
    "option 4"
  ]
}`;
}

Deno.serve(async (req) => {
  try {
    createClientFromRequest(req);

    const body = (await req.json()) as DraftOptionsRequest;
    const fieldKey = normalizeText(body.fieldKey);
    const fieldLabel = normalizeText(body.fieldLabel) || fieldKey;
    const currentValue = normalizeText(body.currentValue);
    const tier = toTier(body.tier);

    if (!fieldKey) {
      return Response.json(
        { success: false, error: 'Missing fieldKey.', schemaVersion: '1.0', fieldKey: '', options: [] },
        { status: 400 },
      );
    }

    const ip = getClientIp(req);
    const today = new Date().toISOString().slice(0, 10);
    const rateLimitKey = `draft_options_rate:${ip}:${today}:${tier}`;
    const limit = tier === 'edge' ? 120 : 30;
    const count = await getRateLimitCount(rateLimitKey);

    if (count >= limit) {
      return Response.json(
        {
          success: false,
          schemaVersion: '1.0',
          fieldKey,
          options: [],
          error: 'Rate limit reached. Try again later.',
        },
        { status: 429 },
      );
    }

    const normalizedContext = {
      fieldKey,
      fieldLabel,
      currentValue,
      tier,
      formContext: {
        productName: normalizeText(body.formContext?.productName),
        oneLiner: normalizeText(body.formContext?.oneLiner),
        audience: normalizeText(body.formContext?.audience),
        differentiators: normalizeText(body.formContext?.differentiators),
      },
    };
    const contextHash = await sha256(JSON.stringify(normalizedContext));
    const cacheKey = `draft_options:${tier}:${fieldKey.toLowerCase()}:${contextHash}`;

    const cached = await getCached(cacheKey);
    if (cached && typeof cached === 'object') {
      await setRateLimitCount(rateLimitKey, count + 1);
      return Response.json({
        success: true,
        schemaVersion: '1.0',
        fieldKey,
        ...(cached as Record<string, unknown>),
        cached: true,
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return Response.json(
        {
          success: false,
          schemaVersion: '1.0',
          fieldKey,
          options: [],
          error: 'GEMINI_API_KEY is not configured.',
        },
        { status: 500 },
      );
    }

    const modelName = Deno.env.get('DRAFT_OPTIONS_MODEL') || DEFAULT_MODEL;
    const model = new GoogleGenerativeAI(geminiKey).getGenerativeModel({ model: modelName });
    const response = await model.generateContent(buildPrompt(body));
    const text = response.response.text().trim();
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    let parsed: { options?: unknown[] } = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { options: [] };
    }

    const options = sanitizeOptions(parsed.options, fieldLabel, currentValue);
    const payload = { options };
    await setCached(cacheKey, payload);
    await setRateLimitCount(rateLimitKey, count + 1);

    return Response.json({
      success: true,
      schemaVersion: '1.0',
      fieldKey,
      ...payload,
      cached: false,
    });
  } catch (error) {
    console.error('draftFieldOptions error:', error);
    return Response.json(
      {
        success: false,
        schemaVersion: '1.0',
        fieldKey: '',
        options: [],
        error: 'Failed to create draft options.',
      },
      { status: 500 },
    );
  }
});
