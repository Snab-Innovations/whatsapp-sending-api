const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const { syncTaskToFirestore, deleteTaskFromFirestore } = require('./firebase');

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
let genAI = null;
let model = null;

if (apiKey && !apiKey.includes('YOUR_')) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('[Gemini AI] Initialized gemini-1.5-flash with API key.');
  } catch (err) {
    console.warn('[Gemini AI] Initialization error:', err.message);
  }
} else {
  console.warn('[Gemini AI] Warning: GEMINI_API_KEY is not set or invalid. Heuristic fallback analyzer active.');
}

/**
 * Analyzes a WhatsApp message for tasks, priorities, categories, due dates, and detailed AI verdicts.
 */
async function analyzeMessage(text, senderName = 'Contact') {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  // 1. Try Gemini AI API if available
  if (genAI) {
    try {
      const prompt = `
You are an expert AI executive productivity assistant analyzing a WhatsApp message.
Analyze the message and extract task details, priority, due date, category, sentiment, and an explicit AI Verdict / Detailed Decision.

CRITICAL TASK EXTRACTION & CASUAL GREETINGS RULES:
1. MESSAGES CONTAINING ONLY GREETINGS, PLEASANTRIES, AFFECTION, OR CASUAL CONVERSATION (e.g. 'good morning', 'good evening', 'hi', 'hello', 'how are you', 'thank you', 'okay', 'bye', 'kay krte', 'kya kar rahe ho', 'love you') ARE NOT TASKS!
   - You MUST set "hasTask": false, "taskTitle": null, and "verdict": null for all casual greetings & personal messages!
2. ANY message mentioning an INTERVIEW, JOB OPPORTUNITY, INTERVIEW LOCATION/VENUE (e.g. NEC, Nashik, SNAB Innovation), MEETING, APPOINTMENT, DEADLINE, PAYMENT, or URGENT ASSIGNMENT MUST BE CLASSIFIED AS:
   - "hasTask": true
   - "priority": "HIGH"
   - "category": "Meeting" or "Urgent" or "Work"
3. Do NOT classify job interviews, scheduled meetings, or time-sensitive appointments as "LOW" priority or "General" category!

Sender: "${senderName}"
Message: "${text}"

Respond ONLY with a valid JSON object matching this exact schema (no markdown fences, no extra text):
{
  "hasTask": true_or_false,
  "taskTitle": "Short actionable title if hasTask is true, else null",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "category": "Meeting" | "Urgent" | "Work" | "Follow-up" | "Payment" | "General",
  "dueDate": "Extracted date and time if specified, else null",
  "sentiment": "Urgent" | "Important" | "Positive" | "Neutral",
  "summary": "1 concise sentence summarizing key point",
  "verdict": "Detailed executive decision & verdict if hasTask is true, else null"
}`;

      let result;
      const candidateModels = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro'];
      let lastErr = null;

      for (const mName of candidateModels) {
        try {
          const m = genAI.getGenerativeModel({ model: mName });
          result = await m.generateContent(prompt);
          if (result) break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!result) throw lastErr || new Error('No candidate Gemini model succeeded');

      const responseText = result.response.text().trim();
      const cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);
      return parsed;
    } catch (err) {
      console.warn('[Gemini AI] Analysis error, reverting to enhanced heuristic fallback:', err.message);
    }
  }

  // 2. Enhanced Heuristic Rule-Based Fallback
  return fallbackAnalyze(text);
}

/**
 * Enhanced heuristic smart reply fallback generator matching exact language & chat context
 */
