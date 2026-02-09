import React, { useState, useEffect } from 'react';
import { getUserTier, upgradeToEdge, clearTierData, getTierData } from '@/lib/tierUtils';

/**
 * Development-only debug panel for testing tier functionality
 * Only renders in development mode
 */
export default function TierDebugPanel() {
    const [tier, setTier] = useState(getUserTier());
    const [tierData, setTierData] = useState(getTierData());
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Poll for tier changes
        const interval = setInterval(() => {
            setTier(getUserTier());
            setTierData(getTierData());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Only show in development
    if (import.meta.env.PROD) {
        return null;
    }

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 right-4 bg-zinc-800 text-zinc-400 p-2 rounded-lg text-xs hover:bg-zinc-700"
            >
                Show Tier Debug
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-zinc-900 border-2 border-[#C24516] rounded-lg p-4 max-w-xs z-50 shadow-xl">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-white">Tier Debug Panel</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-zinc-500 hover:text-white text-xs"
                >
                    Hide
                </button>
            </div>

            <div className="space-y-2 text-xs text-zinc-300 mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Current Tier:</span>
                    <span className={`font-bold ${tier === 'edge' ? 'text-green-500' : 'text-zinc-400'}`}>
                        {tier.toUpperCase()}
                    </span>
                </div>

                {tierData && (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Purchased:</span>
                            <span>{new Date(tierData.purchasedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-500">Expires:</span>
                            <span>{new Date(tierData.expiresAt).toLocaleDateString()}</span>
                        </div>
                        {tierData.transactionId && (
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500">Transaction:</span>
                                <span className="font-mono text-[10px] truncate max-w-[100px]">
                                    {tierData.transactionId}
                                </span>
                            </div>
                        )}
                    </>
                )}

                {!tierData && (
                    <div className="text-zinc-500 italic">No tier data stored</div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => {
                        upgradeToEdge('debug_' + Date.now());
                        setTier('edge');
                        setTierData(getTierData());
                    }}
                    className="flex-1 px-2 py-1.5 bg-[#C24516] hover:bg-[#a33912] text-white rounded text-xs font-medium transition-colors"
                >
                    Set EDGE
                </button>
                <button
                    onClick={() => {
                        clearTierData();
                        setTier('free');
                        setTierData(null);
                    }}
                    className="flex-1 px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-xs font-medium transition-colors"
                >
                    Clear Tier
                </button>
            </div>

            <div className="mt-3 pt-3 border-t border-zinc-800">
                <button
                    onClick={() => window.location.reload()}
                    className="w-full px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
                >
                    Refresh Page
                </button>
            </div>
        </div>
    );
}
