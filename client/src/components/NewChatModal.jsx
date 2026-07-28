import React, { useState } from 'react';
import { Send, X, Phone, MessageSquare, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function NewChatModal({ isOpen, onClose, onSendDirectMessage }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Hello! Testing WhatsApp message sending.');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !message.trim()) return;

    setError(null);
    setSuccess(false);
    setSending(true);

    try {
      await onSendDirectMessage(phoneNumber.trim(), message.trim());
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setPhoneNumber('');
        setMessage('Hello! Testing WhatsApp message sending.');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-[#0095f6] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">New Direct Message</h3>
              <p className="text-xs text-slate-500 font-medium">Test sending a message to any phone number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#0095f6]" /> Phone Number (with Country Code)
            </label>
            <input
              type="text"
              placeholder="e.g. 919876543210 or 15551234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0095f6] placeholder-slate-400 font-medium"
            />
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Include country code without '+' or spaces (e.g. 91 for India, 1 for US/Canada).
            </p>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Message Content
            </label>
            <textarea
              rows={3}
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0095f6] placeholder-slate-400 resize-none font-medium"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Direct message sent successfully!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Direct Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
