// Utility to manage isolated multi-tenant user session IDs

const SESSION_KEY = 'whatsapp_saas_session_id';
const PASSCODE_KEY = 'whatsapp_saas_session_passcode';

export function getOrCreateSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `user_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function getSessionPasscode() {
  return localStorage.getItem(PASSCODE_KEY) || '';
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
  const newSessionId = `user_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
  localStorage.setItem(SESSION_KEY, newSessionId);
  clearSessionPasscode();
  return newSessionId;
}
