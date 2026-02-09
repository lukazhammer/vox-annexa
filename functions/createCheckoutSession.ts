import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.14.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      returnUrl,
      competitorUrl,
      userWebsiteURL,
      businessName,
      productDescription,
      industry,
      email,
    } = await req.json();

    // Build URLs - redirect to PremiumDashboard after payment
    const baseUrl = returnUrl || req.headers.get('origin') || '';
    const successUrl = `${baseUrl}/PremiumDashboard?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/Form?payment=cancelled`;

    // Build metadata for webhook radar generation (Stripe limits: 500 chars per value)
    const metadata: Record<string, string> = {
      base44_app_id: Deno.env.get('BASE44_APP_ID') || '',
      product: 'annexa_premium',
    };

    if (userWebsiteURL) metadata.userWebsiteURL = userWebsiteURL.slice(0, 500);
    if (businessName) metadata.businessName = businessName.slice(0, 500);
    if (competitorUrl) metadata.competitorURL = competitorUrl.slice(0, 500);
    if (productDescription) metadata.productDescription = productDescription.slice(0, 500);
    if (industry) metadata.industry = industry.slice(0, 500);

    const sessionParams: any = {
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
      metadata,
    };

    // Set customer email if provided
    if (email) {
      sessionParams.customer_email = email;
      sessionParams.client_reference_id = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Created checkout session:', session.id, '| business:', businessName);

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