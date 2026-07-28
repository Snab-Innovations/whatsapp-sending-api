import React from 'react';
import { QrCode, Smartphone, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function QRModal({ clientState, onRestart, onResetSession }) {
  const { status, qrCodeDataUrl, error } = clientState;

  return (
    <div className="fixed inset-0 z-50 bg-[#0b141a]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111b21] border border-[#222d34] w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top ambient highlight line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#00a884] to-teal-400" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00a884]/15 border border-[#00a884]/30 text-[#00a884] mb-3 shadow-lg shadow-[#00a884]/10">
            <QrCode className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-[#e9edef]">Scan QR Code to Connect</h2>
          <p className="text-sm text-[#8696a0] mt-1">
            Link your WhatsApp device using local Puppeteer & LocalAuth session
          </p>
        </div>

        {/* Status Content Area */}
        <div className="flex flex-col items-center justify-center my-4 min-h-[260px] bg-[#0b141a] border border-[#222d34] rounded-xl p-4 relative">
          {status === 'QR_READY' && qrCodeDataUrl ? (
            <div className="flex flex-col items-center">
              <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-[#00a884]">
                <img
                  src={qrCodeDataUrl}
                  alt="WhatsApp QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>
              <p className="text-xs text-[#00a884] font-medium mt-3 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#00a884]" />
                Live QR Code generated — waiting for scan...
              </p>
            </div>
          ) : status === 'INITIALIZING' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-[#00a884]/20 border-t-[#00a884] animate-spin" />
              <p className="text-sm font-semibold text-[#e9edef]">Starting Chrome & WhatsApp Web...</p>
              <p className="text-xs text-[#8696a0] max-w-xs text-center">
                `whatsapp-web.js` is initializing. The QR code will appear here shortly.
              </p>
              <button
                onClick={onResetSession}
                className="mt-2 text-xs text-rose-400 hover:text-rose-300 underline font-medium transition-colors"
              >
                Taking too long? Force Reset Session & Fresh QR
              </button>
            </div>
          ) : status === 'AUTHENTICATED' ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-[#00a884] animate-bounce" />
              <p className="text-base font-semibold text-[#e9edef]">Authenticated successfully!</p>
              <p className="text-xs text-[#8696a0]">Syncing contacts and message history...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertTriangle className="w-10 h-10 text-rose-400" />
              <p className="text-sm font-semibold text-rose-300">
                {error || 'Client disconnected or initialization timed out.'}
              </p>
              <button
                onClick={onRestart}
                className="mt-2 px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-black font-semibold text-xs rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Restart Connection
              </button>
            </div>
          )}
        </div>

        {/* Step-by-step guidance */}
        <div className="bg-[#202c33]/50 rounded-xl p-4 border border-[#222d34] text-xs text-[#8696a0] space-y-2.5">
          <p className="font-semibold text-[#e9edef] flex items-center gap-1.5 text-xs">
            <Smartphone className="w-4 h-4 text-[#00a884]" /> How to scan:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[#8696a0]">
            <li>Open <strong className="text-[#e9edef]">WhatsApp</strong> on your mobile phone</li>
            <li>Tap <strong className="text-[#e9edef]">Menu ⚙️</strong> or <strong className="text-[#e9edef]">Settings</strong> and select <strong className="text-[#e9edef]">Linked Devices</strong></li>
            <li>Tap <strong className="text-[#e9edef]">Link a Device</strong> and scan the QR code above</li>
          </ol>
        </div>

        {/* LocalAuth Info Banner */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-[#8696a0] justify-center">
          <ShieldCheck className="w-4 h-4 text-[#00a884] shrink-0" />
          <span>Sessions are saved locally in <code className="bg-[#202c33] text-[#00a884] px-1.5 py-0.5 rounded">.wwebjs_auth</code>. Re-scanning is not required on restarts!</span>
        </div>
      </div>
    </div>
  );
}
