const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/modeName = "SWING_MINGGUAN";/g, 'modeName = "SWING MINGGUAN";');
code = code.replace(/modeName = "SWING_BULANAN";/g, 'modeName = "SWING BULANAN";');
code = code.replace(/modeName = "DAY_TRADE";/g, 'modeName = "DAY TRADE";');

// Update custom blocks to match user's explicit request
code = code.replace(/SWING \(3-7 HARI\)/g, 'SWING MINGGUAN');
code = code.replace(/SWING \(1-3 MINGGU\)/g, 'SWING BULANAN');
code = code.replace(/SWING MINGGUAN \(1-2 MINGGU\)/g, 'SWING MINGGUAN');
code = code.replace(/SWING MINGGUAN \(2-4 MINGGU\)/g, 'SWING BULANAN');

fs.writeFileSync(file, code);
