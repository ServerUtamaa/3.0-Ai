const fs = require('fs');
const file = 'utils/indicators.ts';
let code = fs.readFileSync(file, 'utf-8');

let target = `    continuationModel: 'TYPE_1_BULLISH' | 'TYPE_1_BEARISH' | 'TYPE_2_BULLISH' | 'TYPE_2_BEARISH' | 'TYPE_3_BULLISH' | 'TYPE_3_BEARISH' | 'TYPE_4_BULLISH' | 'TYPE_4_BEARISH' | 'TYPE_5_BULLISH' | 'TYPE_5_BEARISH' | 'TYPE_6_BULLISH' | 'TYPE_6_BEARISH' | 'TYPE_7_BULLISH' | 'TYPE_7_BEARISH' | 'TYPE_8_BULLISH' | 'TYPE_8_BEARISH' | 'TYPE_9_BULLISH' | 'TYPE_9_BEARISH' | 'TYPE_10_BULLISH' | 'TYPE_10_BEARISH' | 'TYPE_11_BULLISH' | 'TYPE_11_BEARISH' | 'TYPE_12_BULLISH' | 'TYPE_12_BEARISH' | 'TYPE_13_BULLISH' | 'TYPE_13_BEARISH' | 'TYPE_14_BULLISH' | 'TYPE_14_BEARISH' | 'TYPE_15_BULLISH' | 'TYPE_15_BEARISH' | 'NONE';`;
let replacement = `    continuationModel: 'TYPE_1_BULLISH' | 'TYPE_1_BEARISH' | 'TYPE_2_BULLISH' | 'TYPE_2_BEARISH' | 'TYPE_3_BULLISH' | 'TYPE_3_BEARISH' | 'TYPE_4_BULLISH' | 'TYPE_4_BEARISH' | 'TYPE_5_BULLISH' | 'TYPE_5_BEARISH' | 'TYPE_6_BULLISH' | 'TYPE_6_BEARISH' | 'TYPE_7_BULLISH' | 'TYPE_7_BEARISH' | 'TYPE_8_BULLISH' | 'TYPE_8_BEARISH' | 'TYPE_9_BULLISH' | 'TYPE_9_BEARISH' | 'TYPE_10_BULLISH' | 'TYPE_10_BEARISH' | 'TYPE_11_BULLISH' | 'TYPE_11_BEARISH' | 'TYPE_12_BULLISH' | 'TYPE_12_BEARISH' | 'TYPE_13_BULLISH' | 'TYPE_13_BEARISH' | 'TYPE_14_BULLISH' | 'TYPE_14_BEARISH' | 'TYPE_15_BULLISH' | 'TYPE_15_BEARISH' | 'NONE';
    advancedEntryMode: 'SCHEME_1' | 'SCHEME_2' | 'SCHEME_3' | 'SCHEME_4' | 'SCHEME_5_SMT_WARNING' | 'SCHEME_6' | 'SCHEME_7' | 'SCHEME_8' | 'NONE';`;

code = code.replace(target, replacement);

target = `        continuationModel: 'NONE'`;
replacement = `        continuationModel: 'NONE',
        advancedEntryMode: 'NONE'`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
