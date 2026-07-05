
import { UserRecord, UserRole, ExecutionRecord, MembershipTier, UserSession } from "../types";
import { getDeviceId } from "./deviceService";
import { saveDeepBackup, getDeepBackup } from "./deepStorageService";

// --- SYSTEM CONFIGURATION ---
// URL Backend (Ganti saat sudah deploy online)
const API_URL = "/api"; 

// --- CONNECTIVITY CHECK ---
export const checkServerConnection = async (): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout for snappy feel
        const res = await fetch(`${API_URL.replace('/api', '')}/`, { signal: controller.signal });
        clearTimeout(timeoutId);
        return res.ok;
    } catch (e) {
        return false; 
    }
};

const LOCAL_KEY_USERS = "vinzx_local_users";
const LOCAL_KEY_USED_CODES = "vinzx_used_membership_codes";
// KUNCI MATI: Ini mencatat kapan DETIK PERTAMA aplikasi dibuka di browser ini.
// Tidak akan berubah meskipun user dihapus.
const GENESIS_KEY = "vinzx_system_genesis_v1"; 

// --- LOCAL STORAGE ENGINE (OFFLINE CORE) ---
const getLocalUsers = (): UserRecord[] => {
    try { 
        let stored = localStorage.getItem(LOCAL_KEY_USERS);
        
        // DEEP RECOVERY: If localStorage is empty, try IndexedDB backup
        if (!stored) {
            // We can't use await here easily in a synchronous function, 
            // but we can trigger a recovery check.
            // For now, we'll rely on the fact that seedDefaultUsers will be called.
            return [];
        }
        
        const users: UserRecord[] = JSON.parse(stored);
        
        // CLEANUP OLD HISTORY (1 YEAR)
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        let modified = false;
        users.forEach(user => {
            if (user.history && user.history.length > 0) {
                const originalLength = user.history.length;
                user.history = user.history.filter(record => (now - record.timestamp) <= ONE_YEAR_MS);
                if (user.history.length !== originalLength) {
                    modified = true;
                }
            }
        });
        
        if (modified) saveLocalUsers(users);
        
        return users; 
    } catch(e) { return []; }
};

const saveLocalUsers = (users: UserRecord[]) => {
    const data = JSON.stringify(users);
    localStorage.setItem(LOCAL_KEY_USERS, data);
    // ASYNC BACKUP
    saveDeepBackup(LOCAL_KEY_USERS, data);
};

