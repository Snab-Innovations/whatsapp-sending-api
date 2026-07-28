import React from 'react';
import { MessageSquare, RefreshCw, LogOut, Wifi, WifiOff, Loader2, Plus, Sparkles, Columns, Bot, BarChart3 } from 'lucide-react';

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
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Baileys WebSocket Ready
          </span>
        );
      case 'AUTHENTICATED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Authenticated...
          </span>
        );
      case 'QR_READY':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Wifi className="w-3.5 h-3.5" />
            Scan QR Code
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <WifiOff className="w-3.5 h-3.5" />
            Disconnected
          </span>
        );
    }
  };

  return (
    <header className="h-16 bg-[#111b21] border-b border-[#222d34] px-4 flex items-center justify-between shrink-0 select-none">
      {/* Left Logo & Brand */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Bot className="w-6 h-6 text-[#0b141a]" />
        </div>
        <div>
          <h1 className="font-bold text-base text-[#e9edef] flex items-center gap-2">
            WhatsApp Gemini AI Workspace
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" /> Gemini 1.5
            </span>
          </h1>
          <p className="text-xs text-[#8696a0]">Real-Time Message Analysis & Task Planner</p>
        </div>
      </div>

      {/* Center Navigation Mode Switcher */}
      <div className="hidden lg:flex items-center bg-[#0b141a] p-1 rounded-xl border border-[#222d34]">
        <button
          onClick={() => onTabChange('WORKSPACE')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'WORKSPACE'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40'
              : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          ⚡ Live Workspace
        </button>

        <button
          onClick={() => onTabChange('KANBAN')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'KANBAN'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/40'
              : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]'
          }`}
        >
          <Columns className="w-4 h-4" />
          📋 AI Task Planner
          {taskCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-400 text-purple-950 font-bold">
              {taskCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('ANALYTICS')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ANALYTICS'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950/40'
              : 'text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          📊 AI Analytics & Report
        </button>
      </div>

      {/* Right Status & Actions */}
      <div className="flex items-center gap-3">
        {getStatusBadge()}

        {status === 'READY' && userInfo && (
          <div className="flex items-center gap-2.5 bg-[#202c33]/70 px-3 py-1.5 rounded-lg border border-[#222d34]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-[#0b141a] flex items-center justify-center font-bold text-xs shadow-inner">
              {userInfo.pushname ? userInfo.pushname.charAt(0).toUpperCase() : 'W'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-[#e9edef] leading-tight">{userInfo.pushname}</p>
              <p className="text-[10px] text-[#8696a0] font-mono">{userInfo.phone ? `+${userInfo.phone}` : ''}</p>
            </div>
          </div>
        )}

        {status === 'READY' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewChat}
              className="px-3 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#008f6f] text-[#0b141a] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> New Message
            </button>

            <button
              onClick={onSync}
              disabled={loadingSync}
              title="Sync & Refetch Chats"
              className="p-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] transition-colors border border-[#222d34] disabled:opacity-50 flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSync ? 'animate-spin text-[#00a884]' : ''}`} />
            </button>

            <button
              onClick={onLogout}
              title="Logout & Clear Local Session"
              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20 flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
