import React, { useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  LogOut,
  Wifi,
  WifiOff,
  Loader2,
  Plus,
  Sparkles,
  Bot,
  BarChart3,
  FolderKanban,
  Instagram,
  Lock,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  X
} from 'lucide-react';
import { clearSessionPasscode, getSessionPasscode, setSessionPasscode } from '../utils/session';
import { setPasscode as apiSetPasscode } from '../services/api';

export default function Header({
  clientState,
  onSync,
  onLogout,
  loadingSync,
  onOpenNewChat,
  activeTab,
  onTabChange,
  taskCount = 0,
  sessionId,
  onLockSession
}) {
  const { status, userInfo } = clientState;

  const getStatusBadge = () => {
    switch (status) {
      case 'READY':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Baileys Connected
          </span>
        );
      case 'AUTHENTICATED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-600 border border-sky-200 shadow-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Authenticating...
          </span>
        );
      case 'QR_READY':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 shadow-sm">
            <Wifi className="w-3.5 h-3.5" />
            Scan QR Code
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 shadow-sm">
            <WifiOff className="w-3.5 h-3.5" />
            Disconnected
          </span>
        );
    }
  };

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [copiedType, setCopiedType] = useState('');
  const [customPasscode, setCustomPasscode] = useState('');
  const [passcodeMsg, setPasscodeMsg] = useState('');

  const currentPasscode = getSessionPasscode();

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(''), 2000);
  };

  const handleUpdatePasscode = async (e) => {
    e.preventDefault();
    if (!customPasscode || customPasscode.trim().length < 4) {
      setPasscodeMsg('Passcode must be at least 4 characters long.');
      return;
    }
    try {
      await apiSetPasscode(customPasscode.trim());
      setSessionPasscode(customPasscode.trim());
      setPasscodeMsg('✅ Access Passcode updated successfully!');
      setCustomPasscode('');
      setTimeout(() => setPasscodeMsg(''), 3000);
    } catch (err) {
      setPasscodeMsg(`Error: ${err.message}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none shadow-xs z-30">
      {/* Left Logo & Brand */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('DASHBOARD')}>
        <div className="w-10 h-10 rounded-2xl ig-gradient-bg flex items-center justify-center shadow-md shadow-pink-500/20">
          <Bot className="w-6 h-6 text-[#ffffff]" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
            <span className="ig-gradient-text">WhatsApp AI</span>
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" /> Gemini 1.5
            </span>
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Instagram Professional AI Task Manager</p>
        </div>
      </div>

      {/* Center Navigation Tabs - Instagram Style */}
      <div className="hidden lg:flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
        {/* Main Dashboard */}
        <button
          onClick={() => onTabChange('DASHBOARD')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'DASHBOARD'
              ? 'ig-gradient-bg text-white shadow-md shadow-rose-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>

        {/* WhatsApp Chats */}
        <button
          onClick={() => onTabChange('CHATS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'CHATS' || activeTab === 'WORKSPACE'
              ? 'bg-[#0095f6] text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Direct Chats
        </button>

        {/* Task Board */}
        <button
          onClick={() => onTabChange('KANBAN')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'KANBAN'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Task Board
          {taskCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-600 font-extrabold">
              {taskCount}
            </span>
          )}
        </button>

        {/* Executive Analytics */}
        <button
          onClick={() => onTabChange('ANALYTICS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'ANALYTICS'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </button>
      </div>

      {/* Right Status & User Profile */}
      <div className="flex items-center gap-3">
        {getStatusBadge()}

        {status === 'READY' && userInfo && (
          <div className="flex items-center gap-2.5 bg-slate-50 px-2.5 py-1 rounded-2xl border border-slate-200">
            {/* Instagram Story Gradient Ring */}
            <div className="p-[2px] rounded-full ig-gradient-bg shadow-sm">
              <div className="w-7 h-7 rounded-full bg-white text-slate-900 flex items-center justify-center font-extrabold text-xs">
                {userInfo.pushname ? userInfo.pushname.charAt(0).toUpperCase() : 'W'}
              </div>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{userInfo.pushname}</p>
              <p className="text-[10px] text-slate-500 font-mono">{userInfo.phone ? `+${userInfo.phone}` : ''}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {status === 'READY' && (
            <>
              <button
                onClick={onOpenNewChat}
                className="px-3.5 py-2 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Chat
              </button>

              <button
                onClick={onSync}
                disabled={loadingSync}
                title="Sync & Refetch Chats"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSync ? 'animate-spin text-[#0095f6]' : ''}`} />
              </button>
            </>
          )}

          {/* Key Passcode View/Edit Button */}
          <button
            onClick={() => setIsKeyModalOpen(true)}
            title="View & Copy Access PIN / Passcode"
            className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors border border-purple-200 flex items-center justify-center cursor-pointer shadow-xs"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              clearSessionPasscode();
              if (onLockSession) onLockSession();
            }}
            title="Lock Session & Require Passcode"
            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors border border-amber-200 flex items-center justify-center cursor-pointer"
          >
            <Lock className="w-4 h-4" />
          </button>

          {status === 'READY' && (
            <button
              onClick={onLogout}
              title="Logout & Clear Local Session"
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200 flex items-center justify-center cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Access Key / Passcode Info Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsKeyModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 mb-2 border border-purple-200">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Your Session Access Key</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Use this Session ID and PIN to access your WhatsApp tasks from any browser or device!
              </p>
            </div>

            <div className="space-y-4">
              {/* Session ID Box */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Session ID:</p>
                <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-900">
                  <span className="truncate max-w-[240px]">{sessionId || 'default'}</span>
                  <button
                    onClick={() => handleCopy(sessionId, 'session')}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#0095f6] hover:underline"
                  >
                    {copiedType === 'session' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedType === 'session' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Passcode Box */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl">
                <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">Access PIN / Passcode:</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-amber-700 tracking-widest">
                    {showPasscode ? currentPasscode || 'None set' : '••••••'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1"
                    >
                      {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopy(currentPasscode, 'passcode')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                    >
                      {copiedType === 'passcode' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedType === 'passcode' ? 'Copied' : 'Copy PIN'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Passcode Form */}
              <form onSubmit={handleUpdatePasscode} className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">Set Custom Passcode</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customPasscode}
                    onChange={(e) => setCustomPasscode(e.target.value)}
                    placeholder="Enter new 4-12 char PIN"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                  >
                    Save
                  </button>
                </div>
                {passcodeMsg && (
                  <p className="text-[11px] font-bold mt-1.5 text-slate-700">{passcodeMsg}</p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