// --- RECOVERY ENGINE ---
export const performDeepRecovery = async (): Promise<boolean> => {
    const backup = await getDeepBackup(LOCAL_KEY_USERS);
    if (backup && !localStorage.getItem(LOCAL_KEY_USERS)) {
        localStorage.setItem(LOCAL_KEY_USERS, backup);
        console.log("Deep Recovery Successful: Restored User Database");
        return true;
    }
    return false;
};
const seedDefaultUsers = () => {
    const users = getLocalUsers();
    
    // 1. Ambil atau Buat Genesis Timestamp (Waktu Install Awal)
    let genesisStart = localStorage.getItem(GENESIS_KEY);
    // UPDATE: Masa pakai diubah menjadi 1 Minggu (7 Hari)
    const TRIAL_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; 
    
    if (!genesisStart) {
        // Jika baru pertama kali buka seumur hidup di browser ini
        genesisStart = Date.now().toString();
        localStorage.setItem(GENESIS_KEY, genesisStart);
    }

    // 2. Hitung Kapan HARUS Expired (Kunci Mati)
    const fixedStartTime = parseInt(genesisStart);
    const fixedExpiry = fixedStartTime + TRIAL_PERIOD_MS;
    const now = Date.now();

    // 3. Cek User 'Vinzx Family'
    const familyIndex = users.findIndex(u => u.username === 'Vinzx Family');
    
    if (familyIndex === -1) {
        // Jika user tidak ada (misal dihapus), buat baru TAPI expiration ngikutin Genesis
        users.push({
            id: 'FAMILY_MEMBER_01',
            username: 'Vinzx Family',
            passwordHash: '',
            role: 'USER',
            tokens: 0, 
            membershipTier: 'BASIC', 
            membershipExpiresAt: fixedExpiry, 
            createdAt: fixedStartTime,
            lastLogin: Date.now(),
            history: [],
            deviceId: getDeviceId() // BIND TO DEVICE
        });
    } else {
        // Jika user ada, dan membershipnya BASIC, pastikan mengikuti Genesis Time
        // Ini mencegah reset waktu saat refresh
        if (users[familyIndex].membershipTier === 'BASIC') {
             // Paksa mengikuti fixedExpiry untuk konsistensi trial
             if (!users[familyIndex].membershipExpiresAt || users[familyIndex].membershipExpiresAt === 0) {
                 users[familyIndex].membershipExpiresAt = fixedExpiry;
             }
        }
    }

    // 4. Cek User 'User01' (Demo User)
    const user01Index = users.findIndex(u => u.username === 'User01');
    
    // Hapus Vinzx_User jika ada (pembersihan dari versi sebelumnya)
    const oldUserIndex = users.findIndex(u => u.username === 'Vinzx_User');
    if (oldUserIndex !== -1) {
        users.splice(oldUserIndex, 1);
    }

    if (user01Index === -1) {
        users.push({
            id: 'USER_01_DEMO',
            username: 'User01',
            passwordHash: 'Membership_Vip_Discount40%',
            role: 'USER',
            tokens: 0,
            membershipTier: 'NONE',
            membershipExpiresAt: 0,
            createdAt: Date.now(),
            lastLogin: Date.now(),
            history: []
        });
    } else {
        // FORCE UPDATE PASSWORD: Jika user sudah ada, pastikan passwordnya benar
        users[user01Index].passwordHash = 'Membership_Vip_Discount40%';
    }

    // 5. Cek User 'System Admin' (Dev)
    const adminIndex = users.findIndex(u => u.username === 'System Admin');
    if (adminIndex === -1) {
        users.push({
            id: 'DEV_ADMIN_01',
            username: 'System Admin',
            passwordHash: 'admin_secure_key', // You can change this if needed
            role: 'DEV',
            tokens: 9999,
            membershipTier: 'VIP',
            membershipExpiresAt: 0,
            createdAt: Date.now(),
            lastLogin: Date.now(),
            history: []
        });
    }

    saveLocalUsers(users);
};

// --- NEW HELPER: PERSISTENT SESSION ---
export const saveCurrentUserSession = (session: {
    isLoggedIn: boolean;
    role: UserRole;
    username: string;
    uid?: string;
    tokens: number;
    membershipTier?: MembershipTier;
    membershipExpiresAt?: number;
}) => {
    localStorage.setItem('CURRENT_USER_SESSION', JSON.stringify(session));
};

export const clearCurrentUserSession = () => {
    localStorage.removeItem('CURRENT_USER_SESSION');
};

