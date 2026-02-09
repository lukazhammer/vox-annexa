// Retrieve premium dashboard data: radar + user metadata
// Called by PremiumDashboard page after Stripe redirect

import { createClient } from 'npm:@vercel/kv@1.0.1';

const kvUrl = Deno.env.get('KV_REST_API_URL');
const kvToken = Deno.env.get('KV_REST_API_TOKEN');
const kv = kvUrl && kvToken ? createClient({ url: kvUrl, token: kvToken }) : null;

export default async function handler(req: Request): Promise<Response> {
  console.log('=== getPremiumDashboard called ===');

  try {
    const { sessionId, email } = await req.json();

    if (!sessionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Session ID is required',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching dashboard data for session:', sessionId);

    if (!kv) {
      console.error('KV not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Cache service unavailable.',
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get radar data (primary key: session ID)
    let radarData = await kv.get(`radar:${sessionId}`);

    // Fallback: try by email
    if (!radarData && email) {
      radarData = await kv.get(`radar:email:${email}`);
    }

    // Check if generation failed
    if (!radarData) {
      const errorData = await kv.get(`radar:error:${sessionId}`);
      if (errorData) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Competitive analysis generation encountered an issue.',
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Dashboard data not found. It may still be generating.',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get tier info
    const tierKey = email ? `tier:${email}` : null;
    const tierData = tierKey ? await kv.get(tierKey) : null;

    return new Response(JSON.stringify({
      success: true,
      data: {
        radarData,
        tierData: tierData || { tier: 'premium', sessionId },
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('getPremiumDashboard error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to retrieve dashboard data',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
