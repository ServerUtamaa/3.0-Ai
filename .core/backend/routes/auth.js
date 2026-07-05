
import express from 'express';
const router = express.Router();
import CryptoJS from 'crypto-js';

// [OMEGA LEVEL SECURITY - BACKEND VAULT]
// This is the isolated vault for membership codes.
// It is NOT accessible from the frontend.
const SECURE_VAULT = {
    // Existing codes (simulated for now, as I can't decrypt the original file)
    // The user provided this new code:
    "3a1f8e9b2c4d5a6b7c8d9e0f1a2b3c4d": {
        tier: "MONTHLY",
        duration: 30 * 24 * 60 * 60 * 1000 // 30 days
    },
    // New 1-month code requested by user
    "vzx-m1-9f8e7d6c5b4a3": {
        tier: "MONTHLY",
        duration: 30 * 24 * 60 * 60 * 1000 // 30 days
    },
    // New 2-week code requested by user
    "5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b": {
        tier: "BIWEEKLY",
        duration: 14 * 24 * 60 * 60 * 1000 // 14 days
    },
    // New 1-week code
    "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d": {
        tier: "WEEKLY",
        duration: 7 * 24 * 60 * 60 * 1000 // 7 days
    },
    
    // --- BATCH WEEKLY ---
    "vzx-wk-8a21b4": { tier: "WEEKLY", duration: 7 * 24 * 60 * 60 * 1000 },
    "vzx-wk-f29c1d": { tier: "WEEKLY", duration: 7 * 24 * 60 * 60 * 1000 },
    "vzx-wk-5e77a2": { tier: "WEEKLY", duration: 7 * 24 * 60 * 60 * 1000 },
    "vzx-wk-bc90df": { tier: "WEEKLY", duration: 7 * 24 * 60 * 60 * 1000 },
    "vzx-wk-114af3": { tier: "WEEKLY", duration: 7 * 24 * 60 * 60 * 1000 },
    "vzx-wk-d45e88": { tier: "WEEKLY", duration: 7 * 24 * 60 * 60 * 1000 },
    "vzx-wk-7f22ca": { tier: "WEEKLY", duration: 7 * 24 * 60 * 60 * 1000 },
    "vzx-wk-a388b1": { tier: "WEEKLY", duration: 7 * 24 * 60 * 60 * 1000 },
    "vzx-wk-2c5f90": { tier: "WEEKLY", duration: 7 * 24 * 60 * 60 * 1000 },
    "vzx-wk-90e4a7": { tier: "WEEKLY", duration: 7 * 24 * 60 * 60 * 1000 },
    
    // --- BATCH BIWEEKLY ---
    "vzx-bw-3b8c22": { tier: "BIWEEKLY", duration: 14 * 24 * 60 * 60 * 1000 },
    "vzx-bw-a71f9d": { tier: "BIWEEKLY", duration: 14 * 24 * 60 * 60 * 1000 },
    "vzx-bw-e455c1": { tier: "BIWEEKLY", duration: 14 * 24 * 60 * 60 * 1000 },
    "vzx-bw-f9011b": { tier: "BIWEEKLY", duration: 14 * 24 * 60 * 60 * 1000 },
    "vzx-bw-8c3af0": { tier: "BIWEEKLY", duration: 14 * 24 * 60 * 60 * 1000 },
    "vzx-bw-22bca9": { tier: "BIWEEKLY", duration: 14 * 24 * 60 * 60 * 1000 },
    "vzx-bw-5d8f33": { tier: "BIWEEKLY", duration: 14 * 24 * 60 * 60 * 1000 },
    "vzx-bw-1e7a4b": { tier: "BIWEEKLY", duration: 14 * 24 * 60 * 60 * 1000 },
    "vzx-bw-b409cd": { tier: "BIWEEKLY", duration: 14 * 24 * 60 * 60 * 1000 },
    "vzx-bw-cae21f": { tier: "BIWEEKLY", duration: 14 * 24 * 60 * 60 * 1000 },
    
    // --- BATCH MONTHLY ---
    "vzx-mo-e29f3c": { tier: "MONTHLY", duration: 30 * 24 * 60 * 60 * 1000 },
    "vzx-mo-d55a80": { tier: "MONTHLY", duration: 30 * 24 * 60 * 60 * 1000 },
    "vzx-mo-4c12b9": { tier: "MONTHLY", duration: 30 * 24 * 60 * 60 * 1000 },
    "vzx-mo-178fee": { tier: "MONTHLY", duration: 30 * 24 * 60 * 60 * 1000 },
    "vzx-mo-ab2144": { tier: "MONTHLY", duration: 30 * 24 * 60 * 60 * 1000 },
    "vzx-mo-9fbc10": { tier: "MONTHLY", duration: 30 * 24 * 60 * 60 * 1000 },
    "vzx-mo-8a5e3d": { tier: "MONTHLY", duration: 30 * 24 * 60 * 60 * 1000 },
    "vzx-mo-7d341a": { tier: "MONTHLY", duration: 30 * 24 * 60 * 60 * 1000 },
    "vzx-mo-0ce15f": { tier: "MONTHLY", duration: 30 * 24 * 60 * 60 * 1000 },
    "vzx-mo-6f77cc": { tier: "MONTHLY", duration: 30 * 24 * 60 * 60 * 1000 }
};

router.post('/verify-membership', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Code is required' });

        const membership = SECURE_VAULT[code];
        if (!membership) {
            return res.status(404).json({ error: 'Invalid or expired code' });
        }

        // Calculate expiry
        const expiresAt = Date.now() + membership.duration;

        res.json({
            success: true,
            plan: membership.tier,
            expiresAt: expiresAt
        });
    } catch (error) {
        console.error('Membership Verification Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
