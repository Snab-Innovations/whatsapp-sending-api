import React, { useState } from 'react';
import { Search, Pin, Users, User, MessageCircle, CheckCheck } from 'lucide-react';

export default function ChatList({ chats, activeChatId, onSelectChat, loading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'groups'

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
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          chat.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === 'unread') return chat.unreadCount > 0;
    if (filter === 'groups') return chat.isGroup;
    return true;
  });

  return (
    <div className="w-80 sm:w-96 bg-[#111b21] border-r border-[#222d34] flex flex-col h-full shrink-0">
      {/* Search Header */}
      <div className="p-3 bg-[#111b21] border-b border-[#222d34] space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#202c33] text-[#e9edef] text-sm pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00a884] placeholder-[#8696a0]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#00a884] text-[#0b141a]'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            All ({chats.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-[#00a884] text-[#0b141a]'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('groups')}
            className={`px-3 py-1 rounded-full font-medium transition-colors ${
              filter === 'groups'
                ? 'bg-[#00a884] text-[#0b141a]'
                : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Chat List Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/40">
        {loading ? (
          <div className="p-8 text-center text-[#8696a0] space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#00a884] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs">Fetching chats from WhatsApp device...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-[#8696a0] text-xs">
            No chats found matching your criteria.
          </div>
        ) : (
          filteredChats.map((chat, idx) => {
            const chatKey = typeof chat.id === 'object' ? (chat.id._serialized || String(idx)) : String(chat.id || idx);
            const isActive = chat.id === activeChatId;

            return (
              <div
                key={chatKey}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors ${
                  isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {chat.profilePicUrl ? (
                    <img
                      src={chat.profilePicUrl}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#222d34]"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                      chat.isGroup ? 'bg-[#202c33] text-[#00a884]' : 'bg-[#00a884]/20 text-[#00a884]'
                    }`}>
                      {chat.isGroup ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                  )}

                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#00a884] text-[#0b141a] font-bold text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-[#111b21]">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="text-sm font-semibold text-[#e9edef] truncate">{chat.name}</h3>
                    <span className="text-[11px] text-[#8696a0] shrink-0 font-mono">
                      {formatTimestamp(chat.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs text-[#8696a0] truncate flex items-center gap-1">
                      {chat.lastMessage?.fromMe && (
                        <CheckCheck className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
                      )}
                      <span>{chat.lastMessage?.body || 'No messages yet'}</span>
                    </p>

                    {chat.isPinned && (
                      <Pin className="w-3 h-3 text-[#8696a0] rotate-45 shrink-0" />
                    )}
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
