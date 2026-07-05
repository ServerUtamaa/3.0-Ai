import { Asset } from '../types';

export function detectSessionStrength(): { session: 'ASIA' | 'LONDON' | 'NEWYORK', score: number } {
    const hours = new Date().getUTCHours();
    let session: 'ASIA' | 'LONDON' | 'NEWYORK' = 'ASIA';
    let score = 50;

    // Simple UTC time heuristic
    if (hours >= 0 && hours < 8) {
        session = 'ASIA';
        score = 40;
    } else if (hours >= 8 && hours < 13) {
        session = 'LONDON';
        score = 80; // High liquidity
    } else if (hours >= 13 && hours < 21) {
        session = 'NEWYORK';
        score = 90; // Highest volatility
    }

    return { session, score };
}

export function validateSessionForAsset(asset: Asset, session: 'ASIA' | 'LONDON' | 'NEWYORK'): boolean {
    if (asset.includes('BTC') || asset.includes('ETH') || asset.includes('SOL') || asset.includes('BNB')) return true; // Crypto 24/7
    
    if (session === 'ASIA') {
        if (asset.includes('JPY') || asset.includes('AUD') || asset.includes('NZD')) return true;
        return false;
    }
    
    // London and NY are generally good for all major forex/commodities
    return true;
}
