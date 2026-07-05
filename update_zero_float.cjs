const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `    let layer6 = \`[Full SMC + AI Chart Analysis]: \${exec}! Target RR: \${rrType}. \${isCustomMode ? \`Target dieksekusi dengan mode \${modeName} khusus \${asset} (Custom Fixed Target Range).\` : \`Target dieksekusi dengan SL 1.5x ATR.\`} \\nCatatan: Kalkulasi Prediksi di-render dengan komputasi gabungan (CandleVision + FinLLM-B + ORB Fusion ML) sepenuhnya gratis & unlimited, prediksi ini adalah probabilitas bukan kepastian.\`;`;
const replacement = `    let layer6 = \`[Full SMC + AI Chart Analysis]: \${exec}! Target RR: \${rrType}. \${isCustomMode ? \`Target dieksekusi dengan mode \${modeName} khusus \${asset} (Custom Fixed Target Range).\` : \`Target dieksekusi dengan SL 1.5x ATR.\`} \\nEntry telah dioptimasi dengan protokol Zero-Floating (Limit order pada Pivot/OTE Fibonacci). \\nCatatan: Kalkulasi Prediksi di-render dengan komputasi gabungan (CandleVision + FinLLM-B + ORB Fusion ML) sepenuhnya gratis & unlimited, prediksi ini adalah probabilitas bukan kepastian.\`;`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