function generateContextualReplies(messages = [], contactName = 'Contact') {
  const cleanName = contactName && contactName !== 'Contact' && !contactName.includes('@') && !/^\+?\d+$/.test(contactName)
    ? contactName
    : '';

  if (!messages || messages.length === 0) {
    return [
      `Hello ${cleanName ? cleanName : ''}! How can I help you today?`.trim(),
      `Hi! Let me know if you need anything.`,
      `Hey! Following up on our chat.`
    ];
  }

  const lastMsgObj = messages[messages.length - 1];
  const lastMsgText = (lastMsgObj ? lastMsgObj.body || '' : '').trim();
  const lower = lastMsgText.toLowerCase();

  // 1. Affection / Love / Emotional messages ("Love you 😘", "love u", "I love you", emojis)
  if (lower.includes('love you') || lower.includes('love u') || lower.includes('loveyou') || lower.includes('i love u') || lower.includes('❤️') || lower.includes('😘') || lower.includes('🥰')) {
    return [
      `Love you too! ❤️😘`,
      `Love you so much! 🥰`,
      `Aww, love you! ❤️`
    ];
  }

  // 2. Greetings with "Sir" / Formal greetings ("Good morning sir", "Good morning", "GM sir")
  if (lower.includes('good morning') || lower.includes('gm')) {
    if (lower.includes('sir')) {
      return [
        `Good morning! How can I help you today?`,
        `Good morning sir! Have a great day ahead.`,
        `Morning sir! Any updates for today?`
      ];
    }
    return [
      `Good morning ${cleanName}! Have a great day ahead ☀️`.trim(),
      `Good morning! How are you doing today?`,
      `Morning! Hope all is going well.`
    ];
  }

  if (lower.includes('good evening') || lower.includes('good night') || lower.includes('gn')) {
    return [
      `Good evening ${cleanName}!`.trim(),
      `Good night! Take care and sleep well 🌙`,
      `Sweet dreams! Talk tomorrow.`
    ];
  }

  // 3. Short greetings ("hii", "hello", "heyy", "hey")
  if (/^(hi+|hello+|hey+|hie+)[!.,\s]*$/i.test(lower)) {
    return [
      `Hii ${cleanName}! How are you?`.trim(),
      `Hey! What's up?`,
      `Hii! Bol na, kya update hai?`
    ];
  }

  // 4. Meeting / Google Meet / Zoom Links
  if (lower.includes('meet.google.com') || lower.includes('zoom.us') || lower.includes('teams.microsoft')) {
    return [
      `Joining the meeting link right now! 📹`,
      `Got the link, joining in 2 minutes!`,
      `Thanks! I am ready for the call.`
    ];
  }

  // 5. Interview / Schedule / Location / Venue
  if (lower.includes('interview') || lower.includes('snab') || lower.includes('venue') || lower.includes('location') || lower.includes('schedule') || lower.includes('nec') || lower.includes('nashik')) {
    return [
      `Confirmed! I will attend the interview on time at the venue.`,
      `Thank you for scheduling! Could you please share the exact Google Maps location?`,
      `Got it! Looking forward to the interview session.`
    ];
  }

  // 6. Marathi Casual Chat ("kay krte", "kay karta", "kasa ahes")
  if (lower.includes('kay krte') || lower.includes('kay karta') || lower.includes('kay krto') || lower.includes('kasa ahes') || lower.includes('kasi ahes') || lower.includes('kay chalalay')) {
    return [
      `Kahi nahi, bas kaam karat ahe. Tu sang?`,
      `Mast chalalay! Tu kay kartey?`,
      `Busy in work right now. Bol na!`
    ];
  }

  // 7. Hinglish Casual Chat ("kya kar rahe ho", "kya kr rhe ho", "kya chal raha hai")
  if (lower.includes('kya kar rahe') || lower.includes('kya kr rhe') || lower.includes('kya chal raha') || lower.includes('kya bolte')) {
    return [
      `Kuch nahi, bas work handle kar raha hu. Tum batao?`,
      `Bas badhiya! Tum batao kya scene hai?`,
      `Working on tasks right now. Bol kya update hai?`
    ];
  }

  // 8. How are you / HRU
  if (lower.includes('how are you') || lower.includes('hru') || lower.includes('wbu') || lower.includes('wby')) {
    return [
      `I am doing great, thanks for asking! How are you doing?`,
      `Doing good! How is everything on your side?`,
      `All well here! What about you?`
    ];
  }

  // 9. Payment / Financial Messages
  if (lower.includes('payment') || lower.includes('bill') || lower.includes('invoice') || lower.includes('money') || lower.includes('pay')) {
    return [
      `Received the payment details. Will process it shortly!`,
      `Could you please share the invoice / receipt PDF?`,
      `Payment is done! Please verify at your end.`
    ];
  }

  // 10. Tasks / Submissions / Reports / News / Official updates
  if (lower.includes('submit') || lower.includes('report') || lower.includes('project') || lower.includes('task') || lower.includes('document') || lower.includes('send') || lower.includes('cap round') || lower.includes('dse')) {
    return [
      `Working on this right now. Will share the update soon!`,
      `I will review and send the documents/update shortly.`,
      `Got the update! Thank you for sharing.`
    ];
  }

  // 11. Personalized default replies (avoiding generic "Thanks for the update, Prapti Patil!")
  return [
    `Got it! Let me check and get back to you.`,
    `Sounds good! Will follow up on this shortly.`,
    `Sure! Will update you in a bit.`
  ];
}

/**
 * Generates 3 smart personalized AI reply suggestions for a conversation
 */
