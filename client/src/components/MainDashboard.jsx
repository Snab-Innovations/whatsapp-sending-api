import React, { useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Zap,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowUpRight,
  Search,
  Filter,
  Plus,
  RefreshCw,
  User,
  Users,
  Check,
  ExternalLink,
  Briefcase,
  AlertTriangle,
  CreditCard,
  FolderKanban,
  Columns,
  BarChart3,
  ListTodo,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { analyzeAllMessages, updateTask } from '../services/api';

export default function MainDashboard({
  tasks = [],
  chats = [],
  messages = [],
  onSelectChat,
  onJumpToChat,
  onOpenNewChat,
  onTabChange,
  onRefreshTasks
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [analyzeReport, setAnalyzeReport] = useState(null);

  const handleAnalyzeAll = async () => {
    try {
      setAnalyzingAll(true);
      setAnalyzeReport(null);
      const res = await analyzeAllMessages();
      setAnalyzeReport(res.report);
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
    try {
      await updateTask(taskId, { status: nextStatus });
      if (onRefreshTasks) onRefreshTasks();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  // Metric Calculations
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
    return true;
  });

  // Recent Top Messages with AI Verdicts
  const topMessagesWithVerdicts = [];
  chats.slice(0, 8).forEach((chat) => {
    if (chat.lastMessage && chat.lastMessage.body) {
      const associatedTask = tasks.find(t => t.chatId === chat.id || (t.chatName && t.chatName === chat.name));
      topMessagesWithVerdicts.push({
        id: `msg-${chat.id}`,
        chatId: chat.id,
        chatName: chat.name,
        isGroup: chat.isGroup,
        body: chat.lastMessage.body,
        timestamp: chat.lastMessage.timestamp || chat.timestamp,
        fromMe: chat.lastMessage.fromMe,
        verdict: associatedTask ? (associatedTask.verdict || associatedTask.summary) : null,
        priority: associatedTask ? associatedTask.priority : 'LOW',
        category: associatedTask ? associatedTask.category : 'General'
      });
    }
  });

  topMessagesWithVerdicts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" /> LOW
          </span>
        );
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Meeting':
        return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      case 'Urgent':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'Work':
        return <Briefcase className="w-3.5 h-3.5 text-blue-400" />;
      case 'Follow-up':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Payment':
        return <CreditCard className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <FolderKanban className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] text-[#e9edef] overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 🚀 Main Executive Dashboard Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-purple-950 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Main Executive Task & Intelligence Center
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              WhatsApp AI Task & Action Dashboard
            </h1>

            <p className="text-xs sm:text-sm text-[#8696a0] max-w-2xl leading-relaxed">
              Consolidated view of all WhatsApp tasks, message AI verdicts, and critical deliverables processed by Google Gemini AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('WORKSPACE')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Open WhatsApp Chats ({chats.length})
            </button>

            <button
              onClick={handleAnalyzeAll}
              disabled={analyzingAll}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-950/50 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {analyzingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning Messages...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-amber-300" />
                  ⚡ Analyze All Messages
                </>
              )}
            </button>
          </div>
        </div>

        {analyzeReport && (
          <div className="mt-4 pt-3 border-t border-emerald-500/20 text-xs font-mono text-emerald-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Bulk Analysis complete! Processed {analyzeReport.analyzedCount} messages across all WhatsApp chats.
            </span>
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
              +{analyzeReport.newTasksExtracted} New Tasks Discovered
            </span>
          </div>
        )}
      </div>

      {/* 📊 KPI Stat Cards Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active To-Do Tasks */}
        <div className="bg-[#111b21] border border-[#202c33] hover:border-purple-500/40 p-5 rounded-2xl shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8696a0] uppercase tracking-wider">Pending To-Do Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white">{activeTasksCount}</h3>
            <span className="text-xs text-purple-400 font-semibold">{totalTasksCount} total tasks</span>
          </div>
        </div>

        {/* Card 2: High Priority Urgent Items */}
        <div className="bg-[#111b21] border border-rose-500/30 hover:border-rose-500/60 p-5 rounded-2xl shadow-xl transition-all group bg-gradient-to-b from-rose-950/15 to-[#111b21]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> High Priority Items
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-rose-400">{highPriorityTasks.length}</h3>
            <span className="text-xs text-rose-300 font-semibold">Immediate attention</span>
          </div>
        </div>

        {/* Card 3: Messages Monitored */}
        <div className="bg-[#111b21] border border-[#202c33] hover:border-blue-500/40 p-5 rounded-2xl shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8696a0] uppercase tracking-wider">Active WhatsApp Feeds</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-white">{chats.length}</h3>
            <span className="text-xs text-blue-400 font-semibold">Connected channels</span>
          </div>
        </div>

        {/* Card 4: Task Completion Velocity */}
        <div className="bg-[#111b21] border border-[#202c33] hover:border-emerald-500/40 p-5 rounded-2xl shadow-xl transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8696a0] uppercase tracking-wider">Completion Velocity</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-emerald-400">{completionRate}%</h3>
            <span className="text-xs text-emerald-400 font-semibold">{completedTasksCount} finished</span>
          </div>
        </div>
      </div>

      {/* 💬 Main Section 1: Recent Top Messages & AI Verdicts */}
      <div className="bg-[#111b21] border border-[#202c33] rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222d34] pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> Recent Top Messages & AI Verdicts
            </h2>
            <p className="text-xs text-[#8696a0]">Latest incoming WhatsApp messages with AI decision summaries & verdicts</p>
          </div>
          <button
            onClick={() => onTabChange('WORKSPACE')}
            className="text-xs text-[#00a884] hover:underline font-bold flex items-center gap-1"
          >
            View All Chats <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topMessagesWithVerdicts.length === 0 ? (
          <div className="py-8 text-center text-[#8696a0] text-xs">
            No message history recorded yet. Open WhatsApp Chats or send a message to populate.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topMessagesWithVerdicts.map((item) => (
              <div
                key={item.id}
                className="bg-[#182229] border border-[#222d34] hover:border-[#00a884]/40 p-4 rounded-2xl transition-all space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#00a884]/20 border border-[#00a884]/30 text-[#00a884] flex items-center justify-center font-bold text-xs shrink-0">
                        {item.isGroup ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <h3 className="font-bold text-sm text-[#e9edef] truncate">{item.chatName}</h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#8696a0] shrink-0">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-[#e9edef] bg-[#111b21] p-2.5 rounded-xl border border-[#222d34] line-clamp-2 leading-relaxed">
                    "{item.body}"
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#222d34]/60">
                  {item.verdict ? (
                    <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[11px] text-purple-200 leading-snug">
                      <span className="font-bold text-amber-300 flex items-center gap-1 mb-0.5">
                        <Sparkles className="w-3 h-3 text-amber-300" /> AI Verdict & Decision:
                      </span>
                      {item.verdict}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#8696a0] italic">
                      No critical action items detected in this message.
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(item.priority)}
                      <span className="bg-[#202c33] text-purple-300 text-[10px] px-2 py-0.5 rounded font-medium border border-[#2a3942]">
                        {item.category}
                      </span>
                    </div>

                    <button
                      onClick={() => onJumpToChat && onJumpToChat(item.chatId)}
                      className="text-[#00a884] hover:underline font-bold text-xs flex items-center gap-1"
                    >
                      Open Chat <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📋 Main Section 2: Actionable To-Do Tasks List */}
      <div className="bg-[#111b21] border border-[#202c33] rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222d34] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <ListTodo className="w-5 h-5 text-purple-400" /> Actionable Tasks To-Do ({filteredTasks.length})
            </h2>
            <p className="text-xs text-[#8696a0] mt-0.5">All action items extracted by Gemini AI. Click checkbox to mark completed.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#202c33] border border-[#222d34] text-[#e9edef] text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-[#00a884] placeholder-[#8696a0]"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#202c33] border border-[#222d34] text-[#e9edef] text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#00a884]"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">HIGH Priority</option>
              <option value="MEDIUM">MEDIUM Priority</option>
              <option value="LOW">LOW Priority</option>
            </select>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-[#8696a0] text-xs space-y-2">
            <p className="font-semibold text-white">No tasks matching filters</p>
            <p className="text-xs max-w-sm mx-auto">Click "Analyze All Messages" or start conversations in WhatsApp to generate tasks.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'COMPLETED';

              return (
                <div
                  key={task.id}
                  className={`bg-[#182229] border border-[#222d34] hover:border-[#00a884]/40 p-4 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCompleted ? 'opacity-50 bg-[#111b21]/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(task.id, task.status)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-[#00a884] border-[#00a884] text-[#0b141a]'
                          : 'border-[#8696a0]/50 hover:border-[#00a884] text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getPriorityBadge(task.priority)}
                        <span className="inline-flex items-center gap-1 bg-[#202c33] text-purple-300 text-[10px] px-2 py-0.5 rounded border border-[#2a3942] font-semibold">
                          {getCategoryIcon(task.category)}
                          {task.category || 'General'}
                        </span>
                        {task.dueDate && (
                          <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" /> {task.dueDate}
                          </span>
                        )}
                      </div>

                      <h3 className={`font-bold text-sm text-[#e9edef] ${isCompleted ? 'line-through text-[#8696a0]' : ''}`}>
                        {task.title}
                      </h3>

                      {task.verdict ? (
                        <p className="text-xs text-[#00a884] bg-[#111b21] p-2 rounded-xl border border-[#00a884]/20 leading-relaxed font-medium">
                          ⚡ AI Verdict: {task.verdict}
                        </p>
                      ) : task.originalMessage && (
                        <p className="text-xs text-[#8696a0] italic truncate">"{task.originalMessage}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#222d34]">
                    {task.chatName && (
                      <button
                        onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                        className="text-[#00a884] hover:underline text-xs font-semibold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {task.chatName}
                      </button>
                    )}

                    <button
                      onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                      className="px-3.5 py-1.5 bg-[#202c33] hover:bg-[#00a884] text-[#e9edef] hover:text-[#0b141a] rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
                    >
                      Open Chat <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
