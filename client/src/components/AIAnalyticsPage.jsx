import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw, AlertTriangle, CheckCircle, Clock, Zap, MessageSquare } from 'lucide-react';
import { getAnalytics, analyzeAllMessages } from '../services/api';

export default function AIAnalyticsPage({ tasks = [], onJumpToChat, onRefreshTasks }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [analyzeReport, setAnalyzeReport] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAll = async () => {
    try {
      setAnalyzingAll(true);
      setAnalyzeReport(null);
      const res = await analyzeAllMessages();
      setAnalyzeReport(res.report);
      await fetchAnalytics();
      if (onRefreshTasks) onRefreshTasks();
    } catch (err) {
      console.error('Bulk analysis error:', err);
      alert('Analysis error: ' + err.message);
    } finally {
      setAnalyzingAll(false);
    }
  };

  const highPriorityTasks = tasks.filter(t => t.priority === 'HIGH');
  const mediumPriorityTasks = tasks.filter(t => t.priority === 'MEDIUM');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] text-[#e9edef] overflow-y-auto p-6 space-y-6">
      {/* Top Banner & Analyze All Action */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            Gemini 1.5 Real-Time Intelligence
          </div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            Executive AI Analytics & Task Report
          </h2>
          <p className="text-xs text-[#8696a0] max-w-xl mt-1 leading-relaxed">
            Run a full Gemini AI scan across all historical WhatsApp messages to extract actionable tasks, analyze chat sentiment, and prioritize critical deliverables.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-start md:items-end gap-2">
          <button
            onClick={handleAnalyzeAll}
            disabled={analyzingAll}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#0b141a] font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2.5 disabled:opacity-50"
          >
            {analyzingAll ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gemini AI Scanning All Messages...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                ⚡ Analyze All Messages Now
              </>
            )}
          </button>

          {analyzeReport && (
            <span className="text-[11px] text-emerald-400 font-mono">
              ✓ Analyzed {analyzeReport.analyzedCount} messages! Found {analyzeReport.newTasksExtracted} new tasks.
            </span>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111b21] border border-[#202c33] p-5 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8696a0] font-semibold uppercase tracking-wider">Messages Analyzed</p>
            <h3 className="text-2xl font-bold text-white mt-1">{analytics?.totalMessages || 0}</h3>
            <p className="text-[10px] text-emerald-400 mt-1">Across {analytics?.totalChats || 0} chats</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
            💬
          </div>
        </div>

        <div className="bg-[#111b21] border border-[#202c33] p-5 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8696a0] font-semibold uppercase tracking-wider">Extracted Action Items</p>
            <h3 className="text-2xl font-bold text-purple-300 mt-1">{tasks.length}</h3>
            <p className="text-[10px] text-purple-400 mt-1">Auto-detected tasks</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">
            🎯
          </div>
        </div>

        <div className="bg-[#111b21] border border-red-500/30 p-5 rounded-2xl shadow-lg flex items-center justify-between shadow-red-950/20">
          <div>
            <p className="text-xs text-red-400 font-semibold uppercase tracking-wider">High Priority Tasks</p>
            <h3 className="text-2xl font-bold text-red-400 mt-1">{highPriorityTasks.length}</h3>
            <p className="text-[10px] text-red-300/80 mt-1">Immediate attention needed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold text-lg">
            🔥
          </div>
        </div>

        <div className="bg-[#111b21] border border-[#202c33] p-5 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8696a0] font-semibold uppercase tracking-wider">Completed Deliverables</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">
              {tasks.filter(t => t.status === 'COMPLETED').length}
            </h3>
            <p className="text-[10px] text-[#8696a0] mt-1">Finished tasks</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
            ✅
          </div>
        </div>
      </div>

      {/* Extracted Tasks Table / Grid */}
      <div className="bg-[#111b21] border border-[#202c33] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#222d34]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📋 All Discovered Action Items & Tasks
            </h3>
            <p className="text-xs text-[#8696a0]">Tasks extracted by Gemini AI from conversation history</p>
          </div>
          <span className="text-xs text-[#8696a0] bg-[#202c33] px-3 py-1 rounded-full font-mono">
            {tasks.length} total tasks
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-[#8696a0]">
            <div className="w-16 h-16 rounded-2xl bg-[#202c33] flex items-center justify-center mb-3 text-2xl">
              🔍
            </div>
            <p className="text-sm font-semibold text-white">No tasks extracted yet</p>
            <p className="text-xs max-w-sm mt-1">
              Click <strong className="text-emerald-400">"Analyze All Messages Now"</strong> above to scan your chat feeds with Gemini AI!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#222d34] text-[#8696a0] uppercase tracking-wider font-mono">
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Task Title</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Chat Origin</th>
                  <th className="pb-3 px-3">Due Date</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202c33]">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-[#182229] transition-colors">
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded font-bold ${
                          task.priority === 'HIGH'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : task.priority === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        }`}
                      >
                        🔥 {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#e9edef] max-w-xs truncate">
                      {task.title}
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-[#202c33] text-purple-300 px-2 py-0.5 rounded border border-[#2a3942] font-medium">
                        {task.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                        className="text-[#00a884] hover:underline font-medium flex items-center gap-1"
                      >
                        💬 {task.chatName}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-mono">
                      {task.dueDate || 'Upcoming'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                        className="px-3 py-1 bg-[#202c33] hover:bg-[#00a884] text-[#e9edef] hover:text-[#0b141a] rounded font-semibold text-[11px] transition-colors"
                      >
                        Open Chat →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-Chat AI Breakdown Grid */}
      {analytics?.chatInsights && analytics.chatInsights.length > 0 && (
        <div className="bg-[#111b21] border border-[#202c33] rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-1">💬 Per-Chat AI Breakdown</h3>
          <p className="text-xs text-[#8696a0] mb-4">Summary of monitored WhatsApp contacts and extracted tasks</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.chatInsights.map((chat) => (
              <div
                key={chat.chatId}
                className="bg-[#182229] border border-[#222d34] hover:border-[#00a884]/40 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-[#e9edef] truncate">{chat.chatName}</h4>
                  <span className="text-[10px] bg-[#202c33] text-[#00a884] px-2 py-0.5 rounded font-mono">
                    {chat.messagesCount} msgs
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#8696a0] pt-2 border-t border-[#222d34]">
                  <span>Tasks Discovered: <strong className="text-purple-300">{chat.taskCount}</strong></span>
                  <button
                    onClick={() => onJumpToChat && onJumpToChat(chat.chatId)}
                    className="text-[#00a884] hover:underline font-medium"
                  >
                    Jump to Chat →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
