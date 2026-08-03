import React, { useState, useEffect } from 'react';
import {
  Send,
  QrCode,
  RefreshCw,
  LogOut,
  Key,
  Copy,
  Check,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Code2,
  Terminal,
  Server,
  Sparkles,
  Loader2,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { getStoredSessionId, getSessionPasscode, hasStoredSession, logoutClientSession } from './utils/session';
import {
  subscribeToEvents,
  getStatus,
  sendMessage,
  logoutSession,
  restartClient,
  verifyPasscode
} from './services/api';
import AuthModal from './components/AuthModal';

export default function App() {
  const [clientState, setClientState] = useState({
    status: 'INITIALIZING',
    qrCodeDataUrl: null,
    userInfo: null,
    error: null,
    isLocked: true
  });

  const [sessionId, setSessionId] = useState(getStoredSessionId() || '');
  const [passcode, setPasscode] = useState(getSessionPasscode() || '');
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Form State
  const [recipient, setRecipient] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState(null);

  // Sent Messages History Log (local state)
  const [sentLogs, setSentLogs] = useState([]);

  // Active Code Snippet Tab: 'curl' | 'javascript' | 'python'
  const [activeCodeTab, setActiveCodeTab] = useState('curl');

  // Load Status & Subscribe to SSE Events
  useEffect(() => {
    setSessionId(getStoredSessionId() || '');
    setPasscode(getSessionPasscode() || '');
    getStatus()
      .then(state => {
        if (state) setClientState(state);
      })
      .catch(err => console.error('Status fetch error:', err));

    const unsubscribe = subscribeToEvents((data) => {
      setClientState(prev => ({ ...prev, ...data }));
    });

    return () => unsubscribe();
  }, []);

  // Poll for QR updates if initializing
  useEffect(() => {
    if (clientState.status !== 'READY') {
      const interval = setInterval(() => {
        getStatus()
          .then(state => {
            if (state) setClientState(state);
          })
          .catch(() => null);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [clientState.status]);

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!recipient.trim() || !messageText.trim()) {
      showToast('Recipient number and message text are required', 'error');
      return;
    }

    setSending(true);
    setNotification(null);

    try {
      const res = await sendMessage(recipient.trim(), messageText.trim());
      if (res.success) {
        showToast(`Message sent successfully to ${res.phone || recipient}!`, 'success');
        const newLog = {
          id: res.messageId || `msg-${Date.now()}`,
          to: res.to || recipient,
          phone: res.phone || recipient,
          text: messageText.trim(),
          timestamp: new Date().toLocaleTimeString(),
          status: 'DELIVERED'
        };
        setSentLogs(prev => [newLog, ...prev]);
        setMessageText('');
      } else {
        showToast(res.error || 'Failed to send WhatsApp message', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error sending message', 'error');
    } finally {
      setSending(false);
    }
  };

  const showToast = (text, type = 'info') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out WhatsApp account?')) {
      try {
        await logoutSession();
      } catch (err) {
        console.warn('Logout API call error:', err);
      }
      logoutClientSession();
    }
  };

  const handleRestart = async () => {
    try {
      await restartClient();
      showToast('WhatsApp connection restarted', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const isAuthenticated = hasStoredSession() && !clientState.isLocked;
  const isModalOpen = !isAuthenticated || clientState.status !== 'READY';
  const isLocked = Boolean(clientState.isLocked) || !hasStoredSession();
  const serverUrl = window.location.origin;

  // Generate Snippets
  const getCurlSnippet = () => `curl -X POST "${serverUrl}/api/messages/send" \\
  -H "Content-Type: application/json" \\
  -H "x-session-id: ${sessionId}" \\
  -H "x-session-passcode: ${passcode || 'YOUR_PASSCODE'}" \\
  -d '{
    "to": "${recipient.trim() || '919876543210'}",
    "message": "${(messageText.trim() || 'Hello from WhatsApp API!').replace(/'/g, "\\'")}"
  }'`;

  const getJsSnippet = () => `fetch("${serverUrl}/api/messages/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-session-id": "${sessionId}",
    "x-session-passcode": "${passcode || 'YOUR_PASSCODE'}"
  },
  body: JSON.stringify({
    to: "${recipient.trim() || '919876543210'}",
    message: "${(messageText.trim() || 'Hello from WhatsApp API!').replace(/"/g, '\\"')}"
  })
})
.then(res => res.json())
.then(data => console.log(data));`;

  const getPythonSnippet = () => `import requests

url = "${serverUrl}/api/messages/send"
headers = {
    "Content-Type": "application/json",
    "x-session-id": "${sessionId}",
    "x-session-passcode": "${passcode || 'YOUR_PASSCODE'}"
}
payload = {
    "to": "${recipient.trim() || '919876543210'}",
    "message": "${(messageText.trim() || 'Hello from WhatsApp API!').replace(/"/g, '\\"')}"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base lg:text-lg tracking-tight text-white">
                WhatsApp Message Sending API
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wide">
                API Only
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Outbound API Engine & Dispatcher Console</p>
          </div>
        </div>

        {/* Status Pill & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-300">
            <span className="text-slate-400 font-sans">Session:</span>
            <span className="text-emerald-400 font-bold">{sessionId}</span>
            <button
              onClick={() => handleCopy(sessionId, 'session')}
              className="hover:text-white transition-colors cursor-pointer ml-1"
              title="Copy Session ID"
            >
              {copiedKey === 'session' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Connection Status Badge */}
          {clientState.status === 'READY' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>WhatsApp Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{clientState.status === 'QR_READY' ? 'Scan QR Code' : 'Connecting...'}</span>
            </div>
          )}

          <button
            onClick={handleRestart}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Restart WhatsApp Socket"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="Logout WhatsApp Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Toast Alert */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-bold transition-all animate-bounce ${
          notification.type === 'success' ? 'bg-emerald-950 border-emerald-600 text-emerald-200' :
          notification.type === 'error' ? 'bg-rose-950 border-rose-600 text-rose-200' :
          'bg-slate-900 border-slate-700 text-slate-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column: WhatsApp Sending Form & Live Outbound Logs */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card: Send WhatsApp Message Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-white">Send WhatsApp Message</h2>
                  <p className="text-xs text-slate-400">Dispatch text message directly via API engine</p>
                </div>
              </div>
              {clientState.userInfo && (
                <div className="text-right text-xs">
                  <span className="text-slate-500 block">Sender Account</span>
                  <span className="font-bold text-emerald-400">+{clientState.userInfo.phone}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Recipient Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g. 919876543210 (Country code + phone number)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    required
                  />
                  <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Enter number with country code without + sign (e.g. 919876543210)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Message Text
                </label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your WhatsApp message payload here..."
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending || clientState.status !== 'READY'}
                className="w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Dispatching Message...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send WhatsApp Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Outbound Sent Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> Outbound Dispatch Logs ({sentLogs.length})
              </h3>
              {sentLogs.length > 0 && (
                <button
                  onClick={() => setSentLogs([])}
                  className="text-[11px] text-slate-500 hover:text-slate-300 font-bold"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {sentLogs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
                <Send className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-slate-500">No outbound messages sent yet</p>
                <p className="text-[11px] text-slate-600 mt-1">Use the form above or send a POST request to test the API.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {sentLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">+{log.phone}</span>
                        <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-300 text-xs truncate">{log.text}</p>
                      <p className="text-[10px] font-mono text-slate-500">ID: {log.id}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      SENT 200
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: API Documentation & Integration Code Snippets */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card: API Credentials & Headers */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-base text-white">API Credentials & Headers</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Header Name</span>
                <span className="font-mono text-xs text-slate-200 font-bold block mt-1">x-session-id</span>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-xs font-mono">
                  <span className="text-emerald-400 truncate">{sessionId}</span>
                  <button
                    onClick={() => handleCopy(sessionId, 'session_card')}
                    className="text-slate-500 hover:text-white cursor-pointer ml-1"
                  >
                    {copiedKey === 'session_card' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Header Name</span>
                <span className="font-mono text-xs text-slate-200 font-bold block mt-1">x-session-passcode</span>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-xs font-mono">
                  <span className="text-emerald-400 truncate">{passcode || 'Not Set'}</span>
                  <button
                    onClick={() => handleCopy(passcode, 'passcode_card')}
                    className="text-slate-500 hover:text-white cursor-pointer ml-1"
                  >
                    {copiedKey === 'passcode_card' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card: API Developer Integration Code Snippets */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base text-white">API Integration Snippets</h3>
              </div>

              <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl gap-1 text-xs">
                <button
                  onClick={() => setActiveCodeTab('curl')}
                  className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                    activeCodeTab === 'curl' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveCodeTab('javascript')}
                  className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                    activeCodeTab === 'javascript' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JS (fetch)
                </button>
                <button
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                    activeCodeTab === 'python' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            {/* Endpoint Badge */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black rounded text-[10px]">POST</span>
                <span className="text-slate-300 font-bold">{serverUrl}/api/messages/send</span>
              </div>
            </div>

            {/* Code Block Container */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative group">
              <button
                onClick={() => {
                  const code = activeCodeTab === 'curl' ? getCurlSnippet() : activeCodeTab === 'javascript' ? getJsSnippet() : getPythonSnippet();
                  handleCopy(code, 'snippet');
                }}
                className="absolute top-3 right-3 p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Copy Snippet"
              >
                {copiedKey === 'snippet' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <pre className="text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed pr-10">
                {activeCodeTab === 'curl' && getCurlSnippet()}
                {activeCodeTab === 'javascript' && getJsSnippet()}
                {activeCodeTab === 'python' && getPythonSnippet()}
              </pre>
            </div>
          </div>
        </div>
      </main>

      {/* QR Code / Pairing Auth Modal */}
      {(isLocked || isModalOpen) && (
        <AuthModal
          clientState={clientState}
          onRestart={handleRestart}
          onResetSession={handleLogout}
          sessionId={sessionId}
          onUnlocked={() => setClientState(prev => ({ ...prev, isLocked: false }))}
        />
      )}
    </div>
  );
}
