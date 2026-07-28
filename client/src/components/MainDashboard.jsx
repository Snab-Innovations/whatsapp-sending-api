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
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-500" /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-600 border border-sky-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-500" /> LOW
          </span>
        );
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Meeting':
        return <Calendar className="w-3.5 h-3.5 text-purple-500" />;
      case 'Urgent':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
      case 'Work':
        return <Briefcase className="w-3.5 h-3.5 text-blue-500" />;
      case 'Follow-up':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Payment':
        return <CreditCard className="w-3.5 h-3.5 text-teal-500" />;
      default:
        return <FolderKanban className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafa] text-slate-900 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 🚀 Instagram Professional Main Hero Banner */}
      <div className="relative rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm overflow-hidden">
        {/* Decorative subtle Instagram gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 ig-gradient-bg" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              Instagram Executive Intelligence Center
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              WhatsApp AI Task & Action Dashboard
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Consolidated Instagram-styled view of all WhatsApp tasks, message AI verdicts, and critical deliverables powered by Google Gemini AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('CHATS')}
              className="px-5 py-3 rounded-2xl bg-[#0095f6] hover:bg-[#1877f2] text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Open WhatsApp Chats ({chats.length})
            </button>

            <button
              onClick={handleAnalyzeAll}
              disabled={analyzingAll}
              className="px-5 py-3 rounded-2xl ig-gradient-bg text-white font-extrabold text-xs shadow-md shadow-pink-500/20 hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {analyzingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning Messages...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-yellow-300" />
                  ⚡ Analyze All Messages
                </>
              )}
            </button>
          </div>
        </div>

        {analyzeReport && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-mono text-emerald-600 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Bulk Analysis complete! Processed {analyzeReport.analyzedCount} messages across all WhatsApp chats.
            </span>
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-0.5 rounded-full font-bold">
              +{analyzeReport.newTasksExtracted} New Tasks Discovered
            </span>
          </div>
        )}
      </div>

      {/* 📊 KPI Stat Cards Row (4 Cards - Pure White Instagram Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active To-Do Tasks */}
        <div className="bg-white border border-slate-200 hover:border-purple-300 p-5 rounded-2xl shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Pending Tasks</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-slate-900">{activeTasksCount}</h3>
            <span className="text-xs text-purple-600 font-bold">{totalTasksCount} total tasks</span>
          </div>
        </div>

        {/* Card 2: High Priority Urgent Items */}
        <div className="bg-white border border-rose-200 hover:border-rose-300 p-5 rounded-2xl shadow-sm transition-all group bg-gradient-to-b from-rose-50/30 to-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-rose-600 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> High Priority Items
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-rose-600">{highPriorityTasks.length}</h3>
            <span className="text-xs text-rose-500 font-bold">Immediate attention</span>
          </div>
        </div>

        {/* Card 3: Messages Monitored */}
        <div className="bg-white border border-slate-200 hover:border-sky-300 p-5 rounded-2xl shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Active Direct Feeds</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-[#0095f6] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-slate-900">{chats.length}</h3>
            <span className="text-xs text-[#0095f6] font-bold">Connected channels</span>
          </div>
        </div>

        {/* Card 4: Task Completion Velocity */}
        <div className="bg-white border border-slate-200 hover:border-emerald-300 p-5 rounded-2xl shadow-sm transition-all group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-emerald-600">{completionRate}%</h3>
            <span className="text-xs text-emerald-600 font-bold">{completedTasksCount} finished</span>
          </div>
        </div>
      </div>

      {/* 💬 Main Section 1: Recent Top Messages & AI Verdicts (Instagram Story/Direct Style) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-[#0095f6]" /> Recent Direct Messages & AI Verdicts
            </h2>
            <p className="text-xs text-slate-500">Latest incoming WhatsApp messages with AI decision summaries & verdicts</p>
          </div>
          <button
            onClick={() => onTabChange('CHATS')}
            className="text-xs text-[#0095f6] hover:underline font-extrabold flex items-center gap-1"
          >
            View All Direct Chats <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topMessagesWithVerdicts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No message history recorded yet. Open Direct Chats or send a message to populate.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topMessagesWithVerdicts.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50/70 border border-slate-200 hover:border-slate-300 p-4 rounded-2xl transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Instagram Story Gradient Ring Avatar */}
                      <div className="p-[2px] rounded-full ig-gradient-bg shadow-xs shrink-0">
                        <div className="w-7 h-7 rounded-full bg-white text-slate-900 flex items-center justify-center font-black text-xs">
                          {item.isGroup ? <Users className="w-3.5 h-3.5 text-purple-600" /> : item.chatName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">{item.chatName}</h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200 line-clamp-2 leading-relaxed shadow-xs">
                    "{item.body}"
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/80">
                  {item.verdict ? (
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-xs text-slate-800 leading-snug">
                      <span className="font-bold text-purple-700 flex items-center gap-1 mb-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-pink-500" /> AI Verdict & Decision:
                      </span>
                      {item.verdict}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      No critical action items detected in this message.
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(item.priority)}
                      <span className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-purple-200">
                        {item.category}
                      </span>
                    </div>

                    <button
                      onClick={() => onJumpToChat && onJumpToChat(item.chatId)}
                      className="text-[#0095f6] hover:underline font-extrabold text-xs flex items-center gap-1"
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
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <ListTodo className="w-5 h-5 text-purple-600" /> Actionable Tasks To-Do ({filteredTasks.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">All action items extracted by Gemini AI. Click checkbox to mark completed.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
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
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <p className="font-bold text-slate-700">No tasks matching filters</p>
            <p className="text-xs max-w-sm mx-auto">Click "Analyze All Messages" or start conversations in WhatsApp to generate tasks.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'COMPLETED';

              return (
                <div
                  key={task.id}
                  className={`bg-slate-50/70 border border-slate-200 hover:border-slate-300 p-4 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCompleted ? 'opacity-50 bg-slate-100/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(task.id, task.status)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-[#0095f6] text-transparent bg-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getPriorityBadge(task.priority)}
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-[10px] px-2.5 py-0.5 rounded-full border border-purple-200 font-extrabold">
                          {getCategoryIcon(task.category)}
                          {task.category || 'General'}
                        </span>
                        {task.dueDate && (
                          <span className="text-[11px] text-amber-700 font-mono font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> {task.dueDate}
                          </span>
                        )}
                      </div>

                      <h3 className={`font-extrabold text-sm text-slate-900 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </h3>

                      {task.verdict ? (
                        <p className="text-xs text-purple-900 bg-purple-50/80 p-2.5 rounded-xl border border-purple-200 leading-relaxed font-semibold">
                          ⚡ AI Verdict: {task.verdict}
                        </p>
                      ) : task.originalMessage && (
                        <p className="text-xs text-slate-500 italic truncate">"{task.originalMessage}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    {task.chatName && (
                      <button
                        onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                        className="text-[#0095f6] hover:underline text-xs font-bold flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {task.chatName}
                      </button>
                    )}

                    <button
                      onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                      className="px-4 py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-xl font-extrabold text-xs transition-colors flex items-center gap-1 shadow-sm"
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
