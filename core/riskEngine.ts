import { Candle, Asset, TimeFrame } from '../types';

export function calculateAdaptiveRiskReward(entry: number, sl: number, tp: number): { rr: string, valid: boolean } {
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    
    if (risk === 0) return { rr: "0:0", valid: false };
    
    const ratio = reward / risk;
    const formatted = `1:${ratio.toFixed(2)}`;
    
    // RR >= 1:3 is the Institutional upgrade requirement
    return { rr: formatted, valid: ratio >= 3.0 };
}
