const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `  // FVG + Inducement (IDM) Extreme Zero Floating Setup
  if (smc.fvg === 'BULLISH' && smc.inducement) totalScore += 5; // Discount FVG + IDM sweep
  if (smc.fvg === 'BEARISH' && smc.inducement) totalScore -= 5; // Premium FVG + IDM sweep`;

const replacement = `  // FVG + Inducement (IDM) Extreme Zero Floating Setup
  if (smc.fvg === 'BULLISH' && smc.inducement) totalScore += 5; // Discount FVG + IDM sweep
  if (smc.fvg === 'BEARISH' && smc.inducement) totalScore -= 5; // Premium FVG + IDM sweep
  
  // OBIIM (Order Block + Imbalance + Inducement) & Premium/Discount Logic from PDF
  if (smc.orderBlock === 'BULLISH' && smc.fvg === 'BULLISH' && smc.inducement) {
      // Must be in Discount Area for Buy
      if (smc.fibonacciOTE && current.close < smc.fibonacciOTE.level0_5) {
          totalScore += 10; // Extra boost for OBIIM in Discount
      } else {
          totalScore += 4;
      }
  }
  if (smc.orderBlock === 'BEARISH' && smc.fvg === 'BEARISH' && smc.inducement) {
      // Must be in Premium Area for Sell
      if (smc.fibonacciOTE && current.close > smc.fibonacciOTE.level0_5) {
          totalScore -= 10; // Extra boost for OBIIM in Premium
      } else {
          totalScore -= 4;
      }
  }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
