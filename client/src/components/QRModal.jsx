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
  ChevronRight,
  Copy,
  Check,
  Bot,
  Sparkles,
  Zap,
  Cloud,
  Shield
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
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col justify-between select-none font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Sleek Ambient Top Accent Header */}
      <div className="w-full bg-white border-b border-slate-200/80 py-4 px-6 flex items-center justify-between relative overflow-hidden shadow-2xs">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0095f6] via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>WhatsApp AI Hub</span>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" /> Gemini 1.5
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Automated Task Extraction & Direct Message Manager</p>
          </div>
        </div>

        {/* Top Right Feature Pills */}
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Real-Time AI
          </span>
          <span className="flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
            <Cloud className="w-3.5 h-3.5 text-blue-500" /> Firebase Cloud Sync
          </span>
        </div>
      </div>

      {/* Main Center Form Container */}
      <div className="w-full max-w-md mx-auto px-6 py-8 flex-1 flex flex-col justify-center items-center relative z-10">
        
        {/* Designer Login Header */}
        <div className="text-center mb-6 w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-950 text-white mb-3.5 shadow-xl shadow-slate-950/20">
            <Bot className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Log in to WhatsApp AI Session
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Access your direct messages, automated tasks, and AI insights
          </p>
        </div>

        {viewMode === 'LOGIN' ? (
          /* Login Form (Clean Designer Input Style) */
          <div className="w-full space-y-4">
            <form onSubmit={handleExistingSessionLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Session ID</label>
                <input
                  type="text"
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value)}
                  placeholder="e.g. user_x9a82b_175829"
                  className="w-full bg-white border border-slate-200/80 text-slate-900 text-sm px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0095f6] placeholder-slate-400 font-mono font-bold shadow-2xs transition-all"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Access PIN / Passcode</label>
                <input
                  type="password"
                  value={targetPasscode}
                  onChange={(e) => setTargetPasscode(e.target.value)}
                  placeholder="Session Passcode (e.g. 673910)"
                  className="w-full bg-white border border-slate-200/80 text-slate-900 text-sm px-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0095f6] placeholder-slate-400 font-mono font-bold shadow-2xs transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-black text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all shadow-md shadow-slate-950/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                Log in <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* "or" Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-slate-50 px-3 text-xs font-bold text-slate-400 uppercase tracking-widest absolute">or</span>
            </div>

            {/* Option to Scan QR Code */}
            <button
              onClick={() => setViewMode('QR')}
              className="w-full bg-white hover:bg-slate-100/80 border border-slate-200 text-slate-900 font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-2xl transition-all shadow-xs flex items-center justify-between cursor-pointer active:scale-95 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#0095f6] text-white flex items-center justify-center shadow-xs">
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
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col items-center">
              {status === 'QR_READY' && qrCodeDataUrl ? (
                <div className="flex flex-col items-center w-full">
                  <div className="bg-white p-3.5 rounded-2xl shadow-lg border-4 border-[#0095f6]">
                    <img
                      src={qrCodeDataUrl}
                      alt="WhatsApp QR Code"
                      className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                    />
                  </div>

                  <p className="text-xs text-[#0095f6] font-extrabold mt-3 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#0095f6]" />
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
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPin ? 'Copied' : 'Copy PIN'}
                      </button>
                    </div>
                  )}
                </div>
              ) : status === 'INITIALIZING' ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#0095f6] animate-spin" />
                  <p className="text-sm font-extrabold text-slate-900">Starting Baileys Engine...</p>
                  <p className="text-xs text-slate-500 max-w-xs">Initializing WhatsApp socket connection. QR code loading...</p>
                  <button
                    onClick={onResetSession}
                    className="mt-2 text-xs text-rose-600 font-bold hover:underline cursor-pointer"
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
                    className="mt-2 px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Restart Connection
                  </button>
                </div>
              )}
            </div>

            {/* How to Scan Steps */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 text-left font-medium space-y-1">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#0095f6]" /> Quick Scan Guide:
              </p>
              <p>1. Open WhatsApp ➔ <strong>Settings</strong> ➔ <strong>Linked Devices</strong></p>
              <p>2. Tap <strong>Link a Device</strong> and scan QR code above</p>
            </div>

            <button
              onClick={() => setViewMode('LOGIN')}
              className="text-xs text-[#0095f6] hover:underline font-extrabold cursor-pointer"
            >
              Back to Session Login
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom-Right QR Card (Desktop View) */}
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
            className="mt-2 text-[10px] text-[#0095f6] font-extrabold hover:underline cursor-pointer"
          >
            Enlarge QR Code
          </button>
        </div>
      )}

      {/* Footer Branding with SNAB Innovations Link */}
      <div className="w-full py-4 px-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500 font-medium relative z-10 flex flex-wrap items-center justify-center gap-3">
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
