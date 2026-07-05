const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `    // Inject WinWorld Advanced SMC Entry Schemes names
    if (smc.advancedEntryMode !== 'NONE') {`;

const replacement = `    // Inject Supply & Demand Price Action
    if (smc.quasimodo !== 'NONE') {
        setupModel = \`Quasimodo (QM) \${smc.quasimodo === 'BULLISH' ? 'Buy' : 'Sell'} Setup\`;
    } else if (smc.compression !== 'NONE') {
        setupModel = \`Compression (Approach) towards \${smc.compression === 'BULLISH' ? 'Supply' : 'Demand'}\`;
    } else if (smc.ftr !== 'NONE' || smc.flagLimit !== 'NONE') {
        setupModel = \`FTR (Fail To Return) / Flag Limit \${smc.ftr === 'BULLISH' ? 'Buy' : 'Sell'} Setup\`;
    }
    // Inject WinWorld Advanced SMC Entry Schemes names
    else if (smc.advancedEntryMode !== 'NONE') {`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
