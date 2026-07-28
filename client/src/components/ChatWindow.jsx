import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Users, MessageSquare, Search, CheckCheck, Loader2, Sparkles, ShieldAlert, Zap, Clock, Calendar, AlertTriangle, Briefcase, CreditCard, CheckCircle2 } from 'lucide-react';
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

  const renderAIBadges = (aiAnalysis, fromMe) => {
    if (!aiAnalysis) return null;

    const { hasTask, priority, category, dueDate, verdict } = aiAnalysis;

    return (
      <div className={`mt-2.5 pt-2 border-t flex flex-wrap items-center gap-1.5 text-[10px] ${fromMe ? 'border-white/20 text-white' : 'border-slate-200 text-slate-700'}`}>
        {hasTask && (
          <span className={`px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 ${fromMe ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
            <Sparkles className="w-3 h-3 text-pink-400" /> Action Item Discovered
          </span>
        )}

        {priority && (
          <span
            className={`px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 ${
              priority === 'HIGH'
                ? fromMe ? 'bg-rose-500/30 text-rose-100' : 'bg-rose-100 text-rose-700 border border-rose-200'
                : priority === 'MEDIUM'
                ? fromMe ? 'bg-amber-500/30 text-amber-100' : 'bg-amber-100 text-amber-800 border border-amber-200'
                : fromMe ? 'bg-sky-500/30 text-sky-100' : 'bg-sky-100 text-sky-700 border border-sky-200'
            }`}
          >
            {priority === 'HIGH' ? <ShieldAlert className="w-3 h-3 text-rose-500" /> : priority === 'MEDIUM' ? <Zap className="w-3 h-3 text-amber-500" /> : <Clock className="w-3 h-3 text-sky-500" />}
            {priority}
          </span>
        )}

        {category && (
          <span className={`px-2 py-0.5 rounded-full font-bold ${fromMe ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            {category}
          </span>
        )}

        {dueDate && (
          <span className={`px-2 py-0.5 rounded-full font-mono ${fromMe ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
            <Clock className="w-3 h-3 inline mr-1 text-amber-600" /> {dueDate}
          </span>
        )}

        {verdict && (
          <div className={`w-full mt-1.5 p-2 rounded-xl text-[11px] leading-snug font-medium ${fromMe ? 'bg-white/15 text-white border border-white/20' : 'bg-purple-50 text-purple-900 border border-purple-200'}`}>
            <span className="font-extrabold flex items-center gap-1 mb-0.5">
              <Sparkles className="w-3 h-3 text-pink-500" /> AI Verdict:
            </span>
            {verdict}
          </div>
        )}
      </div>
    );
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#fafafa] chat-pattern p-6 text-center text-slate-400 select-none">
        <div className="w-20 h-20 rounded-full ig-gradient-bg flex items-center justify-center mb-4 shadow-lg shadow-pink-500/20">
          <MessageSquare className="w-10 h-10 text-white stroke-[1.5]" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-1">Your Direct Messages</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Select a chat from the sidebar to view conversation history and automated Gemini AI action verdicts.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafa] border-l border-slate-200 overflow-hidden">
      {/* Instagram Direct Header */}
      <div className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Instagram Story Gradient Ring Avatar */}
          <div className="p-[2px] rounded-full ig-gradient-bg shadow-xs shrink-0">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-black text-xs text-slate-800">
              {chat.isGroup ? <Users className="w-4 h-4 text-purple-600" /> : chat.name ? chat.name.charAt(0).toUpperCase() : 'W'}
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="font-black text-sm text-slate-900 truncate leading-tight">{chat.name}</h2>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {chat.isGroup ? 'Group Conversation' : chat.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFetchAIReplys}
            disabled={loadingAiReplies}
            className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs transition-all border border-purple-200 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {loadingAiReplies ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
            )}
            AI Smart Replies
          </button>
        </div>
      </div>

      {/* AI Smart Reply Suggestions Bar */}
      {aiReplies.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border-b border-purple-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto shadow-xs">
          <span className="text-xs font-black text-purple-800 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Smart Suggestions:
          </span>
          {aiReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(reply)}
              className="text-xs bg-white hover:bg-purple-100 text-slate-800 font-semibold px-3 py-1 rounded-xl border border-purple-200 shadow-xs transition-all shrink-0 hover:scale-105 active:scale-95"
            >
              "{reply}"
            </button>
          ))}
        </div>
      )}

      {/* Message History Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 chat-pattern">
        {loadingMessages && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#0095f6]" />
            <span>Loading message thread...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 stroke-[1.5]" />
            <p className="font-bold text-slate-600">No messages in this chat yet.</p>
            <p className="text-[11px]">Send a message below to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const fromMe = Boolean(msg.fromMe);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md sm:max-w-lg p-3.5 rounded-2xl shadow-xs transition-all relative ${
                    fromMe
                      ? 'bg-[#0095f6] text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                  }`}
                >
                  {/* Sender Name in Group */}
                  {chat.isGroup && !fromMe && msg.author && (
                    <p className="text-[10px] font-black text-[#0095f6] mb-1 font-mono">
                      {msg.author.split('@')[0]}
                    </p>
                  )}

                  {/* Body Text */}
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-normal">
                    {msg.body}
                  </p>

                  {/* AI Analysis Badges & Verdict */}
                  {renderAIBadges(msg.aiAnalysis, fromMe)}

                  {/* Timestamp & Status Indicator */}
                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] mt-1 font-mono ${
                      fromMe ? 'text-white/80' : 'text-slate-400'
                    }`}
                  >
                    <span>{formatMessageTime(msg.timestamp)}</span>
                    {fromMe && <CheckCheck className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Bar */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-3">
        <input
          type="text"
          placeholder="Message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sending}
          className="flex-1 bg-slate-100 border border-slate-200 text-slate-900 text-sm px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0095f6] placeholder-slate-400 font-medium disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="px-5 py-2.5 bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-40 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 shrink-0"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" /> Send
            </>
          )}
        </button>
      </form>
    </div>
  );
}
