// API service layer for WhatsApp web chat viewer & Gemini AI Task Manager

export function subscribeToEvents(onUpdate) {
  const eventSource = new EventSource('/api/events');

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onUpdate(data);
    } catch (err) {
      console.error('Failed to parse SSE payload:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.warn('SSE connection error:', err);
  };

  return () => {
    eventSource.close();
  };
}

export async function getStatus() {
  const res = await fetch('/api/status');
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function getChats() {
  const res = await fetch('/api/chats');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch chats');
  }
  return res.json();
}

export async function getChatMessages(chatId, limit = 50) {
  const res = await fetch(`/api/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch messages');
  }
  return res.json();
}

export async function sendMessage(chatId, message) {
  const res = await fetch('/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send message');
  }
  return res.json();
}

export async function logoutSession() {
  const res = await fetch('/api/logout', { method: 'POST' });
  if (!res.ok) throw new Error('Logout failed');
  return res.json();
}

export async function restartClient() {
  const res = await fetch('/api/restart', { method: 'POST' });
  if (!res.ok) throw new Error('Restart failed');
  return res.json();
}

// 📋 AI Task & Action Planner APIs
export async function getTasks() {
  const res = await fetch('/api/tasks');
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(taskData) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(id, updates) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
  return res.json();
}

// 🤖 Gemini AI Reply Suggestions & Analytics
export async function getAIReplySuggestions(chatId) {
  const res = await fetch('/api/ai/replies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId })
  });
  if (!res.ok) throw new Error('Failed to generate AI replies');
  return res.json();
}

export async function getAnalytics() {
  const res = await fetch('/api/ai/analytics');
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function analyzeAllMessages() {
  const res = await fetch('/api/ai/analyze-all', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run bulk analysis');
  return res.json();
}
