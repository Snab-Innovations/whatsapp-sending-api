import React from 'react';
import { LayoutDashboard, MessageSquare, CheckSquare, Sparkles, KeyRound } from 'lucide-react';

export default function MobileBottomNav({
  activeTab,
  setActiveTab,
  unreadTotalCount,
  pendingTasksCount,
  onOpenKeyModal
}) {
  const navItems = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'CHATS',
      label: 'Chats',
      icon: MessageSquare,
      badge: unreadTotalCount > 0 ? unreadTotalCount : null
    },
    {
      id: 'KANBAN',
      label: 'Tasks',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : null
    },
    {
      id: 'ANALYTICS',
      label: 'AI Insights',
      icon: Sparkles,
      badge: null
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg pb-[env(safe-area-inset-bottom,8px)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#0095f6] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'}`} />
                {item.badge !== null && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#0095f6] mt-0.5 shadow-xs" />
              )}
            </button>
          );
        })}

        {/* Quick Access Key PIN Button */}
        <button
          onClick={onOpenKeyModal}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-500 hover:text-amber-600 transition-all relative cursor-pointer active:scale-95"
        >
          <div className="p-1 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <KeyRound className="w-4 h-4 stroke-[2px]" />
          </div>
          <span className="text-[10px] text-amber-700 font-bold tracking-tight mt-0.5">PIN</span>
        </button>
      </div>
    </div>
  );
}
