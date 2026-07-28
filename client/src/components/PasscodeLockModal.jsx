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
  ChevronRight,
  Sparkles
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
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col justify-between select-none font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Fixed Executive Top Header (Never Shrinks) */}
      <div className="w-full h-16 sm:h-20 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between relative z-30 shadow-xs">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#0095f6] via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Bot className="w-6 h-6 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 truncate">
              <span>WhatsApp AI Hub</span>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-extrabold flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-purple-600" /> Protected Session
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block truncate">Automated Task Extraction & Direct Message Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-mono font-bold text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Session: <strong className="text-[#0095f6]">{sessionId || 'default'}</strong></span>
        </div>
      </div>

      {/* Main Center Form Area */}
      <div className="w-full max-w-md mx-auto px-6 py-8 flex-1 flex flex-col justify-center items-center relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6 w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-950 text-white mb-3.5 shadow-xl shadow-slate-950/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Session Password Protected
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Enter your 6-digit access PIN for session <strong className="text-slate-900 font-mono">{sessionId || 'default'}</strong>
          </p>
        </div>

        {!showSwitchForm ? (
          <div className="w-full space-y-4">
            <form onSubmit={handleUnlock} className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5 text-center uppercase tracking-wider">
                  Access Passcode / PIN
                </label>
                <input
                  type="password"
                  maxLength={12}
                  value={passcode}
                  onChange={(e) => { setPasscodeInput(e.target.value); setError(''); }}
                  placeholder="••••••"
                  className="w-full bg-white border border-slate-200/80 text-slate-900 text-center font-mono text-2xl font-black tracking-widest px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0095f6] placeholder-slate-400 shadow-2xs transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-950 hover:bg-black text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all shadow-md shadow-slate-950/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Unlock Session <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-slate-50 px-3 text-xs font-bold text-slate-400 uppercase tracking-widest absolute">or</span>
            </div>

            <button
              onClick={() => setShowSwitchForm(true)}
              className="w-full bg-white hover:bg-slate-100/80 border border-slate-200 text-slate-900 font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-2xl transition-all shadow-xs flex items-center justify-between cursor-pointer active:scale-95 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <KeyRound className="w-4 h-4" />
                </div>
                <span className="text-slate-900 font-bold">Switch Session ID & PIN</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={handleCreateNewSession}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-900 font-extrabold flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-purple-600" /> Link New WhatsApp Account (Fresh QR)
            </button>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="text-center mb-2">
              <button
                onClick={() => setShowSwitchForm(false)}
                className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to PIN Unlock
              </button>
              <h3 className="text-lg font-black text-slate-900">Switch Target Session</h3>
            </div>

            <form onSubmit={handleSwitchSessionSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Target Session ID</label>
                <input
                  type="text"
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value)}
                  placeholder="e.g. user_x9a82b_175829"
                  className="w-full bg-white border border-slate-200/80 text-slate-900 text-sm px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0095f6] font-mono font-bold shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Access PIN</label>
                <input
                  type="password"
                  value={targetPasscode}
                  onChange={(e) => setTargetPasscode(e.target.value)}
                  placeholder="Session Passcode (e.g. 673910)"
                  className="w-full bg-white border border-slate-200/80 text-slate-900 text-sm px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0095f6] font-mono font-bold shadow-2xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-black text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all shadow-md shadow-slate-950/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                Switch & Unlock <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer Branding with SNAB Innovations Link */}
      <div className="w-full shrink-0 py-4 px-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500 font-medium relative z-10 flex flex-wrap items-center justify-center gap-3">
        <span>Powered by <strong>WhatsApp AI Task Hub</strong></span>
        <span>•</span>
        <span>
          Created by{' '}
          <a
            href="https://snab.co.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-extrabold text-slate-900 hover:text-[#0095f6] underline transition-colors"
          >
            SNAB Innovations
          </a>
        </span>
      </div>
    </div>
  );
}
