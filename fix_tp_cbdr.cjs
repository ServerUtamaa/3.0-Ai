const fs = require('fs');
const file = 'services/localBrain.ts';
let code = fs.readFileSync(file, 'utf-8');

const targetBuy = `          if (recentSwingHigh > entry + risk * 1.5) {
              tp = entry + ((recentSwingHigh - entry) * tpExtension); // Apply tpExtension correctly
              rrLabel = \`1:\${((tp - entry)/risk).toFixed(1)}\`;
          } else {
              tp = entry + Math.max(risk * rrRatioVal, atr * 2) * tpExtension; // Apply tpExtension
          }`;

const replacementBuy = `          if (smc.cbdr?.isActive && smc.cbdr.up.sd2 > entry + risk * 1.5) {
              tp = smc.cbdr.up.sd2;
              rrLabel = \`1:\${((tp - entry)/risk).toFixed(1)}\`;
          } else if (recentSwingHigh > entry + risk * 1.5) {
              tp = entry + ((recentSwingHigh - entry) * tpExtension); // Apply tpExtension correctly
              rrLabel = \`1:\${((tp - entry)/risk).toFixed(1)}\`;
          } else {
              tp = entry + Math.max(risk * rrRatioVal, atr * 2) * tpExtension; // Apply tpExtension
          }`;
code = code.replace(targetBuy, replacementBuy);

const targetSell = `          if (recentSwingLow < entry - risk * 1.5) {
              tp = recentSwingLow * (1 / tpExtension); // Lower TP for sell (apply inverse extension to push it further down)
              // Wait, recentSwingLow is price. We want tp to be further down by tpExtension factor on the risk size.
              tp = entry - ((entry - recentSwingLow) * tpExtension);
              rrLabel = \`1:\${((entry - tp)/risk).toFixed(1)}\`;
          } else {
              tp = entry - Math.max(risk * rrRatioVal, atr * 2) * tpExtension; // Apply tpExtension
          }`;

const replacementSell = `          if (smc.cbdr?.isActive && smc.cbdr.down.sd2 < entry - risk * 1.5) {
              tp = smc.cbdr.down.sd2;
              rrLabel = \`1:\${((entry - tp)/risk).toFixed(1)}\`;
          } else if (recentSwingLow < entry - risk * 1.5) {
              tp = entry - ((entry - recentSwingLow) * tpExtension);
              rrLabel = \`1:\${((entry - tp)/risk).toFixed(1)}\`;
          } else {
              tp = entry - Math.max(risk * rrRatioVal, atr * 2) * tpExtension; // Apply tpExtension
          }`;
code = code.replace(targetSell, replacementSell);

fs.writeFileSync(file, code);
