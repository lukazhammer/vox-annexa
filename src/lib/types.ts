export type UserTier = 'free' | 'edge';

export interface TierData {
    tier: UserTier;
    purchasedAt: number;
    expiresAt: number;
    transactionId?: string;
}

export interface TierFeatures {
    canExport: boolean;
    canEmail: boolean;
    hasEdgeFeatures: boolean;
}

export const TIER_FEATURES: Record<UserTier, TierFeatures> = {
    free: {
        canExport: false,
        canEmail: false,
        hasEdgeFeatures: false,
    },
    edge: {
        canExport: true,
        canEmail: true,
        hasEdgeFeatures: true,
    },
};

export const PRICING = {
    edge: {
        amount: 29,
        currency: 'USD',
        description: 'One-time payment for lifetime access',
    },
} as const;
