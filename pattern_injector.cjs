const fs = require('fs');
const file = 'utils/indicators.ts';
let code = fs.readFileSync(file, 'utf-8');

const injection = `
    // Bullish Abandoned Baby
    if (isBearish2 && isLongBody2 && isDoji1 && c1.high < c2.low && isBullish && isLongBody && c.low > c1.high) {
        patterns.push({ name: 'Bullish Abandoned Baby', type: 'BULLISH', strength: 4 });
    }
    // Bearish Abandoned Baby
    if (isBullish2 && isLongBody2 && isDoji1 && c1.low > c2.high && isBearish && isLongBody && c.high < c1.low) {
        patterns.push({ name: 'Bearish Abandoned Baby', type: 'BEARISH', strength: 4 });
    }
    // Rising Three Methods
    if (isBullish4 && isLongBody4 && isBearish3 && isBearish2 && isBearish1 && 
        c1.close > c4.open && c3.high < c4.close && 
        isBullish && isLongBody && c.close > c4.close) {
        patterns.push({ name: 'Rising Three Methods', type: 'BULLISH', strength: 3 });
    }
    // Falling Three Methods
    if (isBearish4 && isLongBody4 && isBullish3 && isBullish2 && isBullish1 && 
        c1.close < c4.open && c3.low > c4.close && 
        isBearish && isLongBody && c.close < c4.close) {
        patterns.push({ name: 'Falling Three Methods', type: 'BEARISH', strength: 3 });
    }
    // Advance Block
    if (isUptrend && isBullish2 && isLongBody2 && isBullish1 && isBullish &&
        body1 < body2 && body < body1 && upperShadow1 > body1 * 0.5 && upperShadow > body * 0.5) {
        patterns.push({ name: 'Advance Block', type: 'BEARISH', strength: 2 });
    }
    // Bullish Three Stars in the South
    if (isBearish2 && isLongBody2 && lowerShadow2 > body2 &&
        isBearish1 && c1.open > c2.close && c1.close < c2.open && c1.low > c2.low && lowerShadow1 > body1 &&
        isBearish && isShortBody && c.low > c1.low && c.high < c1.high) {
        patterns.push({ name: 'Bullish Three Stars in the South', type: 'BULLISH', strength: 3 });
    }
    // Bullish Concealing Baby Swallow
    if (isBearish3 && isLongBody3 && isBearish2 && isLongBody2 &&
        isBearish1 && isShortBody1 && c1.open < c2.close && c1.high > c2.close && 
        isBearish && c.open > c1.high && c.close < c1.low) {
        patterns.push({ name: 'Bullish Concealing Baby Swallow', type: 'BULLISH', strength: 4 });
    }
    // Bullish Ladder Bottom
    if (isBearish4 && isBearish3 && isBearish2 && c3.close < c4.close && c2.close < c3.close &&
        isBearish1 && c1.open > c2.close && c1.close < c2.close && upperShadow1 > body1 &&
        isBullish && isLongBody && c.open > c1.open) {
        patterns.push({ name: 'Bullish Ladder Bottom', type: 'BULLISH', strength: 3 });
    }
    // Meeting Line Bullish
    if (isBearish1 && isLongBody1 && isBullish && isLongBody && Math.abs(c.close - c1.close) < body * 0.05) {
        patterns.push({ name: 'Bullish Meeting Line', type: 'BULLISH', strength: 2 });
    }
    // Meeting Line Bearish
    if (isBullish1 && isLongBody1 && isBearish && isLongBody && Math.abs(c.close - c1.close) < body * 0.05) {
        patterns.push({ name: 'Bearish Meeting Line', type: 'BEARISH', strength: 2 });
    }
    // On Neck Line
    if (isBearish1 && isLongBody1 && isBullish && isShortBody && c.open < c1.low && Math.abs(c.close - c1.low) < body * 0.05) {
        patterns.push({ name: 'On Neck Line', type: 'BEARISH', strength: 2 }); 
    }
    // In Neck Line
    if (isBearish1 && isLongBody1 && isBullish && isShortBody && c.open < c1.low && c.close > c1.low && c.close < c1.close) {
        patterns.push({ name: 'In Neck Line', type: 'BEARISH', strength: 2 }); 
    }
    // Bullish Squeeze Alert
    if (isDowntrend && isBearish2 && c1.high < c2.high && c1.low > c2.low && c.high < c1.high && c.low > c1.low) {
        patterns.push({ name: 'Bullish Squeeze Alert', type: 'BULLISH', strength: 3 });
    }
`;

code = code.replace('    return patterns;', injection + '\n    return patterns;');
fs.writeFileSync(file, code);
