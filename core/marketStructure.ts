import { Candle } from '../types';

export interface StructureResult {
    trend: 'BULLISH' | 'BEARISH' | 'RANGING';
    bos: boolean;
    choch: boolean;
    mss: boolean;
    fvg: number | null;
    orderBlock: number | null;
    score: number;
    structurePoints: string[];
}

export function detectMarketStructure(candles: Candle[]): StructureResult {
    if (candles.length < 20) return { trend: 'RANGING', bos: false, choch: false, mss: false, fvg: null, orderBlock: null, score: 0, structurePoints: [] };
    
    let score = 0;
    
    // Structure points (HH, HL, LH, LL) identification
    let highs: {index: number, val: number}[] = [];
    let lows: {index: number, val: number}[] = [];
    
    // Simple swing detection
    for (let i = 2; i < candles.length - 2; i++) {
        const c = candles[i];
        if (c.high > candles[i-1].high && c.high > candles[i-2].high && c.high > candles[i+1].high && c.high > candles[i+2].high) {
            highs.push({index: i, val: c.high});
        }
        if (c.low < candles[i-1].low && c.low < candles[i-2].low && c.low < candles[i+1].low && c.low < candles[i+2].low) {
            lows.push({index: i, val: c.low});
        }
    }

    let trend: 'BULLISH' | 'BEARISH' | 'RANGING' = 'RANGING';
    let bos = false;
    let choch = false;
    let structurePoints: string[] = [];
    
    // Evaluate Trend based on sequence of peaks and troughs
    if (highs.length >= 2 && lows.length >= 2) {
        const lastHigh = highs[highs.length - 1];
        const prevHigh = highs[highs.length - 2];
        const lastLow = lows[lows.length - 1];
        const prevLow = lows[lows.length - 2];

        if (lastHigh.val > prevHigh.val && lastLow.val > prevLow.val) {
            trend = 'BULLISH';
            structurePoints = ['HL', 'HH'];
            score += 20;
        } else if (lastHigh.val < prevHigh.val && lastLow.val < prevLow.val) {
            trend = 'BEARISH';
            structurePoints = ['LH', 'LL'];
            score += 20;
        } else if (lastHigh.val < prevHigh.val && lastLow.val > prevLow.val) {
             trend = 'RANGING'; // INSIDE BAR / CONSOLIDATION
        } else if (lastHigh.val > prevHigh.val && lastLow.val < prevLow.val) {
             trend = 'RANGING'; // EXPANSION
        }
    } else {
        const closes = candles.map(c => c.close);
        const recentCloses = closes.slice(-20);
        if (recentCloses[recentCloses.length-1] > recentCloses[0] * 1.001) trend = 'BULLISH';
        if (recentCloses[recentCloses.length-1] < recentCloses[0] * 0.999) trend = 'BEARISH';
    }

    const latestCandle = candles[candles.length - 1];

    if (trend === 'BULLISH' && highs.length > 0) {
        if (latestCandle.close > highs[highs.length-1].val) {
            bos = true;
            score += 15;
            structurePoints.push('BOS');
        } else if (lows.length > 0 && latestCandle.close < lows[lows.length-1].val) {
            choch = true;
            trend = 'BEARISH';
            score += 25;
            structurePoints.push('CHoCH');
        }
    } else if (trend === 'BEARISH' && lows.length > 0) {
        if (latestCandle.close < lows[lows.length-1].val) {
            bos = true;
            score += 15;
            structurePoints.push('BOS');
        } else if (highs.length > 0 && latestCandle.close > highs[highs.length-1].val) {
            choch = true;
            trend = 'BULLISH';
            score += 25;
            structurePoints.push('CHoCH');
        }
    }

    // FVG Detection
    let fvg: number | null = null;
    for (let i = candles.length - 3; i >= Math.max(0, candles.length - 10); i--) {
        const c1 = candles[i];
        const c2 = candles[i + 1];
        const c3 = candles[i + 2];
        
        if (trend === 'BULLISH' && c1.high < c3.low && c2.close > c2.open) {
            fvg = (c1.high + c3.low) / 2;
            score += 30;
            break;
        } else if (trend === 'BEARISH' && c1.low > c3.high && c2.close < c2.open) {
            fvg = (c1.low + c3.high) / 2;
            score += 30;
            break;
        }
    }

    // Order Block / BOS detection
    let orderBlock: number | null = null;
    let mss = false;

    const prevMax = Math.max(...candles.slice(-20, -1).map(c => c.high));
    const prevMin = Math.min(...candles.slice(-20, -1).map(c => c.low));

    if (trend === 'BULLISH' && latestCandle.close > prevMax) {
        bos = true;
        score += 20;
        for(let i = candles.length - 2; i >= 0; i--) {
            if(candles[i].close < candles[i].open) {
                orderBlock = candles[i].low;
                score += 20;
                break;
            }
        }
    } else if (trend === 'BEARISH' && latestCandle.close < prevMin) {
        bos = true;
        score += 20;
        for(let i = candles.length - 2; i >= 0; i--) {
            if(candles[i].close > candles[i].open) {
                orderBlock = candles[i].high;
                score += 20;
                break;
            }
        }
    }

    if(bos && fvg) mss = true;

    return { trend, bos, choch, mss, fvg, orderBlock, score, structurePoints };
}