export const getInitialVinzxSession = (): UserSession => {
    seedDefaultUsers(); // Pastikan data ada
    const users = getLocalUsers();
    const currentDeviceId = getDeviceId();

    // 1. Check if there's a saved session in localStorage
    const savedSessionStr = localStorage.getItem('CURRENT_USER_SESSION');
    if (savedSessionStr) {
        try {
            const savedSession = JSON.parse(savedSessionStr);
            if (savedSession && savedSession.isLoggedIn) {
                // Fetch fresh data from DB to ensure membership is up to date
                const dbUser = users.find(u => u.username === savedSession.username);
                if (dbUser) {
                    const now = Date.now();
                    let finalTier = dbUser.membershipTier || 'NONE';
                    let finalExpiry = Number(dbUser.membershipExpiresAt || 0);

                    if (finalTier !== 'NONE' && finalExpiry > 0 && now > finalExpiry) {
                        finalTier = 'NONE';
                        finalExpiry = 0;
                        dbUser.membershipTier = 'NONE';
                        dbUser.membershipExpiresAt = 0;
                        const idx = users.findIndex(u => u.username === dbUser.username);
                        if(idx !== -1) { users[idx] = dbUser; saveLocalUsers(users); }
                    }

                    const freshSession: UserSession = {
                        isLoggedIn: true,
                        role: dbUser.role,
                        username: dbUser.username,
                        uid: dbUser.id || savedSession.uid,
                        tokens: Number(dbUser.tokens),
                        membershipTier: finalTier,
                        membershipExpiresAt: finalExpiry,
                        deviceId: currentDeviceId
                    };
                    saveCurrentUserSession(freshSession); // Update saved session
                    return freshSession;
                }
            }
        } catch (e) {
            console.error("Failed to parse saved session", e);
        }
    }

    // 2. AUTO-RECOVERY: Check if any account is bound to this Device ID
    const recoveredUser = users.find(u => u.deviceId === currentDeviceId);
    if (recoveredUser) {
        const now = Date.now();
        let finalTier = recoveredUser.membershipTier || 'NONE';
        let finalExpiry = Number(recoveredUser.membershipExpiresAt || 0);

        if (finalTier !== 'NONE' && finalExpiry > 0 && now > finalExpiry) {
            finalTier = 'NONE';
            finalExpiry = 0;
        }

        const recoveredSession: UserSession = {
            isLoggedIn: true,
            role: recoveredUser.role,
            username: recoveredUser.username,
            uid: recoveredUser.id,
            tokens: Number(recoveredUser.tokens),
            membershipTier: finalTier,
            membershipExpiresAt: finalExpiry,
            deviceId: currentDeviceId
        };
        saveCurrentUserSession(recoveredSession);
        return recoveredSession;
    }

    // 3. Fallback to default Vinzx Family if no saved session and no recovery
    const familyUser = users.find(u => u.username === 'Vinzx Family');

    if (familyUser) {
        // Cek Auto Expire saat load awal
        const now = Date.now();
        const expiresAt = Number(familyUser.membershipExpiresAt || 0);
        
        let finalTier = familyUser.membershipTier || 'NONE';
        let finalExpiry = expiresAt;

        if (finalTier !== 'NONE' && finalExpiry > 0 && now > finalExpiry) {
            finalTier = 'NONE';
            finalExpiry = 0;
            // Update DB
            familyUser.membershipTier = 'NONE';
            familyUser.membershipExpiresAt = 0;
            const idx = users.findIndex(u => u.username === 'Vinzx Family');
            if(idx !== -1) { users[idx] = familyUser; saveLocalUsers(users); }
        }

        return {
            isLoggedIn: false,
            role: familyUser.role,
            username: familyUser.username,
            uid: familyUser.id,
            tokens: Number(familyUser.tokens),
            membershipTier: finalTier,
            membershipExpiresAt: finalExpiry
        };
    }

    // Fallback emergency
    return {
        isLoggedIn: false,
        role: 'USER',
        username: 'Guest',
        tokens: 0,
        membershipTier: 'NONE',
        membershipExpiresAt: 0
    };
};

// --- AUTHENTICATION (SIMPLIFIED) ---

export const loginUser = async (username: string, plainPassword: string): Promise<{ success: boolean; user?: UserRecord; message: string; dailyBonusClaimed?: boolean }> => {
    seedDefaultUsers();
    const users = getLocalUsers();
    const user = users.find(u => u.username === username);
    
    if (user) {
        // Password Check
        if (user.passwordHash !== plainPassword && user.passwordHash !== 'auto_login_secure') {
            return { success: false, message: "Password Salah" };
        }

        user.lastLogin = Date.now();
        const idx = users.findIndex(u => u.username === username);
        users[idx] = user;
        saveLocalUsers(users);
        return { success: true, user: user, message: "Welcome Family", dailyBonusClaimed: false };
    }
    return { success: false, message: "User Tidak Ditemukan" };
};

