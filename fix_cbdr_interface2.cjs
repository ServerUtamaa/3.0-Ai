const fs = require('fs');
const file = 'utils/indicators.ts';
let code = fs.readFileSync(file, 'utf-8');

let target = `    cbdr: { top: number, bottom: number, range: number, sd1: number, sd2: number, sd2_5: number, sd4: number, isActive: boolean } | null;`;
let replacement = `    cbdr: { top: number, bottom: number, range: number, up: { sd1: number, sd2: number, sd2_5: number, sd4: number }, down: { sd1: number, sd2: number, sd2_5: number, sd4: number }, isActive: boolean } | null;`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
