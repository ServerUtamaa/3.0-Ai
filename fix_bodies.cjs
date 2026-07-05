const fs = require('fs');
const file = 'utils/indicators.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `    const isShortBody1 = body1 < avgBody * 0.5;`;
const replacement = `    const isShortBody1 = body1 < avgBody * 0.5;
    const isLongBody2 = body2 > avgBody * 1.5;
    const isLongBody3 = body3 > avgBody * 1.5;
    const isLongBody4 = body4 > avgBody * 1.5;
    const lowerShadow2 = Math.min(c2.close, c2.open) - c2.low;
    const upperShadow2 = c2.high - Math.max(c2.close, c2.open);
    const upperShadow3 = c3.high - Math.max(c3.close, c3.open);
    const lowerShadow3 = Math.min(c3.close, c3.open) - c3.low;`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
