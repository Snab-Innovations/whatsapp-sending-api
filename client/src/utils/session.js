// Utility to manage isolated multi-tenant user session IDs

const SESSION_KEY = 'whatsapp_saas_session_id';
const PASSCODE_KEY = 'whatsapp_saas_session_passcode';

export function getStoredSessionId() {
  return localStorage.getItem(SESSION_KEY) || '';
}

export function getSessionPasscode() {
  return localStorage.getItem(PASSCODE_KEY) || '';
}

export function hasStoredSession() {
  return Boolean(localStorage.getItem(SESSION_KEY) && localStorage.getItem(PASSCODE_KEY));
}

export function getOrCreateSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    // Generate temporary unauthenticated guest ID (do NOT store passcode in localStorage)
    return `guest_${Math.random().toString(36).substring(2, 10)}`;
  }
  return sessionId;
}

export function setSessionCredentials(sessionId, passcode) {
  if (sessionId) {
    localStorage.setItem(SESSION_KEY, String(sessionId).trim());
  }
  if (passcode) {
    localStorage.setItem(PASSCODE_KEY, String(passcode).trim());
  }
}

export function setSessionPasscode(passcode) {
  if (passcode) {
    localStorage.setItem(PASSCODE_KEY, String(passcode).trim());
  } else {
    localStorage.removeItem(PASSCODE_KEY);
  }
}

export function clearSessionPasscode() {
  localStorage.removeItem(PASSCODE_KEY);
}

export function logoutClientSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PASSCODE_KEY);
  window.location.reload();
}

export function switchSession(newSessionId, passcode = '') {
  if (newSessionId) {
    localStorage.setItem(SESSION_KEY, String(newSessionId).trim());
  }
  if (passcode) {
    setSessionPasscode(passcode);
  } else {
    clearSessionPasscode();
  }
  window.location.reload();
}

export function resetSessionId() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PASSCODE_KEY);
  window.location.reload();
}

export function lockClientSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PASSCODE_KEY);
  window.location.reload();
}

