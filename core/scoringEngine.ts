interface ScoreInput {
    structureScore: number;
    liquidityScore: number;
    volumeScore: number;
    momentumScore: number;
    mtfScore: number;
    sessionScore: number;
    patternWeight?: number;
    pairBehaviorScore?: number;
    isBlacklisted?: boolean;
}

export interface AdvancedScoreResult {
    totalScore: number;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'NO TRADE';
    isTradeable: boolean;
    breakdown: {
        trend: number;
        volume: number;
        pattern: number;
        divergence: number;
        emaConfluence: number;
        session: number;
    };
    floatingRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function calculateSetupScore(input: ScoreInput): AdvancedScoreResult {
    // Confidence formula based on advanced SMC & RL Blueprint
    const structure = input.structureScore * 0.20;
    const liquidity = input.liquidityScore * 0.25; // Massive weight on liquidity
    const session = input.sessionScore * 0.15;
    const mtf = input.mtfScore * 0.15;
    const pattern = (input.patternWeight || 0); // Directly added to boost winning patterns
    
    // Add raw score components and bound it to 100
    let rawBase = structure + liquidity + session + mtf + (input.volumeScore * 0.10) + (input.momentumScore * 0.15);
    
    if (input.isBlacklisted) {
        rawBase -= 50; // Massively penalize blacklisted setups
    }
    
    const totalScore = Math.min(Math.max((rawBase + pattern), 0), 100);

    let grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'NO TRADE' = 'NO TRADE';
    let isTradeable = false;
    let floatingRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';

    // Stricter Thresholds for Zero Floating
    if (totalScore >= 95) {
        grade = 'A+';
        isTradeable = true;
        floatingRisk = 'LOW';
    } else if (totalScore >= 88) {
        grade = 'A';
        isTradeable = true;
        floatingRisk = 'LOW';
    } else if (totalScore >= 80) {
        grade = 'B+';
        isTradeable = true;
        floatingRisk = 'MEDIUM';
    } else if (totalScore >= 70) {
        grade = 'B';
        isTradeable = true;
        floatingRisk = 'MEDIUM';
    } else if (totalScore >= 60) {
        grade = 'C';
        isTradeable = false; // Filtered out
    } else if (input.isBlacklisted) {
        grade = 'NO TRADE';
        isTradeable = false;
        floatingRisk = 'HIGH';
    }

    return {
        totalScore,
        grade,
        isTradeable,
        breakdown: { trend: structure, volume: input.volumeScore, pattern, divergence: input.momentumScore, emaConfluence: mtf, session: session },
        floatingRisk
    };
}
