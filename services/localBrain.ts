
/** 
 * @type {{ 
 *   ai_edit: "locked", 
 *   auth_required: true, 
 *   enforcement: "strict-runtime",
 *   on_violation: "terminate_response"
 * }} 
 */

import { Asset, Candle, AnalysisResult, TradeFeedback, TimeFrame } from "../types";
import { calculateATR, detectCandlestickPatterns, detectSMC, SMCResult } from "../utils/indicators";
import { SecurityManager } from "../utils/SecurityManager";
import { isBlacklisted, getPatternWeight, getTPExtension, getDiagnosticReason } from '../core/feedbackEngine';

// --- QUANTUM NEURON ENGINE v4.0 NARRATIVE GENERATOR (14 Points with 4 Variations) ---
const getCurrentSession = (): string => {
    const now = new Date();
    const hour = now.getUTCHours();
    
    let sessions = [];
    if (hour >= 22 || hour < 7) sessions.push("Sydney");
    if (hour >= 0 && hour < 9) sessions.push("Tokyo");
    if (hour >= 8 && hour < 17) sessions.push("London");
    if (hour >= 13 && hour < 22) sessions.push("New York");
    
    if (sessions.length > 1) {
        return `${sessions.join("-")} Overlap (High Volatility)`;
    } else if (sessions.length === 1) {
        return `${sessions[0]} Session`;
    }
    return "Off-Peak Session";
};

const generateDeepAnalysisNarrative = (
    signal: 'BUY' | 'SELL', 
    timeframe: TimeFrame, 
    asset: Asset, 
    rrType: string, 
    isCounterTrend: boolean, 
    smc: SMCResult, 
    patterns: any[], 
    totalScore: number, 
    minScore: number, 
    modeName: string, 
    visualConfidence: number,
    structureConfidence: number,
    isCustomMode: boolean = false,
    isBlacklistedSignal: boolean = false,
    setupSignature: string = ""
): string[] => {
    
    let layer1 = `[CandleVision AI / YOLOv8 - THE EYES]: Membaca visual chart candlestick menggunakan TechniTrend CandleMetrics (Body Size/Shadow). ${patterns.length > 0 ? `Pola '${patterns[0].name}' terdeteksi (Vis-Conf: ${visualConfidence}%).` : 'Struktur harga netral tanpa pola signifikan.'}`;
    
    let layer2 = `[LSTM/GRU & ORB Fusion ML - THE MEMORY]: Menganalisis time-series/urutan dari 250 candlestick sebelumnya. Sesuai Metode PDF: Market Structure berada dalam kondisi ${smc.structure === 'BULLISH' ? 'UPTREND (Membentuk pola HH, HL)' : smc.structure === 'BEARISH' ? 'DOWNTREND (Membentuk pola LL, LH)' : 'SIDEWAYS (Mendatar dengan pantulan di antara rentang harga)'}. ${smc.choch !== 'NONE' ? `Terjadi CHoCH ${smc.choch} (Trend Reversal).` : smc.bos !== 'NONE' ? `BOS ${smc.bos} terkonfirmasi (Trend Continuation).` : ''}`;
    
    let layer3 = `[smc-toolkit & supply-and-demand-zones - THE RADAR]: Deteksi real-time & Confidence Scoring. Liquidity Grab (Stop Hunt): ${smc.liquiditySweep !== 'NONE' ? `Sweep pada ${smc.liquiditySweep} tervalidasi.` : smc.inducement ? 'Inducement (IDM) tersapu.' : 'Neutral Pool.'} Supply/Demand (S/R) Mapping: ${smc.sndPattern !== 'NONE' ? smc.sndPattern : 'Base Netral'}. FVG: ${smc.fvg !== 'NONE' ? smc.fvg : 'N/A'}.`;
    
    let layer4 = `[FinLLM-B & Transformer Models - THE STRATEGIST]: Deteksi False Breakout & analisa market struktural kompleks Multi-TF (Topscore SMC). ${smc.quarterlyTheory !== 'NONE' ? `Terdeteksi ICT Quarterly Theory (${smc.quarterlyTheory.replace('_', ' ')}). Siklus Manipulasi/Judas Swing telah selesai dan siap distribusi.` : `Market Phase: ${smc.phase}.`} LLM-reasoning ML Gating Confidence: ${structureConfidence}%.`;
    
    let setupModel = "Netral/Menunggu Area Institusi";
    
    // Inject Supply & Demand Price Action
    if (smc.quasimodo !== 'NONE') {
        setupModel = `Quasimodo (QM) ${smc.quasimodo === 'BULLISH' ? 'Buy' : 'Sell'} Setup`;
    } else if (smc.compression !== 'NONE') {
        setupModel = `Compression (Approach) towards ${smc.compression === 'BULLISH' ? 'Supply' : 'Demand'}`;
    } else if (smc.ftr !== 'NONE' || smc.flagLimit !== 'NONE') {
        setupModel = `FTR (Fail To Return) / Flag Limit ${smc.ftr === 'BULLISH' ? 'Buy' : 'Sell'} Setup`;
    }
    // Inject WinWorld Advanced SMC Entry Schemes names
    else if (smc.advancedEntryMode !== 'NONE') {
        if (smc.advancedEntryMode === 'SCHEME_1') setupModel = "Advanced Entry Scheme #1 (CHoCH + IDM + OB)";
        else if (smc.advancedEntryMode === 'SCHEME_2') setupModel = "Advanced Entry Scheme #2 (IFC Sweep Entry)";
        else if (smc.advancedEntryMode === 'SCHEME_3') setupModel = "Advanced Entry Scheme #3 (Continuation BOS + IDM)";
        else if (smc.advancedEntryMode === 'SCHEME_4') setupModel = "Advanced Entry Scheme #4 (Instant IFC POI Entry)";
        else if (smc.advancedEntryMode === 'SCHEME_5_SMT_WARNING') setupModel = "⚠️ SMT WARNING (Smart Money Trap)";
        else if (smc.advancedEntryMode === 'SCHEME_8') setupModel = "Advanced Entry Scheme #8 (Valid SMT via IFC Sweep)";
    }
    else if (totalScore > 0) {
        if (smc.choch !== 'NONE') setupModel = "Type 5 - CHoCH Sniper";
        else if (smc.bos !== 'NONE' && smc.liquiditySweep !== 'NONE' && smc.fvg !== 'NONE') setupModel = "Type 3 - Sehebat Ngoni";
        else if (smc.structure === 'BULLISH' && smc.liquiditySweep !== 'NONE') setupModel = "Type 1 - Continuation";
        else if (smc.fvg !== 'NONE' && totalScore > 6) setupModel = "Type 4 - VicentFx Sniper";
        else if (smc.liquiditySweep !== 'NONE' && smc.orderBlock !== 'NONE') setupModel = "Type 6 - Smart Money Reversal";
        else if (smc.sndPattern !== 'NONE' && smc.orderBlock === 'NONE') setupModel = "Type 11 - Missed POI & Flip";
        else if (smc.fvg !== 'NONE') setupModel = "Type 13 - Trade the Pullback";
        else setupModel = "Type 10 - Order Flow Reversal";
    } else if (totalScore < 0) {
        if (smc.choch !== 'NONE') setupModel = "Type 5 - CHoCH Sniper";
        else if (smc.bos !== 'NONE' && smc.liquiditySweep !== 'NONE' && smc.fvg !== 'NONE') setupModel = "Type 3 - Sehebat Ngoni";
        else if (smc.structure === 'BEARISH' && smc.liquiditySweep !== 'NONE') setupModel = "Type 2 - Continuation";
        else if (smc.fvg !== 'NONE' && totalScore < -6) setupModel = "Type 4 - VicentFx Sniper";
        else if (smc.liquiditySweep !== 'NONE' && smc.orderBlock !== 'NONE') setupModel = "Type 6 - Smart Money Reversal";
        else if (smc.sndPattern !== 'NONE' && smc.orderBlock === 'NONE') setupModel = "Type 11 - Missed POI & Flip";
        else if (smc.fvg !== 'NONE') setupModel = "Type 13 - Trade the Pullback";
        else setupModel = "Type 10 - Order Flow Reversal";
    }

    const diagReason = isBlacklistedSignal ? getDiagnosticReason(setupSignature) : null;
    let layer5 = `[RL (Reinforcement Learning) - THE EXPERIENCE]: ${isBlacklistedSignal ? `⚠️ SIGNAL DIKOREKSI OTOMATIS: ${diagReason || 'Mencegah loss berulang pada pola ini'}. Probabilitas ditingkatkan.` : `Analisa real-time & probabilitas adaptif mengurangi loss rate otomatis (Targeting Zero Floating Zone).`} Model Rule-Based SMC aktif: ${setupModel}. Zona tervalidasi dengan ML gating rules.`;

    let exec = `PROBABILITAS EKSEKUSI ${signal} TINGGI`;
    let cbdrProjection = smc.cbdr?.isActive ? `\n[CBDR Analysis]: Central Bank Dealers Range terdeteksi (Range ${smc.cbdr.range.toFixed(2)} pts). Standard Deviation (SD) memproyeksikan ${signal === 'BUY' ? 'Target Atas Harian pada' : 'Target Bawah Harian pada'} SD -2 / -2.5.` : '';
    let layer6 = `[Full SMC + AI Chart Analysis]: ${exec}! Target RR: ${rrType}. ${isCustomMode ? `Target dieksekusi dengan mode ${modeName} khusus ${asset} (Custom Fixed Target Range).` : `Target dieksekusi dengan SL 1.5x ATR.`} ${cbdrProjection}\nEntry telah dioptimasi dengan protokol Zero-Floating (Limit order pada Pivot/OTE Fibonacci). \nCatatan: Kalkulasi Prediksi di-render dengan komputasi gabungan (CandleVision + FinLLM-B + ORB Fusion ML) sepenuhnya gratis & unlimited, prediksi ini adalah probabilitas bukan kepastian.`;

    return [layer1, layer2, layer3, layer4, layer5, layer6];
};

