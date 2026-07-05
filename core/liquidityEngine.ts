import { Candle } from '../types';

export interface LiquidityResult {
    sweptHigh: boolean;
    sweptLow: boolean;
    zone: number | null;
    score: number;
    hasIFC: boolean;
    hasIDMSweep: boolean;
    failureToDisplace: 'PCH' | 'PCL' | null;
}

export function detectLiquiditySweep(candles: Candle[]): LiquidityResult {
    if (candles.length < 20) return { sweptHigh: false, sweptLow: false, zone: null, score: 0, hasIFC: false, hasIDMSweep: false, failureToDisplace: null };
    
    const history = candles.slice(-20, -5);
    const recent = candles.slice(-5);
    const prev = recent[recent.length - 2];
    const last = recent[recent.length - 1];

    let sweptHigh = false;
    let sweptLow = false;
    let score = 0;
    let zone: number | null = null;
    let hasIFC = false;
    let hasIDMSweep = false;
    let failureToDisplace: 'PCH' | 'PCL' | null = null;

    const maxHigh = Math.max(...history.map(c => c.high));
    const minLow = Math.min(...history.map(c => c.low));

    // A liquidity sweep (IFC / Single Candle Block logic) where candle pierces but closes inside
    const isWickHigh = last.high > maxHigh && last.close < maxHigh;
    const isWickLow = last.low < minLow && last.close > minLow;

    if (isWickHigh) {
        sweptHigh = true;
        score += 45; // Huge boost for liquidity sweep
        zone = maxHigh;
        if (last.open > last.close) hasIFC = true; // Swept high, closed bearish
        hasIDMSweep = true;
    }
    
    if (isWickLow) {
        sweptLow = true;
        score += 45; // Huge boost for liquidity sweep
        zone = minLow;
        if (last.close > last.open) hasIFC = true; // Swept low, closed bullish
        hasIDMSweep = true;
    }

    // Intraday Bias - Failure To Displace (FTD) over PCH or PCL
    if (last.high > prev.high && last.close <= prev.high) {
        failureToDisplace = 'PCH';
        score += 15; // Moderate boost for FTD
    } else if (last.low < prev.low && last.close >= prev.low) {
        failureToDisplace = 'PCL';
        score += 15;
    }

    // Invalid Pullback Check (Inside Bar check)
    if (!sweptHigh && !sweptLow && !failureToDisplace) {
        score -= 10;
    }

    return { sweptHigh, sweptLow, zone, score, hasIFC, hasIDMSweep, failureToDisplace };
}