export const registerUser = async (username: string, plainPassword: string): Promise<{ success: boolean; message: string }> => {
    const users = getLocalUsers();
    if (users.find(u => u.username === username)) return { success: false, message: "Username Taken" };
    
    const newUser: UserRecord = {
        id: crypto.randomUUID(),
        username,
        passwordHash: plainPassword,
        role: 'USER',
        tokens: 6,
        membershipTier: 'NONE',
        membershipExpiresAt: 0,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        history: [],
        deviceId: getDeviceId() // BIND TO DEVICE
    };
    users.push(newUser);
    saveLocalUsers(users);
    return { success: true, message: "Registered Local" };
};

export const resetUserPassword = async (username: string, newPlainPassword: string): Promise<{ success: boolean; message: string }> => {
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
        users[idx].passwordHash = newPlainPassword;
        saveLocalUsers(users);
        return { success: true, message: "Password Reset Local" };
    }
    return { success: false, message: "User Not Found" };
};

// --- DATA & SYNC ---

export const getUserData = async (username: string, uid?: string): Promise<{user: UserRecord, dailyBonusClaimed: boolean} | undefined> => {
    let firebaseHistory: ExecutionRecord[] | null = null;
    
    if (uid) {
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('./firebaseConfig');
            const historyRef = doc(db, 'users', uid);
            const snap = await getDoc(historyRef);
            if (snap.exists() && snap.data().history) {
                firebaseHistory = snap.data().history;
            }
        } catch (e) {
            console.error("Gagal load history dari Google/Firestore:", e);
        }
    }

    try {
        const res = await fetch(`/api/users/me/${username}`);
        if (res.ok) {
            const user = await res.json();
            if (firebaseHistory && firebaseHistory.length > 0) {
                user.history = firebaseHistory;
            }
            return {
                user: { ...user, tokens: Number(user.tokens), membershipExpiresAt: Number(user.membershipExpiresAt || 0) },
                dailyBonusClaimed: false
            };
        }
    } catch(e) {
        // Fallback for offline mode or Vinzx Family
    }
    
    if (username === 'Vinzx Family') seedDefaultUsers();
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
         const user = users[idx];
         if (firebaseHistory && firebaseHistory.length > 0) {
             user.history = firebaseHistory;
         }
         const now = Date.now();
         const expiresAt = Number(user.membershipExpiresAt || 0);
         if (user.membershipTier !== 'NONE' && expiresAt > 0 && now > expiresAt) {
             user.membershipTier = 'NONE';
             user.membershipExpiresAt = 0;
             users[idx] = user;
             saveLocalUsers(users);
         }
         return {
            user: { ...user, tokens: Number(user.tokens), membershipExpiresAt: Number(user.membershipExpiresAt || 0) },
            dailyBonusClaimed: false
         };
    }
    return undefined;
};

