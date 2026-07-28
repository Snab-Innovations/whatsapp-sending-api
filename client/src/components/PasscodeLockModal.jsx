import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Bot,
  Zap,
  Cloud,
  Shield,
  Smartphone,
  Cpu,
  Layers
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
    <div className="fixed inset-0 z-50 bg-[#090d16] overflow-y-auto flex flex-col justify-between p-4 sm:p-8 text-white select-none transition-all duration-300">
      
      {/* Apple Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Brand Nav */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-[#0095f6] via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg text-white tracking-tight flex items-center gap-2">
              <span>WhatsApp AI</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> Enterprise Security
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Multi-Tenant AI Task & Messaging Hub</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-extrabold text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Active Session: <strong className="text-blue-400">{sessionId || 'default'}</strong></span>
        </div>
      </div>

      {/* Main Center Full-Page Layout */}
      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8 relative z-10">
        
        {/* Left Side: Professional Platform Info & Features */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold">
            <Shield className="w-4 h-4" /> End-to-End Encrypted & Password Protected
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Unlock Your <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">AI Task Space</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 font-medium max-w-xl leading-relaxed">
            Enter your unique 6-digit access PIN to unlock direct messages, automated task extractions, and real-time Gemini AI analytics for this session.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2.5">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Gemini 1.5 AI Intelligence</h4>
              <p className="text-xs text-slate-400 font-medium mt-1">Automatic action item extraction from chats</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2.5">
                <Cloud className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Firebase Cloud Hydration</h4>
              <p className="text-xs text-slate-400 font-medium mt-1">Cross-device access from any phone or desktop</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Isolated Tenant Security</h4>
              <p className="text-xs text-slate-400 font-medium mt-1">Every WhatsApp account is PIN protected</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-2.5">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Real-Time Mobile Sync</h4>
              <p className="text-xs text-slate-400 font-medium mt-1">Instant updates with zero delayed messages</p>
            </div>
          </div>
        </div>

        {/* Right Side: Apple-Grade Glassmorphism Login Card */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-white text-slate-900 border border-slate-200/80 rounded-[36px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            
            {!showSwitchForm ? (
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-[22px] bg-gradient-to-tr from-[#0095f6] to-purple-600 text-white mb-3.5 shadow-lg shadow-blue-500/25 active:scale-95 transition-transform">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Unlock Session</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Enter your session passcode to continue
                  </p>

                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200/80 rounded-full text-xs font-mono font-bold text-slate-700">
                    <span>ID: <strong className="text-[#0095f6]">{sessionId || 'default'}</strong></span>
                  </div>
                </div>

                <form onSubmit={handleUnlock} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#0095f6]" /> Session Passcode / PIN
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
                    className="w-full py-4 bg-[#0095f6] hover:bg-[#1877f2] text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
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
                    <UserPlus className="w-3.5 h-3.5 text-purple-600" /> Link New WhatsApp Account (Generate Fresh QR)
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
      </div>

      {/* Footer info */}
      <div className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 font-medium py-2 relative z-10 border-t border-white/5">
        WhatsApp AI Task Manager • Powered by Baileys WebSockets, Gemini 1.5 Flash & Firebase Cloud Firestore
      </div>
    </div>
  );
}
