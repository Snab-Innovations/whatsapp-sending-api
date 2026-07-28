import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Users, MessageSquare, Search, CheckCheck, Loader2, Sparkles } from 'lucide-react';
import { getAIReplySuggestions } from '../services/api';

export default function ChatWindow({ chat, messages, loadingMessages, onSendMessage }) {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [aiReplies, setAiReplies] = useState([]);
  const [loadingAiReplies, setLoadingAiReplies] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    setAiReplies([]);
  }, [messages, chat]);

  const handleFetchAIReplys = async () => {
    if (!chat) return;
    try {
      setLoadingAiReplies(true);
      const res = await getAIReplySuggestions(chat.id);
      setAiReplies(res.replies || []);
    } catch (err) {
      console.error('Failed to get AI reply suggestions:', err);
    } finally {
      setLoadingAiReplies(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    try {
      setSending(true);
      await onSendMessage(inputText.trim());
      setInputText('');
      setAiReplies([]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (ts) => {
    if (!ts) return '';
    return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderAIBadges = (aiAnalysis) => {
    if (!aiAnalysis) return null;

    const { hasTask, priority, category, dueDate, sentiment } = aiAnalysis;

    return (
      <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-[10px]">
        {hasTask && (
          <span className="px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            📌 Task: {aiAnalysis.taskTitle || 'Action Item'}
          </span>
        )}

        {priority && (
          <span
            className={`px-1.5 py-0.5 rounded font-bold ${
              priority === 'HIGH'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : priority === 'MEDIUM'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            🔥 {priority}
          </span>
        )}

        {category && (
          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
            🏷️ {category}
          </span>
        )}

        {dueDate && (
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
            📅 {dueDate}
          </span>
        )}

        {sentiment && sentiment !== 'Neutral' && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
            💭 {sentiment}
          </span>
        )}
      </div>
    );
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center chat-pattern border-l border-[#222d34] text-center p-6 select-none">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 border border-[#222d34] flex items-center justify-center mb-4 shadow-xl text-[#0b141a]">
          <MessageSquare className="w-10 h-10 fill-current" />
        </div>
        <h2 className="text-xl font-bold text-[#e9edef]">WhatsApp Gemini AI Command Center</h2>
        <p className="text-sm text-[#8696a0] max-w-sm mt-2">
          Select a conversation from the sidebar to inspect AI action items, tasks, and smart reply suggestions.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-xs text-purple-300 font-medium">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          Gemini 1.5 Real-Time AI Inspector Active
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] chat-pattern border-l border-[#222d34]">
      {/* Active Chat Header */}
      <div className="h-16 bg-[#111b21] border-b border-[#222d34] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {chat.profilePicUrl ? (
            <img
              src={chat.profilePicUrl}
              alt={chat.name}
              className="w-10 h-10 rounded-full object-cover border border-[#222d34]"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                chat.isGroup ? 'bg-[#202c33] text-[#00a884]' : 'bg-[#00a884]/20 text-[#00a884]'
              }`}
            >
              {chat.isGroup ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-[#e9edef] text-sm leading-tight">{chat.name}</h3>
            <p className="text-[11px] text-[#8696a0]">
              {chat.isGroup ? 'Group Conversation' : 'Direct Message'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFetchAIReplys}
            disabled={loadingAiReplies}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            {loadingAiReplies ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            )}
            ⚡ AI Draft Reply
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-[#8696a0]">
              <Loader2 className="w-6 h-6 animate-spin text-[#00a884]" />
              <span className="text-xs">Loading message history...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-[#8696a0]">
            No messages found in this chat.
          </div>
        ) : (
          messages.map((msg, index) => {
            const msgKey =
              typeof msg.id === 'object'
                ? msg.id._serialized || String(index)
                : String(msg.id || index);

            return (
              <div key={msgKey} className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-md relative group ${
                    msg.fromMe
                      ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                      : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-[#222d34]'
                  }`}
                >
                  {/* Author name if group */}
                  {chat.isGroup && !msg.fromMe && msg.author && (
                    <p className="text-[10px] font-bold text-[#00a884] mb-0.5 truncate">
                      {msg.author}
                    </p>
                  )}

                  <p className="break-words whitespace-pre-wrap leading-relaxed">{msg.body}</p>

                  {/* Gemini AI Action Metadata Badges */}
                  {renderAIBadges(msg.aiAnalysis)}

                  <div className="flex items-center justify-end gap-1 text-[10px] text-[#8696a0] mt-1.5">
                    <span>{formatMessageTime(msg.timestamp)}</span>
                    {msg.fromMe && <CheckCheck className="w-3.5 h-3.5 text-[#00a884]" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Gemini AI Smart Reply Pills */}
      {aiReplies.length > 0 && (
        <div className="px-3 py-2 bg-[#182229] border-t border-[#222d34] flex flex-wrap gap-2 animate-fadeIn">
          <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1 w-full mb-1">
            <Sparkles className="w-3 h-3 text-purple-400" /> Gemini Smart Reply Suggestions:
          </span>
          {aiReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(reply)}
              className="text-xs bg-[#202c33] hover:bg-purple-950/60 hover:border-purple-500/40 text-[#e9edef] px-3 py-1.5 rounded-lg border border-[#2a3942] transition-all text-left truncate max-w-full"
            >
              💬 {reply}
            </button>
          ))}
        </div>
      )}

      {/* Reply Input Composer */}
      <form onSubmit={handleSend} className="p-3 bg-[#111b21] border-t border-[#222d34] flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message or click AI Smart Reply above..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-[#202c33] text-[#e9edef] text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#00a884] placeholder-[#8696a0]"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="w-10 h-10 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-[#0b141a] flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:bg-[#00a884] shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin text-[#0b141a]" /> : <Send className="w-4 h-4 fill-current" />}
        </button>
      </form>
    </div>
  );
}