export const addExecutionRecord = async (username: string, record: ExecutionRecord, uid?: string): Promise<ExecutionRecord[]> => {
    // 1. Sync ke Firebase Firestore (Google Account Storage - Aman 1 tahun+)
    if (uid) {
        try {
            const { doc, getDoc, updateDoc, setDoc } = await import('firebase/firestore');
            const { db } = await import('./firebaseConfig');
            
            const historyRef = doc(db, 'users', uid);
            const snap = await getDoc(historyRef);
            
            if (snap.exists()) {
                const data = snap.data();
                const existingHistory = data.history || [];
                // Pertahankan semua history
                existingHistory.unshift(record);
                await updateDoc(historyRef, { history: existingHistory });
            } else {
                await setDoc(historyRef, { history: [record] }, { merge: true });
            }
        } catch (e) {
            console.error("Gagal simpan history ke Google/Firestore:", e);
        }
    }

    // 2. Sync ke Backend Lokal Sementara
    let backendHistory: ExecutionRecord[] = [];
    try {
        const res = await fetch(`/api/users/${username}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ record })
        });
        if (res.ok) {
            const data = await res.json();
            backendHistory = data.history;
        }
    } catch(e) {}

    // 3. Sync ke LocalStorage
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
        const user = users[idx];
        if (!user.history) user.history = [];
        user.history.unshift(record); 
        saveLocalUsers(users);
        return user.history;
    }
    return backendHistory;
};

// --- ADMIN FEATURES ---

export const getAllUsers = async (): Promise<UserRecord[]> => {
    return getLocalUsers();
};

export const updateUserTokens = async (targetUsername: string, amount: number, operation: 'ADD' | 'SUBTRACT' | 'SET'): Promise<UserRecord[]> => {
    try {
        await fetch(`/api/users/${targetUsername}/tokens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, operation })
        });
    } catch (e) {}

    const users = getLocalUsers();
    const idx = users.findIndex(u => u.username === targetUsername);
    if (idx !== -1) {
        let current = Number(users[idx].tokens || 0);
        if (operation === 'ADD') current += amount;
        if (operation === 'SUBTRACT') current = Math.max(0, current - amount);
        if (operation === 'SET') current = amount;
        users[idx].tokens = current;
        saveLocalUsers(users);
    }
    return users;
};

export const updateUserMembership = async (targetUsername: string, tier: MembershipTier, durationDays: number): Promise<UserRecord[]> => {
    try {
        await fetch(`/api/users/${targetUsername}/membership`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier, durationDays })
        });
    } catch (e) {}

    const users = getLocalUsers();
    const idx = users.findIndex(u => u.username === targetUsername);
    if (idx !== -1) {
        const now = Date.now();
        const ms = durationDays * 24 * 60 * 60 * 1000;
        let currentExp = Number(users[idx].membershipExpiresAt) || 0;
        if (tier === 'NONE') {
            users[idx].membershipTier = 'NONE';
            users[idx].membershipExpiresAt = 0;
        } else {
             const newExp = (currentExp > now) ? currentExp + ms : now + ms;
             users[idx].membershipTier = tier;
             users[idx].membershipExpiresAt = newExp;
        }
        saveLocalUsers(users);
    }
    return users;
};

export const updateUserRole = async (targetUsername: string, role: 'USER' | 'DEV'): Promise<UserRecord[]> => {
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.username === targetUsername);
    if (idx !== -1) {
        users[idx].role = role;
        if (role === 'DEV') {
            users[idx].membershipTier = 'VIP';
            users[idx].membershipExpiresAt = 0; // unlimited
            users[idx].tokens = 9999;
        }
        saveLocalUsers(users);
    }
    return users;
};

export const deleteUser = async (targetUsername: string): Promise<UserRecord[]> => {
    let users = getLocalUsers();
    users = users.filter(u => u.username !== targetUsername);
    saveLocalUsers(users);
    return users;
};

// --- MEMBERSHIP CODE ONE-TIME USE ENGINE ---

export const isCodeUsed = async (code: string): Promise<boolean> => {
    try {
        const deviceId = getDeviceId();
        const res = await fetch('/api/membership/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, deviceId })
        });
        if (res.ok) {
            const data = await res.json();
            return data.used === true;
        }
        return false;
    } catch (e) {
        return false;
    }
};

export const markCodeAsUsed = async (code: string, username: string): Promise<boolean> => {
    try {
        const deviceId = getDeviceId();
        const res = await fetch('/api/membership/use-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, username, deviceId })
        });
        
        if (res.ok) {
            const data = await res.json();
            return data.success === true;
        }
        return false;
    } catch (e) {
        console.error("Failed to mark code as used", e);
        return false;
    }
};
