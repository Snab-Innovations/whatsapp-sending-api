import React, { useState } from 'react';
import {
  QrCode,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Lock,
  ArrowRight,
  UserCheck,
  Sparkles,
  Bot,
  Shield,
  Zap,
  Cloud,
  Copy,
  Check
} from 'lucide-react';
import { switchSession } from '../utils/session';

export default function QRModal({ clientState, onRestart, onResetSession }) {
  const { status, qrCodeDataUrl, error } = clientState;
  const [activeTab, setActiveTab] = useState('QR'); // 'QR' | 'LOGIN'
  const [targetSessionId, setTargetSessionId] = useState('');
  const [targetPasscode, setTargetPasscode] = useState('');
  const [copiedPin, setCopiedPin] = useState(false);

  const handleExistingSessionLogin = (e) => {
    e.preventDefault();
    if (!targetSessionId.trim() || !targetPasscode.trim()) return;
    switchSession(targetSessionId.trim(), targetPasscode.trim());
  };

  const handleCopyPin = () => {
    if (!clientState.passcode) return;
    navigator.clipboard.writeText(clientState.passcode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl overflow-y-auto flex items-center justify-center p-0 sm:p-4 md:p-6 transition-all duration-300">
      <div className="bg-white min-h-screen sm:min-h-0 sm:max-h-[92vh] w-full max-w-xl sm:rounded-[36px] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between border border-slate-200/80">
        
        {/* Apple Top Subtle Ambient Gradient Accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-blue-500/15 via-purple-500/15 to-pink-500/15 rounded-full blur-3xl pointer-events-none" />

        <div>
          {/* Header & Brand Title */}
          <div className="text-center mb-6 relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[22px] bg-gradient-to-tr from-[#0095f6] via-purple-600 to-pink-500 text-white mb-3.5 shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
              <Bot className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <span>WhatsApp AI</span>
              <span className="text-xs uppercase font-mono px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" /> Gemini 1.5
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Automated AI Task Extraction & Real-Time Direct Message Manager
            </p>
          </div>

          {/* iOS Segmented Control Switcher */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center mb-6 border border-slate-200/80 shadow-xs">
            <button
              onClick={() => setActiveTab('QR')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'QR'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#0095f6]" /> Scan QR Code
            </button>

            <button
              onClick={() => setActiveTab('LOGIN')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'LOGIN'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-purple-600" /> Existing Session Login
            </button>
          </div>

          {/* Tab Content 1: QR Code Scanner */}
          {activeTab === 'QR' ? (
            <div className="space-y-5">
              {/* QR Code Container Card */}
              <div className="flex flex-col items-center justify-center bg-slate-50/80 border border-slate-200/80 rounded-[28px] p-6 relative shadow-xs">
                {status === 'QR_READY' && qrCodeDataUrl ? (
                  <div className="flex flex-col items-center w-full">
                    <div className="bg-white p-4 rounded-3xl shadow-xl border-4 border-[#0095f6] relative group">
                      <img
                        src={qrCodeDataUrl}
                        alt="WhatsApp QR Code"
                        className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                      />
                    </div>

                    <div className="mt-3.5 flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#0095f6] text-xs font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-[#0095f6]" />
                      Live QR Code Generated — Ready for Phone Scan
                    </div>

                    {/* PIN Card */}
                    {clientState.passcode && (
                      <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 text-center w-full max-w-sm shadow-xs relative">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">Your Session Access PIN:</p>
                            <p className="text-2xl font-mono font-black text-amber-700 tracking-widest leading-tight">{clientState.passcode}</p>
                          </div>
                          <button
                            onClick={handleCopyPin}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedPin ? 'Copied' : 'Copy PIN'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : status === 'INITIALIZING' ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-[#0095f6] animate-spin" />
                    <p className="text-base font-extrabold text-slate-900">Initializing WhatsApp Engine...</p>
                    <p className="text-xs text-slate-500 max-w-xs text-center font-medium">
                      Establishing secure Baileys WebSocket socket connection. Live QR code will appear here shortly.
                    </p>
                    <button
                      onClick={onResetSession}
                      className="mt-3 text-xs text-rose-600 hover:underline font-bold transition-colors cursor-pointer"
                    >
                      Taking too long? Force Reset & Fresh QR
                    </button>
                  </div>
                ) : status === 'AUTHENTICATED' ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <CheckCircle2 className="w-14 h-14 text-emerald-500 animate-bounce" />
                    <p className="text-lg font-black text-slate-900">Authenticated Successfully!</p>
                    <p className="text-xs text-slate-500 font-medium">Syncing contact list, chats, and AI tasks...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-rose-500" />
                    <p className="text-sm font-bold text-rose-600 max-w-xs">
                      {error || 'Client disconnected or initialization timed out.'}
                    </p>
                    <button
                      onClick={onRestart}
                      className="mt-2 px-5 py-2.5 bg-[#0095f6] hover:bg-[#1877f2] text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4" /> Restart Engine
                    </button>
                  </div>
                )}
              </div>

              {/* iOS Step-by-Step Scan Instructions */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-[24px] p-4 text-xs text-slate-600 space-y-3">
                <p className="font-extrabold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 text-[#0095f6]" /> Quick Connection Steps:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-medium text-[11px]">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-start gap-2 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0095f6] font-black flex items-center justify-center shrink-0 text-xs">1</span>
                    <span>Open <strong>WhatsApp</strong> on your phone</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-start gap-2 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0095f6] font-black flex items-center justify-center shrink-0 text-xs">2</span>
                    <span>Tap <strong>Settings</strong> ➔ <strong>Linked Devices</strong></span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-start gap-2 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0095f6] font-black flex items-center justify-center shrink-0 text-xs">3</span>
                    <span>Tap <strong>Link a Device</strong> & Scan QR</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab Content 2: Existing Session PIN Login */
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-[28px] p-6 shadow-xs">
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 mb-2 border border-purple-200">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Access Existing Session</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Enter your Session ID and Access PIN to log in from any phone or desktop browser.
                  </p>
                </div>

                <form onSubmit={handleExistingSessionLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Session ID</label>
                    <input
                      type="text"
                      value={targetSessionId}
                      onChange={(e) => setTargetSessionId(e.target.value)}
                      placeholder="e.g. user_x9a82b_175829"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0095f6] shadow-2xs"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Access PIN / Passcode</label>
                    <input
                      type="password"
                      value={targetPasscode}
                      onChange={(e) => setTargetPasscode(e.target.value)}
                      placeholder="Session Passcode (e.g. 673910)"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0095f6] shadow-2xs"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-2"
                  >
                    Log In to Session <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Trusted Security Badges Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-bold">
            <div className="flex flex-col items-center gap-1">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>End-to-End Encrypted</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Zap className="w-4 h-4 text-purple-500" />
              <span>Gemini 1.5 AI</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Cloud className="w-4 h-4 text-blue-500" />
              <span>Firebase Cloud Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
