import { UserTier, TierData, TierFeatures, TIER_FEATURES } from './types';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'annexa_user_tier';
const TIER_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

// Cache for server verification to avoid excessive API calls
let verificationCache: { verified: boolean; timestamp: number } | null = null;
const VERIFICATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get the stored tier data from localStorage
 * Returns null if not found or expired
 */
export function getTierData(): TierData | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const data: TierData = JSON.parse(stored);

        // Check if expired
        if (data.expiresAt < Date.now()) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Failed to read tier data:', error);
        return null;
    }
}

/**
 * Store tier data in localStorage with TTL
 */
export function setTierData(tier: UserTier, transactionId?: string): void {
    const data: TierData = {
        tier,
        purchasedAt: Date.now(),
        expiresAt: Date.now() + TIER_TTL,
        transactionId,
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save tier data:', error);
    }
}

/**
 * Get the current user tier (free or premium)
 * Checks localStorage first, falls back to 'free'
 */
export function getUserTier(): UserTier {
    const data = getTierData();
    return data?.tier || 'free';
}

/**
 * Get feature flags for a tier
 */
export function getTierFeatures(tier?: UserTier): TierFeatures {
    const currentTier = tier || getUserTier();
    return TIER_FEATURES[currentTier];
}

/**
 * Upgrade user to premium tier
 * @param transactionId - Optional Stripe transaction ID
 */
export function upgradeToPremium(transactionId?: string): void {
    setTierData('premium', transactionId);
}

/**
 * Clear all tier data (reset to free)
 */
export function clearTierData(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if user has premium tier
 */
export function isPremium(): boolean {
    return getUserTier() === 'premium';
}

/**
 * Verify premium access with server
 * Prevents localStorage manipulation
 * Uses cache to avoid excessive API calls
 */
export async function verifyPremiumAccess(): Promise<boolean> {
    const tierData = getTierData();
    
    // Not premium according to localStorage
    if (!tierData || tierData.tier !== 'premium') {
        return false;
    }
    
    // Check expiration
    if (tierData.expiresAt && tierData.expiresAt < Date.now()) {
        clearTierData();
        return false;
    }
    
    // Check cache first
    if (verificationCache && 
        Date.now() - verificationCache.timestamp < VERIFICATION_CACHE_TTL) {
        return verificationCache.verified;
    }
    
    // Verify with server (prevents localStorage manipulation)
    try {
        const response = await base44.functions.invoke('verifyTier', {
            tier: tierData.tier,
            transactionId: tierData.transactionId || ''
        });
        
        const verified = response.verified === true;
        
        // Update cache
        verificationCache = {
            verified,
            timestamp: Date.now()
        };
        
        return verified;
    } catch (error) {
        // Fail closed for security - if verification fails, deny premium access
        // But don't clear localStorage as it might be a temporary network issue
        if (import.meta.env.DEV) {
            console.warn('Tier verification failed (network error?):', error);
        }
        return false;
    }
}

/**
 * Synchronous check for premium features (uses cached verification)
 * For immediate UI decisions, use this. For critical operations, use verifyPremiumAccess()
 */
export function hasPremiumFeatures(): boolean {
    const tierData = getTierData();
    
    if (!tierData || tierData.tier !== 'premium') {
        return false;
    }
    
    // Check expiration
    if (tierData.expiresAt && tierData.expiresAt < Date.now()) {
        clearTierData();
        return false;
    }
    
    // Check if we have a valid cached verification
    if (verificationCache && 
        Date.now() - verificationCache.timestamp < VERIFICATION_CACHE_TTL) {
        return verificationCache.verified;
    }
    
    // Return true based on localStorage, but caller should verify with server for critical operations
    return true;
}

/**
 * Clear verification cache (call after logout or tier change)
 */
export function clearVerificationCache(): void {
    verificationCache = null;
}

/**
 * Migrate old tier data format if it exists
 * Call once on app initialization
 */
export function migrateOldTierData(): void {
    // Check for old format tier storage
    const oldKeys = ['user_tier', 'vox_tier', 'annexa.tier'];

    for (const oldKey of oldKeys) {
        const oldValue = localStorage.getItem(oldKey);
        if (oldValue === 'premium' && !getTierData()) {
            // Note: migrated_ prefix will be rejected by server verification
            // This is intentional - migrated data needs re-verification
            setTierData('premium', 'migrated_' + Date.now());
            localStorage.removeItem(oldKey);
            break;
        }
    }
}