async function generateSmartReplies(messages = [], contactName = 'Contact') {
  const contextualDefaults = generateContextualReplies(messages, contactName);

  if (!genAI || !messages || messages.length === 0) {
    return contextualDefaults;
  }

  try {
    const recentContext = messages.slice(-10).map(m => `${m.fromMe ? 'Me' : contactName}: ${m.body}`).join('\n');
    const prompt = `
You are an expert personalized WhatsApp AI smart reply assistant.
Analyze the conversation context below with ${contactName} and suggest 3 highly accurate, context-aware, personalized replies.

RULES:
1. Matches the tone, language (English, Hinglish, Marathi, Hindi), and topic of the conversation!
2. If the last message is an expression of affection (e.g. 'Love you 😘'), suggest warm responses like 'Love you too! ❤️😘'.
3. If the last message is a greeting (e.g. 'kay krte', 'Good morning sir', 'kya kar rahe ho'), reply appropriately in that exact language/vibe.
4. If the last message is about a meeting, schedule, venue, or link, provide direct actionable responses (e.g. 'I will attend on time', 'Joining link now').

Recent Chat History:
${recentContext}

Respond ONLY with a valid JSON array of 3 strings (no markdown, no extra text):
["Response 1...", "Response 2...", "Response 3..."]`;

    const candidateModels = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro'];
    let result;

    for (const mName of candidateModels) {
      try {
        const m = genAI.getGenerativeModel({ model: mName });
        result = await m.generateContent(prompt);
        if (result) break;
      } catch (e) {
        // try next model
      }
    }

    if (result) {
      const text = result.response.text().trim();
      const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed.slice(0, 3);
      }
    }
  } catch (err) {
    console.warn('[Gemini AI] Smart reply error, using contextual fallback:', err.message);
  }

  return contextualDefaults;
}

/**
 * Bulk analyzes all stored messages across all chats with strict task deduplication & greeting filters
 */
