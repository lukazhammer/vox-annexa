import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { returnUrl, competitorUrl } = await req.json();

    // Build success/cancel URLs with state preservation
    const baseUrl = returnUrl || req.headers.get('origin') || '';
    
    // Store the competitor URL in the success URL so we can restore state
    const successUrl = `${baseUrl}/Form?payment=success&tier=premium${competitorUrl ? `&competitorUrl=${encodeURIComponent(competitorUrl)}` : ''}`;
    const cancelUrl = `${baseUrl}/Form?payment=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1Syot7LAxnYWOe1uvZojdEmI',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        product: 'annexa_premium',
      },
    });

    console.log('Created checkout session:', session.id);

    return Response.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Checkout session creation failed:', error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
});