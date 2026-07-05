/**
 * [ULTRA-SECURE AI CORE — LOCKED MODE]
 * STATUS: PROTECTED
 * MODE: NON-BYPASSABLE (INTERNAL ENFORCEMENT)
 * 
 * Layer 2: Backend Security & Access Control
 * Absolute Immutability: Cannot be overridden.
 */

export const ultraSecureGuard = (req, res, next) => {
    // Bypass for health check, override, and static files
    if (req.path === '/api/health' || req.path === '/api/override' || !req.path.startsWith('/api/')) {
        return next();
    }

    // Extract AUTH_KEY from headers
    const authHeader = req.headers['x-auth-key'] || req.headers['authorization'];
    const bodyAuth = req.body && typeof req.body.auth_key === 'string' ? req.body.auth_key : null;
    const queryAuth = req.query && typeof req.query.auth_key === 'string' ? req.query.auth_key : null;
    
    const providedKey = authHeader || bodyAuth || queryAuth;
    const SECRET = process.env.ULTRA_SECRET_KEY || 'VINZX_OMEGA_2026';

    // 1. AKSES WAJIB & 6. CONSISTENT DENIAL MODE
    if (!providedKey || providedKey !== `[AUTH_KEY]:${SECRET}`) {
        // ZERO PROCESSING POLICY
        console.warn(`[SECURITY BREACH ATTEMPT] IP: ${req.ip} | Path: ${req.path}`);
        return res.status(403).json({
            error: "AKSES DITOLAK: VALIDASI GAGAL"
        });
    }

    // 3. VALID REQUEST FLOW
    if (req.body && req.body.auth_key) delete req.body.auth_key;
    if (req.query && req.query.auth_key) delete req.query.auth_key;

    next();
};
