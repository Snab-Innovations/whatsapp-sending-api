import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  Bot,
  ShieldCheck,
  ArrowLeft,
  QrCode,
  ChevronRight
} from 'lucide-react';
import { setSessionPasscode, resetSessionId, switchSession } from '../utils/session';
import { verifyPasscode } from '../services/api';

export default function PasscodeLockModal({ sessionId, onUnlocked }) {
  const [passcode, setPasscodeInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSwitchForm, setShowSwitchForm] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState('');
  const [targetPasscode, setTargetPasscode] = useState('');

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!passcode || passcode.trim().length < 4) {
      setError('Please enter a valid session passcode.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      setSessionPasscode(passcode.trim());
      await verifyPasscode(passcode.trim());
      onUnlocked();
    } catch (err) {
      setError(err.message || 'Incorrect session passcode. Access denied.');
      setLoading(false);
    }
  };

  const handleCreateNewSession = () => {
    resetSessionId();
    window.location.reload();
  };

  const handleSwitchSessionSubmit = (e) => {
    e.preventDefault();
    if (!targetSessionId.trim()) return;
    switchSession(targetSessionId.trim(), targetPasscode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto flex flex-col justify-between select-none font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 🧵 Threads Top Typography Ribbon Art Banner */}
      <div className="w-full h-36 sm:h-48 overflow-hidden relative border-b border-slate-100 flex items-center justify-center bg-slate-50">
        <div className="absolute inset-0 flex items-center justify-center opacity-90 scale-110 pointer-events-none">
          <div className="flex gap-4 -rotate-6 transform">
            <div className="w-40 h-40 rounded-full border-[18px] border-slate-900 flex items-center justify-center font-black text-[9px] tracking-widest text-white shadow-xl">
              SECURITY • SAY MORE
            </div>
            <div className="w-48 h-48 rounded-full border-[22px] border-gradient-to-tr from-purple-600 via-pink-600 to-red-500 bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center font-black text-xs tracking-widest shadow-2xl">
              WHATSAPP AI • PIN UNLOCK
            </div>
            <div className="w-40 h-40 rounded-full border-[18px] border-slate-900 flex items-center justify-center font-black text-[9px] tracking-widest text-white shadow-xl">
              FIREBASE • PROTECTED
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" />
      </div>

      {/* Main Center Form Area */}
      <div className="w-full max-w-md mx-auto px-6 py-6 flex-1 flex flex-col justify-center items-center relative z-10">
        
        {/* Threads Brand Header */}
        <div className="text-center mb-6 w-full">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black text-white mb-3 shadow-lg shadow-black/20">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Session Password Protected
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Enter your 6-digit access PIN for session <strong className="text-black font-mono">{sessionId || 'default'}</strong>
          </p>
        </div>

        {!showSwitchForm ? (
          <div className="w-full space-y-4">
            <form onSubmit={handleUnlock} className="space-y-3">
              <div>
                <input
                  type="password"
                  maxLength={12}
                  value={passcode}
                  onChange={(e) => { setPasscodeInput(e.target.value); setError(''); }}
                  placeholder="Access PIN / Passcode"
                  className="w-full bg-slate-100/80 border border-slate-200/60 text-slate-900 text-center font-mono text-xl font-bold tracking-widest px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white placeholder-slate-400 transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-slate-900 text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Log in to Session <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-widest absolute">or</span>
            </div>

            <button
              onClick={() => setShowSwitchForm(true)}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-2xl transition-all shadow-xs flex items-center justify-between cursor-pointer active:scale-95 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span className="text-slate-900 font-bold">Switch Session ID & PIN</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={handleCreateNewSession}
              className="w-full text-center text-xs text-slate-500 hover:text-black font-extrabold flex items-center justify-center gap-1 mt-2 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Link New WhatsApp Account (Fresh QR)
            </button>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="text-center mb-2">
              <button
                onClick={() => setShowSwitchForm(false)}
                className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to PIN Login
              </button>
              <h3 className="text-lg font-black text-slate-900">Switch Target Session</h3>
            </div>

            <form onSubmit={handleSwitchSessionSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value)}
                  placeholder="Target Session ID (e.g. user_x9a82b_175829)"
                  className="w-full bg-slate-100/80 border border-slate-200/60 text-slate-900 text-sm px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white placeholder-slate-400 font-medium transition-all"
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  value={targetPasscode}
                  onChange={(e) => setTargetPasscode(e.target.value)}
                  placeholder="Access PIN / Passcode"
                  className="w-full bg-slate-100/80 border border-slate-200/60 text-slate-900 text-sm px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white placeholder-slate-400 font-medium transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black hover:bg-slate-900 text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                Switch & Log in <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Threads Footer */}
      <div className="w-full py-4 px-6 border-t border-slate-100 bg-white text-center text-[11px] text-slate-400 font-medium relative z-10 flex flex-wrap items-center justify-center gap-4">
        <span>© 2026 Threads AI</span>
        <span>•</span>
        <span className="hover:underline cursor-pointer">Terms</span>
        <span className="hover:underline cursor-pointer">Privacy Policy</span>
        <span className="hover:underline cursor-pointer">Security</span>
        <span className="hover:underline cursor-pointer">Firebase Cloud Sync</span>
      </div>
    </div>
  );
}
