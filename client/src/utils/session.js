// Utility to manage isolated multi-tenant user session IDs

const SESSION_KEY = 'whatsapp_saas_session_id';

export function getOrCreateSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `user_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function resetSessionId() {
  const newSessionId = `user_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
  localStorage.setItem(SESSION_KEY, newSessionId);
  return newSessionId;
}
