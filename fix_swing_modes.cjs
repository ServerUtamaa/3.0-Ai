const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/modeName = "SWING MINGGUAN"; }/g, 'modeName = "SWING (3-7 HARI)"; }');
code = code.replace(/modeName = "SWING BULANAN"; }/g, 'modeName = "SWING (1-3 MINGGU)"; }');

fs.writeFileSync(file, code);
