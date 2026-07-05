const fs = require('fs');
const file = 'utils/indicators.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `    return result;
};`;

const replacement = `    // 17. Advanced SMC Entry Points (WinWorld)
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

    return result;
};`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
