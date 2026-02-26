import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

const tiers = [
    {
        name: 'Scout',
        price: '$0',
        priceNote: null,
        features: [
            '1 Growth Sprint',
            '1 Ship Log',
            'Legal docs bundle',
        ],
        cta: 'Start free',
        ctaVariant: 'outline',
        description: 'See how it works',
    },
    {
        name: 'Growth',
        price: '$29',
        priceNote: 'one-time',
        features: [
            '5 Growth Sprints',
            '10 Ship Logs',
            '1 Competitor Check',
            'Legal docs bundle',
        ],
        cta: 'Get Growth',
        ctaVariant: 'default',
        description: 'Enough for 2-3 months',
    },
    {
        name: 'Velocity',
        price: '$79',
        priceNote: 'one-time',
        features: [
            'Unlimited Sprints',
            'Unlimited Ship Logs',
            '3 Competitor Monitors',
            'Weekly alerts',
            'Legal docs bundle',
        ],
        cta: 'Get Velocity',
        ctaVariant: 'default',
        description: 'Ongoing growth engine',
    },
];

import { useEffect } from 'react';

export function PricingTiers() {
    const [loading, setLoading] = useState(null);

    // Check for pending checkout after login redirect
    useEffect(() => {
        const checkPendingCheckout = async () => {
            const pendingTier = localStorage.getItem('pending_checkout_tier');
            if (pendingTier) {
                localStorage.removeItem('pending_checkout_tier');
                
                const isAuthenticated = await base44.auth.isAuthenticated();
                if (isAuthenticated) {
                    setLoading(pendingTier);
                    try {
                        const response = await base44.functions.invoke('createPricingCheckout', { tier: pendingTier });
                        if (response.data?.url) {
                            window.location.href = response.data.url;
                        }
                    } catch (error) {
                        console.error('Checkout error:', error);
                    } finally {
                        setLoading(null);
                    }
                }
            }
        };
        
        checkPendingCheckout();
    }, []);

    const handlePurchase = async (tierName) => {
        // Check if running in iframe
        if (window.self !== window.top) {
            alert('Checkout works only from the published app. Please open the app in a new tab.');
            return;
        }

        const tierKey = tierName.toLowerCase();
        
        if (tierKey === 'scout') {
            // Free tier - redirect to selector
            document.getElementById('selector')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        setLoading(tierKey);
        
        try {
            // Check if user is authenticated first
            const isAuthenticated = await base44.auth.isAuthenticated();
            
            if (!isAuthenticated) {
                // Store the tier they want to purchase, then redirect to login
                localStorage.setItem('pending_checkout_tier', tierKey);
                base44.auth.redirectToLogin(window.location.origin + '/#pricing');
                return;
            }

            const response = await base44.functions.invoke('createPricingCheckout', { tier: tierKey });
            if (response.data?.url) {
                window.location.href = response.data.url;
            } else {
                alert('Failed to create checkout session');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {tiers.map((tier) => (
                <Card
                    key={tier.name}
                    className="bg-white border-[rgba(26,26,26,0.12)] flex flex-col"
                >
                    <CardHeader className="pb-2">
                        <p className="font-semibold text-[#1a1a1a]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {tier.name}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-4xl text-[#1a1a1a]" style={{ fontFamily: "'Caudex', serif" }}>
                                {tier.price}
                            </span>
                            {tier.priceNote && (
                                <span className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    {tier.priceNote}
                                </span>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 space-y-4">
                        <div className="border-t border-[rgba(26,26,26,0.12)] pt-4 flex-1">
                            <ul className="space-y-2">
                                {tier.features.map((feature, i) => (
                                    <li
                                        key={i}
                                        className="text-sm text-[#1a1a1a]"
                                        style={{ fontFamily: "'Poppins', sans-serif" }}
                                    >
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <p className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {tier.description}
                        </p>

                        <Button
                            variant={tier.ctaVariant}
                            onClick={() => handlePurchase(tier.name)}
                            disabled={loading === tier.name.toLowerCase()}
                            className={`w-full ${
                                tier.ctaVariant === 'default'
                                    ? 'bg-[#A03814] hover:bg-[#8a2f11] text-white border-0'
                                    : 'border-[rgba(26,26,26,0.2)] text-[#1a1a1a] hover:bg-[rgba(26,26,26,0.05)]'
                            }`}
                        >
                            {loading === tier.name.toLowerCase() ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                tier.cta
                            )}
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}