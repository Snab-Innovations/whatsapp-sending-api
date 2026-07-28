import React, { useState } from 'react';
import { Search, Pin, Users, User, MessageCircle, CheckCheck, RefreshCw } from 'lucide-react';

export default function ChatList({ chats, activeChatId, onSelectChat, onSyncChats, loading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'groups'
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isSyncing || !onSyncChats) return;
    setIsSyncing(true);
    try {
      await onSyncChats();
    } finally {
      setTimeout(() => setIsSyncing(false), 1200);
    }
  };

  // Format timestamp relative to now
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Filtering
  const filteredChats = chats.filter((chat) => {
    const chatName = chat.name || '';
    const chatId = chat.id || '';
    const matchesSearch = chatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          chatId.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === 'unread') return chat.unreadCount > 0;
    if (filter === 'groups') return chat.isGroup;
    return true;
  });

  return (
    <div className="w-80 sm:w-96 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 shadow-xs">
      {/* Search Header - Instagram Direct Style */}
      <div className="p-4 bg-white border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-2">
            Direct Messages
          </h2>
          {onSyncChats && (
            <button
              onClick={handleSync}
              title="Sync WhatsApp Chats"
              disabled={isSyncing}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-[#0095f6] rounded-xl transition-colors flex items-center justify-center shrink-0 disabled:opacity-50 border border-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Direct Messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 text-slate-900 text-xs pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0095f6] placeholder-slate-400 font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1 rounded-full transition-all ${
              filter === 'all'
                ? 'bg-[#0095f6] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({chats.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-1 rounded-full transition-all ${
              filter === 'unread'
                ? 'bg-[#0095f6] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('groups')}
            className={`px-3.5 py-1 rounded-full transition-all ${
              filter === 'groups'
                ? 'bg-[#0095f6] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Chat List Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {loading && chats.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[#0095f6]" />
            <span>Loading WhatsApp Direct Messages...</span>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-3">
            <MessageCircle className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="font-bold text-slate-600">No chats found matching criteria</p>
            {onSyncChats && (
              <button
                onClick={handleSync}
                className="px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
              >
                Sync WhatsApp Chats
              </button>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const hasUnread = chat.unreadCount > 0;
            const isGroup = chat.isGroup;

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                  isActive
                    ? 'bg-sky-50/80 border-l-4 border-[#0095f6]'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Instagram Story Gradient Ring Avatar */}
                <div className="relative shrink-0">
                  <div className={`p-[2px] rounded-full ${hasUnread ? 'ig-gradient-bg shadow-sm' : 'bg-slate-200'}`}>
                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center font-black text-sm text-slate-800 shadow-xs">
                      {isGroup ? (
                        <Users className="w-5 h-5 text-purple-600" />
                      ) : (
                        chat.name ? chat.name.charAt(0).toUpperCase() : 'W'
                      )}
                    </div>
                  </div>
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#0095f6] border-2 border-white animate-pulse" />
                  )}
                </div>

                {/* Name & Snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`text-sm truncate font-bold ${isActive ? 'text-[#0095f6]' : 'text-slate-900'}`}>
                      {chat.name}
                    </h3>
                    <span className={`text-[11px] shrink-0 font-medium ${hasUnread ? 'text-[#0095f6] font-bold' : 'text-slate-400'}`}>
                      {formatTimestamp(chat.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <p className={`truncate ${hasUnread ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                      {chat.lastMessage?.fromMe && <span className="text-[#0095f6] font-bold">You: </span>}
                      {chat.lastMessage?.body || 'No messages yet'}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {chat.isPinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      {hasUnread && (
                        <span className="bg-[#0095f6] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
