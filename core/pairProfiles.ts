import { Asset, PairBehavior } from '../types';

export const pairProfiles: Record<Asset, PairBehavior> = {
    [Asset.BTCUSD]: { asset: Asset.BTCUSD, volatilityModel: 'HIGH', spreadAverage: 0.1, bestSession: 'ALL', blacklistPatterns: [] },
    [Asset.ETHUSD]: { asset: Asset.ETHUSD, volatilityModel: 'HIGH', spreadAverage: 0.1, bestSession: 'ALL', blacklistPatterns: [] },
    [Asset.SOLUSD]: { asset: Asset.SOLUSD, volatilityModel: 'HIGH', spreadAverage: 0.05, bestSession: 'ALL', blacklistPatterns: [] },
    [Asset.BNBUSD]: { asset: Asset.BNBUSD, volatilityModel: 'HIGH', spreadAverage: 0.05, bestSession: 'ALL', blacklistPatterns: [] },
    [Asset.XAUUSD]: { asset: Asset.XAUUSD, volatilityModel: 'HIGH', spreadAverage: 0.2, bestSession: 'NEWYORK', blacklistPatterns: [] },
    [Asset.XAGUSD]: { asset: Asset.XAGUSD, volatilityModel: 'MEDIUM', spreadAverage: 0.1, bestSession: 'NEWYORK', blacklistPatterns: [] },
    [Asset.XPTUSD]: { asset: Asset.XPTUSD, volatilityModel: 'LOW', spreadAverage: 0.5, bestSession: 'NEWYORK', blacklistPatterns: [] },
    [Asset.USOIL]: { asset: Asset.USOIL, volatilityModel: 'HIGH', spreadAverage: 0.05, bestSession: 'NEWYORK', blacklistPatterns: [] },
    [Asset.EURUSD]: { asset: Asset.EURUSD, volatilityModel: 'LOW', spreadAverage: 0.0001, bestSession: 'LONDON', blacklistPatterns: [] },
    [Asset.GBPUSD]: { asset: Asset.GBPUSD, volatilityModel: 'MEDIUM', spreadAverage: 0.00015, bestSession: 'LONDON', blacklistPatterns: [] },
    [Asset.USDJPY]: { asset: Asset.USDJPY, volatilityModel: 'MEDIUM', spreadAverage: 0.0001, bestSession: 'ASIA', blacklistPatterns: [] },
    [Asset.AUDUSD]: { asset: Asset.AUDUSD, volatilityModel: 'MEDIUM', spreadAverage: 0.0001, bestSession: 'ASIA', blacklistPatterns: [] },
    [Asset.USDCHF]: { asset: Asset.USDCHF, volatilityModel: 'LOW', spreadAverage: 0.0001, bestSession: 'LONDON', blacklistPatterns: [] },
    [Asset.NZDUSD]: { asset: Asset.NZDUSD, volatilityModel: 'MEDIUM', spreadAverage: 0.0001, bestSession: 'ASIA', blacklistPatterns: [] },
    [Asset.NASDAQ]: { asset: Asset.NASDAQ, volatilityModel: 'HIGH', spreadAverage: 1.0, bestSession: 'NEWYORK', blacklistPatterns: [] },
    [Asset.GBPJPY]: { asset: Asset.GBPJPY, volatilityModel: 'HIGH', spreadAverage: 0.0002, bestSession: 'LONDON', blacklistPatterns: [] },
    [Asset.EURJPY]: { asset: Asset.EURJPY, volatilityModel: 'MEDIUM', spreadAverage: 0.00015, bestSession: 'LONDON', blacklistPatterns: [] },
};

export function getPairBehavior(asset: Asset): PairBehavior {
    return pairProfiles[asset] || { asset, volatilityModel: 'MEDIUM', spreadAverage: 0, bestSession: 'ALL', blacklistPatterns: [] };
}
