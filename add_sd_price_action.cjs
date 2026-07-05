const fs = require('fs');
const file = 'utils/indicators.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `    return result;
};`;

const replacement = `    // 18. Supply & Demand Price Action Strategy (QM, FTR, Flag Limit, Compression)
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
};`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
