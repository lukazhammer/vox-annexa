import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

export function PricingTiers() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {tiers.map((tier) => (
                <Card
                    key={tier.name}
                    className="bg-[var(--card)] border-[var(--border)] flex flex-col"
                >
                    <CardHeader className="pb-2">
                        <p className="font-body font-semibold text-[var(--text)]">
                            {tier.name}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="font-headline text-4xl text-[var(--text)]">
                                {tier.price}
                            </span>
                            {tier.priceNote && (
                                <span className="font-body text-sm text-[var(--text-muted)]">
                                    {tier.priceNote}
                                </span>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 space-y-4">
                        <div className="border-t border-[var(--border)] pt-4 flex-1">
                            <ul className="space-y-2">
                                {tier.features.map((feature, i) => (
                                    <li
                                        key={i}
                                        className="font-body text-sm text-[var(--text)]"
                                    >
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <p className="font-body text-sm text-[var(--text-muted)]">
                            {tier.description}
                        </p>

                        <Button
                            variant={tier.ctaVariant}
                            className={`w-full ${
                                tier.ctaVariant === 'default'
                                    ? 'bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white border-0'
                                    : ''
                            }`}
                        >
                            {tier.cta}
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}