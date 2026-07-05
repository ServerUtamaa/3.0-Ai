import React, { useState } from 'react';

export const LockdownScreen = ({ onUnlock }: { onUnlock: () => void }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        setIsChecking(true);
        try {
            const res = await fetch('/api/override', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: input })
            });
            
            if (res.ok) {
                onUnlock();
            } else {
                setError(true);
                setInput('');
            }
        } catch (err) {
            setError(true);
            setInput('');
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[99999] flex flex-col items-center justify-center p-4 font-mono text-green-500 overflow-hidden">
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-50 opacity-20"></div>
            
            <div className="max-w-3xl w-full bg-black border border-red-600 p-8 rounded shadow-[0_0_50px_rgba(255,0,0,0.4)] relative z-10">
                <div className="flex items-center mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-600 animate-ping mr-4"></div>
                    <h1 className="text-red-500 text-3xl md:text-5xl font-bold tracking-wider">FATAL SYSTEM ERROR</h1>
                </div>
                
                <div className="mb-8 border-l-4 border-red-600 pl-4">
                    <p className="text-red-400 text-lg md:text-xl font-bold mb-1">ERR_CODE:</p>
                    <p className="text-red-500 text-xl md:text-2xl font-bold tracking-widest">OxDEADBEEF_UNAUTHORIZED_REMIX</p>
                </div>
                
                <div className="space-y-4 text-gray-300 text-sm md:text-base leading-relaxed mb-10">
                    <p className="text-white font-bold">CRITICAL: Unauthorized duplication or remixing of this project detected.</p>
                    <p>ACTION: The core application has automatically bricked itself to protect intellectual property.</p>
                    <p className="text-red-400">All trading engines, AI models, and UI components have been permanently disabled for this instance.</p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-800">
                    <p className="mb-4 text-yellow-500 animate-pulse font-bold tracking-widest">AWAITING OVERRIDE COMMAND...</p>
                    
                    <form onSubmit={handleSubmit} className="flex items-center text-green-400 bg-gray-900/50 p-3 rounded border border-gray-800 focus-within:border-green-500 transition-colors">
                        <span className="mr-3 text-gray-500 select-none">root@vinzx-sec:~#</span>
                        <input 
                            type="password" 
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                setError(false);
                            }}
                            disabled={isChecking}
                            className="bg-transparent border-none outline-none text-green-400 flex-1 font-mono w-full"
                            autoFocus
                            autoComplete="off"
                            spellCheck="false"
                        />
                    </form>
                    {error && <p className="text-red-500 mt-3 text-sm animate-bounce">ACCESS DENIED: INVALID OVERRIDE SIGNATURE</p>}
                </div>
            </div>
        </div>
    );
};
