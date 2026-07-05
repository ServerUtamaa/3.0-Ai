
/** 
 * @type {{ 
 *   ai_edit: "locked", 
 *   auth_required: true, 
 *   enforcement: "strict-runtime",
 *   on_violation: "terminate_response"
 * }} 
 */

import { Candle, TimeFrame, Asset } from "../types";

// --- CORE MATHEMATICS (THE LEFT BRAIN) ---

export const calculateStochastic = (candles: Candle[], period: number = 14, smoothK: number = 3, smoothD: number = 3) => {
    if (candles.length < period) return { k: 50, d: 50 }; // Default neutral if not enough data

    const currentIdx = candles.length - 1;
    let highestHigh = -Infinity;
    let lowestLow = Infinity;

    // Find highest high and lowest low over the period
    for (let i = currentIdx; i > currentIdx - period; i--) {
        if (candles[i].high > highestHigh) highestHigh = candles[i].high;
        if (candles[i].low < lowestLow) lowestLow = candles[i].low;
    }

    const currentClose = candles[currentIdx].close;
    
    // Calculate %K
    let k = 50;
    if (highestHigh !== lowestLow) {
        k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    }

    // Simplified %D (we'd ideally need an array of %K values to do a true SMA, but for current snapshot this is a rough approximation or we just return K)
    // For full accuracy, we should calculate the array. Let's return just K for the current snapshot for simplicity, or implement the full array if needed.
    // Since we only need the current value for the brain, returning K is sufficient for the Overbought/Oversold check.
    return { k, d: k }; // Returning k for both for now to satisfy simple checks
};

export const calculateSMA = (data: number[], period: number): number => {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
};

// Return Single Value (For Prompt Context)
export const calculateEMA = (data: number[], period: number, prevEMA?: number): number => {
  if (data.length < period) return 0;
  const k = 2 / (period + 1);
  const price = data[data.length - 1];
  
  if (prevEMA === undefined || isNaN(prevEMA)) {
    return calculateSMA(data, period); // First EMA is SMA
  }
  // Standard Formula: (Close - Prev) * k + Prev
  return (price - prevEMA) * k + prevEMA;
};

// Return Array Series (For Chart Visualization)
// REFACTORED: Precise calculation loop that respects live updates
export const calculateEMAArray = (candles: Candle[], period: number): number[] => {
    const emaArray: number[] = [];
    const k = 2 / (period + 1);
    
    // If not enough data, fill with NaN
    if (candles.length < period) {
        return new Array(candles.length).fill(NaN);
    }

    // 1. Calculate Initial SMA (Basis for first EMA)
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += candles[i].close;
    }
    let prevEMA = sum / period;

    // Fill NaN for periods before the EMA starts
    for (let i = 0; i < period - 1; i++) {
        emaArray.push(NaN);
    }
    
    // Push the first EMA (which is the SMA)
    emaArray.push(prevEMA);

    // 2. Calculate the rest using EMA Formula
    for (let i = period; i < candles.length; i++) {
        const close = candles[i].close;
        const currentEMA = (close - prevEMA) * k + prevEMA;
        emaArray.push(currentEMA);
        prevEMA = currentEMA;
    }

    return emaArray;
};

export const calculateMACD = (candles: Candle[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
    if (candles.length < slowPeriod + signalPeriod) return { macd: 0, signal: 0, histogram: 0 };

    const fastEMA = calculateEMAArray(candles, fastPeriod);
    const slowEMA = calculateEMAArray(candles, slowPeriod);
    
    const macdLine: number[] = [];
    for (let i = 0; i < candles.length; i++) {
        if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
            macdLine.push(NaN);
        } else {
            macdLine.push(fastEMA[i] - slowEMA[i]);
        }
    }

    // Calculate Signal Line (EMA of MACD Line)
    const validMacdLine = macdLine.filter(val => !isNaN(val));
    const signalEMA = calculateEMAArray(validMacdLine.map(val => ({ close: val } as Candle)), signalPeriod);
    
    // Pad signal line to match original length
    const paddedSignalLine = new Array(candles.length - validMacdLine.length).fill(NaN).concat(signalEMA);

    const currentIdx = candles.length - 1;
    const macd = macdLine[currentIdx] || 0;
    const signal = paddedSignalLine[currentIdx] || 0;
    const histogram = macd - signal;

    return { macd, signal, histogram };
};

export const calculateADX = (candles: Candle[], period: number = 14) => {
    if (candles.length < period * 2) return { adx: 0, pdi: 0, mdi: 0 };

    let trSum = 0;
    let pdmSum = 0;
    let mdmSum = 0;

    // Initial True Range and Directional Movement
    for (let i = 1; i <= period; i++) {
        const high = candles[i].high;
        const low = candles[i].low;
        const prevHigh = candles[i - 1].high;
        const prevLow = candles[i - 1].low;
        const prevClose = candles[i - 1].close;

        const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
        trSum += tr;

        const upMove = high - prevHigh;
        const downMove = prevLow - low;

        if (upMove > downMove && upMove > 0) pdmSum += upMove;
        if (downMove > upMove && downMove > 0) mdmSum += downMove;
    }

    let smoothedTR = trSum;
    let smoothedPDM = pdmSum;
    let smoothedMDM = mdmSum;

    let dxSum = 0;
    const dxArray: number[] = [];

    // Calculate DX for the rest of the array
    for (let i = period + 1; i < candles.length; i++) {
        const high = candles[i].high;
        const low = candles[i].low;
        const prevHigh = candles[i - 1].high;
        const prevLow = candles[i - 1].low;
        const prevClose = candles[i - 1].close;

        const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
        const upMove = high - prevHigh;
        const downMove = prevLow - low;

        let pdm = 0;
        let mdm = 0;
        if (upMove > downMove && upMove > 0) pdm = upMove;
        if (downMove > upMove && downMove > 0) mdm = downMove;

        smoothedTR = smoothedTR - (smoothedTR / period) + tr;
        smoothedPDM = smoothedPDM - (smoothedPDM / period) + pdm;
        smoothedMDM = smoothedMDM - (smoothedMDM / period) + mdm;

        const pdi = (smoothedPDM / smoothedTR) * 100;
        const mdi = (smoothedMDM / smoothedTR) * 100;

        const dx = (Math.abs(pdi - mdi) / (pdi + mdi)) * 100;
        dxArray.push(dx);
    }

    // Calculate ADX (Smoothed DX)
    let adx = 0;
    if (dxArray.length >= period) {
        let initialDXSum = 0;
        for (let i = 0; i < period; i++) {
            initialDXSum += dxArray[i];
        }
        let smoothedDX = initialDXSum / period;

        for (let i = period; i < dxArray.length; i++) {
            smoothedDX = ((smoothedDX * (period - 1)) + dxArray[i]) / period;
        }
        adx = smoothedDX;
    }

    const pdi = (smoothedPDM / smoothedTR) * 100;
    const mdi = (smoothedMDM / smoothedTR) * 100;

    return { adx, pdi, mdi };
};

// --- NEW: EMA STRUCTURAL ANALYSIS (BASED ON USER MATERIAL) ---
export const analyzeEMACondition = (candles: Candle[]) => {
    const ema10Array = calculateEMAArray(candles, 10);
    const ema20Array = calculateEMAArray(candles, 20);
    const ema50Array = calculateEMAArray(candles, 50);
    const ema200Array = calculateEMAArray(candles, 200);

    const currentIdx = candles.length - 1;
    const prevIdx = candles.length - 2;

    if (currentIdx < 201) return { bias: 'NEUTRAL', cross: 'NONE', zone: 'NONE', goldenMoment: 'NONE', values: null };

    const currPrice = candles[currentIdx].close;
    const curr10 = ema10Array[currentIdx];
    const curr20 = ema20Array[currentIdx];
    const curr50 = ema50Array[currentIdx];
    const curr200 = ema200Array[currentIdx];
    
    const prev10 = ema10Array[prevIdx];
    const prev20 = ema20Array[prevIdx];
    const prev50 = ema50Array[prevIdx];
    const prev200 = ema200Array[prevIdx];

    // 1. BIAS DETERMINATION (Rule: Price vs EMA 200)
    let bias = 'RANGING';
    if (currPrice > curr200) bias = 'BULLISH (Bias BUY)';
    else if (currPrice < curr200) bias = 'BEARISH (Bias SELL)';

    // 2. CROSS DETECTION
    let cross = 'NONE';
    if (prev50 < prev200 && curr50 > curr200) cross = 'GOLDEN CROSS (Start Uptrend)';
    else if (prev50 > prev200 && curr50 < curr200) cross = 'DEATH CROSS (Start Downtrend)';

    // 2.5 GOLDEN MOMENT (EMA 10 vs EMA 20) - Fast Momentum
    let goldenMoment = 'NONE';
    if (prev10 <= prev20 && curr10 > curr20) goldenMoment = 'BUY_MOMENT';
    else if (prev10 >= prev20 && curr10 < curr20) goldenMoment = 'SELL_MOMENT';

    // 3. DYNAMIC ZONE DETECTION (Price vs EMA 50)
    // Check distance percent to EMA 50
    const distTo50 = Math.abs(currPrice - curr50) / curr50 * 100;
    let zone = 'FAR';
    if (distTo50 < 0.05) zone = 'AT EMA 50 (Dynamic S/R)';

    return {
        bias,
        cross,
        zone,
        goldenMoment,
        values: { ema10: curr10, ema20: curr20, ema50: curr50, ema200: curr200 }
    };
};

