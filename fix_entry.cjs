const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `  // 4. EXECUTION CALCULATION
  let entry = current.close;
  let sl = 0, tp = 0;`;

const replacement = `  // 4. EXECUTION CALCULATION
  let entry = current.close;
  
  // AI Zero-Floating Entry Optimization (Limit Order at POI)
  if (signal === 'BUY' && smc.fibonacciOTE && smc.fibonacciOTE.level0_618 < entry) {
      entry = smc.fibonacciOTE.level0_618;
  } else if (signal === 'SELL' && smc.fibonacciOTE && smc.fibonacciOTE.level0_618 > entry) {
      entry = smc.fibonacciOTE.level0_618;
  } else if (smc.pivotPoints) {
      const p = smc.pivotPoints;
      if (signal === 'BUY' && p.PP < entry && p.PP > current.low * 0.99) entry = p.PP;
      else if (signal === 'SELL' && p.PP > entry && p.PP < current.high * 1.01) entry = p.PP;
  }

  let sl = 0, tp = 0;`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
