const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

let target = `const generateDeepAnalysisNarrative = (
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
    isCustomMode: boolean = false
): string[] => {`;
let replacement = `const generateDeepAnalysisNarrative = (
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
): string[] => {`;

code = code.replace(target, replacement);

target = `    let layer5 = \`[RL (Reinforcement Learning) - THE EXPERIENCE]: Analisa real-time & probabilitas adaptif mengurangi loss rate otomatis (Targeting Zero Floating Zone). Model Rule-Based SMC aktif: \${setupModel}. Zona tervalidasi dengan ML gating rules.\`;`;
replacement = `    const diagReason = isBlacklistedSignal ? getDiagnosticReason(setupSignature) : null;
    let layer5 = \`[RL (Reinforcement Learning) - THE EXPERIENCE]: \${isBlacklistedSignal ? \`⚠️ SIGNAL DIKOREKSI OTOMATIS: \${diagReason || 'Mencegah loss berulang pada pola ini'}. Probabilitas ditingkatkan.\` : \`Analisa real-time & probabilitas adaptif mengurangi loss rate otomatis (Targeting Zero Floating Zone).\`} Model Rule-Based SMC aktif: \${setupModel}. Zona tervalidasi dengan ML gating rules.\`;`;

code = code.replace(target, replacement);

target = `  const reasoning = generateDeepAnalysisNarrative(signal, timeframe, asset, rrLabel, isCounterTrend, smc, patterns, totalScore, minScore, modeName, visualConf, structConf, isCustomMode);`;
replacement = `  const reasoning = generateDeepAnalysisNarrative(signal, timeframe, asset, rrLabel, isCounterTrend, smc, patterns, totalScore, minScore, modeName, visualConf, structConf, isCustomMode, isBlacklistedSignal, setupSignature);`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
