const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `    let setupModel = "Netral/Menunggu Area Institusi";
    if (totalScore > 0) {`;

const replacement = `    let setupModel = "Netral/Menunggu Area Institusi";
    
    // Inject WinWorld Advanced SMC Entry Schemes names
    if (smc.advancedEntryMode !== 'NONE') {
        if (smc.advancedEntryMode === 'SCHEME_1') setupModel = "Advanced Entry Scheme #1 (CHoCH + IDM + OB)";
        else if (smc.advancedEntryMode === 'SCHEME_2') setupModel = "Advanced Entry Scheme #2 (IFC Sweep Entry)";
        else if (smc.advancedEntryMode === 'SCHEME_3') setupModel = "Advanced Entry Scheme #3 (Continuation BOS + IDM)";
        else if (smc.advancedEntryMode === 'SCHEME_4') setupModel = "Advanced Entry Scheme #4 (Instant IFC POI Entry)";
        else if (smc.advancedEntryMode === 'SCHEME_5_SMT_WARNING') setupModel = "⚠️ SMT WARNING (Smart Money Trap)";
        else if (smc.advancedEntryMode === 'SCHEME_8') setupModel = "Advanced Entry Scheme #8 (Valid SMT via IFC Sweep)";
    }
    else if (totalScore > 0) {`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
