const fs = require('fs');
const file = 'utils/indicators.ts';
let code = fs.readFileSync(file, 'utf-8');

const target = `    return result;
};`;

const replacement = `    // 16. CBDR (Central Bank Dealers Range)
    // Approximate 2 PM NY to 8 PM NY with a rolling window for shortest consolidation body range
    let cbdrLen = timeframe === 'M5' ? 72 : timeframe === 'M15' ? 24 : timeframe === 'M30' ? 12 : timeframe === 'H1' ? 6 : 0;
    
    if (cbdrLen > 0 && recentCandles.length >= cbdrLen * 4) {
        let minRange = Infinity;
        let bestCbdr = null;
        for (let i = 0; i <= (cbdrLen * 4) - cbdrLen; i++) {
            const window = recentCandles.slice(i, i + cbdrLen);
            const highestBody = Math.max(...window.map(c => Math.max(c.open, c.close)));
            const lowestBody = Math.min(...window.map(c => Math.min(c.open, c.close)));
            const range = highestBody - lowestBody;
            if (range < minRange) {
                minRange = range;
                bestCbdr = { top: highestBody, bottom: lowestBody, range };
            }
        }
        
        if (bestCbdr && bestCbdr.range > 0) {
            result.cbdr = {
                top: bestCbdr.top,
                bottom: bestCbdr.bottom,
                range: bestCbdr.range,
                up: {
                    sd1: bestCbdr.top + bestCbdr.range,
                    sd2: bestCbdr.top + bestCbdr.range * 2,
                    sd2_5: bestCbdr.top + bestCbdr.range * 2.5,
                    sd4: bestCbdr.top + bestCbdr.range * 4
                },
                down: {
                    sd1: bestCbdr.bottom - bestCbdr.range,
                    sd2: bestCbdr.bottom - bestCbdr.range * 2,
                    sd2_5: bestCbdr.bottom - bestCbdr.range * 2.5,
                    sd4: bestCbdr.bottom - bestCbdr.range * 4
                },
                isActive: true
            };
        }
    }

    return result;
};`;

code = code.replace(target, replacement);

fs.writeFileSync(file, code);
