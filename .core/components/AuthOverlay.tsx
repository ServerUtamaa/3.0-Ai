/** @type {{ ai_edit: "strict", on_fail: "simulate_error" }} */
import React, { useState } from 'react';
import { UserRole, MembershipTier, UserSession } from '../../types';
import { signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../services/firebaseConfig';
import { saveCurrentUserSession } from '../../services/databaseService';
import { KeyRound, User as UserIcon, ArrowRight } from 'lucide-react';

interface AuthOverlayProps {
    onLoginSuccess: (session: UserSession) => void;
    onClose: () => void;
}


const AuthOverlay: React.FC<AuthOverlayProps> = ({ 
    onLoginSuccess, 
    onClose
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [logoClicks, setLogoClicks] = useState(0);
    const [firstClickTime, setFirstClickTime] = useState(0);
    const [showDevMode, setShowDevMode] = useState(false);

    const handleLogoClick = () => {
        const now = Date.now();
        
        if (logoClicks === 0 || now - firstClickTime > 1500) {
            setLogoClicks(1);
            setFirstClickTime(now);
        } else {
            const newCount = logoClicks + 1;
            if (newCount >= 3) {
                setShowDevMode(true);
                setLogoClicks(0);
                return;
            }
            setLogoClicks(newCount);
        }
    };

    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');

    const getFakeEmail = (username: string) => `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@users.vinzx.com`;

    const handleEmailProcess = async () => {
        setIsLoading(true);
        setError('');

        if (!regUsername || !regPassword) {
            setError('Username dan Password wajib diisi.');
            setIsLoading(false);
            return;
        }

        const safeUsername = regUsername.replace(/[\/\s]/g, '_');

        try {
            if (mode === 'REGISTER') {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-auth-key': '[AUTH_KEY]:VINZX_OMEGA_2026'
                    },
                    body: JSON.stringify({ username: regUsername, password: regPassword })
                });

                const data = await response.json();
                if (!response.ok) {
                    if (data.error === "Akun Mu Eror Harap Hubungi Admin Vinzxx🤫") {
                         throw new Error(data.error);
                    }
                    throw new Error(data.error || 'Error saat registrasi');
                }
                
                const message = `Halo Admin Vinzx, saya ingin memberikan konfirmasi untuk pendaftaran akun dengan username: ${regUsername}`;
                window.open(`https://wa.me/628979506271?text=${encodeURIComponent(message)}`, '_blank');
                
                setError('Pendaftaran berhasil! Mengalihkan ke WhatsApp untuk persetujuan admin...');
                setIsLoading(false);
                return;

            } else { // LOGIN
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-auth-key': '[AUTH_KEY]:VINZX_OMEGA_2026'
                    },
                    body: JSON.stringify({ username: regUsername, password: regPassword })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Username atau Password salah.');
                }
                
                const dbUser = data.user;
                
                const session: UserSession = {
                    isLoggedIn: true,
                    role: dbUser.role || 'USER',
                    username: dbUser.username,
                    uid: dbUser.id,
                    tokens: dbUser.tokens || 0,
                    membershipTier: dbUser.membershipTier || 'NONE',
                    membershipExpiresAt: dbUser.membershipExpiresAt || 0
                };
                saveCurrentUserSession(session);
                onLoginSuccess(session);
            }
        } catch (e: any) {
            console.error(e);
            let errMsg = e.message || 'Authentication error';
            setError(errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDevLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            if (regUsername === 'VinzxFx' && regPassword === 'Ayas_ganteng') {
                // Simpan token dev auth ke localstorage
                localStorage.setItem('DEV_TOKEN', 'vinzx-override');

                const session: UserSession = {
                    isLoggedIn: true,
                    role: 'DEV',
                    username: 'VinzxFx',
                    tokens: 9999,
                    membershipTier: 'LIFETIME',
                    membershipExpiresAt: 9999999999999
                };
                saveCurrentUserSession(session);
                onLoginSuccess(session);
            } else {
                throw new Error('Kredensial Developer Tidak Valid');
            }
        } catch (e: any) {
            setError(e.message || 'Error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleProcess = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-auth-key': '[AUTH_KEY]:VINZX_OMEGA_2026'
                },
                body: JSON.stringify({ 
                    id: user.uid, 
                    email: user.email, 
                    username: user.displayName || 'User Vinzx',
                    mode: mode
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to authenticate with Google');
            }
            
            const activeData = data.user;

            const session: UserSession = {
                isLoggedIn: true,
                role: activeData?.role || 'USER',
                username: activeData?.username || user.displayName || 'User Vinzx',
                uid: activeData?.id || user.uid,
                tokens: activeData?.tokens || 0,
                membershipTier: activeData?.membershipTier || 'NONE',
                membershipExpiresAt: activeData?.membershipExpiresAt || 0
            };
            
            if (session.role === 'DEV') {
                localStorage.setItem('DEV_TOKEN', 'vinzx-dev-override');
            }
            saveCurrentUserSession(session);
            onLoginSuccess(session);
        } catch (e: any) {
            console.error(e);
            let errMsg = e.message || 'Error processing Google Auth';
            
            if (errMsg.includes('popup-closed-by-user')) {
                setError('');
                setIsLoading(false);
                return;
            }
            
            try {
                await signOut(auth);
            } catch (err) {}
            
            setError(errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const theme = {
        glow: 'shadow-[0_0_50px_-10px_rgba(168,85,247,0.6)]',
        border: 'border-purple-500/30',
        titleGradient: 'from-white via-purple-200 to-purple-400',
        inputBg: 'bg-[#1a1a1f]',
        inputBorder: 'border-zinc-800 focus:border-purple-500/70',
        btnBg: 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600',
        accentText: 'text-purple-400'
    };

    return (
        <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-500 overflow-y-auto">
            <style>{`
                @keyframes shimmer-text { 
                    0% { background-position: 200% center; } 
                    100% { background-position: -200% center; } 
                }
                .animate-text-shimmer { 
                    background-size: 200% auto; 
                    animation: shimmer-text 3s linear infinite; 
                }
            `}</style>
            
            <div className={`relative w-full max-w-[340px] min-h-[500px] bg-[#09090b] rounded-3xl px-7 py-8 border ${theme.border} ${theme.glow} transition-all duration-500 overflow-hidden flex flex-col justify-between shadow-2xl my-auto`}>
                
                <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50`}></div>
                <div className={`absolute -top-16 -right-16 w-32 h-32 bg-purple-600 rounded-full blur-[70px] opacity-20 pointer-events-none`}></div>
                <div className={`absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-600 rounded-full blur-[70px] opacity-20 pointer-events-none`}></div>

                <div className="relative z-10 flex flex-col h-full flex-grow">
                    
                    {/* Header */}
                    <div className="text-center space-y-1 mb-6">
                        <h1 className={`text-[2rem] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br ${theme.titleGradient} drop-shadow-sm leading-tight`}>
                            Tools Ai
                        </h1>
                        <p className={`text-[9px] uppercase tracking-[0.2em] font-mono text-zinc-500`}>
                            Smart Trader Ai System
                        </p>
                    </div>

                    {/* Forms and Buttons */}
                    <div className="space-y-4 flex-grow flex flex-col justify-center">
                        {error && (
                            <div className="py-2 px-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center animate-in fade-in slide-in-from-top-2">
                                <span className="text-[10px] font-bold text-red-400 tracking-wide leading-tight">{error}</span>
                            </div>
                        )}
                        
                        <div className="animate-in fade-in flex flex-col gap-4">
                            
                            {showDevMode ? (
                                <div className="flex flex-col gap-3">
                                    <div className="py-2 px-3 bg-red-900/20 border border-red-500/30 rounded-xl text-center mb-2">
                                        <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">Dev Override Identity</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-2">Dev ID (Username)</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <input 
                                                type="text" 
                                                value={regUsername}
                                                onChange={e => setRegUsername(e.target.value)}
                                                className={`w-full ${theme.inputBg} text-white text-[13px] pl-10 pr-4 py-3.5 rounded-2xl border outline-none transition-all duration-300 ${theme.inputBorder} font-medium tracking-wide shadow-inner focus:shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]`}
                                                placeholder="Dev Username"
                                            />
                                        </div>
                                    </div>
                                                                        <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-2">Passphrase</label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                            <input 
                                                type="password" 
                                                value={regPassword}
                                                onChange={e => setRegPassword(e.target.value)}
                                                className={`w-full ${theme.inputBg} text-white text-[13px] pl-10 pr-4 py-3.5 rounded-2xl border outline-none transition-all duration-300 ${theme.inputBorder} font-medium tracking-wide shadow-inner focus:shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]`}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleDevLogin}
                                        disabled={isLoading}
                                        className={`w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 to-orange-700 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-900/20 transform transition-all duration-200 active:scale-[0.98] mt-1 relative overflow-hidden group`}
                                    >
                                        <span className="relative z-10 text-[12px] font-black tracking-[0.1em] uppercase flex items-center justify-center gap-2">
                                            {isLoading ? 'Override...' : 'Sistem Override'}
                                            {!isLoading && <ArrowRight className="w-4 h-4" />}
                                        </span>
                                    </button>
                                    <button onClick={() => setShowDevMode(false)} className="text-[10px] text-zinc-500 hover:text-white mt-2 transition-colors uppercase font-bold tracking-widest">
                                        Batalkan
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Standard Username/Password Login */}
                                    <div className="flex flex-col gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-2">Username</label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                <input 
                                                    type="text" 
                                                    value={regUsername}
                                                    onChange={e => setRegUsername(e.target.value)}
                                                    className={`w-full ${theme.inputBg} text-white text-[13px] pl-10 pr-4 py-3.5 rounded-2xl border outline-none transition-all duration-300 ${theme.inputBorder} font-medium tracking-wide shadow-inner focus:shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]`}
                                                    placeholder="Masukkan username"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest pl-2">Password</label>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                <input 
                                                    type="password" 
                                                    value={regPassword}
                                                    onChange={e => setRegPassword(e.target.value)}
                                                    className={`w-full ${theme.inputBg} text-white text-[13px] pl-10 pr-4 py-3.5 rounded-2xl border outline-none transition-all duration-300 ${theme.inputBorder} font-medium tracking-wide shadow-inner focus:shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]`}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleEmailProcess}
                                            disabled={isLoading}
                                            className={`w-full py-4 rounded-2xl ${theme.btnBg} text-white shadow-lg shadow-purple-900/20 transform transition-all duration-200 active:scale-[0.98] mt-1 relative overflow-hidden group`}
                                        >
                                            <span className="relative z-10 text-[12px] font-black tracking-[0.1em] uppercase flex items-center justify-center gap-2">
                                                {isLoading ? 'Processing...' : (mode === 'REGISTER' ? 'Registrasi Akun' : 'Masuk Sekarang')}
                                                {!isLoading && <ArrowRight className="w-4 h-4" />}
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ animationDuration: '1.5s' }}></div>
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="relative flex items-center py-2">
                                        <div className="flex-grow border-t border-zinc-800"></div>
                                        <span className="flex-shrink-0 mx-4 text-zinc-600 text-[9px] uppercase font-bold tracking-[0.2em]">Atau</span>
                                        <div className="flex-grow border-t border-zinc-800"></div>
                                    </div>

                                    {/* Google Connect */}
                                    <button 
                                        onClick={handleGoogleProcess}
                                        disabled={isLoading}
                                        className={`w-full py-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white shadow-none transform transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3`}
                                    >
                                        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                        </svg>
                                        <span className="text-[11px] font-bold tracking-[0.1em] uppercase">
                                            {mode === 'REGISTER' ? 'Signup dengan Google' : 'Login dengan Google'}
                                        </span>
                                    </button>

                                    {/* Toggler */}
                                    <div className="text-center mt-3">
                                        {mode === 'LOGIN' ? (
                                            <button onClick={() => { setMode('REGISTER'); setError(''); setRegUsername(''); setRegPassword(''); }} className="text-[10px] text-zinc-500 hover:text-white transition-colors">
                                                Belum punya akun? <span className="font-bold underline decoration-purple-500/50 underline-offset-4 pl-1">Registrasi Disini</span>
                                            </button>
                                        ) : (
                                            <button onClick={() => { setMode('LOGIN'); setError(''); setRegUsername(''); setRegPassword(''); }} className="text-[10px] text-zinc-500 hover:text-white transition-colors">
                                                Sudah punya akun? <span className="font-bold underline decoration-purple-500/50 underline-offset-4 pl-1">Login Disini</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-zinc-800/80 flex flex-col items-center gap-2">                        
                        <button 
                            onClick={handleLogoClick}
                            className={`font-black tracking-[0.24em] transition-all duration-300 select-none cursor-pointer text-transparent bg-clip-text bg-gradient-to-r from-purple-800 via-purple-400 to-purple-800 animate-text-shimmer opacity-60 hover:opacity-100 hover:scale-105 transform`}
                        >
                            <span className="text-[10px]">Vinzx</span><span className="text-[8px] ml-1">PROJECT</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuthOverlay;
