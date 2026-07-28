import React, { useState } from 'react';
import {
  QrCode,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  UserCheck,
  ChevronRight,
  Copy,
  Check,
  Bot,
  Sparkles
} from 'lucide-react';
import { switchSession } from '../utils/session';

export default function QRModal({ clientState, onRestart, onResetSession }) {
  const { status, qrCodeDataUrl, error } = clientState;
  const [viewMode, setViewMode] = useState('LOGIN'); // 'LOGIN' | 'QR'
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
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto flex flex-col justify-between select-none font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 🧵 Threads-Style Top Typography Ring Art Banner */}
      <div className="w-full h-36 sm:h-48 overflow-hidden relative border-b border-slate-100 flex items-center justify-center bg-slate-50">
        <div className="absolute inset-0 flex items-center justify-center opacity-90 scale-110 pointer-events-none">
          {/* Animated Decorative Rings */}
          <div className="flex gap-4 -rotate-6 transform">
            <div className="w-40 h-40 rounded-full border-[18px] border-slate-900 flex items-center justify-center font-black text-[9px] tracking-widest text-white shadow-xl">
              SAY MORE • WHATSAPP AI
            </div>
            <div className="w-48 h-48 rounded-full border-[22px] border-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center font-black text-xs tracking-widest shadow-2xl">
              GEMINI 1.5 • THREADS
            </div>
            <div className="w-40 h-40 rounded-full border-[18px] border-slate-900 flex items-center justify-center font-black text-[9px] tracking-widest text-white shadow-xl">
              FIREBASE • CLOUD SYNC
            </div>
          </div>
        </div>

        {/* Ambient Top Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" />
      </div>

      {/* Main Center Form Area */}
      <div className="w-full max-w-md mx-auto px-6 py-6 flex-1 flex flex-col justify-center items-center relative z-10">
        
        {/* Threads Brand Header */}
        <div className="text-center mb-6 w-full">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black text-white mb-3 shadow-lg shadow-black/20">
            <Bot className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Log in with your WhatsApp session
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Access your direct messages, automated tasks, and AI insights
          </p>
        </div>

        {viewMode === 'LOGIN' ? (
          /* Login Form (Threads Input Style) */
          <div className="w-full space-y-4">
            <form onSubmit={handleExistingSessionLogin} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value)}
                  placeholder="Session ID (e.g. user_x9a82b_175829)"
                  className="w-full bg-slate-100/80 border border-slate-200/60 text-slate-900 text-sm px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white placeholder-slate-400 font-medium transition-all"
                  required
                  autoFocus
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
                className="w-full bg-black hover:bg-slate-900 text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                Log in <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Threads "or" Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-widest absolute">or</span>
            </div>

            {/* Option to Scan QR Code */}
            <button
              onClick={() => setViewMode('QR')}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-2xl transition-all shadow-xs flex items-center justify-between cursor-pointer active:scale-95 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-xs">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="text-slate-900 font-bold">Link New WhatsApp Account (Scan QR)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ) : (
          /* Live QR Code Display Mode */
          <div className="w-full space-y-4 text-center">
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col items-center">
              {status === 'QR_READY' && qrCodeDataUrl ? (
                <div className="flex flex-col items-center w-full">
                  <div className="bg-white p-3 rounded-2xl shadow-lg border-4 border-black">
                    <img
                      src={qrCodeDataUrl}
                      alt="WhatsApp QR Code"
                      className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                    />
                  </div>

                  <p className="text-xs text-blue-600 font-extrabold mt-3 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Live QR Code generated — waiting for scan...
                  </p>

                  {clientState.passcode && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center w-full max-w-xs shadow-2xs flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-amber-900 uppercase">Session PIN:</p>
                        <p className="text-xl font-mono font-black text-amber-700">{clientState.passcode}</p>
                      </div>
                      <button
                        onClick={handleCopyPin}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPin ? 'Copied' : 'Copy PIN'}
                      </button>
                    </div>
                  )}
                </div>
              ) : status === 'INITIALIZING' ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-black animate-spin" />
                  <p className="text-sm font-extrabold text-slate-900">Starting Baileys Engine...</p>
                  <p className="text-xs text-slate-500 max-w-xs">Initializing WhatsApp socket connection. QR code loading...</p>
                  <button
                    onClick={onResetSession}
                    className="mt-2 text-xs text-rose-600 font-bold hover:underline"
                  >
                    Force Reset & Fresh QR
                  </button>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center gap-2">
                  <AlertTriangle className="w-10 h-10 text-rose-500" />
                  <p className="text-xs font-bold text-rose-600">{error || 'Disconnected'}</p>
                  <button
                    onClick={onRestart}
                    className="mt-2 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Restart Connection
                  </button>
                </div>
              )}
            </div>

            {/* How to Scan Steps */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 text-left font-medium space-y-1">
              <p className="font-extrabold text-slate-900">How to scan:</p>
              <p>1. Open WhatsApp ➔ <strong>Settings</strong> ➔ <strong>Linked Devices</strong></p>
              <p>2. Tap <strong>Link a Device</strong> and scan QR code above</p>
            </div>

            <button
              onClick={() => setViewMode('LOGIN')}
              className="text-xs text-slate-600 hover:text-black font-extrabold underline cursor-pointer"
            >
              Back to Session Login
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom-Right QR Card (Desktop Threads Style) */}
      {status === 'QR_READY' && qrCodeDataUrl && viewMode === 'LOGIN' && (
        <div className="hidden md:flex fixed bottom-6 right-6 z-40 bg-white border border-slate-200/80 p-3.5 rounded-3xl shadow-xl flex-col items-center w-48 text-center transition-all hover:scale-105">
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-[#0095f6]" /> Scan to Link Device
          </p>
          <div className="bg-white p-2 rounded-2xl border-2 border-slate-900 shadow-xs">
            <img src={qrCodeDataUrl} alt="WhatsApp QR Code" className="w-36 h-36 object-contain" />
          </div>
          <button
            onClick={() => setViewMode('QR')}
            className="mt-2 text-[10px] text-blue-600 font-extrabold hover:underline"
          >
            Enlarge QR Code
          </button>
        </div>
      )}

      {/* Threads Footer */}
      <div className="w-full py-4 px-6 border-t border-slate-100 bg-white text-center text-[11px] text-slate-400 font-medium relative z-10 flex flex-wrap items-center justify-center gap-4">
        <span>© 2026 Threads AI</span>
        <span>•</span>
        <span className="hover:underline cursor-pointer">Terms</span>
        <span className="hover:underline cursor-pointer">Privacy Policy</span>
        <span className="hover:underline cursor-pointer">Security</span>
        <span className="hover:underline cursor-pointer">Firebase Cloud Sync</span>
        <span className="hover:underline cursor-pointer">Report a problem</span>
      </div>
    </div>
  );
}
