import React, { useState } from 'react';
import {
  FolderKanban,
  ShieldAlert,
  Zap,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Briefcase,
  CreditCard,
  MessageSquare,
  ArrowUpRight,
  Search,
  Plus,
  Trash2,
  Sparkles,
  ListTodo,
  Video,
  ExternalLink
} from 'lucide-react';

export default function TaskKanban({ tasks = [], onUpdateTaskStatus, onDeleteTask, onJumpToChat }) {
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMobileCol, setActiveMobileCol] = useState('ALL');

  const filteredTasks = tasks.filter((task) => {
    const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.chatName && task.chatName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPriority && matchesSearch;
  });

  const renderLinkButton = (text) => {
    if (!text || typeof text !== 'string') return null;
    const urlMatches = text.match(/(https?:\/\/[^\s]+)/gi);
    if (!urlMatches || urlMatches.length === 0) return null;

    const uniqueUrls = [...new Set(urlMatches.map(u => u.replace(/[.,)!]*$/, '')))];

    return (
      <div className="flex flex-wrap items-center gap-2 mb-3">
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

  const columns = [
    { id: 'TO_DO', title: 'To Do', icon: ListTodo, color: 'border-sky-200 text-sky-700 bg-sky-50' },
    { id: 'IN_PROGRESS', title: 'In Progress', icon: Zap, color: 'border-amber-200 text-amber-700 bg-amber-50' },
    { id: 'COMPLETED', title: 'Completed', icon: CheckCircle2, color: 'border-emerald-200 text-emerald-700 bg-emerald-50' }
  ];

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-500" /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-600 border border-sky-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-500" /> LOW
          </span>
        );
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Urgent':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500" /> Urgent
          </span>
        );
      case 'Meeting':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-purple-500" /> Meeting
          </span>
        );
      case 'Work':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-blue-500" /> Work
          </span>
        );
      case 'Follow-up':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Follow-up
          </span>
        );
      case 'Payment':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-teal-500" /> Payment
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {category || 'General'}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fafafa] text-slate-900 overflow-hidden p-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
            <div className="p-2.5 rounded-2xl ig-gradient-bg text-white shadow-md shadow-purple-500/20">
              <FolderKanban className="w-6 h-6" />
            </div>
            AI Task Planner & Kanban
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Action items automatically extracted from your WhatsApp conversations by Gemini AI
          </p>
        </div>

        {/* Priority Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0095f6] w-48 font-medium shadow-xs"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 text-xs rounded-lg transition-all font-bold ${
                  filterPriority === p
                    ? 'bg-[#0095f6] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {p === 'ALL' ? 'All Priorities' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Column Tab Selector */}
      <div className="md:hidden flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveMobileCol('ALL')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all text-center shrink-0 ${
            activeMobileCol === 'ALL'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({filteredTasks.length})
        </button>
        {columns.map(col => {
          const count = filteredTasks.filter(t => (t.status || 'TO_DO') === col.id).length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileCol(col.id)}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all text-center shrink-0 ${
                activeMobileCol === col.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {col.title} ({count})
            </button>
          );
        })}
      </div>

      {/* Kanban Board Columns - White Instagram Style */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-1">
        {columns.map((col) => {
          if (typeof window !== 'undefined' && window.innerWidth < 768 && activeMobileCol !== 'ALL' && activeMobileCol !== col.id) {
            return null;
          }
          const colTasks = filteredTasks.filter((t) => (t.status || 'TO_DO') === col.id);
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className="flex flex-col bg-white rounded-3xl border border-slate-200 p-4 shadow-sm overflow-hidden"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border ${col.color}`}>
                    <ColIcon className="w-3.5 h-3.5" />
                    {col.title}
                  </span>
                </h3>
                <span className="text-xs font-black text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-mono">
                  {colTasks.length}
                </span>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                    <span>No tasks in this stage</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 transition-all shadow-xs hover:shadow-md"
                    >
                      {/* Priority & Category Header */}
                      <div className="flex items-center justify-between mb-2">
                        {getPriorityBadge(task.priority)}
                        {getCategoryBadge(task.category)}
                      </div>

                      {/* Title */}
                      <h4 className="font-extrabold text-sm text-slate-900 mb-2 leading-snug">
                        {task.title}
                      </h4>

                      {/* AI Verdict Box */}
                      {task.verdict && (
                        <div className="mb-2.5 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 leading-snug">
                          <span className="font-extrabold text-purple-700 flex items-center gap-1 mb-0.5">
                            <Sparkles className="w-3 h-3 text-pink-500" /> AI Verdict:
                          </span>
                          {task.verdict}
                        </div>
                      )}

                      {/* Original Snippet */}
                      {task.originalMessage && task.originalMessage !== task.title && (
                        <p className="text-xs text-slate-500 italic mb-3 bg-white p-2.5 rounded-xl border border-slate-200 line-clamp-2">
                          "{task.originalMessage}"
                        </p>
                      )}

                      {/* Direct Link Action Button */}
                      {renderLinkButton(`${task.title} ${task.originalMessage || ''} ${task.verdict || ''}`)}

                      {/* Meta Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {task.chatName && (
                            <button
                              onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                              className="text-[#0095f6] hover:underline font-bold flex items-center gap-1 truncate"
                              title="Jump to conversation"
                            >
                              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{task.chatName}</span>
                            </button>
                          )}
                        </div>

                        {task.dueDate && (
                          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-amber-600" /> {task.dueDate}
                          </span>
                        )}
                      </div>

                      {/* Stage Move Controls */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 text-xs">
                        <div className="flex items-center gap-1">
                          {col.id !== 'TO_DO' && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, 'TO_DO')}
                              className="text-[10px] bg-white hover:bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 font-bold shadow-2xs"
                            >
                              To Do
                            </button>
                          )}
                          {col.id !== 'IN_PROGRESS' && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                              className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-1 rounded-lg border border-amber-200 font-bold shadow-2xs"
                            >
                              In Progress
                            </button>
                          )}
                          {col.id !== 'COMPLETED' && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, 'COMPLETED')}
                              className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-200 font-bold shadow-2xs"
                            >
                              Completed
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => onDeleteTask && onDeleteTask(task.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
