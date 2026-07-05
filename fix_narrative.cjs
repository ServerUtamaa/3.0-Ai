const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `    let layer2 = \`[LSTM/GRU & ORB Fusion ML - THE MEMORY]: Menganalisis time-series/urutan dari 250 candlestick sebelumnya. Market Structure & Momentum: \${smc.structure}. \${smc.choch !== 'NONE' ? \`Terjadi CHoCH \${smc.choch} (Trend Reversal).\` : smc.bos !== 'NONE' ? \`BOS \${smc.bos} terkonfirmasi (Trend Continuation).\` : 'Fase Konsolidasi.'}\`;`;
const replacement = `    let layer2 = \`[LSTM/GRU & ORB Fusion ML - THE MEMORY]: Menganalisis time-series/urutan dari 250 candlestick sebelumnya. Sesuai Metode PDF: Market Structure berada dalam kondisi \${smc.structure === 'BULLISH' ? 'UPTREND (Membentuk pola HH, HL)' : smc.structure === 'BEARISH' ? 'DOWNTREND (Membentuk pola LL, LH)' : 'SIDEWAYS (Mendatar dengan pantulan di antara rentang harga)'}. \${smc.choch !== 'NONE' ? \`Terjadi CHoCH \${smc.choch} (Trend Reversal).\` : smc.bos !== 'NONE' ? \`BOS \${smc.bos} terkonfirmasi (Trend Continuation).\` : ''}\`;`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
