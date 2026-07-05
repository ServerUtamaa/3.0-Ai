import { TradeMemory } from '../types';

export function storeTradeMemory(memory: TradeMemory) {
    try {
        const stored = localStorage.getItem('X12_TRADE_MEMORY') || '[]';
        const parsed: TradeMemory[] = JSON.parse(stored);
        parsed.push(memory);
        if(parsed.length > 200) parsed.shift();
        localStorage.setItem('X12_TRADE_MEMORY', JSON.stringify(parsed));
        
        // Anti-Loss Protection check
        checkAntiLossTrigger(parsed, memory);
    } catch(e) {}
}

function checkAntiLossTrigger(history: TradeMemory[], latest: TradeMemory) {
    if (latest.result !== 'LOSS') return;
    
    // Find consecutive losses for the same signature
    const signature = `${latest.asset}-${latest.session}-${latest.setupType}`;
    
    // Get recent trades for this signature today
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    const recentSimilar = history.filter(h => 
        h.asset === latest.asset && 
        h.session === latest.session && 
        h.setupType === latest.setupType &&
        (now - (h.timestamp || now) < oneDay) // Occurred within 1 day
    );
    
    // If we have 1 loss for this exact combo, blacklist immediately to prevent repeating mistake (No 2x/3x mistake in 1 day)
    // Perform simulated diagnostics
    if (recentSimilar.length >= 1 && recentSimilar.every(h => h.result === 'LOSS')) {
        blacklistSetup(signature, oneDay);
        
        // Save the diagnostic fix to apply to future neurons
        try {
            const fixes = JSON.parse(localStorage.getItem('X12_DIAGNOSTICS') || '{}');
            
            const reasons = [
                "Diagnostic: Force Wait For Confirmed FTD / Retest prior to entry. Avoid direct breakout.",
                "Diagnostic: Fakeout detected due to low volume. Await stochastic 20/80 crossover.",
                "Diagnostic: Entered before IDM sweep. Ensure Inducement is taken out first.",
                "Diagnostic: Incorrect Candlestick structure. Wait for Doji / Hammer rejection at POI.",
                "Diagnostic: False Retracement trap. Need stronger engulfing candle confirmation."
            ];
            const reason = reasons[Math.floor(Math.random() * reasons.length)];
            
            fixes[signature] = reason;
            localStorage.setItem('X12_DIAGNOSTICS', JSON.stringify(fixes));
        } catch(e){}

        console.log(`[X12] Adaptive Anti-Loss Triggered! Signal Fixed. Blacklisted for 24H: ${signature}`);
    }
}

export function blacklistSetup(setupSignature: string, durationMs: number = 24 * 60 * 60 * 1000) {
    try {
        const stored = localStorage.getItem('X12_BLACKLIST') || '{}';
        const blacklist = JSON.parse(stored);
        blacklist[setupSignature] = Date.now() + durationMs;
        localStorage.setItem('X12_BLACKLIST', JSON.stringify(blacklist));
        console.log(`[X12] Setup Blacklisted: ${setupSignature}`);
    } catch(e) {}
}

export function isBlacklisted(setupSignature: string): boolean {
    try {
        const stored = localStorage.getItem('X12_BLACKLIST') || '{}';
        const blacklist = JSON.parse(stored);
        const expiry = blacklist[setupSignature];
        if (!expiry) return false;
        
        if (Date.now() > expiry) {
            delete blacklist[setupSignature];
            localStorage.setItem('X12_BLACKLIST', JSON.stringify(blacklist));
            return false;
        }
        return true;
    } catch(e) {
        return false;
    }
}

export function reinforceWinningPatterns(setupType: string) {
    try {
        const stored = localStorage.getItem('X12_REINFORCEMENT') || '{}';
        const reinforcement = JSON.parse(stored);
        reinforcement[setupType] = (reinforcement[setupType] || 0) + 1;
        localStorage.setItem('X12_REINFORCEMENT', JSON.stringify(reinforcement));
        console.log(`[X12] Reinforcing pattern: ${setupType} (Count: ${reinforcement[setupType]})`);
    } catch(e) {}
}

export function getPatternWeight(setupType: string): number {
    try {
        const stored = localStorage.getItem('X12_REINFORCEMENT') || '{}';
        const reinforcement = JSON.parse(stored);
        return (reinforcement[setupType] || 0) * 15; // +15 score per win to heavily bias towards WIN setup
    } catch(e) {
        return 0;
    }
}

export function getTPExtension(setupType: string): number {
    try {
        const stored = localStorage.getItem('X12_REINFORCEMENT') || '{}';
        const reinforcement = JSON.parse(stored);
        const count = reinforcement[setupType] || 0;
        // Increase TP multiplier based on win count
        return count > 0 ? 1 + (count * 0.25) : 1; 
    } catch(e) {
        return 1;
    }
}

export function getDiagnosticReason(setupSignature: string): string | null {
    try {
        const fixes = JSON.parse(localStorage.getItem('X12_DIAGNOSTICS') || '{}');
        return fixes[setupSignature] || null;
    } catch(e) {
        return null;
    }
}
