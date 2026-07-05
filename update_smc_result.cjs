const fs = require('fs');
const file = 'utils/indicators.ts';
let code = fs.readFileSync(file, 'utf-8');

let target = `    advancedEntryMode: 'SCHEME_1' | 'SCHEME_2' | 'SCHEME_3' | 'SCHEME_4' | 'SCHEME_5_SMT_WARNING' | 'SCHEME_6' | 'SCHEME_7' | 'SCHEME_8' | 'NONE';
}`;
let replacement = `    advancedEntryMode: 'SCHEME_1' | 'SCHEME_2' | 'SCHEME_3' | 'SCHEME_4' | 'SCHEME_5_SMT_WARNING' | 'SCHEME_6' | 'SCHEME_7' | 'SCHEME_8' | 'NONE';
    quasimodo: 'BULLISH' | 'BEARISH' | 'NONE';
    ftr: 'BULLISH' | 'BEARISH' | 'NONE';
    flagLimit: 'BULLISH' | 'BEARISH' | 'NONE';
    compression: 'BULLISH' | 'BEARISH' | 'NONE';
}`;

code = code.replace(target, replacement);

target = `        advancedEntryMode: 'NONE'
    };`;
replacement = `        advancedEntryMode: 'NONE',
        quasimodo: 'NONE',
        ftr: 'NONE',
        flagLimit: 'NONE',
        compression: 'NONE'
    };`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