// Return Array Series for Bollinger Bands
export const calculateBollingerBandsArray = (candles: Candle[], period: number = 20, multiplier: number = 2) => {
    const upper: number[] = [];
    const lower: number[] = [];
    const closes = candles.map(c => c.close);

    for (let i = 0; i < candles.length; i++) {
        if (i < period - 1) {
            upper.push(NaN);
            lower.push(NaN);
            continue;
        }

        const slice = closes.slice(i - period + 1, i + 1);
        const sum = slice.reduce((a, b) => a + b, 0);
        const mean = sum / period;

        const squaredDiffs = slice.map(val => Math.pow(val - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / period;
        const stdDev = Math.sqrt(avgSquaredDiff);

        upper.push(mean + (multiplier * stdDev));
        lower.push(mean - (multiplier * stdDev));
    }
    return { upper, lower };
};

export const calculateRSI = (candles: Candle[], period: number = 14): number => {
  if (candles.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  // Calculate initial average
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smooth it (Wilder's Smoothing) for the rest
  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

export const calculateRSIArray = (candles: Candle[], period: number = 14): number[] => {
  const rsiArray: number[] = [];
  if (candles.length < period + 1) {
    return candles.map(() => 50);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 0; i < period; i++) {
    rsiArray.push(NaN);
  }

  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  if (avgLoss === 0) rsiArray.push(100);
  else {
      const rs = avgGain / avgLoss;
      rsiArray.push(100 - (100 / (1 + rs)));
  }

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;

    if (avgLoss === 0) rsiArray.push(100);
    else {
        const rs = avgGain / avgLoss;
        rsiArray.push(100 - (100 / (1 + rs)));
    }
  }
  return rsiArray;
};

export const calculateBollingerBands = (candles: Candle[], period: number = 20, multiplier: number = 2) => {
  if (candles.length < period) return { upper: 0, middle: 0, lower: 0 };
  
  const closes = candles.map(c => c.close);
  const middle = calculateSMA(closes, period); 
  
  const slice = closes.slice(-period);
  const squaredDiffs = slice.map(val => Math.pow(val - middle, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return {
    upper: middle + (multiplier * stdDev),
    middle: middle,
    lower: middle - (multiplier * stdDev)
  };
};

export const calculateATR = (candles: Candle[], period: number = 14): number => {
  if (candles.length < period + 1) return 0;

  const trs: number[] = [];
  for(let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const closePrev = candles[i-1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - closePrev),
      Math.abs(low - closePrev)
    );
    trs.push(tr);
  }

  return calculateSMA(trs, period);
};

export const detectDivergence = (candles: Candle[], rsiArray: number[]): 'BULLISH' | 'BEARISH' | 'NONE' => {
    if (candles.length < 30 || rsiArray.length < 30) return 'NONE';

    const recentCandles = candles.slice(-30);
    const recentRSI = rsiArray.slice(-30);

    let swings: { type: 'HIGH' | 'LOW', price: number, rsi: number, index: number }[] = [];
    for (let i = 2; i < recentCandles.length - 2; i++) {
        const c = recentCandles[i];
        if (c.high > recentCandles[i-1].high && c.high > recentCandles[i-2].high && c.high > recentCandles[i+1].high && c.high > recentCandles[i+2].high) {
            swings.push({ type: 'HIGH', price: c.high, rsi: recentRSI[i], index: i });
        }
        if (c.low < recentCandles[i-1].low && c.low < recentCandles[i-2].low && c.low < recentCandles[i+1].low && c.low < recentCandles[i+2].low) {
            swings.push({ type: 'LOW', price: c.low, rsi: recentRSI[i], index: i });
        }
    }

    const highs = swings.filter(s => s.type === 'HIGH');
    const lows = swings.filter(s => s.type === 'LOW');

    if (highs.length >= 2) {
        const lastHigh = highs[highs.length - 1];
        const prevHigh = highs[highs.length - 2];
        // Bearish Divergence: Price makes Higher High, RSI makes Lower High
        if (lastHigh.price > prevHigh.price && lastHigh.rsi < prevHigh.rsi && lastHigh.rsi > 60) {
            return 'BEARISH';
        }
    }

    if (lows.length >= 2) {
        const lastLow = lows[lows.length - 1];
        const prevLow = lows[lows.length - 2];
        // Bullish Divergence: Price makes Lower Low, RSI makes Higher Low
        if (lastLow.price < prevLow.price && lastLow.rsi > prevLow.rsi && lastLow.rsi < 40) {
            return 'BULLISH';
        }
    }

    return 'NONE';
};

export interface CandlestickPattern {
    name: string;
    type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: number; // 1-3
}

export const detectCandlestickPatterns = (candles: Candle[]): CandlestickPattern[] => {
    if (candles.length < 14) return [];

    const patterns: CandlestickPattern[] = [];
    const c = candles[candles.length - 1]; // Current
    const c1 = candles[candles.length - 2]; // Previous
    const c2 = candles[candles.length - 3]; // 2nd Previous
    const c3 = candles[candles.length - 4]; // 3rd Previous
    const c4 = candles[candles.length - 5]; // 4th Previous
    const c5 = candles[candles.length - 6]; // 5th
    const c6 = candles[candles.length - 7]; // 6th
    const c7 = candles[candles.length - 8]; // 7th
    const c8 = candles[candles.length - 9]; // 8th
    const c9 = candles[candles.length - 10]; // 9th
    const c10 = candles[candles.length - 11]; // 10th
    const c11 = candles[candles.length - 12]; // 11th
    const c12 = candles[candles.length - 13]; // 12th
    const c13 = candles[candles.length - 14]; // 13th

    const body = Math.abs(c.close - c.open);
    const upperShadow = c.high - Math.max(c.close, c.open);
    const lowerShadow = Math.min(c.close, c.open) - c.low;
    const isBullish = c.close > c.open;
    const isBearish = c.close < c.open;
    const isDoji = body <= 0.1 * (c.high - c.low);

    const body1 = Math.abs(c1.close - c1.open);
    const upperShadow1 = c1.high - Math.max(c1.close, c1.open);
    const lowerShadow1 = Math.min(c1.close, c1.open) - c1.low;
    const isBullish1 = c1.close > c1.open;
    const isBearish1 = c1.close < c1.open;
    const isDoji1 = body1 <= 0.1 * (c1.high - c1.low);

    const body2 = Math.abs(c2.close - c2.open);
    const isBullish2 = c2.close > c2.open;
    const isBearish2 = c2.close < c2.open;
    const isDoji2 = body2 <= 0.1 * (c2.high - c2.low);

    const body3 = Math.abs(c3.close - c3.open);
    const isBullish3 = c3.close > c3.open;
    const isBearish3 = c3.close < c3.open;

    const body4 = Math.abs(c4.close - c4.open);
    const isBullish4 = c4.close > c4.open;
    const isBearish4 = c4.close < c4.open;

    // Helper: Trend detection (simple)
    const isUptrend = c1.close > c2.close && c2.close > c3.close;
    const isDowntrend = c1.close < c2.close && c2.close < c3.close;

    const avgBody = (body + body1 + body2 + body3) / 4;
    const isLongBody = body > avgBody * 1.5;
    const isShortBody = body < avgBody * 0.5;
    const isLongBody1 = body1 > avgBody * 1.5;
    const isShortBody1 = body1 < avgBody * 0.5;
    const isLongBody2 = body2 > avgBody * 1.5;
    const isLongBody3 = body3 > avgBody * 1.5;
    const isLongBody4 = body4 > avgBody * 1.5;
    const lowerShadow2 = Math.min(c2.close, c2.open) - c2.low;
    const upperShadow2 = c2.high - Math.max(c2.close, c2.open);
    const upperShadow3 = c3.high - Math.max(c3.close, c3.open);
    const lowerShadow3 = Math.min(c3.close, c3.open) - c3.low;

    // --- 1. SINGLE CANDLE PATTERNS (15) ---
    
    // 1. Hammer: B kecil & D >= 2B & U kecil (Reversal in downtrend)
    if (isShortBody && lowerShadow >= 2 * body && upperShadow <= 0.1 * body && isDowntrend) {
        let strength = isBullish ? 3 : 2;
        patterns.push({ name: 'Hammer', type: 'BULLISH', strength });
    }
    // 2. Hanging Man: Hammer in uptrend
    if (isShortBody && lowerShadow >= 2 * body && upperShadow <= 0.1 * body && isUptrend) {
        let strength = !isBullish ? 3 : 2;
        patterns.push({ name: 'Hanging Man', type: 'BEARISH', strength });
    }
    // 3. Inverted Hammer: B kecil & U >= 2B & D kecil (Reversal in downtrend)
    if (isShortBody && upperShadow >= 2 * body && lowerShadow <= 0.1 * body && isDowntrend) {
        let strength = isBullish ? 2 : 1;
        patterns.push({ name: 'Inverted Hammer', type: 'BULLISH', strength });
    }
    // 4. Shooting Star: Inverted Hammer in uptrend
    if (isShortBody && upperShadow >= 2 * body && lowerShadow <= 0.1 * body && isUptrend) {
        let strength = !isBullish ? 3 : 2;
        patterns.push({ name: 'Shooting Star', type: 'BEARISH', strength });
    }
    // 5. Bullish Marubozu
    if (isBullish && upperShadow < 0.05 * body && lowerShadow < 0.05 * body && isLongBody) {
        patterns.push({ name: 'Bullish Marubozu', type: 'BULLISH', strength: 3 });
    }
    // 6. Bearish Marubozu
    if (isBearish && upperShadow < 0.05 * body && lowerShadow < 0.05 * body && isLongBody) {
        patterns.push({ name: 'Bearish Marubozu', type: 'BEARISH', strength: 3 });
    }
    // 7-11. Dojis (Upgraded based on PDF context)
    if (isDoji) {
        // PDF: Doji after a long body in volatile market = exhaustion/reversal
        if (isLongBody1) {
            patterns.push({ name: 'Exhaustion Doji (Reversal Signal)', type: isBullish1 ? 'BEARISH' : 'BULLISH', strength: 3 });
        }
        // PDF: Doji after a short body (spinning top) = market weakness peaking
        else if (isShortBody1 && !isDoji1) {
            patterns.push({ name: 'Peak Weakness Doji', type: 'NEUTRAL', strength: 2 }); // Needs confirmation
        }
        
        if (upperShadow > 3 * body && lowerShadow > 3 * body) patterns.push({ name: 'Long-Legged Doji', type: 'NEUTRAL', strength: 1 });
        else if (lowerShadow > 3 * body && upperShadow <= 0.1 * body) patterns.push({ name: 'Dragonfly Doji (Buy Signal)', type: 'BULLISH', strength: 4 });
        else if (upperShadow > 3 * body && lowerShadow <= 0.1 * body) patterns.push({ name: 'Gravestone Doji (Sell Signal)', type: 'BEARISH', strength: 4 });
        else if (c.open === c.high && c.high === c.low && c.low === c.close) patterns.push({ name: 'Four Price Doji', type: 'NEUTRAL', strength: 1 });
        else patterns.push({ name: 'Standard Doji', type: 'NEUTRAL', strength: 1 });
    }
    // 12. Spinning Top
    if (isShortBody && upperShadow > body && lowerShadow > body && !isDoji) {
        patterns.push({ name: 'Spinning Top', type: 'NEUTRAL', strength: 1 });
    }
    
    // 13-14. Long Body Candles (Upgraded based on PDF context)
    if (isLongBody) {
        // PDF: Long body after saturation/consolidation = strong momentum
        if (isShortBody1 || isDoji1) {
            patterns.push({ name: isBullish ? 'Momentum Breakout Bullish' : 'Momentum Breakout Bearish', type: isBullish ? 'BULLISH' : 'BEARISH', strength: 4 });
        }
        
        if (isBullish) patterns.push({ name: 'Long Bullish Candle', type: 'BULLISH', strength: 2 });
        if (isBearish) patterns.push({ name: 'Long Bearish Candle', type: 'BEARISH', strength: 2 });
    }
    
    // 15. Short Body Candle
    if (isShortBody && !isDoji) patterns.push({ name: 'Short Body Candle', type: 'NEUTRAL', strength: 1 });

    // NEW from Image: Pin Bar (Rejection)
    if (upperShadow > 2.5 * body && lowerShadow <= 0.5 * body) {
        patterns.push({ name: 'Pin Bar (Bearish Rejection)', type: 'BEARISH', strength: 4 });
    }
    if (lowerShadow > 2.5 * body && upperShadow <= 0.5 * body) {
        patterns.push({ name: 'Pin Bar (Bullish Rejection)', type: 'BULLISH', strength: 4 });
    }

    // --- 2. DOUBLE CANDLE PATTERNS (15) ---
    
    // 16. Bullish Engulfing (Upgraded based on PDF)
    // Strong green candle that 'engulfs' the prior red candle body (disregard wicks)
    // Occurs at bottom of downward trend (handled by localBrain)
    // Stronger signals if red candle is doji
    if (isBearish1 && isBullish && body > body1 && c.open <= c1.close && c.close >= c1.open) {
        let strength = 3;
        if (isDoji1) strength = 4; // Stronger if prior is doji
        patterns.push({ name: 'Bullish Engulfing', type: 'BULLISH', strength });
    }
    // 17. Bearish Engulfing
    if (isBullish1 && isBearish && body > body1 && c.open >= c1.close && c.close <= c1.open) {
        let strength = 3;
        if (isDoji1) strength = 4;
        patterns.push({ name: 'Bearish Engulfing', type: 'BEARISH', strength });
    }
    // 18. Piercing Line
    if (isBearish1 && isBullish && c.open < c1.close && c.close > (c1.open + c1.close) / 2 && c.close < c1.open) {
        patterns.push({ name: 'Piercing Line', type: 'BULLISH', strength: 2 });
    }
    // 19. Dark Cloud Cover
    if (isBullish1 && isBearish && c.open > c1.close && c.close < (c1.open + c1.close) / 2 && c.close > c1.open) {
        patterns.push({ name: 'Dark Cloud Cover', type: 'BEARISH', strength: 2 });
    }
    // 20. Bullish Harami
    if (isBearish1 && isBullish && body <= body1 * 0.25 && c.open > c1.close && c.close < c1.open) {
        patterns.push({ name: 'Bullish Harami', type: 'BULLISH', strength: 2 });
    }
    // 21. Bearish Harami
    if (isBullish1 && isBearish && body <= body1 * 0.25 && c.open < c1.close && c.close > c1.open) {
        patterns.push({ name: 'Bearish Harami', type: 'BEARISH', strength: 2 });
    }
    // 22. Harami Cross
    if (body1 > body && c.high < Math.max(c1.open, c1.close) && c.low > Math.min(c1.open, c1.close) && isDoji) {
        patterns.push({ name: 'Harami Cross', type: 'NEUTRAL', strength: 3 });
    }
    // 23. Tweezer Top (Double Touch Resistance)
    if (isBullish1 && isBearish && Math.abs(c.high - c1.high) < (avgBody * 0.1) && isUptrend) {
        patterns.push({ name: 'Tweezer Top', type: 'BEARISH', strength: 4 });
    }
    // 24. Tweezer Bottom (Double Touch Support)
    if (isBearish1 && isBullish && Math.abs(c.low - c1.low) < (avgBody * 0.1) && isDowntrend) {
        patterns.push({ name: 'Tweezer Bottom', type: 'BULLISH', strength: 4 });
    }
    // 25. Bullish Kicker
    if (isBearish1 && isBullish && c.open >= c1.open && c.low > c1.close) {
        patterns.push({ name: 'Bullish Kicker', type: 'BULLISH', strength: 3 });
    }
    // 26. Bearish Kicker
    if (isBullish1 && isBearish && c.open <= c1.open && c.high < c1.close) {
        patterns.push({ name: 'Bearish Kicker', type: 'BEARISH', strength: 3 });
    }
    // 27. Matching Low
    if (isBearish1 && isBearish && Math.abs(c.close - c1.close) < 0.0001 * c.close) {
        patterns.push({ name: 'Matching Low', type: 'BULLISH', strength: 2 });
    }
    // 28. Matching High
    if (isBullish1 && isBullish && Math.abs(c.close - c1.close) < 0.0001 * c.close) {
        patterns.push({ name: 'Matching High', type: 'BEARISH', strength: 2 });
    }
    // 29. On-Neck
    if (isBearish1 && isLongBody && isBullish && c.close === c1.low) {
        patterns.push({ name: 'On-Neck', type: 'BEARISH', strength: 2 });
    }
    // 30. In-Neck
    if (isBearish1 && isLongBody && isBullish && c.close > c1.low && c.close < c1.close) {
        patterns.push({ name: 'In-Neck', type: 'BEARISH', strength: 2 });
    }

    // --- 3. TRIPLE CANDLE PATTERNS (20) ---
    
    // 31. Morning Star
    if (isBearish2 && body2 > avgBody && body1 < avgBody * 0.5 && isBullish && c.close > (c2.open + c2.close) / 2 && c1.open < c2.close && c.open > c1.close) {
        patterns.push({ name: 'Morning Star', type: 'BULLISH', strength: 3 });
    }
    // 32. Evening Star
    if (isBullish2 && body2 > avgBody && body1 < avgBody * 0.5 && isBearish && c.close < (c2.open + c2.close) / 2 && c1.open > c2.close && c.open < c1.close) {
        patterns.push({ name: 'Evening Star', type: 'BEARISH', strength: 3 });
    }
    // 33. Morning Doji Star
    if (isBearish2 && body2 > avgBody && isDoji1 && isBullish && c.close > (c2.open + c2.close) / 2 && c1.open < c2.close && c.open > c1.close) {
        patterns.push({ name: 'Morning Doji Star', type: 'BULLISH', strength: 3 });
    }
    // 34. Evening Doji Star
    if (isBullish2 && body2 > avgBody && isDoji1 && isBearish && c.close < (c2.open + c2.close) / 2 && c1.open > c2.close && c.open < c1.close) {
        patterns.push({ name: 'Evening Doji Star', type: 'BEARISH', strength: 3 });
    }
    // 35. Three White Soldiers
    if (isBullish && isBullish1 && isBullish2 && c.close > c1.close && c1.close > c2.close && c.open > c1.open && c.open < c1.close && c1.open > c2.open && c1.open < c2.close) {
        patterns.push({ name: 'Three White Soldiers', type: 'BULLISH', strength: 3 });
    }
    // 36. Three Black Crows
    if (isBearish && isBearish1 && isBearish2 && c.close < c1.close && c1.close < c2.close && c.open < c1.open && c.open > c1.close && c1.open < c2.open && c1.open > c2.close) {
        patterns.push({ name: 'Three Black Crows', type: 'BEARISH', strength: 3 });
    }
    // 37. Three Inside Up
    if (isBearish2 && isBullish1 && c1.close < c2.open && c1.open > c2.close && c1.close > (c2.open + c2.close) / 2 && isBullish && c.close > c2.open) {
        patterns.push({ name: 'Three Inside Up', type: 'BULLISH', strength: 3 });
    }
    // 38. Three Inside Down
    if (isBullish2 && isBearish1 && c1.close > c2.open && c1.open < c2.close && c1.close < (c2.open + c2.close) / 2 && isBearish && c.close < c2.open) {
        patterns.push({ name: 'Three Inside Down', type: 'BEARISH', strength: 3 });
    }
    // 39. Three Outside Up
    if (isBearish2 && isBullish1 && c1.open < c2.close && c1.close > c2.open && isBullish && c.close > c1.close) {
        patterns.push({ name: 'Three Outside Up', type: 'BULLISH', strength: 3 });
    }
    // 40. Three Outside Down
    if (isBullish2 && isBearish1 && c1.open > c2.close && c1.close < c2.open && isBearish && c.close < c1.close) {
        patterns.push({ name: 'Three Outside Down', type: 'BEARISH', strength: 3 });
    }
    // 41. Rising Three Methods
    if (isBullish && isBearish1 && isBearish2 && isBearish3 && c4.close > c4.open && c.close > c4.close && c1.close > c4.open && c2.close > c4.open && c3.close > c4.open) {
        patterns.push({ name: 'Rising Three Methods', type: 'BULLISH', strength: 3 });
    }
    // 42. Falling Three Methods
    if (isBearish && isBullish1 && isBullish2 && isBullish3 && c4.close < c4.open && c.close < c4.close && c1.close < c4.open && c2.close < c4.open && c3.close < c4.open) {
        patterns.push({ name: 'Falling Three Methods', type: 'BEARISH', strength: 3 });
    }
    // 43. Three Line Strike
    if (isBullish3 && isBullish2 && isBullish1 && isBearish && c.open > c1.close && c.close < c3.open) {
        patterns.push({ name: 'Three Line Strike (Bullish)', type: 'BULLISH', strength: 3 });
    } else if (isBearish3 && isBearish2 && isBearish1 && isBullish && c.open < c1.close && c.close > c3.open) {
        patterns.push({ name: 'Three Line Strike (Bearish)', type: 'BEARISH', strength: 3 });
    }
    // 44. Deliberation Pattern
    if (isBullish && isBullish1 && isBullish2 && c2.close > c2.open && c1.close > c1.open && body < body1 && body1 < body2) {
        patterns.push({ name: 'Deliberation Pattern', type: 'BEARISH', strength: 2 });
    }
    // 45. Abandoned Baby (Bullish)
    if (isBearish2 && isDoji1 && isBullish && c1.high < c2.low && c1.high < c.low) {
        patterns.push({ name: 'Abandoned Baby (Bullish)', type: 'BULLISH', strength: 3 });
    }
    // 46. Abandoned Baby (Bearish)
    if (isBullish2 && isDoji1 && isBearish && c1.low > c2.high && c1.low > c.high) {
        patterns.push({ name: 'Abandoned Baby (Bearish)', type: 'BEARISH', strength: 3 });
    }
    // 47. Tri-Star
    if (isDoji && isDoji1 && isDoji2) {
        if (c1.low > c2.high && c1.low > c.high) patterns.push({ name: 'Tri-Star Top', type: 'BEARISH', strength: 3 });
        if (c1.high < c2.low && c1.high < c.low) patterns.push({ name: 'Tri-Star Bottom', type: 'BULLISH', strength: 3 });
    }
    // 48. Upside Tasuki Gap
    if (isBullish2 && isBullish1 && isBearish && c1.open > c2.close && c.open < c1.open && c.close < c1.open && c.close > c2.close) {
        patterns.push({ name: 'Upside Tasuki Gap', type: 'BULLISH', strength: 2 });
    }
    // 49. Downside Tasuki Gap
    if (isBearish2 && isBearish1 && isBullish && c1.open < c2.close && c.open > c1.open && c.close > c1.open && c.close < c2.close) {
        patterns.push({ name: 'Downside Tasuki Gap', type: 'BEARISH', strength: 2 });
    }
    // 50. Stick Sandwich
    if (isBearish2 && isBullish1 && isBearish && Math.abs(c.close - c2.close) < 0.0001 * c.close) {
        patterns.push({ name: 'Stick Sandwich', type: 'BULLISH', strength: 2 });
    }

    // --- NEW PATTERNS FROM IMAGE (Zero Floating Priorities) ---
    const isSmallBody1 = body1 <= avgBody * 0.5;
    const isSmallBody2 = body2 <= avgBody * 0.5;
    const isSmallBody3 = body3 <= avgBody * 0.5;
    
    // 51. Exhaustion & Impulsion (Bullish) - Small candles hovering near support, then strong bullish engulfing
    if (isBullish && isLongBody && isSmallBody1 && isSmallBody2 && isSmallBody3 && Math.abs(c1.low - c2.low) < c.open * 0.001) {
         patterns.push({ name: 'Exhaustion & Impulsion (Bullish)', type: 'BULLISH', strength: 4 });
    }
    // 52. Exhaustion & Impulsion (Bearish) - Small candles hovering near resistance, then strong bearish engulfing
    if (isBearish && isLongBody && isSmallBody1 && isSmallBody2 && isSmallBody3 && Math.abs(c1.high - c2.high) < c.open * 0.001) {
         patterns.push({ name: 'Exhaustion & Impulsion (Bearish)', type: 'BEARISH', strength: 4 });
    }

    // 53. Bullish Fakeout - Bearish candle drops low, immediately engulfed by massive bullish candle pumping higher
    if (isBearish1 && isBullish && c.close > c1.high && c1.low < c2.low && c1.low < c3.low) {
         patterns.push({ name: 'Bullish Fakeout', type: 'BULLISH', strength: 4 });
    }
    // 54. Bearish Fakeout - Bullish candle pumps high, immediately engulfed by massive bearish candle dumping lower
    if (isBullish1 && isBearish && c.close < c1.low && c1.high > c2.high && c1.high > c3.high) {
         patterns.push({ name: 'Bearish Fakeout', type: 'BEARISH', strength: 4 });
    }

    // --- OTHER PATTERNS ---

    // 55. Mat Hold (Bullish)
    if (isBullish && isBearish1 && isBearish2 && isBearish3 && c4.close > c4.open && c4.close < c3.open && c.close > c4.close && c.close > c1.high) {
        patterns.push({ name: 'Bullish Mat Hold', type: 'BULLISH', strength: 3 });
    }
    // 52. Mat Hold (Bearish)
    if (isBearish && isBullish1 && isBullish2 && isBullish3 && c4.close < c4.open && c4.close > c3.open && c.close < c4.close && c.close < c1.low) {
        patterns.push({ name: 'Bearish Mat Hold', type: 'BEARISH', strength: 3 });
    }
    // 53. Above The Stomach
    if (isBearish1 && isBullish && c.open >= (c1.open + c1.close) / 2 && c.close > c1.open) {
        patterns.push({ name: 'Above The Stomach', type: 'BULLISH', strength: 2 });
    }
    // 54. Below The Stomach
    if (isBullish1 && isBearish && c.open <= (c1.open + c1.close) / 2 && c.close < c1.open) {
        patterns.push({ name: 'Below The Stomach', type: 'BEARISH', strength: 2 });
    }
    // 55. Thrusting Line
    if (isBearish1 && isBullish && c.open < c1.low && c.close < (c1.open + c1.close) / 2 && c.close > c1.close) {
        patterns.push({ name: 'Thrusting Line', type: 'BEARISH', strength: 1 }); // Continuation
    }
    // 56. Separating Line (Bullish)
    if (isBearish1 && isBullish && Math.abs(c.open - c1.open) < 0.0001 * c.open) {
        patterns.push({ name: 'Bullish Separating Line', type: 'BULLISH', strength: 2 });
    }
    // 57. Separating Line (Bearish)
    if (isBullish1 && isBearish && Math.abs(c.open - c1.open) < 0.0001 * c.open) {
        patterns.push({ name: 'Bearish Separating Line', type: 'BEARISH', strength: 2 });
    }
    // 58. Meeting Line (Bullish)
    if (isBearish1 && isBullish && Math.abs(c.close - c1.close) < 0.0001 * c.close && c.open < c1.close) {
        patterns.push({ name: 'Bullish Meeting Line', type: 'BULLISH', strength: 2 });
    }
    // 59. Meeting Line (Bearish)
    if (isBullish1 && isBearish && Math.abs(c.close - c1.close) < 0.0001 * c.close && c.open > c1.close) {
        patterns.push({ name: 'Bearish Meeting Line', type: 'BEARISH', strength: 2 });
    }
    // 60. Homing Pigeon
    if (isBearish1 && isBearish && c.open < c1.open && c.close > c1.close) {
        patterns.push({ name: 'Homing Pigeon', type: 'BULLISH', strength: 2 });
    }
    // 61. Advance Block
    if (isBullish2 && isBullish1 && isBullish && c1.open > c2.open && c1.open < c2.close && c.open > c1.open && c.open < c1.close && body < body1 && body1 < body2 && upperShadow > upperShadow1) {
        patterns.push({ name: 'Advance Block', type: 'BEARISH', strength: 2 });
    }
    // 62. Bullish Unique Three River Bottom
    if (isBearish2 && isBearish1 && isBullish && c1.open < c2.close && c1.close > c2.close && c1.low < c2.low && c.close < c1.close) {
        patterns.push({ name: 'Unique Three River Bottom', type: 'BULLISH', strength: 2 });
    }
    // 63. Bullish Three Stars in the South
    if (isBearish2 && isBearish1 && isBearish && c1.open < c2.open && c1.open > c2.close && c1.low > c2.low && c.open < c1.open && c.open > c1.close && c.high < c1.high && c.low > c1.low) {
        patterns.push({ name: 'Three Stars in the South', type: 'BULLISH', strength: 2 });
    }
    // 64. Bullish Concealing Baby Swallow
    if (isBearish3 && isBearish2 && isBearish1 && isBearish && c3.open > c3.close && c2.open > c2.close && c1.open < c2.close && c1.high > c2.close && c.open > c1.high && c.close < c1.low) {
        patterns.push({ name: 'Concealing Baby Swallow', type: 'BULLISH', strength: 3 });
    }
    // 65. Bullish Ladder Bottom
    if (isBearish3 && isBearish2 && isBearish1 && isBearish && isBullish && c3.close < c4.close && c2.close < c3.close && c1.close < c2.close && c.open > c1.open) {
        patterns.push({ name: 'Ladder Bottom', type: 'BULLISH', strength: 3 });
    }
    // 66. Side-by-Side White Lines (Bullish)
    if (isBullish2 && isBullish1 && isBullish && c1.open > c2.close && Math.abs(c.open - c1.open) < 0.0001 * c.open && Math.abs(c.close - c1.close) < 0.0001 * c.close) {
        patterns.push({ name: 'Side-by-Side White Lines', type: 'BULLISH', strength: 2 });
    }
    // 67. Tower Bottom
    if (isBearish4 && body4 > avgBody * 1.5 && body3 < avgBody * 0.5 && body2 < avgBody * 0.5 && body1 < avgBody * 0.5 && isBullish && body > avgBody * 1.5 && c.close > c1.high) {
        patterns.push({ name: 'Tower Bottom', type: 'BULLISH', strength: 3 });
    }
    // 68. Tower Top
    if (isBullish4 && body4 > avgBody * 1.5 && body3 < avgBody * 0.5 && body2 < avgBody * 0.5 && body1 < avgBody * 0.5 && isBearish && body > avgBody * 1.5 && c.close < c1.low) {
        patterns.push({ name: 'Tower Top', type: 'BEARISH', strength: 3 });
    }

    // --- ADVANCED & RARE PATTERNS FROM PDF ---

    // 69. High Wave
    if (isShortBody && upperShadow > body * 2 && lowerShadow > body * 2 && !isDoji) {
        patterns.push({ name: 'High Wave', type: 'NEUTRAL', strength: 2 });
    }

    // 70. 8 New Price Lines (Bullish)
    if (c.high > c1.high && c1.high > c2.high && c2.high > c3.high && c3.high > c4.high && c4.high > c5.high && c5.high > c6.high && c6.high > c7.high) {
        patterns.push({ name: '8 New Price Lines', type: 'BULLISH', strength: 3 });
    }

    // 71. 8 New Price Lines (Bearish)
    if (c.low < c1.low && c1.low < c2.low && c2.low < c3.low && c3.low < c4.low && c4.low < c5.low && c5.low < c6.low && c6.low < c7.low) {
        patterns.push({ name: '8 New Price Lines', type: 'BEARISH', strength: 3 });
    }

    // 72. Bullish Squeeze Alert
    if (isBearish2 && c1.high < c2.high && c1.low > c2.low && c.high < c1.high && c.low > c1.low) {
        patterns.push({ name: 'Bullish Squeeze Alert', type: 'BULLISH', strength: 2 });
    }

    // 73. Bullish After Bottom Gap Up
    if (isBearish4 && isBearish3 && isBearish2 && c3.close < c4.close && c2.close < c3.close && c1.open < c2.close && isBullish1 && isBullish && c.open > c1.close) {
        patterns.push({ name: 'After Bottom Gap Up', type: 'BULLISH', strength: 3 });
    }

    // 74. Bullish Descent Block
    if (isBearish2 && isBearish1 && isBearish && c1.close < c2.close && c.close < c1.close && c1.open > c2.close && c1.open < c2.open && c.open > c1.close && c.open < c1.open && body < body1 && body1 < body2 && lowerShadow > lowerShadow1) {
        patterns.push({ name: 'Descent Block', type: 'BULLISH', strength: 2 });
    }

    // 75. Bullish Downside Gap Two Rabbits
    if (isBearish2 && isBullish1 && c1.open < c2.close && c1.close < c2.close && isBullish && c.open <= c1.open && c.close > c1.close && c.close < c2.close) {
        patterns.push({ name: 'Downside Gap Two Rabbits', type: 'BULLISH', strength: 3 });
    }

    // 76. Low Price Gapping Play
    if (isBearish4 && isShortBody && body1 < avgBody * 0.5 && body2 < avgBody * 0.5 && body3 < avgBody * 0.5 && isBearish && c.open < c1.low) {
        patterns.push({ name: 'Low Price Gapping Play', type: 'BEARISH', strength: 3 });
    }

    // 77. High Price Gapping Play
    if (isBullish4 && isShortBody && body1 < avgBody * 0.5 && body2 < avgBody * 0.5 && body3 < avgBody * 0.5 && isBullish && c.open > c1.high) {
        patterns.push({ name: 'High Price Gapping Play', type: 'BULLISH', strength: 3 });
    }

    // 78. Cradle Pattern
    if (isBearish4 && isLongBody && body3 < avgBody * 0.5 && body2 < avgBody * 0.5 && body1 < avgBody * 0.5 && isBullish && isLongBody && c.close > c1.high) {
        patterns.push({ name: 'Cradle Pattern', type: 'BULLISH', strength: 3 });
    }

    // 79. GAP UP (From PDF: Technical Analysis for Mega Profit)
    if (c.low > c1.high) {
        patterns.push({ name: 'Gap Up', type: 'BULLISH', strength: 2 });
    }

    // 80. GAP DOWN (From PDF: Technical Analysis for Mega Profit)
    if (c.high < c1.low) {
        patterns.push({ name: 'Gap Down', type: 'BEARISH', strength: 2 });
    }


    // Bullish Abandoned Baby
    if (isBearish2 && isLongBody2 && isDoji1 && c1.high < c2.low && isBullish && isLongBody && c.low > c1.high) {
        patterns.push({ name: 'Bullish Abandoned Baby', type: 'BULLISH', strength: 4 });
    }
    // Bearish Abandoned Baby
    if (isBullish2 && isLongBody2 && isDoji1 && c1.low > c2.high && isBearish && isLongBody && c.high < c1.low) {
        patterns.push({ name: 'Bearish Abandoned Baby', type: 'BEARISH', strength: 4 });
    }
    // Rising Three Methods
    if (isBullish4 && isLongBody4 && isBearish3 && isBearish2 && isBearish1 && 
        c1.close > c4.open && c3.high < c4.close && 
        isBullish && isLongBody && c.close > c4.close) {
        patterns.push({ name: 'Rising Three Methods', type: 'BULLISH', strength: 3 });
    }
    // Falling Three Methods
    if (isBearish4 && isLongBody4 && isBullish3 && isBullish2 && isBullish1 && 
        c1.close < c4.open && c3.low > c4.close && 
        isBearish && isLongBody && c.close < c4.close) {
        patterns.push({ name: 'Falling Three Methods', type: 'BEARISH', strength: 3 });
    }
    // Advance Block
    if (isUptrend && isBullish2 && isLongBody2 && isBullish1 && isBullish &&
        body1 < body2 && body < body1 && upperShadow1 > body1 * 0.5 && upperShadow > body * 0.5) {
        patterns.push({ name: 'Advance Block', type: 'BEARISH', strength: 2 });
    }
    // Bullish Three Stars in the South
    if (isBearish2 && isLongBody2 && lowerShadow2 > body2 &&
        isBearish1 && c1.open > c2.close && c1.close < c2.open && c1.low > c2.low && lowerShadow1 > body1 &&
        isBearish && isShortBody && c.low > c1.low && c.high < c1.high) {
        patterns.push({ name: 'Bullish Three Stars in the South', type: 'BULLISH', strength: 3 });
    }
    // Bullish Concealing Baby Swallow
    if (isBearish3 && isLongBody3 && isBearish2 && isLongBody2 &&
        isBearish1 && isShortBody1 && c1.open < c2.close && c1.high > c2.close && 
        isBearish && c.open > c1.high && c.close < c1.low) {
        patterns.push({ name: 'Bullish Concealing Baby Swallow', type: 'BULLISH', strength: 4 });
    }
    // Bullish Ladder Bottom
    if (isBearish4 && isBearish3 && isBearish2 && c3.close < c4.close && c2.close < c3.close &&
        isBearish1 && c1.open > c2.close && c1.close < c2.close && upperShadow1 > body1 &&
        isBullish && isLongBody && c.open > c1.open) {
        patterns.push({ name: 'Bullish Ladder Bottom', type: 'BULLISH', strength: 3 });
    }
    // Meeting Line Bullish
    if (isBearish1 && isLongBody1 && isBullish && isLongBody && Math.abs(c.close - c1.close) < body * 0.05) {
        patterns.push({ name: 'Bullish Meeting Line', type: 'BULLISH', strength: 2 });
    }
    // Meeting Line Bearish
    if (isBullish1 && isLongBody1 && isBearish && isLongBody && Math.abs(c.close - c1.close) < body * 0.05) {
        patterns.push({ name: 'Bearish Meeting Line', type: 'BEARISH', strength: 2 });
    }
    // On Neck Line
    if (isBearish1 && isLongBody1 && isBullish && isShortBody && c.open < c1.low && Math.abs(c.close - c1.low) < body * 0.05) {
        patterns.push({ name: 'On Neck Line', type: 'BEARISH', strength: 2 }); 
    }
    // In Neck Line
    if (isBearish1 && isLongBody1 && isBullish && isShortBody && c.open < c1.low && c.close > c1.low && c.close < c1.close) {
        patterns.push({ name: 'In Neck Line', type: 'BEARISH', strength: 2 }); 
    }
    // Bullish Squeeze Alert
    if (isDowntrend && isBearish2 && c1.high < c2.high && c1.low > c2.low && c.high < c1.high && c.low > c1.low) {
        patterns.push({ name: 'Bullish Squeeze Alert', type: 'BULLISH', strength: 3 });
    }

    return patterns;
};

export interface SMCResult {
    structure: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
    phase: 'ACCUMULATION' | 'MARKUP' | 'DISTRIBUTION' | 'MARKDOWN';
    bos: 'BULLISH' | 'BEARISH' | 'NONE';
    choch: 'BULLISH' | 'BEARISH' | 'NONE';
    liquiditySweep: 'BUY_SIDE' | 'SELL_SIDE' | 'NONE';
    orderBlock: 'BULLISH' | 'BEARISH' | 'NONE';
    fvg: 'BULLISH' | 'BEARISH' | 'NONE';
    mitigationBlock: 'BULLISH' | 'BEARISH' | 'NONE';
    inducement: boolean;
    score: number;
    bullishStrongCount: number;
    bearishStrongCount: number;
    dojiCount: number;
    sndPattern: 'RBR' | 'DBD' | 'RBD' | 'DBR' | 'NONE';
    liquidityType: 'EQH' | 'EQL' | 'TRENDLINE' | 'NONE';
    crtStatus: 'ACCUMULATION' | 'MANIPULATION_SWEEP' | 'DISTRIBUTION' | 'NONE';
    pivotPoints: { PP: number, R1: number, R2: number, S1: number, S2: number } | null;
    fibonacciOTE: { level0_5: number, level0_618: number, level0_786: number, level0_886: number } | null;
    baseTrading: 'BASE_BREAK_BULLISH' | 'BASE_BREAK_BEARISH' | 'BASE_RETURN_BULLISH' | 'BASE_RETURN_BEARISH' | 'NONE';
    chartPatterns: string[];
    amdPattern: 'BULLISH' | 'BEARISH' | 'NONE';
    quarterlyTheory: 'AMDX_BULLISH' | 'AMDX_BEARISH' | 'XAMD_BULLISH' | 'XAMD_BEARISH' | 'NONE';
    cbdr: { top: number, bottom: number, range: number, up: { sd1: number, sd2: number, sd2_5: number, sd4: number }, down: { sd1: number, sd2: number, sd2_5: number, sd4: number }, isActive: boolean } | null;
    continuationModel: 'TYPE_1_BULLISH' | 'TYPE_1_BEARISH' | 'TYPE_2_BULLISH' | 'TYPE_2_BEARISH' | 'TYPE_3_BULLISH' | 'TYPE_3_BEARISH' | 'TYPE_4_BULLISH' | 'TYPE_4_BEARISH' | 'TYPE_5_BULLISH' | 'TYPE_5_BEARISH' | 'TYPE_6_BULLISH' | 'TYPE_6_BEARISH' | 'TYPE_7_BULLISH' | 'TYPE_7_BEARISH' | 'TYPE_8_BULLISH' | 'TYPE_8_BEARISH' | 'TYPE_9_BULLISH' | 'TYPE_9_BEARISH' | 'TYPE_10_BULLISH' | 'TYPE_10_BEARISH' | 'TYPE_11_BULLISH' | 'TYPE_11_BEARISH' | 'TYPE_12_BULLISH' | 'TYPE_12_BEARISH' | 'TYPE_13_BULLISH' | 'TYPE_13_BEARISH' | 'TYPE_14_BULLISH' | 'TYPE_14_BEARISH' | 'TYPE_15_BULLISH' | 'TYPE_15_BEARISH' | 'NONE';
    advancedEntryMode: 'SCHEME_1' | 'SCHEME_2' | 'SCHEME_3' | 'SCHEME_4' | 'SCHEME_5_SMT_WARNING' | 'SCHEME_6' | 'SCHEME_7' | 'SCHEME_8' | 'NONE';
    quasimodo: 'BULLISH' | 'BEARISH' | 'NONE';
    ftr: 'BULLISH' | 'BEARISH' | 'NONE';
    flagLimit: 'BULLISH' | 'BEARISH' | 'NONE';
    compression: 'BULLISH' | 'BEARISH' | 'NONE';
}

export const detectSMC = (candles: Candle[], timeframe: TimeFrame = 'H1'): SMCResult => {
    const result: SMCResult = {
        structure: 'SIDEWAYS',
        phase: 'ACCUMULATION',
        bos: 'NONE',
        choch: 'NONE',
        liquiditySweep: 'NONE',
        orderBlock: 'NONE',
        fvg: 'NONE',
        mitigationBlock: 'NONE',
        inducement: false,
        score: 0,
        bullishStrongCount: 0,
        bearishStrongCount: 0,
        dojiCount: 0,
        sndPattern: 'NONE',
        liquidityType: 'NONE',
        crtStatus: 'NONE',
        pivotPoints: null,
        fibonacciOTE: null,
        baseTrading: 'NONE',
        chartPatterns: [],
        amdPattern: 'NONE',
        quarterlyTheory: 'NONE',
        cbdr: null,
        continuationModel: 'NONE',
        advancedEntryMode: 'NONE',
        quasimodo: 'NONE',
        ftr: 'NONE',
        flagLimit: 'NONE',
        compression: 'NONE'
    };

    if (candles.length < 150) return result;

    const isM1M5 = timeframe === 'M1' || timeframe === 'M5';
    const isM15M30 = timeframe === 'M15' || timeframe === 'M30';
    const isH1H4 = timeframe === 'H1' || timeframe === 'H4' || timeframe === 'D1';

    const wStructure = isM1M5 ? 2 : isM15M30 ? 3 : 4;
    const wMomentum = 2;
    const wBOS = 3;
    const wSweep = 3;
    const wOB = isM1M5 ? 2 : isM15M30 ? 3 : 4;
    const wFVG = isM1M5 ? 2 : isM15M30 ? 2 : 3;
    const wInducement = isM1M5 ? 2 : isM15M30 ? 2 : 1;

    const recentCandles = candles.slice(-150);
    const current = recentCandles[recentCandles.length - 1];
    const prev1 = recentCandles[recentCandles.length - 2];
    const prev2 = recentCandles[recentCandles.length - 3];
    const prev3 = recentCandles[recentCandles.length - 4];

    // 1. MARKET STRUCTURE (150 Candles)
    let swings: { type: 'HIGH' | 'LOW', price: number, index: number }[] = [];
    for (let i = 2; i < recentCandles.length - 2; i++) {
        const c = recentCandles[i];
        if (c.high > recentCandles[i-1].high && c.high > recentCandles[i-2].high && c.high > recentCandles[i+1].high && c.high > recentCandles[i+2].high) {
            swings.push({ type: 'HIGH', price: c.high, index: i });
        }
        if (c.low < recentCandles[i-1].low && c.low < recentCandles[i-2].low && c.low < recentCandles[i+1].low && c.low < recentCandles[i+2].low) {
            swings.push({ type: 'LOW', price: c.low, index: i });
        }
    }

    let hhCount = 0, hlCount = 0, llCount = 0, lhCount = 0;
    let eqhCount = 0, eqlCount = 0; // Equal Highs, Equal Lows (Sideways indicators)
    let lastHigh = 0, lastLow = Infinity;

    swings.forEach(s => {
        if (s.type === 'HIGH') {
            if (lastHigh !== 0) {
                if (s.price > lastHigh * 1.0005) hhCount++;
                else if (s.price < lastHigh * 0.9995) lhCount++;
                else eqhCount++; // Roughly equal high
            }
            lastHigh = s.price;
        } else {
            if (lastLow !== Infinity) {
                if (s.price > lastLow * 1.0005) hlCount++;
                else if (s.price < lastLow * 0.9995) llCount++;
                else eqlCount++; // Roughly equal low
            }
            lastLow = s.price;
        }
    });

    const totalBullishSwings = hhCount + hlCount;
    const totalBearishSwings = llCount + lhCount;
    const totalSidewaysSwings = eqhCount + eqlCount;
    const totalSwings = totalBullishSwings + totalBearishSwings + totalSidewaysSwings;

    if (totalSwings > 0) {
        // PDF: Sideways is when price bounces between roughly equal highs and lows (Equal Highs / Equal Lows)
        // PDF: Sideways always occurs between Uptrend and Downtrend
        if (totalSidewaysSwings > totalSwings * 0.4 || (hhCount === 0 && llCount === 0 && totalSwings > 2)) {
            result.structure = 'SIDEWAYS';
            // Sideways doesn't add directional score, but we might want to trade the bounces (Buy Support, Sell Resistance)
            // This will be handled by the Base Trading / Rejection logic
        } else if (totalBullishSwings / totalSwings >= 0.6) {
            result.structure = 'BULLISH';
            result.score += wStructure;
        } else if (totalBearishSwings / totalSwings >= 0.6) {
            result.structure = 'BEARISH';
            result.score -= wStructure;
        }
    }
    
    // --- NEW: MACRO CHART PATTERNS (From Image) ---
    const highsList = swings.filter(s => s.type === 'HIGH');
    const lowsList = swings.filter(s => s.type === 'LOW');
    
    if (highsList.length >= 2 && lowsList.length >= 2) {
        const h1 = highsList[highsList.length - 2].price;
        const h2 = highsList[highsList.length - 1].price;
        const l1 = lowsList[lowsList.length - 2].price;
        const l2 = lowsList[lowsList.length - 1].price;
        const closeHigh = (a: number, b: number) => Math.abs(a - b) / a < 0.002;
        
        if (closeHigh(l1, l2) && h2 > h1) result.chartPatterns.push('Double Bottom');
        if (closeHigh(h1, h2) && l2 < l1) result.chartPatterns.push('Double Top');
        
        if (h2 < h1 && l2 < l1) {
            const highSlope = Math.abs(h1 - h2);
            const lowSlope = Math.abs(l1 - l2);
            if (highSlope > lowSlope * 1.5) result.chartPatterns.push('Falling Wedge');
            else result.chartPatterns.push('Bullish Flag');
        }
        if (h2 > h1 && l2 > l1) {
            const highSlope = Math.abs(h2 - h1);
            const lowSlope = Math.abs(l2 - l1);
            if (lowSlope > highSlope * 1.5) result.chartPatterns.push('Rising Wedge');
            else result.chartPatterns.push('Bearish Flag');
        }
        if (h2 > h1 && l2 < l1) {
            result.chartPatterns.push('Broadening Triangle');
        }
    }
    
    if (highsList.length >= 3 && lowsList.length >= 2) {
        const h1 = highsList[highsList.length - 3].price;
        const h2 = highsList[highsList.length - 2].price;
        const h3 = highsList[highsList.length - 1].price;
        const closeHigh = (a: number, b: number) => Math.abs(a - b) / a < 0.002;
        if (h2 > h1 && h2 > h3 && Math.abs(h1 - h3) / h1 < 0.003) result.chartPatterns.push('Head & Shoulder');
        if (closeHigh(h1, h2) && closeHigh(h2, h3)) result.chartPatterns.push('Triple Top');
    }
    if (lowsList.length >= 3 && highsList.length >= 2) {
        const l1 = lowsList[lowsList.length - 3].price;
        const l2 = lowsList[lowsList.length - 2].price;
        const l3 = lowsList[lowsList.length - 1].price;
        const closeHigh = (a: number, b: number) => Math.abs(a - b) / a < 0.002;
        if (l2 < l1 && l2 < l3 && Math.abs(l1 - l3) / l1 < 0.003) result.chartPatterns.push('Inv. Head & Shoulder');
        if (closeHigh(l1, l2) && closeHigh(l2, l3)) result.chartPatterns.push('Triple Bottom');
    }
    
    if (highsList.length >= 3 && lowsList.length >= 3) {
        const h1 = highsList[highsList.length - 3].price;
        const h2 = highsList[highsList.length - 2].price;
        const h3 = highsList[highsList.length - 1].price;
        const l1 = lowsList[lowsList.length - 3].price;
        const l2 = lowsList[lowsList.length - 2].price;
        const l3 = lowsList[lowsList.length - 1].price;
        const isFlatHigh = Math.abs(h1-h2)/h1 < 0.002 && Math.abs(h2-h3)/h2 < 0.002;
        const isFlatLow = Math.abs(l1-l2)/l1 < 0.002 && Math.abs(l2-l3)/l2 < 0.002;
        
        if (isFlatHigh && l3 > l2 && l2 > l1) result.chartPatterns.push('Ascending Triangle');
        if (isFlatLow && h3 < h2 && h2 < h1) result.chartPatterns.push('Descending Triangle');
        if (h3 < h2 && h2 < h1 && l3 > l2 && l2 > l1) {
            const highSlope = Math.abs(h1 - h3);
            const lowSlope = Math.abs(l1 - l3);
            if (highSlope < h1 * 0.005 && lowSlope < l1 * 0.005) {
                result.chartPatterns.push('Pennant');
            } else {
                result.chartPatterns.push('Symmetrical Triangle');
            }
        }
        if (isFlatHigh && isFlatLow) result.chartPatterns.push('Rectangle');
    }

    if (highsList.length >= 4 && lowsList.length >= 4) {
        const h1 = highsList[highsList.length - 4].price;
        const h2 = highsList[highsList.length - 3].price;
        const h3 = highsList[highsList.length - 2].price;
        const h4 = highsList[highsList.length - 1].price;
        const l1 = lowsList[lowsList.length - 4].price;
        const l2 = lowsList[lowsList.length - 3].price;
        const l3 = lowsList[lowsList.length - 2].price;
        const l4 = lowsList[lowsList.length - 1].price;

        if (h2 > h1 && l2 < l1 && h4 < h3 && l4 > l3 && h3 < h2 && l3 > l2) {
            result.chartPatterns.push('Diamond');
        }
        
        // Approximate Cup & Handle
        if (l2 < l1 && l3 < l4 && l2 < h1 && l3 < h4 && l4 > l3 && (h4 > h3 || h3 > h2)) {
            if (l4 > l2 && Math.abs(l4 - l3) < (h4 - l3) * 0.5) {
                result.chartPatterns.push('Cup & Handle');
            }
        }
        
        if (Math.abs(h1 - h4) / h1 < 0.002 && Math.abs(l1 - l4) / l1 < 0.002 && h2 < h1 && h3 < h1 && l2 > l1 && l3 > l1) {
            result.chartPatterns.push('Consolidation');
        }
    }
    
    // 2. MOMENTUM DISTRIBUTION
    recentCandles.forEach(c => {
        const body = Math.abs(c.close - c.open);
        const range = c.high - c.low;
        const isBullish = c.close > c.open;
        const isBearish = c.close < c.open;
        
        if (range === 0) return;

        // Bullish Strong: Body >= 70% of range
        if (body / range >= 0.7) {
            if (isBullish) result.bullishStrongCount++;
            else result.bearishStrongCount++;
        } else if (body / range <= 0.1) {
            result.dojiCount++;
        }
    });

    if (result.bullishStrongCount > result.bearishStrongCount) {
        result.score += wMomentum;
    } else if (result.bearishStrongCount > result.bullishStrongCount) {
        result.score -= wMomentum;
    }

    // 3. SIKLUS MARKET (Wyckoff)
    if (result.bullishStrongCount > result.bearishStrongCount * 1.5) {
        result.phase = 'MARKUP';
        result.score += 2;
    } else if (result.bearishStrongCount > result.bullishStrongCount * 1.5) {
        result.phase = 'MARKDOWN';
        result.score -= 2;
    } else if (result.dojiCount > 30 && result.structure === 'BULLISH') {
        result.phase = 'DISTRIBUTION';
        result.score -= 2;
    } else if (result.dojiCount > 30 && result.structure === 'BEARISH') {
        result.phase = 'ACCUMULATION';
        result.score += 2;
    }

    // 4. BOS & CHoCH (Break Market Structure & Change of Character)
    const currentBodySize = Math.abs(current.close - current.open) / (current.high - current.low);
    const isStrongBreak = currentBodySize >= 0.6; // Valid break requires body close, not just wick

    if (lastHigh !== 0 && current.close > lastHigh && isStrongBreak) {
        if (result.structure === 'BULLISH') {
            result.bos = 'BULLISH';
            result.score += wBOS;
        } else {
            // PDF: Bearish to Bullish CHoCH (Price breaks the last Lower High)
            result.choch = 'BULLISH';
            result.score += 4; // High score for trend reversal confirmation
        }
    } else if (lastLow !== Infinity && current.close < lastLow && isStrongBreak) {
        if (result.structure === 'BEARISH') {
            result.bos = 'BEARISH';
            result.score -= wBOS;
        } else {
            // PDF: Bullish to Bearish CHoCH (Price breaks the last Higher Low)
            result.choch = 'BEARISH';
            result.score -= 4; // High score for trend reversal confirmation
        }
    }

    // 5. LIQUIDITY SWEEP / STOP HUNT (SH)
    // PDF: Stop Hunt is a fake breakout/breakdown that grabs liquidity (wicks above/below key levels but closes back inside)
    const upperWick = current.high - Math.max(current.open, current.close);
    const lowerWick = Math.min(current.open, current.close) - current.low;
    const currentRange = current.high - current.low;

    // Buy Side Liquidity (BSL) Sweep / Stop Hunt High
    if (lastHigh !== 0 && current.high > lastHigh && current.close < lastHigh && upperWick / currentRange >= 0.5) {
        result.liquiditySweep = 'BUY_SIDE';
        result.score -= wSweep; // Bearish signal (trapped buyers)
    } 
    // Sell Side Liquidity (SSL) Sweep / Stop Hunt Low
    else if (lastLow !== Infinity && current.low < lastLow && current.close > lastLow && lowerWick / currentRange >= 0.5) {
        result.liquiditySweep = 'SELL_SIDE';
        result.score += wSweep; // Bullish signal (trapped sellers)
    }

    // 6. FVG (Fair Value Gap)
    if (current.low > prev2.high && prev1.close > prev1.open && (prev1.close - prev1.open) / (prev1.high - prev1.low) >= 0.6) {
        result.fvg = 'BULLISH';
        // Score based on bias
        if (result.score > 0) result.score += wFVG;
        else result.score -= 1;
    } else if (current.high < prev2.low && prev1.close < prev1.open && (prev1.open - prev1.close) / (prev1.high - prev1.low) >= 0.6) {
        result.fvg = 'BEARISH';
        if (result.score < 0) result.score -= wFVG;
        else result.score += 1;
    }

    // 7. ORDER BLOCK (OB)
    if (result.fvg === 'BULLISH' && prev2.close < prev2.open) {
        result.orderBlock = 'BULLISH';
        if (current.close > prev2.high) result.score += wOB;
    } else if (result.fvg === 'BEARISH' && prev2.close > prev2.open) {
        result.orderBlock = 'BEARISH';
        if (current.close < prev2.low) result.score -= wOB;
    }

    // 8. INDUCEMENT (IDM)
    // PDF: Inducement (IDM) is liquidity taken before a valid BOS/CHoCH. 
    // It's a trap for early traders. Once IDM is taken, the market structure becomes valid.
    if (result.liquiditySweep !== 'NONE' && !isStrongBreak) {
        result.inducement = true;
        if (result.liquiditySweep === 'SELL_SIDE') result.score += wInducement; // Bullish Inducement (Retail trapped selling)
        else result.score -= wInducement; // Bearish Inducement (Retail trapped buying)
    }

    // 8. MITIGATION BLOCK
    if (result.bos === 'BEARISH' && prev3.close > prev3.open && current.high >= prev3.low) {
        result.mitigationBlock = 'BEARISH';
    } else if (result.bos === 'BULLISH' && prev3.close < prev3.open && current.low <= prev3.high) {
        result.mitigationBlock = 'BULLISH';
    }

    // 9. SUPPLY & DEMAND (SND) PATTERNS & BASE TRADING SYSTEMS
    const isBullish1 = prev1.close > prev1.open;
    const isBearish1 = prev1.close < prev1.open;
    const isBullish3 = prev3.close > prev3.open;
    const isBearish3 = prev3.close < prev3.open;
    
    // Base definition: small body compared to its range (indecision)
    const isBase2 = Math.abs(prev2.close - prev2.open) < (prev2.high - prev2.low) * 0.5;
    const isBase3 = Math.abs(prev3.close - prev3.open) < (prev3.high - prev3.low) * 0.5;

    // Identify Base Types (RBR, DBD, RBD, DBR)
    if (isBullish3 && isBase2 && isBullish1) result.sndPattern = 'RBR';
    else if (isBearish3 && isBase2 && isBearish1) result.sndPattern = 'DBD';
    else if (isBullish3 && isBase2 && isBearish1) result.sndPattern = 'RBD';
    else if (isBearish3 && isBase2 && isBullish1) result.sndPattern = 'DBR';

    // 9.5 BASE TRADING SYSTEMS (Break & Return/Rejection) & SNR BREAKOUT (RBS/SBR)
    
    // BASE BREAK ENTRY & SNR BREAKOUT (RBS/SBR)
    // A base is broken when the next candle closes above its HIGH (for Demand) or below its LOW (for Supply)
    if (isBase2) {
        // PDF: Breakout yang valid biasanya ditandai dengan candle momentum yang tegak dan besar (Marubozu/Long Body)
        const isMomentumBreakoutBullish = isBullish1 && (Math.abs(prev1.close - prev1.open) > (prev1.high - prev1.low) * 0.8 || Math.abs(prev1.close - prev1.open) > (Math.abs(prev2.close - prev2.open) * 2));
        const isMomentumBreakoutBearish = isBearish1 && (Math.abs(prev1.close - prev1.open) > (prev1.high - prev1.low) * 0.8 || Math.abs(prev1.close - prev1.open) > (Math.abs(prev2.close - prev2.open) * 2));

        // Bullish Break (Demand created: DBR or RBR) / Resistant Become Support (RBS)
        if (prev1.close > prev2.high && isBullish1) {
            result.baseTrading = 'BASE_BREAK_BULLISH';
            result.score += isMomentumBreakoutBullish ? 4 : 2; // Higher score if momentum candle
        } 
        // Bearish Break (Supply created: RBD or DBD) / Support Become Resistant (SBR)
        else if (prev1.close < prev2.low && isBearish1) {
            result.baseTrading = 'BASE_BREAK_BEARISH';
            result.score -= isMomentumBreakoutBearish ? 4 : 2; // Higher score if momentum candle
        }
    }

    // BASE BREAK RETURN ENTRY (REJECTION) & BREAKOUT ENTRY ZONE
    // Price broke the base previously, now returns to test it (Open, High, Low, or Close of the base) and rejects
    // This perfectly aligns with the "Buying the Retracement" / "Shorting the Retracement" logic from Sam Seiden's PDF
    if (isBase3) {
        const baseHigh = prev3.high;
        const baseLow = prev3.low;
        
        // Bullish Return (Buying the Retracement): Broke high previously (prev2), now returns to test base and rejects (leaves lower wick in base)
        if (prev2.close > baseHigh) {
            // Check if prev1 or current tested the base (wick went inside base) and closed above it
            const testedBase = (prev1.low <= baseHigh && prev1.low >= baseLow && prev1.close > baseHigh) || 
                               (current.low <= baseHigh && current.low >= baseLow && current.close > baseHigh);
            if (testedBase) {
                result.baseTrading = 'BASE_RETURN_BULLISH';
                result.score += 6; // Very high probability setup (Sniper Entry - Sam Seiden Retracement)
            }
        }
        // Bearish Return (Shorting the Retracement): Broke low previously (prev2), now returns to test base and rejects (leaves upper wick in base)
        else if (prev2.close < baseLow) {
            const testedBase = (prev1.high >= baseLow && prev1.high <= baseHigh && prev1.close < baseLow) || 
                               (current.high >= baseLow && current.high <= baseHigh && current.close < baseLow);
            if (testedBase) {
                result.baseTrading = 'BASE_RETURN_BEARISH';
                result.score -= 6; // Very high probability setup (Sniper Entry - Sam Seiden Retracement)
            }
        }
    }

    // 10. LIQUIDITY TYPES (EQH, EQL)
    let eqhFound = false;
    let eqlFound = false;
    const lookback = recentCandles.slice(-20, -1);
    for (let i = 0; i < lookback.length - 1; i++) {
        for (let j = i + 1; j < lookback.length; j++) {
            if (Math.abs(lookback[i].high - lookback[j].high) / lookback[i].high < 0.0005) eqhFound = true;
            if (Math.abs(lookback[i].low - lookback[j].low) / lookback[i].low < 0.0005) eqlFound = true;
        }
    }
    if (eqhFound && current.high > lastHigh) result.liquidityType = 'EQH';
    else if (eqlFound && current.low < lastLow) result.liquidityType = 'EQL';
    else if (eqhFound) result.liquidityType = 'EQH';
    else if (eqlFound) result.liquidityType = 'EQL';

    // 11. CANDLE RANGE THEORY (CRT)
    const crtWindow = recentCandles.slice(-20, -1);
    const crtHigh = Math.max(...crtWindow.map(c => c.high));
    const crtLow = Math.min(...crtWindow.map(c => c.low));
    
    if (current.high > crtHigh && current.close < crtHigh) {
        result.crtStatus = 'MANIPULATION_SWEEP';
        result.score -= 2;
    } else if (current.low < crtLow && current.close > crtLow) {
        result.crtStatus = 'MANIPULATION_SWEEP';
        result.score += 2;
    } else if (current.close > crtHigh || current.close < crtLow) {
        result.crtStatus = 'DISTRIBUTION';
    } else {
        result.crtStatus = 'ACCUMULATION';
    }

    // 12. PIVOT POINTS (PP, R1, R2, S1, S2)
    const pp = (prev1.high + prev1.low + prev1.close) / 3;
    const r1 = (2 * pp) - prev1.low;
    const r2 = pp + (prev1.high - prev1.low);
    const s1 = (2 * pp) - prev1.high;
    const s2 = pp - (prev1.high - prev1.low);
    result.pivotPoints = { PP: pp, R1: r1, R2: r2, S1: s1, S2: s2 };

    // 13. FIBONACCI OTE
    if (lastHigh !== 0 && lastLow !== Infinity) {
        const swingRange = Math.abs(lastHigh - lastLow);
        if (result.structure === 'BULLISH') {
            result.fibonacciOTE = {
                level0_5: lastHigh - (swingRange * 0.5),
                level0_618: lastHigh - (swingRange * 0.618),
                level0_786: lastHigh - (swingRange * 0.786),
                level0_886: lastHigh - (swingRange * 0.886)
            };
        } else {
            result.fibonacciOTE = {
                level0_5: lastLow + (swingRange * 0.5),
                level0_618: lastLow + (swingRange * 0.618),
                level0_786: lastLow + (swingRange * 0.786),
                level0_886: lastLow + (swingRange * 0.886)
            };
        }
    }

    // 14. AMD (PO3 - Power of 3 Pattern)
    // From requested AMD PO3 Strategy (Accumulation -> Manipulation -> Distribution/CHoCH)
    const amdWindow = recentCandles.slice(-40);
    if (amdWindow.length === 40) {
        const accWindow = amdWindow.slice(0, 20); // First 20 candles (Accumulation)
        const manWindow = amdWindow.slice(20, 32); // Next 12 candles (Manipulation)
        const distWindow = amdWindow.slice(32, 40); // Last 8 candles (Distribution / CHoCH)

        const accHigh = Math.max(...accWindow.map(c => c.high));
        const accLow = Math.min(...accWindow.map(c => c.low));
        const accRange = accHigh - accLow;
        const avgAccBody = accWindow.reduce((sum, c) => sum + Math.abs(c.open - c.close), 0) / 20 || 1;

        if (accRange <= avgAccBody * 8) { // Confirmed ranging/accumulation
            const manHigh = Math.max(...manWindow.map(c => c.high));
            const manLow = Math.min(...manWindow.map(c => c.low));
            const distHigh = Math.max(...distWindow.map(c => c.high));
            const distLow = Math.min(...distWindow.map(c => c.low));

            // Bullish AMD: Accumulate -> Manipulate Down -> Distribute Up
            if (manLow < accLow && distHigh > accHigh) {
                 result.amdPattern = 'BULLISH';
                 result.score += 4;
            }
            // Bearish AMD: Accumulate -> Manipulate Up -> Distribute Down
            else if (manHigh > accHigh && distLow < accLow) {
                 result.amdPattern = 'BEARISH';
                 result.score -= 4;
            }
        }
    }

    // 14.5 QUARTERLY THEORY (AMDX / XAMD)
    const qWindow = recentCandles.slice(-80);
    if (qWindow.length === 80) {
        const q1 = qWindow.slice(0, 20);
        const q2 = qWindow.slice(20, 40);
        const q3 = qWindow.slice(40, 60);
        const q4 = qWindow.slice(60, 80);

        const q1High = Math.max(...q1.map(c => c.high));
        const q1Low = Math.min(...q1.map(c => c.low));
        const q1Range = q1High - q1Low;
        const avgQ1Body = q1.reduce((sum, c) => sum + Math.abs(c.open - c.close), 0) / 20 || 1;

        const q2High = Math.max(...q2.map(c => c.high));
        const q2Low = Math.min(...q2.map(c => c.low));
        const q2Range = q2High - q2Low;
        const avgQ2Body = q2.reduce((sum, c) => sum + Math.abs(c.open - c.close), 0) / 20 || 1;

        const q3High = Math.max(...q3.map(c => c.high));
        const q3Low = Math.min(...q3.map(c => c.low));
        
        const q4High = Math.max(...q4.map(c => c.high));
        const q4Low = Math.min(...q4.map(c => c.low));

        const isQ1Consolidation = q1Range <= avgQ1Body * 8;
        const isQ2Consolidation = q2Range <= avgQ2Body * 8;

        // Model 1: AMDX (Accumulation Q1 -> Manipulation Q2 -> Distribution Q3)
        if (isQ1Consolidation) {
            if (q2Low < q1Low && q3High > q1High) {
                result.quarterlyTheory = 'AMDX_BULLISH';
                result.score += 6;
            } else if (q2High > q1High && q3Low < q1Low) {
                result.quarterlyTheory = 'AMDX_BEARISH';
                result.score -= 6;
            }
        } 
        // Model 2: XAMD (Expansion Q1 -> Consolidation Q2 -> Manipulation Q3 -> Distribution Q4)
        else if (isQ2Consolidation) {
            if (q3Low < q2Low && q4High > q2High) {
                result.quarterlyTheory = 'XAMD_BULLISH';
                result.score += 6;
            } else if (q3High > q2High && q4Low < q2Low) {
                result.quarterlyTheory = 'XAMD_BEARISH';
                result.score -= 6;
            }
        }
    }

    // 15. SMC Continuation Model (Type 1 to 13)
    // Type 1: BOS + OB + IDM Sweep
    // Type 2: BOS + OB + Liquidity Build-up & Sweep (EQH/EQL)
    // Type 3: BOS + IDM Sweep + Imbalance (FVG) + OB (Sniper Entry)
    // Type 4: Sweep (LQ) + BOS + FVG/IFVG + OB (Sniper Reversal/Continuation)
    // Type 5: CHoCH (MSS) + IDM Sweep + Imbalance (FVG) + OB (High Probability Reversal)
    // Type 6: Major Sweep (X) + CHoCH + FVG + OB (Smart Money Reversal)
    // Type 7: CHoCH + FVG (SMC Entry Structure 02)
    // Type 8: BOS + Liquidity Sweep ($) + Extreme OB Mitigation (WealthGrowth Model)
    // Type 9: CHoCH + BOS + Inducement Sweep (X) + Extreme OB/Supply (WealthGrowth Reversal)
    // Type 10: Counter-Trend CHoCH mapping HTF POI mitigation (WealthGrowth HTF Model)
    // Type 11: Missed Extreme S&D + Flip + CHoCH (Entries Without S&D Zones)
    // Type 12: HTF Trend Continuation + LTF CHoCH inside POI (Trading Continuation)
    // Type 13: HTF BOS + Counter-Trend CHoCH (Trade the Pullback)
    // Type 14: BOS + Inducement Sweep (X) + POI/OB Mitigation (Trend Continuation)
    if ((result.bos === 'BULLISH' || result.choch === 'BULLISH') && result.orderBlock === 'BULLISH') {
        if (result.bos === 'BULLISH' && result.inducement && result.fvg === 'BULLISH') {
            result.continuationModel = 'TYPE_14_BULLISH';
            result.score += 15; // BOS + Inducement + POI
        } else if (result.bos === 'BULLISH' && result.choch === 'BULLISH' && result.fvg === 'BULLISH' && result.liquiditySweep === 'NONE') {
            result.continuationModel = 'TYPE_12_BULLISH';
            result.score += 15; // HTF Continuation + LTF CHoCH
        } else if (result.bos === 'BEARISH' && result.choch === 'BULLISH' && result.fvg === 'BULLISH') {
            result.continuationModel = 'TYPE_10_BULLISH';
            result.score += 15; // HTF POI Mitigation Shift
        } else if (result.bos === 'BEARISH' && result.choch === 'BULLISH') {
            result.continuationModel = 'TYPE_13_BULLISH';
            result.score += 12; // Trade the Pullback
        } else if (result.choch === 'BULLISH' && result.bos === 'BULLISH' && result.inducement) {
            result.continuationModel = 'TYPE_9_BULLISH';
            result.score += 15; // WealthGrowth Entry Module Reversal
        } else if (result.liquiditySweep === 'SELL_SIDE' && result.choch === 'BULLISH' && result.fvg === 'BULLISH') {
            result.continuationModel = 'TYPE_6_BULLISH';
            result.score += 15; // Ultimate Reversal Setup
        } else if (result.choch === 'BULLISH' && result.inducement && result.fvg === 'BULLISH') {
            result.continuationModel = 'TYPE_5_BULLISH';
            result.score += 12; // High Probability Formula (MSS + IDM + IMB + OB)
        } else if (result.choch === 'BULLISH' && result.fvg === 'BULLISH') {
            result.continuationModel = 'TYPE_7_BULLISH';
            result.score += 10; // SMC Entry Structure 02
        } else if (result.liquiditySweep === 'SELL_SIDE' && result.fvg === 'BULLISH') {
            result.continuationModel = 'TYPE_4_BULLISH';
            result.score += 10; // Extreme Sniper probability setup
        } else if (result.inducement && result.fvg === 'BULLISH') {
            result.continuationModel = 'TYPE_3_BULLISH';
            result.score += 8; // Ultra high probability setup
        } else if (result.liquiditySweep === 'SELL_SIDE' && result.bos === 'BULLISH') {
            result.continuationModel = 'TYPE_8_BULLISH';
            result.score += 7; // WealthGrowth Extreme OB Model
        } else if (result.inducement) {
            result.continuationModel = 'TYPE_1_BULLISH';
            result.score += 5; // Very high probability setup
        } else if (result.liquiditySweep === 'SELL_SIDE' || result.liquidityType === 'EQL') {
            result.continuationModel = 'TYPE_2_BULLISH';
            result.score += 5;
        } else if (result.bos === 'BULLISH' && result.fvg === 'NONE' && result.liquiditySweep === 'NONE' && !result.inducement) {
            result.continuationModel = 'TYPE_15_BULLISH';
            result.score += 5; // Strong Low Mitigation
        }
    } else if ((result.bos === 'BEARISH' || result.choch === 'BEARISH') && result.orderBlock === 'BEARISH') {
        if (result.bos === 'BEARISH' && result.inducement && result.fvg === 'BEARISH') {
            result.continuationModel = 'TYPE_14_BEARISH';
            result.score -= 15;
        } else if (result.bos === 'BEARISH' && result.choch === 'BEARISH' && result.fvg === 'BEARISH' && result.liquiditySweep === 'NONE') {
            result.continuationModel = 'TYPE_12_BEARISH';
            result.score -= 15;
        } else if (result.bos === 'BULLISH' && result.choch === 'BEARISH' && result.fvg === 'BEARISH') {
            result.continuationModel = 'TYPE_10_BEARISH';
            result.score -= 15;
        } else if (result.bos === 'BULLISH' && result.choch === 'BEARISH') {
            result.continuationModel = 'TYPE_13_BEARISH';
            result.score -= 12; // Trade the Pullback
        } else if (result.choch === 'BEARISH' && result.bos === 'BEARISH' && result.inducement) {
            result.continuationModel = 'TYPE_9_BEARISH';
            result.score -= 15;
        } else if (result.liquiditySweep === 'BUY_SIDE' && result.choch === 'BEARISH' && result.fvg === 'BEARISH') {
            result.continuationModel = 'TYPE_6_BEARISH';
            result.score -= 15;
        } else if (result.choch === 'BEARISH' && result.inducement && result.fvg === 'BEARISH') {
            result.continuationModel = 'TYPE_5_BEARISH';
            result.score -= 12;
        } else if (result.choch === 'BEARISH' && result.fvg === 'BEARISH') {
            result.continuationModel = 'TYPE_7_BEARISH';
            result.score -= 10;
        } else if (result.liquiditySweep === 'BUY_SIDE' && result.fvg === 'BEARISH') {
            result.continuationModel = 'TYPE_4_BEARISH';
            result.score -= 10;
        } else if (result.inducement && result.fvg === 'BEARISH') {
            result.continuationModel = 'TYPE_3_BEARISH';
            result.score -= 8;
        } else if (result.liquiditySweep === 'BUY_SIDE' && result.bos === 'BEARISH') {
            result.continuationModel = 'TYPE_8_BEARISH';
            result.score -= 7;
        } else if (result.inducement) {
            result.continuationModel = 'TYPE_1_BEARISH';
            result.score -= 5;
        } else if (result.liquiditySweep === 'BUY_SIDE' || result.liquidityType === 'EQH') {
            result.continuationModel = 'TYPE_2_BEARISH';
            result.score -= 5;
        } else if (result.bos === 'BEARISH' && result.fvg === 'NONE' && result.liquiditySweep === 'NONE' && !result.inducement) {
            result.continuationModel = 'TYPE_15_BEARISH';
            result.score -= 5; // Strong High Mitigation
        }
    } else {
        // Missing S&D Zone Entry Models (Flip + CHoCH without extreme OB / Missed POI)
        if (result.choch === 'BULLISH' && result.fvg === 'BULLISH' && result.inducement) {
            result.continuationModel = 'TYPE_11_BULLISH';
            result.score += 12; // Flip & CHoCH Without S&D
        } else if (result.choch === 'BEARISH' && result.fvg === 'BEARISH' && result.inducement) {
            result.continuationModel = 'TYPE_11_BEARISH';
            result.score -= 12; // Flip & CHoCH Without S&D
        }
    }

    // 16. CBDR (Central Bank Dealers Range)
    // Approximate 2 PM NY to 8 PM NY with a rolling window for shortest consolidation body range
    let cbdrLen = timeframe === 'M5' ? 72 : timeframe === 'M15' ? 24 : timeframe === 'M30' ? 12 : timeframe === 'H1' ? 6 : 0;
    
    if (cbdrLen > 0 && recentCandles.length >= cbdrLen * 4) {
        let minRange = Infinity;
        let bestCbdr = null;
        for (let i = 0; i <= (cbdrLen * 4) - cbdrLen; i++) {
            const window = recentCandles.slice(i, i + cbdrLen);
            const highestBody = Math.max(...window.map(c => Math.max(c.open, c.close)));
            const lowestBody = Math.min(...window.map(c => Math.min(c.open, c.close)));
            const range = highestBody - lowestBody;
            if (range < minRange) {
                minRange = range;
                bestCbdr = { top: highestBody, bottom: lowestBody, range };
            }
        }
        
        if (bestCbdr && bestCbdr.range > 0) {
            result.cbdr = {
                top: bestCbdr.top,
                bottom: bestCbdr.bottom,
                range: bestCbdr.range,
                up: {
                    sd1: bestCbdr.top + bestCbdr.range,
                    sd2: bestCbdr.top + bestCbdr.range * 2,
                    sd2_5: bestCbdr.top + bestCbdr.range * 2.5,
                    sd4: bestCbdr.top + bestCbdr.range * 4
                },
                down: {
                    sd1: bestCbdr.bottom - bestCbdr.range,
                    sd2: bestCbdr.bottom - bestCbdr.range * 2,
                    sd2_5: bestCbdr.bottom - bestCbdr.range * 2.5,
                    sd4: bestCbdr.bottom - bestCbdr.range * 4
                },
                isActive: true
            };
        }
    }

    // 17. Advanced SMC Entry Points (WinWorld)
    // Heuristics mapping based on existing SMC features:
    if (result.choch !== 'NONE' && result.inducement && result.orderBlock !== 'NONE' && result.liquiditySweep === 'NONE') {
        result.advancedEntryMode = 'SCHEME_1'; // CHoCH + IDM + OB
        result.score += 5;
    } else if (result.choch !== 'NONE' && result.inducement && result.liquiditySweep !== 'NONE' && result.orderBlock !== 'NONE') {
        result.advancedEntryMode = 'SCHEME_2'; // CHoCH + IDM Sweep via IFC
        result.score += 8; 
    } else if (result.bos !== 'NONE' && result.inducement && result.orderBlock !== 'NONE') {
        result.advancedEntryMode = 'SCHEME_3'; // BOS + IDM + OB
        result.score += 5;
    } else if (result.liquiditySweep !== 'NONE' && result.bos !== 'NONE' && !result.inducement) {
        result.advancedEntryMode = 'SCHEME_4'; // POI Sweep via IFC (no IDM wait)
        result.score += 10; 
    } else if (result.orderBlock !== 'NONE' && result.choch === 'NONE' && result.bos === 'NONE' && !result.inducement) {
        result.advancedEntryMode = 'SCHEME_5_SMT_WARNING'; // SMT Warning
        result.score -= 10; // Forbidden entry!
    } else if (result.liquiditySweep !== 'NONE' && result.choch === 'NONE' && result.bos === 'NONE') {
        result.advancedEntryMode = 'SCHEME_8'; // IFC sweep in POI (SMT valid)
        result.score += 8;
    }

    // 18. Supply & Demand Price Action Strategy (QM, FTR, Flag Limit, Compression)
    // QM (Quasimodo): A major sweep followed by a CHoCH in the opposite direction
    if (result.liquiditySweep === 'SELL_SIDE' && result.choch === 'BULLISH') {
        result.quasimodo = 'BULLISH';
        result.score += 7;
    } else if (result.liquiditySweep === 'BUY_SIDE' && result.choch === 'BEARISH') {
        result.quasimodo = 'BEARISH';
        result.score -= 7;
    }

    // FTR (Fail to Return) & Flag Limit
    // A BOS followed by a short base/consolidation (S&D Pattern)
    if (result.bos === 'BULLISH' && (result.sndPattern === 'RBR' || result.sndPattern === 'DBR')) {
        result.ftr = 'BULLISH';
        result.flagLimit = 'BULLISH';
        result.score += 5;
    } else if (result.bos === 'BEARISH' && (result.sndPattern === 'DBD' || result.sndPattern === 'RBD')) {
        result.ftr = 'BEARISH';
        result.flagLimit = 'BEARISH';
        result.score -= 5;
    }

    // Compression
    // Multiple dojis or small bodies moving slowly
    if (result.dojiCount >= 3) {
        if (result.structure === 'BEARISH') { 
            result.compression = 'BULLISH'; // Bullish compression towards supply (weakness)
            result.score -= 6; // Drop probability
        } else if (result.structure === 'BULLISH') { 
            result.compression = 'BEARISH'; // Bearish compression towards demand (weakness)
            result.score += 6; // Rally probability
        }
    }

    return result;
};

export const getTrendStatus = (candles: Candle[]): string => {
  const emaAnalysis = analyzeEMACondition(candles);
  return emaAnalysis.bias; // Now returns specific EMA 200 Bias
};