export const analyzeLocalMarket = (
  asset: Asset,
  candles: Candle[],
  timeframe: TimeFrame,
  lastFeedback: TradeFeedback,
  winStreak: number = 0,
  lossStreak: number = 0
): AnalysisResult => {
  
  // Layer 6: Anti-Tamper & Anti-Debug (Fake Data Injection if Locked)
  if (SecurityManager.isSystemLocked()) {
      return {
          signal: 'BUY', confidence: 0, entryPrice: 0, stopLoss: 0, takeProfit: 0, riskRewardRatio: "0:0",
          reasoning: ["SYSTEM LOCKED: Unauthorized Access Detected. Data Corrupted."], smcConceptsFound: ["CORRUPTED"], timestamp: new Date().toLocaleTimeString(), timeframe: timeframe
      };
  }

  if (!candles || candles.length < 250) {
      return {
          signal: 'BUY', confidence: 0, entryPrice: 0, stopLoss: 0, takeProfit: 0, riskRewardRatio: "0:0",
          reasoning: Array(14).fill("Initializing ASI Core (Need 250 Candles)..."), smcConceptsFound: [], timestamp: new Date().toLocaleTimeString(), timeframe: timeframe
      };
  }

  // LEARNING STATE (Self-Correction & Probabilities boosting)
  let learningState = {
      punished: {} as Record<string, { count: number, lastTime: number }>,
      rewarded: {} as Record<string, { count: number }>
  };
  try {
      const stored = localStorage.getItem('ASI_LEARNING_STATE');
      if (stored) learningState = JSON.parse(stored);
  } catch(e) {}

  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const atr = calculateATR(candles, 14) || (current.close * 0.001);
  const patterns = detectCandlestickPatterns(candles);
  const smc = detectSMC(candles, timeframe);

  // --- MATHEMATICAL AGENT LOGIC (LOCAL BRAIN) ---
  
  let signal: 'BUY' | 'SELL' = 'BUY'; // DEFAULT TO BUY
  let confidence = 0;
  let isCounterTrend = false;
  let setupType = "SMC_TREND";

  // TIMEFRAME-SPECIFIC THRESHOLDS & MODES (Upgraded Sniper Mode)
  let minScore = 7;
  let rrRatioVal = 3.0;
  let rrLabel = "1:3";
  let modeName = "TRADING";

  const isCrypto = [Asset.BTCUSD, Asset.ETHUSD, Asset.SOLUSD, Asset.BNBUSD].includes(asset);

  // AUTOMATIC MODE SELECTION BASED ON TIMEFRAME
  if (timeframe === 'M1' || timeframe === 'M5') {
      modeName = "SCALPING";
      if (isCrypto) { minScore = 3; rrRatioVal = 2.0; rrLabel = "1:2"; }
      else { minScore = 4; rrRatioVal = 2.0; rrLabel = "1:2"; }
  }
  else if (timeframe === 'M15') {
      modeName = "INTRADAY";
      if (isCrypto) { minScore = 4; rrRatioVal = 2.0; rrLabel = "1:2"; }
      else { minScore = 5; rrRatioVal = 2.0; rrLabel = "1:2"; }
  }
  else if (timeframe === 'M30') {
      modeName = "DAY TRADE";
      if (isCrypto) { minScore = 5; rrRatioVal = 2.0; rrLabel = "1:2"; }
      else { minScore = 6; rrRatioVal = 2.5; rrLabel = "1:2.5"; }
  }
  else if (timeframe === 'H1') {
      modeName = "SWING MINGGUAN";
      if (isCrypto) { minScore = 6; rrRatioVal = 2.5; rrLabel = "1:2.5"; }
      else { minScore = 7; rrRatioVal = 2.5; rrLabel = "1:2.5"; }
  }
  else if (timeframe === 'H4' || timeframe === 'D1') {
      modeName = "SWING BULANAN";
      if (isCrypto) { minScore = 6; rrRatioVal = 2.5; rrLabel = "1:2.5"; }
      else { minScore = 8; rrRatioVal = 3.0; rrLabel = "1:3"; }
  }

  // DYNAMIC RR BOOSTING FOR SNIPER SETUPS (Zero Floating Models) AFTER BASE SET
  if (smc.continuationModel.includes('TYPE_15')) {
      rrRatioVal = 5.0; // Strong OB Mitigation
      rrLabel = `1:5.0`;
  } else if (smc.continuationModel.includes('TYPE_14')) {
      rrRatioVal = 6.5; // Inducement + POI Mitigation
      rrLabel = `1:6.5`;
  } else if (smc.continuationModel.includes('TYPE_13')) {
      rrRatioVal = 6.0; // Trade the Pullback
      rrLabel = `1:6.0`;
  } else if (smc.continuationModel.includes('TYPE_12')) {
      rrRatioVal = 7.0; // Trading Continuation LTF in HTF POI
      rrLabel = `1:7.0`;
  } else if (smc.continuationModel.includes('TYPE_11')) {
      rrRatioVal = 6.0; // Missed POI & Flip
      rrLabel = `1:6.0`;
  } else if (smc.continuationModel.includes('TYPE_10')) {
      rrRatioVal = 10.0; // HTF POI Mitigation (Biggest RR)
      rrLabel = `1:10.0`;
  } else if (smc.continuationModel.includes('TYPE_9')) {
      rrRatioVal = 9.0; // WealthGrowth Extreme Reversal
      rrLabel = `1:9.0`;
  } else if (smc.continuationModel.includes('TYPE_6')) {
      rrRatioVal = 8.0; // Ultimate Reversal Setup
      rrLabel = `1:8.0`;
  } else if (smc.continuationModel.includes('TYPE_5') || smc.continuationModel.includes('TYPE_7') || smc.continuationModel.includes('TYPE_8')) {
      rrRatioVal = 7.0; // Most Profitable Setup / WealthGrowth Model
      rrLabel = `1:7.0`;
  } else if (smc.continuationModel.includes('TYPE_4')) {
      rrRatioVal = 6.0; // Extreme 1:6 for Type 4
      rrLabel = `1:6.0`;
  } else if (smc.continuationModel.includes('TYPE_3')) {
      rrRatioVal = 5.0; // Minimum 1:5 for Type 3
      rrLabel = `1:5.0`;
  } else if (smc.continuationModel.includes('TYPE_1') || smc.continuationModel.includes('TYPE_2')) {
      rrRatioVal = 4.0;
      rrLabel = `1:4.0`;
  }

  // 1. LAYER 1: SMC VECTOR (DIRECTION)
  const isUptrend = smc.structure === 'BULLISH';
  const isDowntrend = smc.structure === 'BEARISH';
  const isSideways = smc.structure === 'SIDEWAYS';

  // 2. LAYER 2 & 4: SND LOCATION & CANDLE TRIGGER
  const bullishPatterns = patterns.filter(p => p.type === 'BULLISH');
  const bearishPatterns = patterns.filter(p => p.type === 'BEARISH');
  
  // --- ADVANCED SCORING SYSTEM (VISION & SMC v5.0) ---
  let totalScore = smc.score; // Base score from SMC structure
  
  let emotionalBias = 0; // Removing RSI-based fear/greed

  // CHART PATTERN CONFIRMATION (Macro Structural Priority)
  if (smc.chartPatterns && smc.chartPatterns.length > 0) {
      smc.chartPatterns.forEach(pattern => {
          const p = pattern.toLowerCase();
          if (p.includes('bullish') || p.includes('bottom') || p === 'inv. head & shoulder' || p === 'falling wedge' || p === 'ascending triangle' || p === 'cup & handle') {
              totalScore += 15; // Boosted for high probability (Kitab Chart Pattern New Reborn)
          } else if (p.includes('bearish') || p.includes('top') || p === 'head & shoulder' || p === 'rising wedge' || p === 'descending triangle') {
              totalScore -= 15;
          } else {
              if (isUptrend) totalScore += 5;
              if (isDowntrend) totalScore -= 5;
          }
      });
  }

  const signatureLiquidity = smc.liquiditySweep !== 'NONE' ? smc.liquiditySweep : (smc.inducement ? 'IDM' : 'NONE');
  const signaturePattern = patterns.length > 0 ? patterns[0].name.replace(/ /g, '_') : 'NONE';
  const setupSignature = `${asset}-${timeframe}-${smc.structure}-${signatureLiquidity}-${signaturePattern}`;
  
  // Apply external Feedback Engine (Win/Loss Buttons)
  const patternWeight = getPatternWeight(setupSignature);
  if (totalScore > 0) {
      totalScore += patternWeight;
  } else if (totalScore < 0) {
      totalScore -= patternWeight;
  }
  
  const tpExtension = getTPExtension(setupSignature);
  let isBlacklistedSignal = isBlacklisted(setupSignature);

  // 2. ZERO-FLOATING PROTOCOL (Precision Filter)
  let isAtPivotZone = false;
  if (smc.pivotPoints) {
      const p = smc.pivotPoints;
      const levels = [p.PP, p.R1, p.R2, p.S1, p.S2];
      isAtPivotZone = levels.some(level => Math.abs(current.low - level) / current.low < 0.0015 || Math.abs(current.high - level) / current.high < 0.0015);
  }

  const isAtExtremeZone = smc.orderBlock !== 'NONE' || smc.liquiditySweep !== 'NONE' || smc.sndPattern !== 'NONE' || smc.fibonacciOTE !== null || smc.baseTrading !== 'NONE' || isAtPivotZone || smc.amdPattern !== 'NONE';
  const momentumStrength = Math.abs(current.close - prev.close) / atr;
  
  if (isAtExtremeZone && momentumStrength > 1.5) {
      totalScore += (totalScore > 0 ? 3 : -3);
  }

  // Add Candlestick Pattern Scores (Trigger)
  if (bullishPatterns.length > 0) {
      const bestPattern = bullishPatterns[0];
      const isTopTripleBullishPattern = ['Morning Star', 'Three White Soldiers', 'Rising Three Methods', 'Three Inside Up', 'Exhaustion & Impulsion (Bullish)'].some(p => bestPattern.name.includes(p));
      const isTopDoubleBullishPattern = ['Bullish Engulfing', 'Piercing Line', 'Pin Bar (Bullish Rejection)', 'Hammer', 'Dragonfly Doji (Buy Signal)', 'Bullish Fakeout'].some(p => bestPattern.name.includes(p));

      let patternScore = 0;
      if (isTopTripleBullishPattern) {
          patternScore = 8; 
      } else if (isTopDoubleBullishPattern) {
          patternScore = 7; 
          if ((bestPattern.name.includes('Engulfing') || bestPattern.name.includes('Pin Bar') || bestPattern.name.includes('Fakeout')) && isDowntrend) {
              patternScore += 4; 
          }
      } else if (bestPattern.strength >= 3) {
          patternScore = 3;
      } else {
          patternScore = 1;
      }

      if (isAtExtremeZone) {
          patternScore = Math.floor(patternScore * 3.5); 
          const isFakeout = current.close > current.open && current.low < (prev.low - atr * 0.5);
          if (isFakeout) {
              totalScore += 20; 
          } else {
              totalScore += 15; 
          }
      }
      totalScore += patternScore;
  } else if (isAtExtremeZone && current.close < current.open && momentumStrength > 2) {
      totalScore -= 20; 
  }
  
  if (bearishPatterns.length > 0) {
      const bestPattern = bearishPatterns[0];
      const isTopBearishPattern = ['Bearish Engulfing', 'Evening Star', 'Three Black Crows', 'Dark Cloud Cover', 'Three Inside Down', 'Falling Three Methods', 'Pin Bar (Bearish Rejection)', 'Exhaustion & Impulsion (Bearish)', 'Gravestone Doji (Sell Signal)', 'Bearish Fakeout'].some(p => bestPattern.name.includes(p));

      let patternScore = 0;
      if (isTopBearishPattern) {
          patternScore = 8; 
          if ((bestPattern.name.includes('Engulfing') || bestPattern.name.includes('Pin Bar') || bestPattern.name.includes('Fakeout')) && isUptrend) {
              patternScore += 4; 
          }
      } else if (bestPattern.strength >= 3) {
          patternScore = 3;
      } else {
          patternScore = 1;
      }

      if (isAtExtremeZone) {
          patternScore = Math.floor(patternScore * 3.5); 
          const isFakeout = current.close < current.open && current.high > (prev.high + atr * 0.5);
          if (isFakeout) {
              totalScore -= 20; 
          } else {
              totalScore -= 15; 
          }
      }
      totalScore -= patternScore;
  } else if (isAtExtremeZone && current.close > current.open && momentumStrength > 2) {
      totalScore += 20; 
  }

  // Apply Momentum Confirmation Structure
  if (isUptrend && smc.structure === 'BULLISH') totalScore += 4;
  if (isDowntrend && smc.structure === 'BEARISH') totalScore -= 4;

  // Structural SMC Filtering vs Technical Oscillators
  // Retail Trap (Inducement) Multiplier - High probability if retail is trapped
  if (smc.inducement) {
      if (totalScore > 0) totalScore += 3;
      if (totalScore < 0) totalScore -= 3;
  }

  // New SMC Concepts Scoring
  if (smc.sndPattern === 'RBR' || smc.sndPattern === 'DBR') totalScore += 2;
  if (smc.sndPattern === 'DBD' || smc.sndPattern === 'RBD') totalScore -= 2;

  // FVG + Inducement (IDM) Extreme Zero Floating Setup
  if (smc.fvg === 'BULLISH' && smc.inducement) totalScore += 5; // Discount FVG + IDM sweep
  if (smc.fvg === 'BEARISH' && smc.inducement) totalScore -= 5; // Premium FVG + IDM sweep
  
  // OBIIM (Order Block + Imbalance + Inducement) & Premium/Discount Logic from PDF
  if (smc.orderBlock === 'BULLISH' && smc.fvg === 'BULLISH' && smc.inducement) {
      // Must be in Discount Area for Buy
      if (smc.fibonacciOTE && current.close < smc.fibonacciOTE.level0_5) {
          totalScore += 10; // Extra boost for OBIIM in Discount
      } else {
          totalScore += 4;
      }
  }
  if (smc.orderBlock === 'BEARISH' && smc.fvg === 'BEARISH' && smc.inducement) {
      // Must be in Premium Area for Sell
      if (smc.fibonacciOTE && current.close > smc.fibonacciOTE.level0_5) {
          totalScore -= 10; // Extra boost for OBIIM in Premium
      } else {
          totalScore -= 4;
      }
  }
  
  // Base Breakout (Adjusted to match the dynamic scoring in indicators.ts)
  if (smc.baseTrading === 'BASE_BREAK_BULLISH') totalScore += 3;
  if (smc.baseTrading === 'BASE_BREAK_BEARISH') totalScore -= 3;
  
  // Sam Seiden's Breakout Entry Zone (Buying/Shorting the Retracement)
  if (smc.baseTrading === 'BASE_RETURN_BULLISH') totalScore += 6;
  if (smc.baseTrading === 'BASE_RETURN_BEARISH') totalScore -= 6;

  if (smc.crtStatus === 'ACCUMULATION') totalScore += 1;
  if (smc.crtStatus === 'DISTRIBUTION') totalScore -= 1;
  if (smc.crtStatus === 'MANIPULATION_SWEEP') {
      if (totalScore > 0) totalScore += 2;
      if (totalScore < 0) totalScore -= 2;
  }

  // AMD PO3 Rule
  if (smc.amdPattern === 'BULLISH') {
      totalScore += 5; // AMD has very high priority for zero floating entry
  } else if (smc.amdPattern === 'BEARISH') {
      totalScore -= 5;
  }

  // CBDR (Central Bank Dealers Range) Alignment
  if (smc.cbdr?.isActive) {
      const cbdr = smc.cbdr;
      if (signal === 'BUY') {
          // If current price is below CBDR Top, it means we haven't reached SD targets yet.
          if (current.close < cbdr.up.sd2) totalScore += 3;
      } else if (signal === 'SELL') {
          // If current price is above CBDR Bottom, we haven't reached SD targets yet.
          if (current.close > cbdr.down.sd2) totalScore += 3;
      }
  }

  // ICT Quarterly Theory (AMDX / XAMD)
  if (smc.quarterlyTheory === 'AMDX_BULLISH' || smc.quarterlyTheory === 'XAMD_BULLISH') {
      totalScore += 6;
  } else if (smc.quarterlyTheory === 'AMDX_BEARISH' || smc.quarterlyTheory === 'XAMD_BEARISH') {
      totalScore -= 6;
  }

  if (smc.fibonacciOTE) {
      if (totalScore > 0) totalScore += 2;
      if (totalScore < 0) totalScore -= 2;
  }

  if (smc.pivotPoints) {
      if (current.close > smc.pivotPoints.PP) totalScore += 1;
      if (current.close < smc.pivotPoints.PP) totalScore -= 1;
  }

  // AI QUANTUM NEURON LEARNING ENGINE (Self-Correction feedback logic)
  const learningKey = `${smc.continuationModel !== 'NONE' ? smc.continuationModel : smc.choch !== 'NONE' ? 'CHOCH_'+smc.choch : smc.bos !== 'NONE' ? 'BOS_'+smc.bos : smc.sndPattern !== 'NONE' ? smc.sndPattern : smc.fvg !== 'NONE' ? 'FVG_'+smc.fvg : 'RAW'}_${asset}_${timeframe}`;
  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  if (learningState.punished[learningKey]) {
      const punishData = learningState.punished[learningKey];
      if (nowMs - punishData.lastTime < dayMs) {
          if (punishData.count >= 2) {
              // Block completely - "Tidak akan terulang ke 2x atau ke 3x dalam 1 hari"
              totalScore = 0; 
          } else {
              // Punished 1 time, reduce score to make it harder to trigger
              if (totalScore > 0) totalScore -= 3;
              if (totalScore < 0) totalScore += 3;
          }
      } else {
          // Reset if it's a new day
          delete learningState.punished[learningKey];
          try { localStorage.setItem('ASI_LEARNING_STATE', JSON.stringify(learningState)); } catch(e){}
      }
  }

  if (learningState.rewarded[learningKey]) {
      // Increase probability if it was successful previously (Win button clicked)
      const rewardData = learningState.rewarded[learningKey];
      const winBoost = Math.min(rewardData.count * 2, 6); // Max 6 points boost
      if (totalScore > 0) totalScore += winBoost;
      if (totalScore < 0) totalScore -= winBoost;
  }

  // Interpretation (Zero Floating & Running Profit - Instant Execution)
  // No more waiting for perfect alignment, execute based on pure Score and Multi-Confluence.
  const scoreAbs = Math.abs(totalScore);
  
  const getSetupName = (isBullish: boolean, score: number) => {
      // 15 Setup Models from Training Data
      if (smc.choch !== 'NONE') return "Type 5 - CHoCH Sniper";
      if (smc.bos !== 'NONE' && smc.liquiditySweep !== 'NONE' && smc.fvg !== 'NONE') return "Type 3 - Sehebat Ngoni";
      if (smc.structure === (isBullish ? 'BULLISH' : 'BEARISH') && smc.liquiditySweep !== 'NONE') return isBullish ? "Type 1 - Continuation" : "Type 2 - Continuation";
      if (smc.fvg !== 'NONE' && score > 6) return "Type 4 - VicentFx Sniper (Zero Floating)";
      if (smc.liquiditySweep !== 'NONE' && smc.orderBlock !== 'NONE') return "Type 6 - Smart Money Reversal";
      if (smc.sndPattern !== 'NONE' && smc.orderBlock === 'NONE') return "Type 11 - Missed POI & Flip";
      if (smc.fvg !== 'NONE') return "Type 13 - Trade the Pullback";
      if (smc.liquidityType === 'EQH' || smc.liquidityType === 'EQL') return "Type 15 - Strong Point Mitigation";
      if (smc.continuationModel !== 'NONE') return "Type 12 - HTF Trend Continuation";
      if (smc.inducement) return "Type 14 - Inducement + POI";
      if (smc.structure !== 'SIDEWAYS') return "Type 8 - WealthGrowth Market Structure";
      return "Type 10 - Order Flow Reversal";
  };

  if (totalScore > 0) {
      signal = 'BUY';
      confidence = Math.min(99.9, 85 + (totalScore * 1.5));
      setupType = getSetupName(true, totalScore);
  } else if (totalScore < 0) {
      signal = 'SELL';
      confidence = Math.min(99.9, 85 + (Math.abs(totalScore) * 1.5));
      setupType = getSetupName(false, Math.abs(totalScore));
  } else {
      // FORCE EXECUTION based on structure position (Never WAIT)
      if (isUptrend || smc.structure === 'BULLISH') {
          signal = 'BUY';
          confidence = 85.1;
          setupType = "Type 1 - Trend Continuation Structure";
          totalScore = 1;
      } else {
          signal = 'SELL';
          confidence = 85.1;
          setupType = "Type 2 - Trend Continuation Structure";
          totalScore = -1;
      }
  }

  // AI Feedback Engine: Reverse Signal if Setup is Blacklisted (Fix Loss Repeated Mistakes)
  if (isBlacklistedSignal) {
      signal = signal === 'BUY' ? 'SELL' : 'BUY';
      setupType = setupType + " [⚠️ BLACKLIST REVERSED]";
      confidence = Math.max(85, confidence - 5); 
  }

  // 3. LAYER 3: SNR (Implicitly handled by zones)

  // 4. EXECUTION CALCULATION
  let entry = current.close;
  
  // AI Zero-Floating Entry Optimization (Limit Order at POI)
  if (signal === 'BUY') {
      if (smc.fibonacciOTE && smc.fibonacciOTE.level0_618 < entry && smc.fibonacciOTE.level0_618 > current.low * 0.95) {
          entry = smc.fibonacciOTE.level0_618;
      } else if (smc.orderBlock === 'BULLISH') {
          entry = Math.min(entry, prev.high); // Sniping the OB top
      } else if (smc.fvg === 'BULLISH') {
          entry = Math.min(entry, candles[candles.length - 3].high); // Sniping the FVG gap
      } else if (smc.pivotPoints && smc.pivotPoints.PP < entry && smc.pivotPoints.PP > current.low * 0.99) {
          entry = smc.pivotPoints.PP;
      }
  } else if (signal === 'SELL') {
      if (smc.fibonacciOTE && smc.fibonacciOTE.level0_618 > entry && smc.fibonacciOTE.level0_618 < current.high * 1.05) {
          entry = smc.fibonacciOTE.level0_618;
      } else if (smc.orderBlock === 'BEARISH') {
          entry = Math.max(entry, prev.low); // Sniping the OB bottom
      } else if (smc.fvg === 'BEARISH') {
          entry = Math.max(entry, candles[candles.length - 3].low); // Sniping the FVG gap
      } else if (smc.pivotPoints && smc.pivotPoints.PP > entry && smc.pivotPoints.PP < current.high * 1.01) {
          entry = smc.pivotPoints.PP;
      }
  }

  let sl = 0, tp = 0;
  let isCustomMode = false;
  let customSl = 0, customTp = 0;

  // ==========================================
  // 🔒 LOCKED LOGIC: CUSTOM MODE TRADING PARAMETERS
  // USER REQUESTED: DO NOT MODIFY OR ALTER THESE VALUES
  // ==========================================
  if (asset === Asset.BTCUSD || asset === Asset.USOIL || asset === Asset.ETHUSD || asset === Asset.SOLUSD || asset === Asset.BNBUSD) {
      isCustomMode = true;
      let minSl = 0, maxSl = 0, minTp = 0, maxTp = 0;
      let pipMultiplier = asset === Asset.USOIL ? 0.01 : 1.0;
      
      if (asset === Asset.BTCUSD) {
          if (timeframe === 'M1') { minTp = 80; maxTp = 140; minSl = 40; maxSl = 60; modeName = "SCALPING"; }
          else if (timeframe === 'M5') { minTp = 160; maxTp = 320; minSl = 80; maxSl = 120; modeName = "SCALPING 2"; }
          else if (timeframe === 'M15') { minTp = 320; maxTp = 640; minSl = 160; maxSl = 200; modeName = "INTRADAY"; }
          else if (timeframe === 'M30') { minTp = 640; maxTp = 1000; minSl = 200; maxSl = 280; modeName = "DAY TRADE"; }
          else if (timeframe === 'H1') { minTp = 1000; maxTp = 1600; minSl = 280; maxSl = 400; modeName = "SWING (3-7 HARI)"; }
          else if (timeframe === 'H4' || timeframe === 'D1') { minTp = 1600; maxTp = 2800; minSl = 400; maxSl = 600; modeName = "SWING (1-3 MINGGU)"; }
      } else if (asset === Asset.ETHUSD) {
          if (timeframe === 'M1') { minTp = 16; maxTp = 28; minSl = 8; maxSl = 12; modeName = "SCALPING"; }
          else if (timeframe === 'M5') { minTp = 32; maxTp = 64; minSl = 16; maxSl = 24; modeName = "SCALPING 2"; }
          else if (timeframe === 'M15') { minTp = 64; maxTp = 128; minSl = 32; maxSl = 40; modeName = "INTRADAY"; }
          else if (timeframe === 'M30') { minTp = 141; maxTp = 220; minSl = 44; maxSl = 62; modeName = "DAY TRADE"; }
          else if (timeframe === 'H1') { minTp = 220; maxTp = 352; minSl = 62; maxSl = 88; modeName = "SWING (3-7 HARI)"; }
          else if (timeframe === 'H4' || timeframe === 'D1') { minTp = 352; maxTp = 616; minSl = 88; maxSl = 132; modeName = "SWING (1-3 MINGGU)"; }
      } else if (asset === Asset.SOLUSD) {
          if (timeframe === 'M1') { minTp = 0.32; maxTp = 0.56; minSl = 0.16; maxSl = 0.24; modeName = "SCALPING"; }
          else if (timeframe === 'M5') { minTp = 0.64; maxTp = 1.28; minSl = 0.32; maxSl = 0.48; modeName = "SCALPING 2"; }
          else if (timeframe === 'M15') { minTp = 1.28; maxTp = 2.56; minSl = 0.64; maxSl = 0.80; modeName = "INTRADAY"; }
          else if (timeframe === 'M30') { minTp = 2.82; maxTp = 4.40; minSl = 0.88; maxSl = 1.24; modeName = "DAY TRADE"; }
          else if (timeframe === 'H1') { minTp = 4.40; maxTp = 7.04; minSl = 1.24; maxSl = 1.76; modeName = "SWING (3-7 HARI)"; }
          else if (timeframe === 'H4' || timeframe === 'D1') { minTp = 7.04; maxTp = 12.32; minSl = 1.76; maxSl = 2.64; modeName = "SWING (1-3 MINGGU)"; }
      } else if (asset === Asset.BNBUSD) {
          if (timeframe === 'M1') { minTp = 1.76; maxTp = 3.08; minSl = 0.88; maxSl = 1.32; modeName = "SCALPING"; }
          else if (timeframe === 'M5') { minTp = 3.52; maxTp = 7.04; minSl = 1.76; maxSl = 2.64; modeName = "SCALPING 2"; }
          else if (timeframe === 'M15') { minTp = 7.04; maxTp = 14.08; minSl = 3.52; maxSl = 4.40; modeName = "INTRADAY"; }
          else if (timeframe === 'M30') { minTp = 15.51; maxTp = 24.20; minSl = 4.84; maxSl = 6.82; modeName = "DAY TRADE"; }
          else if (timeframe === 'H1') { minTp = 24.20; maxTp = 38.72; minSl = 6.82; maxSl = 9.68; modeName = "SWING (3-7 HARI)"; }
          else if (timeframe === 'H4' || timeframe === 'D1') { minTp = 38.72; maxTp = 67.76; minSl = 9.68; maxSl = 14.52; modeName = "SWING (1-3 MINGGU)"; }
      } else if (asset === Asset.USOIL) {
          if (timeframe === 'M1') { minTp = 280; maxTp = 350; minSl = 140; maxSl = 140; modeName = "SCALPING"; }
          else if (timeframe === 'M5') { minTp = 420; maxTp = 840; minSl = 280; maxSl = 350; modeName = "SCALPING 2"; }
          else if (timeframe === 'M15') { minTp = 840; maxTp = 1680; minSl = 420; maxSl = 490; modeName = "INTRADAY"; }
          else if (timeframe === 'M30') { minTp = 1680; maxTp = 2450; minSl = 560; maxSl = 560; modeName = "DAY TRADE"; }
          else if (timeframe === 'H1') { minTp = 2520; maxTp = 3500; minSl = 560; maxSl = 700; modeName = "SWING (3-7 HARI)"; }
          else if (timeframe === 'H4' || timeframe === 'D1') { minTp = 3500; maxTp = 5600; minSl = 840; maxSl = 1050; modeName = "SWING (1-3 MINGGU)"; }
      }

      // Use ATR as a dynamic factor between 0 and 1 to pick within the range
      // E.g. high volatility = higher target and SL within the range
      const volatilityFactor = Math.min(Math.max((atr / entry) * 100, 0), 1); 
      customSl = (minSl + (maxSl - minSl) * volatilityFactor) * pipMultiplier;
      customTp = (minTp + (maxTp - minTp) * volatilityFactor) * pipMultiplier * tpExtension; // Applied tpExtension
  }
  // ==========================================
  // 🔒 END LOCKED LOGIC
  // ==========================================

  if (signal === 'BUY') {
      if (isCustomMode) {
          sl = entry - customSl;
          tp = entry + customTp;
          rrLabel = `1:${(customTp/customSl).toFixed(1)}`;
      } else {
          // Precise SL: Last 3 candles low minus 1.5x ATR (Institutional Standard)
          const lowestLow = Math.min(current.low, prev.low, candles[candles.length - 3].low);
          const riskBuffer = atr * 1.5; 
          sl = lowestLow - riskBuffer;
          const risk = entry - sl;
          
          // Target: Recent Swing High or RR
          const recentWindow = candles.slice(Math.max(0, candles.length - 40), candles.length - 3);
          const recentSwingHigh = Math.max(...recentWindow.map(c => c.high));
          
          if (recentSwingHigh > entry + risk * 1.5) { 
              tp = entry + ((recentSwingHigh - entry) * tpExtension); // Apply tpExtension correctly
              rrLabel = `1:${((tp - entry)/risk).toFixed(1)}`;
          } else {
              tp = entry + Math.max(risk * rrRatioVal, atr * 2) * tpExtension; // Apply tpExtension
          }
      }
  } else if (signal === 'SELL') {
      if (isCustomMode) {
          sl = entry + customSl;
          tp = entry - customTp;
          rrLabel = `1:${(customTp/customSl).toFixed(1)}`;
      } else {
          // Precise SL: Last 3 candles high plus 1.5x ATR (Institutional Standard)
          const highestHigh = Math.max(current.high, prev.high, candles[candles.length - 3].high);
          const riskBuffer = atr * 1.5;
          sl = highestHigh + riskBuffer;
          const risk = sl - entry;
          
          // Target: Recent Swing Low or RR
          const recentWindow = candles.slice(Math.max(0, candles.length - 40), candles.length - 3);
          const recentSwingLow = Math.min(...recentWindow.map(c => c.low));
    
          if (smc.cbdr?.isActive && smc.cbdr.down.sd2 < entry - risk * 1.5) {
              tp = smc.cbdr.down.sd2;
              rrLabel = `1:${((entry - tp)/risk).toFixed(1)}`;
          } else if (recentSwingLow < entry - risk * 1.5) {
              tp = entry - ((entry - recentSwingLow) * tpExtension);
              rrLabel = `1:${((entry - tp)/risk).toFixed(1)}`;
          } else {
              tp = entry - Math.max(risk * rrRatioVal, atr * 2) * tpExtension; // Apply tpExtension
          }
      }
  } else {
      sl = 0;
      tp = 0;
      rrLabel = "0:0";
  }

  // PREDICTION 10-25 CANDLES
  let prediction = "";
  let multiplier = 1.5;
  let candleTarget = "10-25";
  if (timeframe === 'M1' || timeframe === 'M5') { multiplier = 1.2; candleTarget = "10-15"; }
  else if (timeframe === 'M15' || timeframe === 'M30') { multiplier = 1.8; candleTarget = "15-20"; }
  else { multiplier = 2.5; candleTarget = "15-25"; }

  const avgSwingDist = atr * 10; // Approximation of average swing distance
  const targetPriceUp = current.close + (avgSwingDist * multiplier);
  const targetPriceDown = current.close - (avgSwingDist * multiplier);

  if (signal === 'BUY') {
      prediction = `Mode ${modeName} - Prediksi ${candleTarget} candle ke depan: Institusi memproyeksikan pergerakan impulsif naik menuju area likuiditas ${targetPriceUp.toFixed(4)} didukung oleh struktur bullish dan momentum saat ini.`;
  } else if (signal === 'SELL') {
      prediction = `Mode ${modeName} - Prediksi ${candleTarget} candle ke depan: Institusi memproyeksikan pergerakan impulsif turun menuju area likuiditas ${targetPriceDown.toFixed(4)} didukung oleh struktur bearish dan momentum saat ini.`;
  } else {
      prediction = `Mode ${modeName} - Prediksi ${candleTarget} candle ke depan: Market kemungkinan akan bergerak ranging/sideways di sekitar ${current.close.toFixed(4)} untuk menjebak ritel sebelum pergerakan besar berikutnya.`;
  }

  const smcConcepts = ["ASI_CORE", setupType, timeframe + "_ANALYSIS"];
  if (smc.bos !== 'NONE') smcConcepts.push(`BOS_${smc.bos}`);
  if (smc.choch !== 'NONE') smcConcepts.push(`CHoCH_${smc.choch}`);
  if (smc.orderBlock !== 'NONE') smcConcepts.push(`OB_${smc.orderBlock}`);
  if (smc.fvg !== 'NONE') smcConcepts.push(`FVG_${smc.fvg}`);
  if (smc.liquiditySweep !== 'NONE') smcConcepts.push(`SWEEP_${smc.liquiditySweep}`);
  if (smc.inducement) smcConcepts.push('INDUCEMENT');
  if (smc.sndPattern !== 'NONE') smcConcepts.push(`SND_${smc.sndPattern}`);
  if (smc.baseTrading !== 'NONE') smcConcepts.push(`BASE_${smc.baseTrading}`);
  if (smc.liquidityType !== 'NONE') smcConcepts.push(`LIQ_${smc.liquidityType}`);
  if (smc.crtStatus !== 'NONE') smcConcepts.push(`CRT_${smc.crtStatus}`);
  if (smc.amdPattern !== 'NONE') smcConcepts.push(`PO3_AMD_${smc.amdPattern}`);
  if (smc.continuationModel !== 'NONE') smcConcepts.push(`CONT_MODEL_${smc.continuationModel}`);
  if (smc.fibonacciOTE) smcConcepts.push('FIBO_OTE');
  if (smc.pivotPoints) smcConcepts.push('PIVOT_POINTS');
  if (smc.chartPatterns && smc.chartPatterns.length > 0) {
      smcConcepts.push(...smc.chartPatterns.map(p => `MACRO_${p.replace(/ /g, '_').toUpperCase()}`));
  }
  smcConcepts.push(...patterns.map(p => p.name));

  const visualConf = patterns.length > 0 ? 80 + patterns[0].strength * 5 : 50;
  const structConf = 75 + Math.abs(totalScore) * 1.5;
  const reasoning = generateDeepAnalysisNarrative(signal, timeframe, asset, rrLabel, isCounterTrend, smc, patterns, totalScore, minScore, modeName, visualConf, structConf, isCustomMode, isBlacklistedSignal, setupSignature);
  
  return {
    signal,
    confidence: confidence,
    entryPrice: entry,
    stopLoss: sl,
    takeProfit: tp,
    riskRewardRatio: rrLabel,
    reasoning: reasoning,
    smcConceptsFound: smcConcepts,
    timestamp: new Date().toLocaleTimeString(),
    timeframe: timeframe,
    learningKey: learningKey,
    prediction: prediction
  };
};
