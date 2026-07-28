import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowRight, UserPlus, Sparkles, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 w-full max-w-md rounded-[36px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Apple Top Subtle Ambient Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-tr from-blue-500/15 via-purple-500/15 to-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {!showSwitchForm ? (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-[22px] bg-gradient-to-tr from-blue-600 to-purple-600 text-white mb-3.5 shadow-lg shadow-blue-500/25 active:scale-95 transition-transform">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Session Protected</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Enter your 4 to 6 digit access PIN to unlock WhatsApp messages & AI tasks.
              </p>

              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-slate-100/80 border border-slate-200/80 rounded-full text-xs font-mono font-bold text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Session: <span className="text-[#0095f6]">{sessionId || 'default'}</span>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#0095f6]" /> Enter Access PIN
                </label>
                <input
                  type="password"
                  maxLength={12}
                  value={passcode}
                  onChange={(e) => { setPasscodeInput(e.target.value); setError(''); }}
                  placeholder="••••••"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl font-mono text-center text-2xl font-black tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:bg-white transition-all shadow-inner"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-600 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0095f6] hover:bg-[#1877f2] text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
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

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <button
                onClick={() => setShowSwitchForm(true)}
                className="text-xs text-[#0095f6] hover:underline font-extrabold text-center cursor-pointer"
              >
                Have a PIN for another session? Switch Session
              </button>
              <button
                onClick={handleCreateNewSession}
                className="text-xs text-slate-500 hover:text-slate-900 font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-purple-600" /> Link a New WhatsApp Account (Fresh QR)
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-5">
              <button
                onClick={() => setShowSwitchForm(false)}
                className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Unlock
              </button>
              <h3 className="text-xl font-black text-slate-900">Switch Session</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Enter your Target Session ID and PIN to load stored messages.
              </p>
            </div>

            <form onSubmit={handleSwitchSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Target Session ID</label>
                <input
                  type="text"
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value)}
                  placeholder="e.g. user_x9a82b_175829"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0095f6]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Access PIN</label>
                <input
                  type="password"
                  value={targetPasscode}
                  onChange={(e) => setTargetPasscode(e.target.value)}
                  placeholder="Session Passcode (e.g. 673910)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0095f6]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSwitchForm(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-2xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
                >
                  Switch & Unlock
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
