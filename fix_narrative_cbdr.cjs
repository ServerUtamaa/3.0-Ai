const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `    let exec = \`PROBABILITAS EKSEKUSI \${signal} TINGGI\`;
    let layer6 = \`[Full SMC + AI Chart Analysis]: \${exec}! Target RR: \${rrType}. \${isCustomMode ? \`Target dieksekusi dengan mode \${modeName} khusus \${asset} (Custom Fixed Target Range).\` : \`Target dieksekusi dengan SL 1.5x ATR.\`} \\nEntry telah dioptimasi dengan protokol Zero-Floating (Limit order pada Pivot/OTE Fibonacci). \\nCatatan: Kalkulasi Prediksi di-render dengan komputasi gabungan (CandleVision + FinLLM-B + ORB Fusion ML) sepenuhnya gratis & unlimited, prediksi ini adalah probabilitas bukan kepastian.\`;`;

const replacement = `    let exec = \`PROBABILITAS EKSEKUSI \${signal} TINGGI\`;
    let cbdrProjection = smc.cbdr?.isActive ? \`\\n[CBDR Analysis]: Central Bank Dealers Range terdeteksi (Range \${smc.cbdr.range.toFixed(2)} pts). Standard Deviation (SD) memproyeksikan \${signal === 'BUY' ? 'Target Atas Harian pada' : 'Target Bawah Harian pada'} SD -2 / -2.5.\` : '';
    let layer6 = \`[Full SMC + AI Chart Analysis]: \${exec}! Target RR: \${rrType}. \${isCustomMode ? \`Target dieksekusi dengan mode \${modeName} khusus \${asset} (Custom Fixed Target Range).\` : \`Target dieksekusi dengan SL 1.5x ATR.\`} \${cbdrProjection}\\nEntry telah dioptimasi dengan protokol Zero-Floating (Limit order pada Pivot/OTE Fibonacci). \\nCatatan: Kalkulasi Prediksi di-render dengan komputasi gabungan (CandleVision + FinLLM-B + ORB Fusion ML) sepenuhnya gratis & unlimited, prediksi ini adalah probabilitas bukan kepastian.\`;`;

code = code.replace(target, replacement);

const cbdrScoreTarget = `  // ICT Quarterly Theory (AMDX / XAMD)`;
const cbdrScoreReplacement = `  // CBDR (Central Bank Dealers Range) Alignment
  if (smc.cbdr?.isActive) {
      const cbdr = smc.cbdr;
      if (signal === 'BUY') {
          // If current price is below CBDR Top, it means we haven't reached SD targets yet.
          if (current.close < cbdr.up.sd2) totalScore += 3;
      } else if (signal === 'SELL') {
          // If current price is above CBDR Bottom, we haven't reached SD targets yet.
          if (current.close > cbdr.down.sd2) totalScore += 3;
      }
  }

  // ICT Quarterly Theory (AMDX / XAMD)`;
code = code.replace(cbdrScoreTarget, cbdrScoreReplacement);

fs.writeFileSync(file, code);
