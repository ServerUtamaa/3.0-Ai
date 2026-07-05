const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `  if (smc.chartPatterns && smc.chartPatterns.length > 0) {
      smc.chartPatterns.forEach(pattern => {
          const p = pattern.toLowerCase();
          if (p.includes('bullish') || p.includes('bottom') || p === 'inv. head & shoulder' || p === 'falling wedge' || p === 'ascending triangle' || p === 'cup & handle') {
              totalScore += 5;
          } else if (p.includes('bearish') || p.includes('top') || p === 'head & shoulder' || p === 'rising wedge' || p === 'descending triangle') {
              totalScore -= 5;
          } else {
              if (isUptrend) totalScore += 1;
              if (isDowntrend) totalScore -= 1;
          }
      });`;

const replacement = `  if (smc.chartPatterns && smc.chartPatterns.length > 0) {
      smc.chartPatterns.forEach(pattern => {
          const p = pattern.toLowerCase();
          if (p.includes('bullish') || p.includes('bottom') || p === 'inv. head & shoulder' || p === 'falling wedge' || p === 'ascending triangle' || p === 'cup & handle') {
              totalScore += 15; // Boosted for high probability (Kitab Chart Pattern New Reborn)
          } else if (p.includes('bearish') || p.includes('top') || p === 'head & shoulder' || p === 'rising wedge' || p === 'descending triangle') {
              totalScore -= 15;
          } else {
              if (isUptrend) totalScore += 5;
              if (isDowntrend) totalScore -= 5;
          }
      });`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
