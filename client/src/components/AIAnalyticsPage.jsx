import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  MessageSquare,
  Search,
  Check,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  BarChart3,
  ListTodo,
  ExternalLink
} from 'lucide-react';
import { getAnalytics, analyzeAllMessages, updateTask } from '../services/api';

export default function AIAnalyticsPage({ tasks: initialTasks = [], onJumpToChat, onRefreshTasks }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [analyzeReport, setAnalyzeReport] = useState(null);
  const [localTasks, setLocalTasks] = useState(initialTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    setLocalTasks(initialTasks);
  }, [initialTasks]);

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
      if (onRefreshTasks) await onRefreshTasks();
    } catch (err) {
      console.error('Bulk analysis error:', err);
      alert('Analysis error: ' + (err.message || String(err)));
    } finally {
      setAnalyzingAll(false);
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'TO_DO' : 'COMPLETED';
    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
    try {
      await updateTask(taskId, { status: nextStatus });
      if (onRefreshTasks) onRefreshTasks();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Metrics Calculations
  const totalTasks = localTasks.length;
  const completedTasksCount = localTasks.filter(t => t.status === 'COMPLETED').length;
  const activeTasksCount = totalTasks - completedTasksCount;
  const highPriorityTasks = localTasks.filter(t => t.priority === 'HIGH');
  const mediumPriorityTasks = localTasks.filter(t => t.priority === 'MEDIUM');
  const lowPriorityTasks = localTasks.filter(t => t.priority === 'LOW');
  const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  // Filtered Tasks
  const filteredTasks = localTasks.filter((task) => {
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
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] text-[#e9edef] overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 🚀 Hero Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-emerald-950 border border-purple-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Gemini 1.5 Flash Executive Intelligence Engine
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Executive AI Analytics & Task Report
            </h1>

            <p className="text-xs sm:text-sm text-[#8696a0] max-w-2xl leading-relaxed">
              Real-time productivity analytics derived from WhatsApp conversations using Google Gemini AI. Extract actionable deliverables, track task velocity, and identify high-priority risks instantly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              title="Refresh Analytics Data"
              className="p-3.5 rounded-2xl bg-[#202c33] hover:bg-[#2a3942] border border-[#222d34] text-[#e9edef] transition-all flex items-center justify-center disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-[#00a884]' : ''}`} />
            </button>

            <button
              onClick={handleAnalyzeAll}
              disabled={analyzingAll}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#0b141a] font-extrabold text-sm shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-95"
            >
              {analyzingAll ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Scanning WhatsApp Feeds...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  <span>⚡ Analyze All Messages Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Notification Bar if Report Generated */}
        {analyzeReport && (
          <div className="mt-6 pt-4 border-t border-purple-500/20 flex items-center justify-between text-xs font-mono text-emerald-400 animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Scan Complete! Processed {analyzeReport.analyzedCount} historical messages across all chats.
            </span>
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
              +{analyzeReport.newTasksExtracted} New Action Items Found
            </span>
          </div>
        )}
      </div>

      {/* 📊 KPI Executive Metrics Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#111b21] border border-[#202c33] hover:border-[#00a884]/40 p-5 rounded-2xl shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#8696a0] uppercase tracking-wider">Messages Monitored</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {analytics?.totalMessages !== undefined ? analytics.totalMessages : '...'}
            </h3>
            <span className="text-xs text-blue-400 font-medium">
              {analytics?.totalChats || 0} active chats
            </span>
          </div>
          <div className="mt-3 w-full bg-[#202c33] h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full w-full animate-pulse" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#111b21] border border-[#202c33] hover:border-purple-500/40 p-5 rounded-2xl shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#8696a0] uppercase tracking-wider">Discovered Action Items</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-purple-300 tracking-tight">
              {totalTasks}
            </h3>
            <span className="text-xs text-purple-400 font-medium">
              {activeTasksCount} active to-do
            </span>
          </div>
          <div className="mt-3 w-full bg-[#202c33] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalTasks / 20) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#111b21] border border-rose-500/40 hover:border-rose-500/70 p-5 rounded-2xl shadow-xl transition-all group bg-gradient-to-b from-rose-950/20 to-[#111b21]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" /> High Priority Risks
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {highPriorityTasks.length}
            </h3>
            <span className="text-xs text-rose-300 font-medium">
              Immediate action
            </span>
          </div>
          <div className="mt-3 w-full bg-[#202c33] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalTasks > 0 ? (highPriorityTasks.length / totalTasks) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#111b21] border border-[#202c33] hover:border-emerald-500/40 p-5 rounded-2xl shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#8696a0] uppercase tracking-wider">Completion Velocity</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {completionRate}%
            </h3>
            <span className="text-xs text-emerald-400 font-medium">
              {completedTasksCount} / {totalTasks} finished
            </span>
          </div>
          <div className="mt-3 w-full bg-[#202c33] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 📈 Distribution & Executive Insights Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority & Status Breakdown */}
        <div className="bg-[#111b21] border border-[#202c33] rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#222d34] pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" /> Priority & Status Breakdown
            </h3>
            <span className="text-xs text-[#8696a0] font-mono">{totalTasks} items</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* High Priority Bar */}
            <div>
              <div className="flex items-center justify-between mb-1 font-medium">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High Priority (Urgent)
                </span>
                <span className="font-mono text-white font-bold">{highPriorityTasks.length}</span>
              </div>
              <div className="w-full bg-[#202c33] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalTasks > 0 ? (highPriorityTasks.length / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium Priority Bar */}
            <div>
              <div className="flex items-center justify-between mb-1 font-medium">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Medium Priority
                </span>
                <span className="font-mono text-white font-bold">{mediumPriorityTasks.length}</span>
              </div>
              <div className="w-full bg-[#202c33] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalTasks > 0 ? (mediumPriorityTasks.length / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Low Priority Bar */}
            <div>
              <div className="flex items-center justify-between mb-1 font-medium">
                <span className="text-cyan-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Low Priority
                </span>
                <span className="font-mono text-white font-bold">{lowPriorityTasks.length}</span>
              </div>
              <div className="w-full bg-[#202c33] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalTasks > 0 ? (lowPriorityTasks.length / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Completion Progress Bar */}
            <div className="pt-3 border-t border-[#222d34]">
              <div className="flex items-center justify-between mb-1 font-medium">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Overall Task Completion
                </span>
                <span className="font-mono text-emerald-400 font-bold">{completionRate}%</span>
              </div>
              <div className="w-full bg-[#202c33] h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Executive AI Insights & Recommendations */}
        <div className="lg:col-span-2 bg-[#111b21] border border-[#202c33] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-[#222d34] pb-3 mb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> AI Executive Intelligence & Insights
              </h3>
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-medium">
                Live Insights
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#182229] border border-[#222d34] p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> High-Priority Focus Area
                </div>
                <p className="text-[#8696a0] leading-relaxed">
                  {highPriorityTasks.length > 0
                    ? `${highPriorityTasks.length} urgent tasks require immediate attention. First: "${highPriorityTasks[0]?.title}"`
                    : 'No urgent high-priority bottlenecks detected across current WhatsApp feeds.'}
                </p>
              </div>

              <div className="bg-[#182229] border border-[#222d34] p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Task Completion Velocity
                </div>
                <p className="text-[#8696a0] leading-relaxed">
                  {completionRate > 50
                    ? `Strong execution velocity! ${completionRate}% of discovered tasks are marked complete.`
                    : `Active workload: ${activeTasksCount} tasks pending resolution. Click "Analyze All Messages Now" to ensure all items are indexed.`}
                </p>
              </div>

              <div className="bg-[#182229] border border-[#222d34] p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> Active WhatsApp Channels
                </div>
                <p className="text-[#8696a0] leading-relaxed">
                  Monitoring {analytics?.totalChats || 0} active chat feeds. Gemini AI extracts tasks automatically as new messages arrive.
                </p>
              </div>

              <div className="bg-[#182229] border border-[#222d34] p-4 rounded-2xl space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-400" /> Automated Background Worker
                </div>
                <p className="text-[#8696a0] leading-relaxed">
                  Historical store persistence active. Tasks and messages are automatically preserved across application sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 Discovered Action Items & Tasks Table Section */}
      <div className="bg-[#111b21] border border-[#202c33] rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222d34] pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              📋 All Discovered Action Items ({filteredTasks.length})
            </h2>
            <p className="text-xs text-[#8696a0] mt-0.5">
              Tasks extracted by Gemini AI from conversation history. Click checkmark to complete.
            </p>
          </div>

          {/* Search & Filter controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks or contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#202c33] border border-[#222d34] text-[#e9edef] text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-[#00a884] placeholder-[#8696a0]"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#202c33] border border-[#222d34] text-[#e9edef] text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#00a884]"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">🔥 High Priority</option>
              <option value="MEDIUM">⚡ Medium Priority</option>
              <option value="LOW">🔹 Low Priority</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#202c33] border border-[#222d34] text-[#e9edef] text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#00a884]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">⏳ Pending To-Do</option>
              <option value="COMPLETED">✅ Completed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {filteredTasks.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center text-[#8696a0] space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#202c33] border border-[#222d34] flex items-center justify-center text-3xl">
              🎯
            </div>
            <p className="text-base font-bold text-white">No matching tasks found</p>
            <p className="text-xs text-[#8696a0] max-w-md">
              {totalTasks === 0
                ? 'No action items have been extracted yet. Click "Analyze All Messages Now" to scan your conversations.'
                : 'Try adjusting your search query or priority filters above.'}
            </p>
            {totalTasks === 0 && (
              <button
                onClick={handleAnalyzeAll}
                disabled={analyzingAll}
                className="px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-[#0b141a] font-bold text-xs rounded-xl transition-colors mt-2"
              >
                ⚡ Trigger Bulk AI Analysis
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#222d34]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#182229] border-b border-[#222d34] text-[#8696a0] uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3.5 px-4">Done</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Task Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Contact Origin</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222d34]/60 bg-[#111b21]">
                {filteredTasks.map((task) => {
                  const isCompleted = task.status === 'COMPLETED';

                  return (
                    <tr
                      key={task.id}
                      className={`transition-colors ${
                        isCompleted ? 'bg-[#111b21]/50 opacity-60' : 'hover:bg-[#182229]'
                      }`}
                    >
                      {/* Checkbox Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleComplete(task.id, task.status)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isCompleted
                              ? 'bg-[#00a884] border-[#00a884] text-[#0b141a]'
                              : 'border-[#8696a0]/40 hover:border-[#00a884] text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                            task.priority === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : task.priority === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          }`}
                        >
                          {task.priority === 'HIGH' ? '🔥 HIGH' : task.priority === 'MEDIUM' ? '⚡ MED' : '🔹 LOW'}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className={`font-semibold text-sm text-[#e9edef] ${isCompleted ? 'line-through text-[#8696a0]' : ''}`}>
                          {task.title}
                        </p>
                        {task.verdict ? (
                          <p className="text-[11px] text-[#00a884] font-medium mt-1 leading-snug bg-[#202c33]/80 p-1.5 rounded-lg border border-[#00a884]/20">
                            ⚡ AI Verdict: {task.verdict}
                          </p>
                        ) : task.summary ? (
                          <p className="text-[11px] text-[#8696a0] mt-0.5 truncate">{task.summary}</p>
                        ) : null}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="bg-[#202c33] text-purple-300 px-2.5 py-1 rounded-lg border border-[#2a3942] font-medium text-[11px]">
                          {task.category || 'General'}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                          className="text-[#00a884] hover:underline font-semibold flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[140px]">{task.chatName || 'WhatsApp Contact'}</span>
                        </button>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 text-amber-400 font-mono text-xs">
                        {task.dueDate || 'Upcoming'}
                      </td>

                      {/* Jump to Chat Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#202c33] hover:bg-[#00a884] text-[#e9edef] hover:text-[#0b141a] rounded-xl font-bold text-xs transition-colors"
                        >
                          Open Chat <ArrowUpRight className="w-3.5 h-3.5" />
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

      {/* 💬 Monitored WhatsApp Contacts & Chat Insights Grid */}
      {analytics?.chatInsights && analytics.chatInsights.length > 0 && (
        <div className="bg-[#111b21] border border-[#202c33] rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#222d34] pb-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                💬 Monitored WhatsApp Channels ({analytics.chatInsights.length})
              </h3>
              <p className="text-xs text-[#8696a0]">Overview of active chat feeds monitored by Gemini AI</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.chatInsights.map((chat) => (
              <div
                key={chat.chatId}
                className="bg-[#182229] border border-[#222d34] hover:border-[#00a884]/50 rounded-2xl p-4 transition-all hover:shadow-xl group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-[#e9edef] group-hover:text-[#00a884] transition-colors truncate">
                      {chat.chatName}
                    </h4>
                    <span className="text-[10px] bg-[#202c33] text-[#00a884] px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {chat.messagesCount} msgs
                    </span>
                  </div>

                  <p className="text-xs text-[#8696a0] mb-3">
                    Discovered Tasks: <strong className="text-purple-300 font-bold">{chat.taskCount}</strong>
                  </p>
                </div>

                <div className="pt-3 border-t border-[#222d34] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#8696a0] font-mono">
                    ID: {chat.chatId.split('@')[0]}
                  </span>
                  <button
                    onClick={() => onJumpToChat && onJumpToChat(chat.chatId)}
                    className="text-[#00a884] hover:underline font-bold flex items-center gap-1"
                  >
                    Jump to Chat <ExternalLink className="w-3 h-3" />
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
