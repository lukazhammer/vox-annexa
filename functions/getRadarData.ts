// Retrieve pre-generated competitive radar data from KV cache
// Called by CompetitiveResults page after Stripe redirect

import { createClient } from 'npm:@vercel/kv@1.0.1';

// Initialize KV with graceful fallback
const kvUrl = Deno.env.get('KV_REST_API_URL');
const kvToken = Deno.env.get('KV_REST_API_TOKEN');
const kv = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null;

export default async function handler(req: Request): Promise<Response> {
  console.log('=== getRadarData called ===');

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Session ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching radar data for session:', sessionId);

    if (!kv) {
      console.error('KV not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Cache service unavailable. Please contact support.',
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get pre-generated radar data
    const radarData = await kv.get(`radar:${sessionId}`);

    if (!radarData) {
      console.error('Radar data not found for session:', sessionId);

      // Check if generation failed
      const errorData = await kv.get(`radar:error:${sessionId}`);

      if (errorData) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Competitive analysis generation encountered an issue. Please contact support.',
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Competitive analysis data not found. It may still be generating or has expired (24 hours). Please try refreshing in a moment.',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Radar data found, returning');

    return new Response(JSON.stringify({
      success: true,
      data: radarData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('getRadarData error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to retrieve competitive analysis data',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
