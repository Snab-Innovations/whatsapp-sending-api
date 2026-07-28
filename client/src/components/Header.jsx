import React from 'react';
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
  Instagram
} from 'lucide-react';

export default function Header({
  clientState,
  onSync,
  onLogout,
  loadingSync,
  onOpenNewChat,
  activeTab,
  onTabChange,
  taskCount = 0
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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none shadow-xs z-30">
      {/* Left Logo & Brand */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('DASHBOARD')}>
        <div className="w-10 h-10 rounded-2xl ig-gradient-bg flex items-center justify-center shadow-md shadow-pink-500/20">
          <Bot className="w-6 h-6 text-white" />
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

        {status === 'READY' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewChat}
              className="px-3.5 py-2 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>

            <button
              onClick={onSync}
              disabled={loadingSync}
              title="Sync & Refetch Chats"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 disabled:opacity-50 flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSync ? 'animate-spin text-[#0095f6]' : ''}`} />
            </button>

            <button
              onClick={onLogout}
              title="Logout & Clear Local Session"
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200 flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