async function batchAnalyzeAllMessages(chatsMap, messagesMap, tasksMap) {
  let analyzedCount = 0;
  let newTasksExtracted = 0;
  const chatSummaries = [];

  // Purge any existing casual greeting tasks from tasksMap
  for (const [id, t] of tasksMap.entries()) {
    const lowerMsg = (t.originalMessage || t.title || '').toLowerCase().trim();
    const isCasualGreeting = /^(good\s*(morning|afternoon|evening|night)|hi+|hello+|hey+|gm|gn|hie|heyy+|how\s*are\s*you|thanks|thank\s*you|ok|okay|k|cool|great|nice|bye|take\s*care|tc|welcome|kay\s*(krte|karta|krto|chalel|karte|chalalay)|kya\s*(kar\s*rahe\s*ho|kr\s*rhe\s*ho|krte|kar\s*raha\s*h|bolte|chal\s*raha\s*hai)|whats\s*up|what's\s*up|sup|wbu|wby|hru|i\s*love\s*you|love\s*you)[!.,\s\u1f600-\u1f64f\u1f300-\u1f5ff\u1f680-\u1f6ff\u2600-\u26ff]*$/i.test(lowerMsg);
    if (isCasualGreeting) {
      tasksMap.delete(id);
      deleteTaskFromFirestore(id).catch(() => null);
    }
  }

  for (const [chatId, messages] of messagesMap.entries()) {
    const chatObj = chatsMap.get(chatId);
    const chatName = chatObj ? chatObj.name : chatId.split('@')[0];

    let chatTaskCount = 0;
    const chatTasks = [];

    const targetMsgs = messages.slice(-30);
    for (const msg of targetMsgs) {
      if (!msg.body || msg.body.trim().length === 0) continue;
      analyzedCount++;

      const textLower = msg.body.toLowerCase().trim();
      const isCasualGreeting = /^(good\s*(morning|afternoon|evening|night)|hi+|hello+|hey+|gm|gn|hie|heyy+|how\s*are\s*you|thanks|thank\s*you|ok|okay|k|cool|great|nice|bye|take\s*care|tc|welcome|kay\s*(krte|karta|krto|chalel|karte|chalalay)|kya\s*(kar\s*rahe\s*ho|kr\s*rhe\s*ho|krte|kar\s*raha\s*h|bolte|chal\s*raha\s*hai)|whats\s*up|what's\s*up|sup|wbu|wby|hru|i\s*love\s*you|love\s*you)[!.,\s\u1f600-\u1f64f\u1f300-\u1f5ff\u1f680-\u1f6ff\u2600-\u26ff]*$/i.test(textLower);

      if (isCasualGreeting) {
        msg.aiAnalysis = {
          hasTask: false,
          taskTitle: null,
          priority: 'LOW',
          category: 'General',
          summary: 'Conversational message',
          verdict: null
        };
        continue;
      }

      const isImportantEvent = textLower.includes('interview') || textLower.includes('snab') || textLower.includes('schedule') || textLower.includes('meeting') || textLower.includes('urgent') || textLower.includes('appointment');

      if (!msg.aiAnalysis || (isImportantEvent && msg.aiAnalysis.priority === 'LOW')) {
        const analysis = await analyzeMessage(msg.body, chatName).catch(() => null);
        if (analysis) {
          msg.aiAnalysis = analysis;
          if (analysis.hasTask) {
            // Strict task deduplication key
            const targetTaskId = msg.id ? `task-${msg.id}` : `task-${chatId}-${msg.body.trim().substring(0, 30)}`;

            // Check if task already exists by ID or by matching originalMessage in same chat
            let existingId = null;
            if (tasksMap.has(targetTaskId)) {
              existingId = targetTaskId;
            } else {
              for (const [id, t] of tasksMap.entries()) {
                if (t.chatId === chatId && t.originalMessage === msg.body) {
                  existingId = id;
                  break;
                }
              }
            }

            if (existingId) {
              // Update existing task instead of creating a duplicate
              const existing = tasksMap.get(existingId);
              existing.priority = analysis.priority || (isImportantEvent ? 'HIGH' : existing.priority);
              existing.category = analysis.category || (isImportantEvent ? 'Meeting' : existing.category);
              existing.title = analysis.taskTitle || existing.title;
              existing.dueDate = analysis.dueDate || existing.dueDate;
              existing.verdict = analysis.verdict || analysis.summary || existing.verdict;
              existing.summary = analysis.summary || existing.summary;
              tasksMap.set(existingId, existing);
              syncTaskToFirestore(existing).catch(() => null);
              chatTaskCount++;
              chatTasks.push(existing);
            } else {
              // Create new task
              const taskObj = {
                id: targetTaskId,
                title: analysis.taskTitle || msg.body,
                chatId,
                chatName,
                originalMessage: msg.body,
                priority: analysis.priority || (isImportantEvent ? 'HIGH' : 'MEDIUM'),
                category: analysis.category || (isImportantEvent ? 'Meeting' : 'General'),
                status: 'TO_DO',
                dueDate: analysis.dueDate || 'Upcoming',
                sentiment: analysis.sentiment || 'Important',
                summary: analysis.summary || '',
                verdict: analysis.verdict || analysis.summary || msg.body,
                createdAt: new Date().toISOString()
              };

              tasksMap.set(targetTaskId, taskObj);
              syncTaskToFirestore(taskObj).catch(() => null);
              newTasksExtracted++;
              chatTaskCount++;
              chatTasks.push(taskObj);
            }
          }
        }
      } else if (msg.aiAnalysis.hasTask) {
        chatTaskCount++;
      }
    }

    chatSummaries.push({
      chatId,
      chatName,
      totalMessages: messages.length,
      taskCount: chatTaskCount,
      lastMessageTime: chatObj?.timestamp || 0,
      tasks: chatTasks
    });
  }

  return {
    analyzedCount,
    newTasksExtracted,
    totalTasks: tasksMap.size,
    chatSummaries
  };
}

/**
 * Enhanced Rule-based heuristic analyzer fallback ignoring casual greetings
 */
function fallbackAnalyze(text) {
  const lower = text.toLowerCase().trim();

  // 1. Casual Greetings & Pleasantries Filter
  const isCasualGreeting = /^(good\s*(morning|afternoon|evening|night)|hi+|hello+|hey+|gm|gn|hie|heyy+|how\s*are\s*you|thanks|thank\s*you|ok|okay|k|cool|great|nice|bye|take\s*care|tc|welcome|kay\s*(krte|karta|krto|chalel|karte|chalalay)|kya\s*(kar\s*rahe\s*ho|kr\s*rhe\s*ho|krte|kar\s*raha\s*h|bolte|chal\s*raha\s*hai)|whats\s*up|what's\s*up|sup|wbu|wby|hru|i\s*love\s*you|love\s*you)[!.,\s\u1f600-\u1f64f\u1f300-\u1f5ff\u1f680-\u1f6ff\u2600-\u26ff]*$/i.test(lower);
  
  if (isCasualGreeting) {
    return {
      hasTask: false,
      taskTitle: null,
      priority: 'LOW',
      category: 'General',
      dueDate: null,
      sentiment: 'Positive',
      summary: 'Conversational message',
      verdict: null
    };
  }

  const isInterview = lower.includes('interview') || lower.includes('snab') || lower.includes('candidate') || lower.includes('appointment') || lower.includes('hiring') || lower.includes('job') || lower.includes('shortlisted');
  const isUrgent = lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately') || lower.includes('critical') || lower.includes('imp ') || lower.includes('important');
  const isMeeting = isInterview || lower.includes('meeting') || lower.includes('schedule') || lower.includes('scheduled') || lower.includes('call') || lower.includes('zoom') || lower.includes('meet') || lower.includes('location') || lower.includes('venue') || lower.includes('nashik') || lower.includes('nec');
  const isWork = lower.includes('submit') || lower.includes('report') || lower.includes('task') || lower.includes('project') || lower.includes('send') || lower.includes('fix') || lower.includes('documents') || lower.includes('card') || lower.includes('assign');
  const isPayment = lower.includes('payment') || lower.includes('invoice') || lower.includes('bill') || lower.includes('pay') || lower.includes('cheque') || lower.includes('salary');
  const isFollowUp = lower.includes('check') || lower.includes('update') || lower.includes('status') || lower.includes('reminder');

  const hasTimeOrDate = /\b(1[0-2]|[1-9])\s*(am|pm)\b/i.test(text) ||
                        /\b\d{1,2}\s*(jul|aug|sep|oct|nov|dec|jan|feb|mar|apr|may|jun)/i.test(text) ||
                        lower.includes('today') || lower.includes('tomorrow');

  const hasTask = isInterview || isUrgent || isMeeting || isWork || isPayment || isFollowUp || hasTimeOrDate || lower.includes('please') || lower.includes('by ');

  if (!hasTask) {
    return {
      hasTask: false,
      taskTitle: null,
      priority: 'LOW',
      category: 'General',
      dueDate: null,
      sentiment: 'Neutral',
      summary: text.length > 50 ? text.substring(0, 47) + '...' : text,
      verdict: null
    };
  }

  // Priority classification logic: Interviews, Appointments, Deadlines & Urgent items are HIGH priority
  let priority = 'LOW';
  if (isInterview || isUrgent || (isMeeting && hasTimeOrDate) || lower.includes('important') || lower.includes('imp ')) {
    priority = 'HIGH';
  } else if (isMeeting || isWork || isPayment) {
    priority = 'MEDIUM';
  }

  // Category classification logic
  let category = 'General';
  if (isInterview || isMeeting) category = 'Meeting';
  else if (isUrgent) category = 'Urgent';
  else if (isWork) category = 'Work';
  else if (isPayment) category = 'Payment';
  else if (isFollowUp) category = 'Follow-up';

  // Due date extraction logic
  let dueDate = null;
  const dateMatch = text.match(/\b\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(\s*at\s*\d{1,2}(\:\d{2})?\s*(am|pm)?)?/i) ||
                    text.match(/\b\d{1,2}\:\d{2}\s*(am|pm)?\b/i) ||
                    text.match(/\b(today|tomorrow|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/i);
  if (dateMatch) {
    dueDate = dateMatch[0];
  } else if (lower.includes('today')) {
    dueDate = 'Today';
  } else if (lower.includes('tomorrow')) {
    dueDate = 'Tomorrow';
  }

  // Task title generation
  let taskTitle = text;
  if (isInterview) {
    taskTitle = `Attend Job Interview: ${text.length > 50 ? text.substring(0, 47) + '...' : text}`;
  } else if (text.length > 55) {
    taskTitle = text.substring(0, 52) + '...';
  }

  // Detailed AI Verdict & Assigned Decision Summary
  let verdict = `Action Item Identified. Priority: ${priority} (${category}).`;
  if (isInterview) {
    verdict = `🔥 CRITICAL INTERVIEW VERDICT: Confirmed high-priority interview/schedule meeting. Location & Venue details: "${text}". Assigned for immediate attendance & calendar blocking.`;
  } else if (isUrgent) {
    verdict = `🚨 URGENT ACTION VERDICT: High-priority task requiring immediate resolution. Content: "${text}".`;
  } else if (isMeeting) {
    verdict = `📅 MEETING & SCHEDULE VERDICT: Scheduled appointment or discussion. Date/Time: ${dueDate || 'Upcoming'}. Assigned as priority item.`;
  }

  return {
    hasTask,
    taskTitle,
    priority,
    category,
    dueDate,
    sentiment: (isInterview || isUrgent) ? 'Urgent' : 'Important',
    summary: text.length > 70 ? text.substring(0, 67) + '...' : text,
    verdict
  };
}

module.exports = {
  analyzeMessage,
  generateSmartReplies,
  batchAnalyzeAllMessages
};
