// API service layer for WhatsApp web chat viewer & Gemini AI Task Manager (Multi-Tenant)
import { getOrCreateSessionId, getSessionPasscode } from '../utils/session';

const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_SERVER_URL || '').replace(/\/$/, '') : '';

function getHeaders(customHeaders = {}) {
  const sessionId = getOrCreateSessionId() || 'default';
  const passcode = getSessionPasscode() || '';
  return {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
    'x-session-passcode': passcode,
    ...customHeaders
  };
}

export function subscribeToEvents(onUpdate) {
  const sessionId = getOrCreateSessionId();
  const passcode = getSessionPasscode();
  const eventSource = new EventSource(`${API_BASE}/api/events?sessionId=${encodeURIComponent(sessionId)}&passcode=${encodeURIComponent(passcode)}`);

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

export async function verifyPasscode(passcode) {
  const res = await fetch(`${API_BASE}/api/auth/verify-passcode`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ passcode })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Invalid session passcode');
  }
  return res.json();
}

export async function setPasscode(newPasscode) {
  const res = await fetch(`${API_BASE}/api/auth/set-passcode`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ newPasscode })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to set passcode');
  }
  return res.json();
}

export async function getStatus() {
  const res = await fetch(`${API_BASE}/api/status`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function getChats() {
  const res = await fetch(`${API_BASE}/api/chats`, { headers: getHeaders() });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch chats');
  }
  return res.json();
}

export async function getChatMessages(chatId, limit = 50) {
  const res = await fetch(`${API_BASE}/api/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}`, {
    headers: getHeaders()
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch messages');
  }
  return res.json();
}

export async function sendMessage(chatId, message) {
  const res = await fetch(`${API_BASE}/api/messages/send`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ chatId, message })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send message');
  }
  return res.json();
}

export async function logoutSession() {
  const res = await fetch(`${API_BASE}/api/logout`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Logout failed');
  return res.json();
}

export async function restartClient() {
  const res = await fetch(`${API_BASE}/api/restart`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Restart failed');
  return res.json();
}

export async function syncChats() {
  const res = await fetch(`${API_BASE}/api/chats/sync`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to sync chats');
  return res.json();
}

// 📋 AI Task & Action Planner APIs
export async function getTasks() {
  const res = await fetch(`${API_BASE}/api/tasks`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(taskData) {
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(taskData)
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(id, updates) {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete task');
  return res.json();
}

// 🤖 Gemini AI Reply Suggestions & Analytics
export async function getAIReplySuggestions(chatId) {
  const res = await fetch(`${API_BASE}/api/ai/replies`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ chatId })
  });
  if (!res.ok) throw new Error('Failed to generate AI replies');
  return res.json();
}

export async function getAnalytics() {
  const res = await fetch(`${API_BASE}/api/ai/analytics`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function analyzeAllMessages() {
  const res = await fetch(`${API_BASE}/api/ai/analyze-all`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to run bulk analysis');
  return res.json();
}
