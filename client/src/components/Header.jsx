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
  Lock,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
  UserCheck,
  ChevronDown
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
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [copiedType, setCopiedType] = useState('');
  const [customPasscode, setCustomPasscode] = useState('');
  const [passcodeMsg, setPasscodeMsg] = useState('');
  const [showMobileActionsMenu, setShowMobileActionsMenu] = useState(false);

  const currentPasscode = getSessionPasscode();

  const getStatusBadge = () => {
    switch (status) {
      case 'READY':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">WhatsApp Connected</span>
            <span className="sm:hidden">Ready</span>
          </span>
        );
      case 'AUTHENTICATED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-50 text-sky-600 border border-sky-200/80 shadow-2xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
            <span className="hidden sm:inline">Authenticating...</span>
            <span className="sm:hidden">Syncing</span>
          </span>
        );
      case 'QR_READY':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
            <Wifi className="w-3.5 h-3.5 text-amber-600" />
            <span>Scan QR</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200/80 shadow-2xs">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Disconnected</span>
          </span>
        );
    }
  };

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
      setPasscodeMsg('✅ Access PIN updated successfully!');
      setCustomPasscode('');
      setTimeout(() => setPasscodeMsg(''), 3000);
    } catch (err) {
      setPasscodeMsg(`Error: ${err.message}`);
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between shrink-0 select-none shadow-2xs z-30 relative">
      {/* Left Brand Icon & Logo */}
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange('DASHBOARD')}>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-gradient-to-tr from-[#0095f6] via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 active:scale-95 transition-transform shrink-0">
          <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-black text-base sm:text-lg text-slate-900 tracking-tight leading-tight flex items-center gap-1.5 truncate">
            <span>WhatsApp AI</span>
            <span className="hidden sm:inline-flex uppercase text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 font-extrabold items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" /> Gemini 1.5
            </span>
          </h1>
          <p className="text-[10px] text-slate-500 font-medium truncate hidden sm:block">AI Task Planner & Direct Manager</p>
        </div>
      </div>

      {/* Center Segmented Control Nav Tabs (Desktop) */}
      <div className="hidden lg:flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
        <button
          onClick={() => onTabChange('DASHBOARD')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'DASHBOARD'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-[#0095f6]" />
          Dashboard
        </button>

        <button
          onClick={() => onTabChange('CHATS')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'CHATS' || activeTab === 'WORKSPACE'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-purple-600" />
          Chats
        </button>

        <button
          onClick={() => onTabChange('KANBAN')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'KANBAN'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderKanban className="w-4 h-4 text-amber-500" />
          Task Board
          {taskCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
              {taskCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('ANALYTICS')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'ANALYTICS'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-pink-500" />
          Analytics
        </button>
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {getStatusBadge()}

        {status === 'READY' && userInfo && (
          <div className="hidden md:flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-2xl border border-slate-200/80">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0095f6] to-purple-600 text-white flex items-center justify-center font-extrabold text-xs shadow-2xs">
              {userInfo.pushname ? userInfo.pushname.charAt(0).toUpperCase() : 'W'}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">{userInfo.pushname}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {status === 'READY' && (
            <>
              <button
                onClick={onOpenNewChat}
                className="px-3 py-1.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Chat</span>
              </button>

              <button
                onClick={onSync}
                disabled={loadingSync}
                title="Sync & Refetch Chats"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80 disabled:opacity-50 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSync ? 'animate-spin text-[#0095f6]' : ''}`} />
              </button>
            </>
          )}

          {/* Quick Access Key PIN Button */}
          <button
            onClick={() => setIsKeyModalOpen(true)}
            title="View Access PIN & Session Key"
            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors border border-amber-200/80 flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              clearSessionPasscode();
              if (onLockSession) onLockSession();
            }}
            title="Lock Session"
            className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors border border-purple-200/80 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <Lock className="w-4 h-4" />
          </button>

          {status === 'READY' && (
            <button
              onClick={onLogout}
              title="Logout Session"
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200/80 flex items-center justify-center cursor-pointer active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Access Key / PIN Info Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 w-full max-w-md rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setIsKeyModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mb-2 border border-amber-200">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Your Session Access Key</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Use your Session ID and PIN to log in from any phone or desktop browser!
              </p>
            </div>

            <div className="space-y-4">
              {/* Session ID Box */}
              <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Session ID:</p>
                <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-900">
                  <span className="truncate max-w-[240px]">{sessionId || 'default'}</span>
                  <button
                    onClick={() => handleCopy(sessionId, 'session')}
                    className="flex items-center gap-1 text-xs font-bold text-[#0095f6] hover:underline cursor-pointer"
                  >
                    {copiedType === 'session' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedType === 'session' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Passcode Box */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-4 rounded-2xl">
                <p className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider mb-1">Access PIN / Passcode:</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-amber-700 tracking-widest">
                    {showPasscode ? currentPasscode || 'None set' : '••••••'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleCopy(currentPasscode, 'passcode')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-xs cursor-pointer active:scale-95"
                    >
                      {copiedType === 'passcode' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedType === 'passcode' ? 'Copied' : 'Copy PIN'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Passcode Form */}
              <form onSubmit={handleUpdatePasscode} className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Set Custom Passcode</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customPasscode}
                    onChange={(e) => setCustomPasscode(e.target.value)}
                    placeholder="Enter new 4-12 char PIN"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    Save PIN
                  </button>
                </div>
                {passcodeMsg && (
                  <p className="text-[11px] font-bold mt-2 text-slate-700">{passcodeMsg}</p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
