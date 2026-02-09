// Server-side tier verification function
// Prevents localStorage manipulation by verifying premium access with server

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

interface VerifyRequest {
  tier: string;
  transactionId?: string;
}

interface VerifyResponse {
  verified: boolean;
  tier?: string;
  reason?: string;
  note?: string;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    // Verify user is authenticated
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({
        verified: false,
        reason: 'Authentication required'
      } as VerifyResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { tier, transactionId } = await req.json() as VerifyRequest;

    // Free tier is always valid
    if (tier === 'free') {
      return new Response(JSON.stringify({
        verified: true,
        tier: 'free'
      } as VerifyResponse), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Premium tier requires valid transaction ID
    if (tier === 'premium') {
      // Reject suspicious transaction IDs
      const suspiciousPrefixes = ['test_', 'placeholder_', 'migrated_', 'fake_', 'dummy_'];
      const isSuspicious = !transactionId || 
        suspiciousPrefixes.some(prefix => transactionId.startsWith(prefix));

      if (isSuspicious) {
        // Log potential abuse
        base44.analytics.track({
          eventName: 'tier_verification_suspicious',
          properties: {
            tier,
            transactionId: transactionId || 'none',
            userId: user.id
          }
        });

        return new Response(JSON.stringify({
          verified: false,
          reason: 'Invalid transaction ID'
        } as VerifyResponse), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // TODO: When Stripe integration is complete, verify with Stripe API
      // For now, validate transaction ID format (should be Stripe payment intent format)
      // Stripe payment intents start with 'pi_'
      const isValidStripeFormat = transactionId.startsWith('pi_') || 
        transactionId.startsWith('csess_'); // Checkout session

      if (isValidStripeFormat) {
        // Log successful verification
        base44.analytics.track({
          eventName: 'tier_verification_success',
          properties: {
            tier,
            transactionId,
            userId: user.id
          }
        });

        return new Response(JSON.stringify({
          verified: true,
          tier: 'premium',
          note: 'Verified via Stripe transaction ID format'
        } as VerifyResponse), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // For non-Stripe transaction IDs, we can't verify yet
      // This is a placeholder until full Stripe webhook integration
      return new Response(JSON.stringify({
        verified: false,
        reason: 'Transaction verification not available',
        note: 'Full Stripe webhook integration required for production'
      } as VerifyResponse), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Unknown tier
    return new Response(JSON.stringify({
      verified: false,
      reason: 'Unknown tier'
    } as VerifyResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Tier verification error:', error);
    return new Response(JSON.stringify({
      verified: false,
      reason: 'Verification failed'
    } as VerifyResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
