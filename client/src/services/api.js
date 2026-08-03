// API service layer for WhatsApp Message Sending API
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

export async function sendMessage(to, message) {
  const res = await fetch(`${API_BASE}/api/messages/send`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ to, message })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to send message');
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

export async function createNewSession() {
  const res = await fetch(`${API_BASE}/api/auth/new-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to create new session');
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
