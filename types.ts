
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export enum Asset {
  // CRYPTO (BINANCE REAL-TIME)
  BTCUSD = 'BTCUSD',
  ETHUSD = 'ETHUSD',
  SOLUSD = 'SOLUSD',
  BNBUSD = 'BNBUSD', // ADDED BNB

  // COMMODITY (METAL & OIL)
  XAUUSD = 'XAUUSD', // Gold
  XAGUSD = 'XAGUSD', // Silver
  XPTUSD = 'XPTUSD', // Platinum
  USOIL = 'USOIL',   // WTI Crude Oil
  
  // FOREX MAJORS & INDICES
  EURUSD = 'EURUSD',
  GBPUSD = 'GBPUSD',
  USDJPY = 'USDJPY',
  AUDUSD = 'AUDUSD',
  USDCHF = 'USDCHF',
  NZDUSD = 'NZDUSD',
  NASDAQ = 'NASDAQ', // US Tech 100

  // FOREX CROSS PAIRS
  GBPJPY = 'GBPJPY',
  EURJPY = 'EURJPY',
}

export type TimeFrame = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';

export type TradeFeedback = 'WIN' | 'LOSS' | null;

export type VoiceGender = 'MALE' | 'FEMALE';

export type UserRole = 'GUEST' | 'USER' | 'DEV' | 'PENDING';

export type MembershipTier = 'NONE' | 'BASIC' | 'WEEKLY' | 'BIWEEKLY' | 'VIP' | 'MONTHLY' | 'LIFETIME';

export interface UserSession {
    isLoggedIn: boolean;
    role: UserRole;
    username: string;
    uid?: string; // ADDED: Firebase user UID to map user's Google account
    tokens: number; // ADDED: Token System
    membershipTier?: MembershipTier; // NEW: Track UI Membership
    membershipExpiresAt?: number;    // NEW: Track UI Expiry
    deviceId?: string;               // NEW: Persistent Guest ID
}

// --- DATABASE STRUCTURE ---
export interface ExecutionRecord {
    id: string;
    asset: Asset;
    signal: 'BUY' | 'SELL';
    entry: number;
    sl: number;
    tp: number;
    status: 'WIN' | 'LOSS';
    timestamp: number;
    rr: string;
}

export interface TradeMemory {
  asset: string;
  timeframe: string;
  setupType: string;
  signal: 'BUY' | 'SELL';
  result: 'WIN' | 'LOSS';
  timestamp: number;
  confidence: number;
  session: 'ASIA' | 'LONDON' | 'NEWYORK';
  confluences: string[];
}

export interface PairBehavior {
  asset: string;
  volatilityModel: 'HIGH' | 'MEDIUM' | 'LOW';
  spreadAverage: number;
  bestSession: 'ASIA' | 'LONDON' | 'NEWYORK' | 'ALL';
  blacklistPatterns: string[];
}

export interface UserRecord {
    id: string;
    username: string;
    passwordHash: string; // Encrypted Password
    role: UserRole;
    tokens: number;
    integritySignature?: string; // NEW: ANTI-HACK SIGNATURE (HMAC)
    createdAt: number;
    lastLogin: number;
    history?: ExecutionRecord[]; // NEW: Trade History
    // NEW: MEMBERSHIP FIELDS
    membershipTier?: MembershipTier;
    membershipExpiresAt?: number;
    deviceId?: string; // NEW: Persistent Guest ID
}

export interface OtpRecord {
    username: string;
    code: string;
    expiresAt: number; // Timestamp
}

export interface AnalysisResult {
  signal: 'BUY' | 'SELL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: string;
  reasoning: string[];
  smcConceptsFound: string[];
  timestamp: string;
  timeframe: string;
  learningKey?: string;
  setupSignature?: string;
  prediction?: string; // NEW: Future prediction
  nextPricePrediction?: number; // Exact price prediction
  trendPrediction?: string; // BULLISH, BEARISH, RANGING
  drlMetrics?: {
    stateValue: number;
    advantage: number;
    buyProb: number;
    sellProb: number;
  };
}

export interface GeminiResponseSchema {
  signal: string;
  confidence: number;
  entry: number;
  sl: number;
  tp: number;
  rr: string;
  reasoning: string[];
  concepts: string[];
  prediction?: string; // NEW: Future prediction
  next_price_prediction?: number;
  trend_prediction?: string;
  drl_metrics?: {
    state_value: number;
    advantage: number;
    buy_prob: number;
    sell_prob: number;
  };
}
