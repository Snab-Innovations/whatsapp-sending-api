import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowRight, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 ig-gradient-bg" />

        {!showSwitchForm ? (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl ig-gradient-bg text-white mb-4 shadow-xl shadow-pink-500/20">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Session Password Required</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                This WhatsApp session is password protected. Enter your unique 6-digit PIN to access messages & AI tasks.
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-mono font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Session: <span className="text-[#0095f6]">{sessionId || 'default'}</span>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#0095f6]" /> Enter Access Passcode
                </label>
                <input
                  type="password"
                  maxLength={12}
                  value={passcode}
                  onChange={(e) => { setPasscodeInput(e.target.value); setError(''); }}
                  placeholder="e.g. 673910"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-center text-xl font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0095f6] focus:bg-white transition-all shadow-inner"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0095f6] hover:bg-[#1877f2] text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => setShowSwitchForm(true)}
                className="text-xs text-[#0095f6] hover:underline font-bold text-center"
              >
                Already have a passcode for another session? Switch Session
              </button>
              <button
                onClick={handleCreateNewSession}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold text-center flex items-center justify-center gap-1 mt-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Link a New WhatsApp Account (Generate Fresh Session)
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Switch WhatsApp Session</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Enter an existing Session ID and Passcode to load your connected WhatsApp messages.
              </p>
            </div>

            <form onSubmit={handleSwitchSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Session ID</label>
                <input
                  type="text"
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value)}
                  placeholder="e.g. user_x9a82b_175829"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0095f6]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Passcode / PIN</label>
                <input
                  type="password"
                  value={targetPasscode}
                  onChange={(e) => setTargetPasscode(e.target.value)}
                  placeholder="Session Passcode"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0095f6]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSwitchForm(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  Switch & Connect
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
