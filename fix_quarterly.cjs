const fs = require('fs');
const file = 'utils/indicators.ts';
let code = fs.readFileSync(file, 'utf-8');

let target = `    amdPattern: 'BULLISH' | 'BEARISH' | 'NONE';`;
let replacement = `    amdPattern: 'BULLISH' | 'BEARISH' | 'NONE';
    quarterlyTheory: 'AMDX_BULLISH' | 'AMDX_BEARISH' | 'XAMD_BULLISH' | 'XAMD_BEARISH' | 'NONE';`;
code = code.replace(target, replacement);

target = `        amdPattern: 'NONE',`;
replacement = `        amdPattern: 'NONE',
        quarterlyTheory: 'NONE',`;
code = code.replace(target, replacement);

target = `    // 15. SMC Continuation Model (Type 1 to 13)`;
replacement = `    // 14.5 QUARTERLY THEORY (AMDX / XAMD)
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

    // 15. SMC Continuation Model (Type 1 to 13)`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
