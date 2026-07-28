import React, { useState } from 'react';

export default function TaskKanban({ tasks = [], onUpdateTaskStatus, onDeleteTask, onJumpToChat }) {
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskCategory, setNewTaskCategory] = useState('Work');

  const filteredTasks = tasks.filter((task) => {
    const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.chatName && task.chatName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPriority && matchesSearch;
  });

  const columns = [
    { id: 'TO_DO', title: '📌 To Do', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20' },
    { id: 'IN_PROGRESS', title: '⚡ In Progress', color: 'border-amber-500/40 text-amber-400 bg-amber-950/20' },
    { id: 'COMPLETED', title: '✅ Completed', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20' }
  ];

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
      case 'LOW':
      default:
        return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40';
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Urgent':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'Meeting':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'Work':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Follow-up':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'Payment':
        return 'bg-teal-500/20 text-teal-300 border border-teal-500/30';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b141a] text-[#e9edef] overflow-hidden p-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#222d34]">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-[#f1f5f9]">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
              📋
            </span>
            AI Task Kanban & Planner
          </h2>
          <p className="text-xs text-[#8696a0] mt-1">
            Action items automatically extracted from your WhatsApp conversations by Gemini AI
          </p>
        </div>

        {/* Priority Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111b21] border border-[#222d34] rounded-lg px-3 py-1.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] w-48"
            />
          </div>

          <div className="flex items-center bg-[#111b21] border border-[#222d34] p-1 rounded-lg">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 text-xs rounded-md transition-all font-medium ${
                  filterPriority === p
                    ? 'bg-[#00a884] text-white shadow-md'
                    : 'text-[#8696a0] hover:text-white hover:bg-[#202c33]'
                }`}
              >
                {p === 'ALL' ? 'All Priority' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-1">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => (t.status || 'TO_DO') === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col bg-[#111b21] rounded-2xl border border-[#202c33] p-4 shadow-xl overflow-hidden"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222d34]">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${col.color}`}>
                    {col.title}
                  </span>
                </h3>
                <span className="text-xs font-semibold text-[#8696a0] bg-[#202c33] px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center border border-dashed border-[#222d34] rounded-xl text-[#8696a0] text-xs">
                    <span>No tasks in this stage</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group bg-[#1f2c34] hover:bg-[#22313a] border border-[#2a3942] hover:border-[#00a884]/40 rounded-xl p-4 transition-all shadow-md hover:shadow-emerald-950/20"
                    >
                      {/* Priority & Category Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getPriorityBadge(task.priority)}`}>
                          🔥 {task.priority}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${getCategoryBadge(task.category)}`}>
                          {task.category || 'General'}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-semibold text-sm text-[#f1f5f9] mb-1.5 line-clamp-2 leading-snug">
                        {task.title}
                      </h4>

                      {/* Original Snippet */}
                      {task.originalMessage && task.originalMessage !== task.title && (
                        <p className="text-xs text-[#8696a0] italic mb-3 bg-[#111b21]/60 p-2 rounded-lg border border-[#222d34] line-clamp-2">
                          "{task.originalMessage}"
                        </p>
                      )}

                      {/* Meta Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#2a3942]/60 text-[11px] text-[#8696a0]">
                        <div className="flex items-center gap-1.5">
                          {task.chatName && (
                            <button
                              onClick={() => onJumpToChat && onJumpToChat(task.chatId)}
                              className="text-[#00a884] hover:underline font-medium flex items-center gap-1"
                              title="Jump to conversation"
                            >
                              💬 {task.chatName}
                            </button>
                          )}
                        </div>

                        {task.dueDate && (
                          <span className="text-amber-400 bg-amber-950/40 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                            📅 {task.dueDate}
                          </span>
                        )}
                      </div>

                      {/* Stage Move Controls */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2a3942]/40 text-xs">
                        <div className="flex items-center gap-1">
                          {col.id !== 'TO_DO' && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, 'TO_DO')}
                              className="text-[10px] bg-[#111b21] hover:bg-[#2a3942] text-[#8696a0] hover:text-white px-2 py-1 rounded border border-[#222d34]"
                            >
                              ← To Do
                            </button>
                          )}
                          {col.id !== 'IN_PROGRESS' && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                              className="text-[10px] bg-[#111b21] hover:bg-[#2a3942] text-amber-400 hover:text-white px-2 py-1 rounded border border-[#222d34]"
                            >
                              ⚡ In Progress
                            </button>
                          )}
                          {col.id !== 'COMPLETED' && (
                            <button
                              onClick={() => onUpdateTaskStatus(task.id, 'COMPLETED')}
                              className="text-[10px] bg-emerald-950/60 hover:bg-emerald-800 text-emerald-400 hover:text-white px-2 py-1 rounded border border-emerald-500/30"
                            >
                              ✓ Done
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="text-[#8696a0] hover:text-red-400 text-xs p-1"
                          title="Delete task"
                        >
                          🗑️
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
