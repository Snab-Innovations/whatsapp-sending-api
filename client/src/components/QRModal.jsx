import React, { useState } from 'react';
import { QrCode, Smartphone, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, KeyRound, Lock, ArrowRight, UserCheck } from 'lucide-react';
import { switchSession } from '../utils/session';

export default function QRModal({ clientState, onRestart, onResetSession }) {
  const { status, qrCodeDataUrl, error } = clientState;
  const [showExistingLoginForm, setShowExistingLoginForm] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState('');
  const [targetPasscode, setTargetPasscode] = useState('');

  const handleExistingSessionLogin = (e) => {
    e.preventDefault();
    if (!targetSessionId.trim() || !targetPasscode.trim()) return;
    switchSession(targetSessionId.trim(), targetPasscode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Instagram Gradient Highlight Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 ig-gradient-bg" />

        {!showExistingLoginForm ? (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl ig-gradient-bg text-white mb-3 shadow-md shadow-pink-500/20">
                <QrCode className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Scan QR Code to Connect</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Link your WhatsApp device using Baileys WebSocket & persistent local storage
              </p>
            </div>

            {/* Status Content Area */}
            <div className="flex flex-col items-center justify-center my-4 min-h-[260px] bg-slate-50 border border-slate-200 rounded-2xl p-4 relative">
              {status === 'QR_READY' && qrCodeDataUrl ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-3 rounded-2xl shadow-lg border-4 border-[#0095f6]">
                    <img
                      src={qrCodeDataUrl}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                  <p className="text-xs text-[#0095f6] font-bold mt-3 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#0095f6]" />
                    Live QR Code generated — waiting for phone scan...
                  </p>

                  {clientState.passcode && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center w-full max-w-xs shadow-sm">
                      <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Your Session Access Passcode:</p>
                      <div className="text-2xl font-mono font-black text-amber-700 tracking-widest my-1">{clientState.passcode}</div>
                      <p className="text-[10px] text-amber-800 font-medium">Save this PIN! You will need it to access messages & tasks.</p>
                    </div>
                  )}
                </div>
              ) : status === 'INITIALIZING' ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#0095f6] animate-spin" />
                  <p className="text-sm font-bold text-slate-900">Starting Baileys WhatsApp Engine...</p>
                  <p className="text-xs text-slate-500 max-w-xs text-center font-medium">
                    Initializing socket connection. The QR code will appear here shortly.
                  </p>
                  <button
                    onClick={onResetSession}
                    className="mt-2 text-xs text-rose-600 hover:underline font-bold transition-colors"
                  >
                    Taking too long? Force Reset Session & Fresh QR
                  </button>
                </div>
              ) : status === 'AUTHENTICATED' ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
                  <p className="text-base font-bold text-slate-900">Authenticated successfully!</p>
                  <p className="text-xs text-slate-500 font-medium">Syncing contacts and message history...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <AlertTriangle className="w-10 h-10 text-rose-500" />
                  <p className="text-sm font-bold text-rose-600">
                    {error || 'Client disconnected or initialization timed out.'}
                  </p>
                  <button
                    onClick={onRestart}
                    className="mt-2 px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Restart Connection
                  </button>
                </div>
              )}
            </div>

            {/* Step-by-step guidance */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2.5">
              <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Smartphone className="w-4 h-4 text-[#0095f6]" /> How to scan:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 font-medium">
                <li>Open <strong className="text-slate-900">WhatsApp</strong> on your mobile phone</li>
                <li>Tap <strong className="text-slate-900">Settings</strong> and select <strong className="text-slate-900">Linked Devices</strong></li>
                <li>Tap <strong className="text-slate-900">Link a Device</strong> and scan the QR code above</li>
              </ol>
            </div>

            {/* Already Scanned Login Option */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                onClick={() => setShowExistingLoginForm(true)}
                className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 w-full shadow-xs cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-purple-600" /> Already scanned WhatsApp? Login with Session ID & PIN
              </button>
            </div>

            {/* Auth Info Banner */}
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 justify-center font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Sessions are preserved locally on server. Re-scanning is not required if logged in!</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 mb-3 border border-purple-200">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Login to Existing Session</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Enter your Session ID and Access PIN to log in without scanning QR code again.
              </p>
            </div>

            <form onSubmit={handleExistingSessionLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Session ID</label>
                <input
                  type="text"
                  value={targetSessionId}
                  onChange={(e) => setTargetSessionId(e.target.value)}
                  placeholder="e.g. user_x9a82b_175829"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0095f6]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Access PIN / Passcode</label>
                <input
                  type="password"
                  value={targetPasscode}
                  onChange={(e) => setTargetPasscode(e.target.value)}
                  placeholder="Session Passcode (e.g. 673910)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0095f6]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExistingLoginForm(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Back to QR Scan
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Log In <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
