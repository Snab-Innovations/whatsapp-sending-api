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
    <div className="fixed inset-0 z-50 bg-[#0b141a]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111b21] border border-[#222d34] w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222d34] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00a884]/15 border border-[#00a884]/30 text-[#00a884] flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#e9edef] text-base">New Direct Message</h3>
              <p className="text-xs text-[#8696a0]">Test sending a message to any phone number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-semibold text-[#8696a0] mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#00a884]" /> Phone Number (with Country Code)
            </label>
            <input
              type="text"
              placeholder="e.g. 919876543210 or 15551234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full bg-[#202c33] border border-[#222d34] text-[#e9edef] text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00a884] placeholder-[#8696a0]"
            />
            <p className="text-[11px] text-[#8696a0] mt-1">
              Include country code without '+' or spaces (e.g. 91 for India, 1 for US/Canada).
            </p>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-xs font-semibold text-[#8696a0] mb-1.5">
              Message Content
            </label>
            <textarea
              rows={3}
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full bg-[#202c33] border border-[#222d34] text-[#e9edef] text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00a884] placeholder-[#8696a0] resize-none"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Message sent successfully! Opening chat...</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8696a0] hover:text-[#e9edef] bg-[#202c33] hover:bg-[#2a3942] rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!phoneNumber.trim() || !message.trim() || sending}
              className="px-5 py-2 text-xs font-bold bg-[#00a884] hover:bg-[#008f6f] text-[#0b141a] rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 fill-current" /> Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
