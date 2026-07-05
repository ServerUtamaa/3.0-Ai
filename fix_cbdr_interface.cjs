const fs = require('fs');
const file = 'utils/indicators.ts';
let code = fs.readFileSync(file, 'utf-8');

let target = `    quarterlyTheory: 'AMDX_BULLISH' | 'AMDX_BEARISH' | 'XAMD_BULLISH' | 'XAMD_BEARISH' | 'NONE';`;
let replacement = `    quarterlyTheory: 'AMDX_BULLISH' | 'AMDX_BEARISH' | 'XAMD_BULLISH' | 'XAMD_BEARISH' | 'NONE';
    cbdr: { top: number, bottom: number, range: number, sd1: number, sd2: number, sd2_5: number, sd4: number, isActive: boolean } | null;`;

code = code.replace(target, replacement);

target = `        quarterlyTheory: 'NONE',`;
replacement = `        quarterlyTheory: 'NONE',
        cbdr: null,`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
