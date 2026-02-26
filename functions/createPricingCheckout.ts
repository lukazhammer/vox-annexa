import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.5.0';

// Initialize Stripe with secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tier } = await req.json();

        if (!tier || !['growth', 'velocity'].includes(tier)) {
            return Response.json({ error: 'Invalid tier' }, { status: 400 });
        }

        const tierConfig = {
            growth: {
                name: 'Annexa Growth',
                amount: 2900, // $29.00
                description: '5 Growth Sprints, 10 Ship Logs, 1 Competitor Check, Legal docs bundle'
            },
            velocity: {
                name: 'Annexa Velocity',
                amount: 7900, // $79.00
                description: 'Unlimited Sprints, Unlimited Ship Logs, 3 Competitor Monitors, Weekly alerts, Legal docs bundle'
            }
        };

        const config = tierConfig[tier];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: config.name,
                            description: config.description,
                        },
                        unit_amount: config.amount,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${req.headers.get('origin') || 'https://annexa.base44.app'}/Growth?payment=success&tier=${tier}`,
            cancel_url: `${req.headers.get('origin') || 'https://annexa.base44.app'}/#pricing`,
            metadata: {
                base44_app_id: Deno.env.get('BASE44_APP_ID'),
                user_email: user.email,
                tier: tier
            }
        });

        console.log(`Checkout session created for ${tier}: ${session.id}`);

        return Response.json({ url: session.url });

    } catch (error) {
        console.error('Stripe checkout error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});