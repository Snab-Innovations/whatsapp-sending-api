import React, { useState, useEffect } from 'react';
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
  PlusCircle,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { switchSession, resetSessionId, setSessionPasscode } from '../utils/session';
import { verifyPasscode } from '../services/api';

export default function AuthModal({
  clientState,
  onRestart,
  onResetSession,
  sessionId,
  onUnlocked
}) {
  const { status, qrCodeDataUrl, error: serverError, isLocked } = clientState;

  // Active view: 'QR' | 'LOGIN' | 'UNLOCK'
  const [activeMode, setActiveMode] = useState(isLocked ? 'UNLOCK' : 'QR');

  useEffect(() => {
    if (isLocked) {
      setActiveMode('UNLOCK');
    }
  }, [isLocked]);

  // Existing Session Login state
  const [targetSessionId, setTargetSessionId] = useState('');
  const [targetPasscode, setTargetPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Current Session Unlock state
  const [unlockPasscode, setUnlockPasscode] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);

  const handleExistingSessionLogin = async (e) => {
    e.preventDefault();
    const cleanId = targetSessionId.trim();
    const cleanPass = targetPasscode.trim();

    if (!cleanId || !cleanPass) {
      setLoginError('Both Session ID and Access PIN are required.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      // Switch session using correct SESSION_KEY and PASSCODE_KEY
      switchSession(cleanId, cleanPass);
    } catch (err) {
      setLoginError(err.message || 'Invalid Session ID or Access PIN. Login denied.');
      setLoginLoading(false);
    }
  };

  const handleUnlockCurrentSession = async (e) => {
    e.preventDefault();
    if (!unlockPasscode || unlockPasscode.trim().length < 4) {
      setUnlockError('Passcode must be at least 4 characters.');
      return;
    }

    setUnlockLoading(true);
    setUnlockError('');

    try {
      setSessionPasscode(unlockPasscode.trim());
      await verifyPasscode(unlockPasscode.trim());
      if (onUnlocked) onUnlocked();
    } catch (err) {
      setUnlockError(err.message || 'Incorrect PIN passcode. Access denied.');
      setUnlockLoading(false);
    }
  };

  const handleNewSession = () => {
    resetSessionId();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Accent Bar */}
        <div className="h-1.5 ig-gradient-bg w-full" />

        {/* Header Mode Switcher Tabs */}
        <div className="bg-slate-100/80 p-1.5 border-b border-slate-200 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveMode('QR')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'QR'
                ? 'bg-white text-[#0095f6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> Scan QR Code
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('LOGIN')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'LOGIN'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Log In
          </button>

          {isLocked && (
            <button
              type="button"
              onClick={() => setActiveMode('UNLOCK')}
              className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'UNLOCK'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Unlock
            </button>
          )}
        </div>

        <div className="p-6 sm:p-8">
          {/* MODE 1: QR CODE DISPLAY */}
          {activeMode === 'QR' && (
            <div>
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl ig-gradient-bg text-white mb-3 shadow-md shadow-pink-500/20">
                  <QrCode className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Connect WhatsApp</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Link your phone using Baileys engine & persistent storage
                </p>
              </div>

              {/* Status Content */}
              <div className="flex flex-col items-center justify-center my-4 min-h-[240px] bg-slate-50 border border-slate-200 rounded-2xl p-4 relative">
                {status === 'QR_READY' && qrCodeDataUrl ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-3 rounded-2xl shadow-lg border-4 border-[#0095f6]">
                      <img src={qrCodeDataUrl} alt="WhatsApp QR Code" className="w-52 h-52 object-contain" />
                    </div>
                    <p className="text-xs text-[#0095f6] font-bold mt-3 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-[#0095f6]" />
                      Live QR Code generated — scan with WhatsApp phone...
                    </p>
                  </div>
                ) : status === 'INITIALIZING' ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#0095f6] animate-spin" />
                    <p className="text-sm font-bold text-slate-900">Initializing Baileys Engine...</p>
                    <p className="text-xs text-slate-500 max-w-xs text-center font-medium">
                      Socket connection in progress. QR code will update automatically.
                    </p>
                    <button
                      onClick={onResetSession}
                      className="mt-2 text-xs text-rose-600 hover:underline font-bold"
                    >
                      Reset Session & Re-Generate
                    </button>
                  </div>
                ) : status === 'AUTHENTICATED' ? (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
                    <p className="text-base font-bold text-slate-900">Authenticated successfully!</p>
                    <p className="text-xs text-slate-500 font-medium">Syncing contacts and messages...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                    <p className="text-sm font-bold text-rose-600">{serverError || 'Connection timed out.'}</p>
                    <button
                      onClick={onRestart}
                      className="mt-2 px-4 py-2 bg-[#0095f6] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Restart Connection
                    </button>
                  </div>
                )}
              </div>

              {/* How to scan instructions */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#0095f6]" /> How to connect:
                </p>
                <ol className="list-decimal list-inside space-y-1 font-medium">
                  <li>Open <strong className="text-slate-900">WhatsApp</strong> on your phone</li>
                  <li>Go to <strong className="text-slate-900">Settings</strong> $\rightarrow$ <strong className="text-slate-900">Linked Devices</strong></li>
                  <li>Tap <strong className="text-slate-900">Link a Device</strong> and scan the QR code above</li>
                </ol>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setActiveMode('LOGIN')}
                  className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-purple-600" /> Already scanned WhatsApp? Login with Session ID & PIN
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: LOGIN TO EXISTING SESSION */}
          {activeMode === 'LOGIN' && (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 mb-3 border border-purple-200">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Login to Existing Session</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Enter your unique Session ID and Access PIN to log in without re-scanning QR code.
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    placeholder="Session Access PIN"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveMode('QR')}
                    className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Back to QR
                  </button>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-1/2 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Log In <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 3: UNLOCK CURRENT SESSION */}
          {activeMode === 'UNLOCK' && (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl ig-gradient-bg text-white mb-3 shadow-lg shadow-pink-500/20">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Session Locked</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Enter your session passcode to unlock messages and AI tasks.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-700">
                  Session: <span className="text-[#0095f6]">{sessionId || 'default'}</span>
                </div>
              </div>

              <form onSubmit={handleUnlockCurrentSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Access Passcode</label>
                  <input
                    type="password"
                    value={unlockPasscode}
                    onChange={(e) => setUnlockPasscode(e.target.value)}
                    placeholder="Enter your PIN"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0095f6]"
                    autoFocus
                    required
                  />
                </div>

                {unlockError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{unlockError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={unlockLoading}
                  className="w-full py-3.5 bg-[#0095f6] hover:bg-[#1877f2] text-white font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {unlockLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Unlock Session <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <button
                  onClick={handleNewSession}
                  className="text-slate-500 hover:text-rose-600 flex items-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" /> Start New Session
                </button>
                <button
                  onClick={() => setActiveMode('LOGIN')}
                  className="text-purple-600 hover:underline"
                >
                  Switch Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
