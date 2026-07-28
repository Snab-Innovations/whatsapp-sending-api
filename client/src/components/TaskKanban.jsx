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
  ListTodo
} from 'lucide-react';

export default function TaskKanban({ tasks = [], onUpdateTaskStatus, onDeleteTask, onJumpToChat }) {
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter((task) => {
    const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.chatName && task.chatName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPriority && matchesSearch;
  });

  const columns = [
    { id: 'TO_DO', title: 'To Do', icon: ListTodo, color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/30' },
    { id: 'IN_PROGRESS', title: 'In Progress', icon: Zap, color: 'border-amber-500/40 text-amber-400 bg-amber-950/30' },
    { id: 'COMPLETED', title: 'Completed', icon: CheckCircle2, color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30' }
  ];

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" /> LOW
          </span>
        );
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Urgent':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> Urgent
          </span>
        );
      case 'Meeting':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-purple-400" /> Meeting
          </span>
        );
      case 'Work':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-blue-400" /> Work
          </span>
        );
      case 'Follow-up':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Follow-up
          </span>
        );
      case 'Payment':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-teal-400" /> Payment
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-300 border border-gray-700">
            {category || 'General'}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] text-[#e9edef] overflow-hidden p-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#222d34]">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-[#f1f5f9]">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
              <FolderKanban className="w-6 h-6" />
            </div>
            AI Task Board & Planner
          </h2>
          <p className="text-xs text-[#8696a0] mt-1">
            Action items automatically extracted from your WhatsApp conversations by Gemini AI
          </p>
        </div>

        {/* Priority Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111b21] border border-[#222d34] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] w-48"
            />
          </div>

          <div className="flex items-center bg-[#111b21] border border-[#222d34] p-1 rounded-xl">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 text-xs rounded-lg transition-all font-semibold ${
                  filterPriority === p
                    ? 'bg-[#00a884] text-[#0b141a] shadow-md'
                    : 'text-[#8696a0] hover:text-white hover:bg-[#202c33]'
                }`}
              >
                {p === 'ALL' ? 'All Priorities' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-1">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => (t.status || 'TO_DO') === col.id);
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className="flex flex-col bg-[#111b21] rounded-3xl border border-[#202c33] p-4 shadow-xl overflow-hidden"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222d34]">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${col.color}`}>
                    <ColIcon className="w-3.5 h-3.5" />
                    {col.title}
                  </span>
                </h3>
                <span className="text-xs font-bold text-[#8696a0] bg-[#202c33] px-2.5 py-0.5 rounded-full font-mono">
                  {colTasks.length}
                </span>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center border border-dashed border-[#222d34] rounded-2xl text-[#8696a0] text-xs">
                    <span>No tasks in this stage</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group bg-[#182229] hover:bg-[#1f2c34] border border-[#222d34] hover:border-[#00a884]/40 rounded-2xl p-4 transition-all shadow-md"
                    >
                      {/* Priority & Category Header */}
                      <div className="flex items-center justify-between mb-2">
                        {getPriorityBadge(task.priority)}
                        {getCategoryBadge(task.category)}
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-sm text-[#e9edef] mb-2 leading-snug">
                        {task.title}
                      </h4>

                      {/* AI Verdict Box */}
                      {task.verdict && (
                        <div className="mb-2.5 p-2.5 rounded-xl bg-[#111b21] border border-purple-500/30 text-[11px] text-purple-200 leading-snug">
                          <span className="font-bold text-[#00a884] flex items-center gap-1 mb-0.5">
                            <Sparkles className="w-3 h-3 text-amber-300" /> AI Decision & Verdict:
                          </span>
                          {task.verdict}
                        </div>
                      )}

                      {/* Original Snippet */}
                      {task.originalMessage && task.originalMessage !== task.title && (
                        <p className="text-xs text-[#8696a0] italic mb-3 bg-[#111b21]/60 p-2 rounded-xl border border-[#222d34] line-clamp-2">
                          "{task.originalMessage}"
                        </p>
                      )}

                      {/* Meta Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#222d34] text-[11px] text-[#8696a0]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {task.chatName && (
                            <button
                              onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                              className="text-[#00a884] hover:underline font-semibold flex items-center gap-1 truncate"
                              title="Jump to conversation"
                            >
                              <MessageSquare className="w-3 h-3 shrink-0" />
                              <span className="truncate">{task.chatName}</span>
                            </button>
                          )}
                        </div>

                        {task.dueDate && (
                          <span className="text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-lg font-mono text-[10px] flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-amber-400" /> {task.dueDate}
                          </span>
                        )}
                      </div>

                      {/* Stage Move Controls */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#222d34] text-xs">
                        <div className="flex items-center gap-1">
                          {col.id !== 'TO_DO' && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, 'TO_DO')}
                              className="text-[10px] bg-[#111b21] hover:bg-[#202c33] text-[#8696a0] hover:text-white px-2 py-1 rounded-lg border border-[#222d34] font-semibold"
                            >
                              To Do
                            </button>
                          )}
                          {col.id !== 'IN_PROGRESS' && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                              className="text-[10px] bg-[#111b21] hover:bg-[#202c33] text-amber-400 hover:text-amber-300 px-2 py-1 rounded-lg border border-[#222d34] font-semibold"
                            >
                              In Progress
                            </button>
                          )}
                          {col.id !== 'COMPLETED' && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, 'COMPLETED')}
                              className="text-[10px] bg-emerald-950/60 hover:bg-emerald-800 text-emerald-400 hover:text-white px-2 py-1 rounded-lg border border-emerald-500/30 font-semibold"
                            >
                              Completed
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => onDeleteTask && onDeleteTask(task.id)}
                          className="text-[#8696a0] hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
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
