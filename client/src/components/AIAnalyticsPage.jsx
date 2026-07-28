import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpRight,
  RefreshCw,
  Check,
  Calendar,
  Briefcase,
  CreditCard,
  User,
  Users,
  Loader2,
  Video,
  ExternalLink
} from 'lucide-react';
import { getAnalytics, analyzeAllMessages, updateTask } from '../services/api';

export default function AIAnalyticsPage({ tasks = [], onJumpToChat, onRefreshTasks }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [analyzeReport, setAnalyzeReport] = useState(null);

  // Filters for action items table
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  useEffect(() => {
    fetchAnalytics();
  }, [tasks]);

  const handleAnalyzeAll = async () => {
    try {
      setAnalyzingAll(true);
      setAnalyzeReport(null);
      const res = await analyzeAllMessages();
      setAnalyzeReport(res.report);
      await fetchAnalytics();
      if (onRefreshTasks) await onRefreshTasks();
    } catch (err) {
      console.error('Bulk analysis error:', err);
      alert('Bulk analysis error: ' + (err.message || String(err)));
    } finally {
      setAnalyzingAll(false);
    }
  };

  const renderLinkButton = (text) => {
    if (!text || typeof text !== 'string') return null;
    const urlMatches = text.match(/(https?:\/\/[^\s]+)/gi);
    if (!urlMatches || urlMatches.length === 0) return null;

    const uniqueUrls = [...new Set(urlMatches.map(u => u.replace(/[.,)!]*$/, '')))];

    return (
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {uniqueUrls.map((url, idx) => {
          const lower = url.toLowerCase();
          const isMeeting = lower.includes('meet.google.com') || lower.includes('zoom.us') || lower.includes('teams.microsoft.com') || lower.includes('webex.com');
          const isPayment = lower.includes('pay') || lower.includes('invoice') || lower.includes('stripe') || lower.includes('paypal') || lower.includes('upi');

          let label = 'Open Link';
          let btnClass = 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20';
          let IconComp = ExternalLink;

          if (isMeeting) {
            label = '📹 Join Meeting';
            btnClass = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20';
            IconComp = Video;
          } else if (isPayment) {
            label = '💳 Pay Now';
            btnClass = 'bg-[#0095f6] hover:bg-[#1877f2] text-white shadow-blue-500/20';
            IconComp = CreditCard;
          }

          return (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-md transition-all ${btnClass}`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{label}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          );
        })}
      </div>
    );
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'TO_DO' : 'COMPLETED';
    try {
      await updateTask(taskId, { status: nextStatus });
      if (onRefreshTasks) onRefreshTasks();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  // Metrics Calculations
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const activeTasksCount = totalTasksCount - completedTasksCount;
  const highPriorityTasks = tasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED');
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    const title = task.title || '';
    const chatName = task.chatName || '';
    const category = task.category || '';
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          chatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
    if (statusFilter === 'COMPLETED' && task.status !== 'COMPLETED') return false;
    if (statusFilter === 'ACTIVE' && task.status === 'COMPLETED') return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafa] text-slate-900 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 🚀 Instagram Hero Header Banner */}
      <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 ig-gradient-bg" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              Gemini 1.5 Flash Executive Intelligence Engine
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Executive AI Analytics & Task Report
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Real-time productivity analytics derived from WhatsApp conversations using Google Gemini AI. Extract actionable deliverables, track task velocity, and identify high-priority risks instantly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              title="Refresh Analytics Data"
              className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all flex items-center justify-center disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-[#0095f6]' : ''}`} />
            </button>

            <button
              onClick={handleAnalyzeAll}
              disabled={analyzingAll}
              className="px-6 py-3.5 rounded-2xl ig-gradient-bg text-white font-black text-sm shadow-md shadow-pink-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-95"
            >
              {analyzingAll ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Scanning WhatsApp Feeds...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current text-yellow-300" />
                  <span>⚡ Analyze All Messages Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Notification Bar if Report Generated */}
        {analyzeReport && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-emerald-600 animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Scan Complete! Processed {analyzeReport.analyzedCount} historical messages across all chats.
            </span>
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-0.5 rounded-full font-bold">
              +{analyzeReport.newTasksExtracted} New Action Items Found
            </span>
          </div>
        )}
      </div>

      {/* 📊 KPI Executive Metrics Grid (4 Cards - Pure White Instagram Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 hover:border-sky-300 p-5 rounded-2xl shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Messages Monitored</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-[#0095f6] flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {analytics?.totalMessages !== undefined ? analytics.totalMessages : '...'}
            </h3>
            <span className="text-xs text-[#0095f6] font-bold">
              {analytics?.totalChats || 0} active chats
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#0095f6] h-full rounded-full w-full animate-pulse" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 hover:border-purple-300 p-5 rounded-2xl shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Discovered Action Items</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{totalTasksCount}</h3>
            <span className="text-xs text-purple-600 font-bold">
              {activeTasksCount} pending resolution
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full w-3/4" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-rose-200 hover:border-rose-300 p-5 rounded-2xl shadow-sm transition-all group bg-gradient-to-b from-rose-50/30 to-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> High Priority Risks
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-rose-600 tracking-tight">{highPriorityTasks.length}</h3>
            <span className="text-xs text-rose-500 font-bold">Immediate attention</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full w-full" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 hover:border-emerald-300 p-5 rounded-2xl shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Completion Velocity</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-emerald-600 tracking-tight">{completionRate}%</h3>
            <span className="text-xs text-emerald-600 font-bold">
              {completedTasksCount} finished
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 📈 Executive Priority & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Breakdown Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-600" /> Priority Distribution
          </h2>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                <span className="flex items-center gap-1.5 text-rose-600">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> High Priority (Urgent)
                </span>
                <span className="font-mono text-slate-900">
                  {tasks.filter(t => t.priority === 'HIGH').length}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full"
                  style={{
                    width: `${totalTasksCount > 0 ? (tasks.filter(t => t.priority === 'HIGH').length / totalTasksCount) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Medium Priority
                </span>
                <span className="font-mono text-slate-900">
                  {tasks.filter(t => t.priority === 'MEDIUM').length}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${totalTasksCount > 0 ? (tasks.filter(t => t.priority === 'MEDIUM').length / totalTasksCount) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                <span className="flex items-center gap-1.5 text-sky-600">
                  <Clock className="w-3.5 h-3.5 text-sky-500" /> Low Priority
                </span>
                <span className="font-mono text-slate-900">
                  {tasks.filter(t => t.priority === 'LOW').length}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{
                    width: `${totalTasksCount > 0 ? (tasks.filter(t => t.priority === 'LOW').length / totalTasksCount) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Executive Insights Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" /> Gemini AI Executive Summary & Insights
              </h2>
              <span className="text-xs font-mono font-bold bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                Live Insights
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Task Completion Velocity
                </div>
                <p className="text-slate-500 leading-relaxed font-medium">
                  {completionRate > 50
                    ? `Strong execution velocity! ${completionRate}% of discovered tasks are marked complete.`
                    : `Active workload: ${activeTasksCount} tasks pending resolution. Click "Analyze All Messages Now" to ensure all items are indexed.`}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#0095f6]" /> Active WhatsApp Channels
                </div>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Monitoring {analytics?.totalChats || 0} active chat feeds. Gemini AI extracts tasks automatically as new messages arrive.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-600" /> Background AI Worker
                </div>
                <p className="text-slate-500 leading-relaxed font-medium">
                  Historical store persistence active. Tasks and messages are automatically preserved across application sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 Discovered Action Items & Tasks Table Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
              📋 All Discovered Action Items ({filteredTasks.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Tasks extracted by Gemini AI from conversation history. Click checkmark to complete.
            </p>
          </div>

          {/* Search & Filter controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-[#0095f6] placeholder-slate-400 font-medium"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#0095f6] font-semibold"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">HIGH Priority</option>
              <option value="MEDIUM">MEDIUM Priority</option>
              <option value="LOW">LOW Priority</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#0095f6] font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Pending To-Do</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Action Items Table */}
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <p className="font-bold text-slate-700">No action items matching criteria</p>
            <p className="text-xs max-w-sm mx-auto">Try adjusting your search terms or filters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black bg-slate-50">
                  <th className="py-3 px-4 w-10">Done</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Task Description & AI Verdict</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === 'COMPLETED';

                  return (
                    <tr
                      key={task.id}
                      className={`transition-colors ${
                        isCompleted ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Checkbox Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleComplete(task.id, task.status)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 hover:border-[#0095f6] text-transparent bg-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                            task.priority === 'HIGH'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : task.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-sky-50 text-sky-600 border border-sky-200'
                          }`}
                        >
                          {task.priority === 'HIGH' ? (
                            <>
                              <ShieldAlert className="w-3 h-3 text-rose-500" /> HIGH
                            </>
                          ) : task.priority === 'MEDIUM' ? (
                            <>
                              <Zap className="w-3 h-3 text-amber-500" /> MED
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-sky-500" /> LOW
                            </>
                          )}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className={`font-bold text-sm text-slate-900 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </p>
                        {task.verdict ? (
                          <p className="text-[11px] text-purple-900 font-semibold mt-1 leading-snug bg-purple-50 p-2 rounded-xl border border-purple-200">
                            ⚡ AI Verdict: {task.verdict}
                          </p>
                        ) : task.summary ? (
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate font-medium">{task.summary}</p>
                        ) : null}
                        {renderLinkButton(`${task.title} ${task.originalMessage || ''} ${task.verdict || ''}`)}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200 font-bold text-[11px]">
                          {task.category || 'General'}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                          className="text-[#0095f6] hover:underline font-bold flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {task.chatName || 'WhatsApp Contact'}
                        </button>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                          {task.dueDate || 'Upcoming'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                          className="px-3 py-1.5 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1"
                        >
                          Open Chat <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
