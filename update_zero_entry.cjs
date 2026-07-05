const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `  // AI Zero-Floating Entry Optimization (Limit Order at POI)
  if (signal === 'BUY' && smc.fibonacciOTE && smc.fibonacciOTE.level0_618 < entry) {
      entry = smc.fibonacciOTE.level0_618;
  } else if (signal === 'SELL' && smc.fibonacciOTE && smc.fibonacciOTE.level0_618 > entry) {
      entry = smc.fibonacciOTE.level0_618;
  } else if (smc.pivotPoints) {
      const p = smc.pivotPoints;
      if (signal === 'BUY' && p.PP < entry && p.PP > current.low * 0.99) entry = p.PP;
      else if (signal === 'SELL' && p.PP > entry && p.PP < current.high * 1.01) entry = p.PP;
  }`;

const replacement = `  // AI Zero-Floating Entry Optimization (Limit Order at POI)
  if (signal === 'BUY') {
      if (smc.fibonacciOTE && smc.fibonacciOTE.level0_618 < entry && smc.fibonacciOTE.level0_618 > current.low * 0.95) {
          entry = smc.fibonacciOTE.level0_618;
      } else if (smc.orderBlock === 'BULLISH') {
          entry = Math.min(entry, prev.high); // Sniping the OB top
      } else if (smc.fvg === 'BULLISH') {
          entry = Math.min(entry, candles[candles.length - 3].high); // Sniping the FVG gap
      } else if (smc.pivotPoints && smc.pivotPoints.PP < entry && smc.pivotPoints.PP > current.low * 0.99) {
          entry = smc.pivotPoints.PP;
      }
  } else if (signal === 'SELL') {
      if (smc.fibonacciOTE && smc.fibonacciOTE.level0_618 > entry && smc.fibonacciOTE.level0_618 < current.high * 1.05) {
          entry = smc.fibonacciOTE.level0_618;
      } else if (smc.orderBlock === 'BEARISH') {
          entry = Math.max(entry, prev.low); // Sniping the OB bottom
      } else if (smc.fvg === 'BEARISH') {
          entry = Math.max(entry, candles[candles.length - 3].low); // Sniping the FVG gap
      } else if (smc.pivotPoints && smc.pivotPoints.PP > entry && smc.pivotPoints.PP < current.high * 1.01) {
          entry = smc.pivotPoints.PP;
      }
  }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
