import React, { useState } from 'react';
import { Send, X, Phone, MessageSquare, AlertCircle, Loader2, CheckCircle2, Search, ChevronDown, Globe } from 'lucide-react';

const COUNTRIES = [
  { code: 'IN', name: 'India', dialCode: '91', flag: '🇮🇳', length: 10 },
  { code: 'US', name: 'United States', dialCode: '1', flag: '🇺🇸', length: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '44', flag: '🇬🇧', length: 10 },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '971', flag: '🇦🇪', length: 9 },
  { code: 'CA', name: 'Canada', dialCode: '1', flag: '🇨🇦', length: 10 },
  { code: 'AU', name: 'Australia', dialCode: '61', flag: '🇦🇺', length: 9 },
  { code: 'SG', name: 'Singapore', dialCode: '65', flag: '🇸🇬', length: 8 },
  { code: 'DE', name: 'Germany', dialCode: '49', flag: '🇩🇪', length: 10 },
  { code: 'FR', name: 'France', dialCode: '33', flag: '🇫🇷', length: 9 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '966', flag: '🇸🇦', length: 9 },
  { code: 'QA', name: 'Qatar', dialCode: '974', flag: '🇶🇦', length: 8 },
  { code: 'KW', name: 'Kuwait', dialCode: '965', flag: '🇰🇼', length: 8 },
  { code: 'OM', name: 'Oman', dialCode: '968', flag: '🇴🇲', length: 8 },
  { code: 'BH', name: 'Bahrain', dialCode: '973', flag: '🇧🇭', length: 8 },
  { code: 'NP', name: 'Nepal', dialCode: '977', flag: '🇳🇵', length: 10 },
  { code: 'LK', name: 'Sri Lanka', dialCode: '94', flag: '🇱🇰', length: 9 },
  { code: 'BD', name: 'Bangladesh', dialCode: '880', flag: '🇧🇩', length: 10 },
  { code: 'PK', name: 'Pakistan', dialCode: '92', flag: '🇵🇰', length: 10 },
  { code: 'MY', name: 'Malaysia', dialCode: '60', flag: '🇲🇾', length: 9 },
  { code: 'NZ', name: 'New Zealand', dialCode: '64', flag: '🇳🇿', length: 9 }
];

export default function NewChatModal({ isOpen, onClose, onSendDirectMessage }) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default India +91
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Hello! Testing WhatsApp message sending.');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  if (!isOpen) return null;

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.dialCode.includes(countrySearch) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Format full number
  const cleanDigits = phoneNumber.replace(/\D/g, '');
  
  let formattedFullNumber = '';
  if (cleanDigits) {
    if (cleanDigits.startsWith(selectedCountry.dialCode) && cleanDigits.length > selectedCountry.dialCode.length) {
      formattedFullNumber = cleanDigits;
    } else {
      formattedFullNumber = `${selectedCountry.dialCode}${cleanDigits}`;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits) {
      setError('Please enter a valid phone number.');
      return;
    }

    // Validation for India (default 10 digits)
    if (selectedCountry.code === 'IN' && !digits.startsWith('91') && digits.length !== 10) {
      setError('India phone numbers must contain exactly 10 digits (e.g. 9876543210).');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message to send.');
      return;
    }

    try {
      setSending(true);
      await onSendDirectMessage(formattedFullNumber, message.trim());
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
              <p className="text-xs text-slate-500 font-medium">Send a WhatsApp message to any number</p>
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
          {/* Country & Phone Number Selector */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#0095f6]" /> Mobile Phone Number
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {selectedCountry.code === 'IN' ? 'Exact 10 digits' : 'With Country Code'}
              </span>
            </label>

            <div className="flex items-center gap-2">
              {/* Country Code Picker Button */}
              <button
                type="button"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-900 text-xs px-3 py-2.5 rounded-xl transition-all font-bold shrink-0 shadow-xs"
              >
                <span className="text-base">{selectedCountry.flag}</span>
                <span>+{selectedCountry.dialCode}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Phone Input */}
              <input
                type="tel"
                placeholder={selectedCountry.code === 'IN' ? 'e.g. 9876543210' : 'Mobile number'}
                value={phoneNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow digits and plus sign
                  if (/^[0-9+\s-]*$/.test(val)) {
                    setPhoneNumber(val);
                    setError(null);
                  }
                }}
                required
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0095f6] placeholder-slate-400 font-medium"
              />
            </div>

            {/* Country Selector Search Popup */}
            {showCountryDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 space-y-2 animate-fadeIn">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search country or code..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="w-full bg-slate-100 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0095f6]"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(country);
                        setShowCountryDropdown(false);
                        setCountrySearch('');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        selectedCountry.code === country.code
                          ? 'bg-sky-50 text-[#0095f6] font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{country.flag}</span>
                        <span>{country.name}</span>
                      </span>
                      <span className="font-mono text-slate-500">+{country.dialCode}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live Number Preview Banner */}
            {formattedFullNumber && (
              <div className="text-[11px] text-slate-500 font-mono bg-slate-100 p-2 rounded-xl border border-slate-200 flex items-center justify-between">
                <span>WhatsApp Target JID:</span>
                <span className="font-bold text-[#0095f6]">+{formattedFullNumber}</span>
              </div>
            )}
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
