import React from 'react';
import { QrCode, Smartphone, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function QRModal({ clientState, onRestart, onResetSession }) {
  const { status, qrCodeDataUrl, error } = clientState;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Instagram Gradient Highlight Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 ig-gradient-bg" />

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

        {/* Auth Info Banner */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 justify-center font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Sessions are preserved locally in <code className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded">baileys_auth_info</code>. Re-scanning is not required on restarts!</span>
        </div>
      </div>
    </div>
  );
}
