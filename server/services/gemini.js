const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
let genAI = null;
let model = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('[Gemini AI] Initialized gemini-1.5-flash with API key.');
  } catch (err) {
    console.warn('[Gemini AI] Initialization error:', err.message);
  }
} else {
  console.warn('[Gemini AI] Warning: GEMINI_API_KEY is not set. Heuristic fallback analyzer active.');
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
1. MESSAGES CONTAINING ONLY GREETINGS, PLEASANTRIES, OR CASUAL CONVERSATION (e.g. 'good morning', 'good evening', 'hi', 'hello', 'how are you', 'thank you', 'okay', 'bye') ARE NOT TASKS!
   - You MUST set "hasTask": false, "taskTitle": null, and "verdict": null for all casual greetings!
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
      const candidateModels = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro-latest', 'gemini-pro'];
      let lastErr = null;

      for (const mName of candidateModels) {
        try {
          model = genAI.getGenerativeModel({ model: mName });
          result = await model.generateContent(prompt);
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
 * Generates 3 smart AI reply suggestions for a conversation
 */
async function generateSmartReplies(messages = [], contactName = 'Contact') {
  const defaultReplies = [
    `Thanks for the update, ${contactName}! I'll check it right away.`,
    `Got it! Let me get back to you shortly.`,
    `Sounds good! Will follow up on this.`
  ];

  if (!model || !messages || messages.length === 0) {
    return defaultReplies;
  }

  try {
    const context = messages.slice(-5).map(m => `${m.fromMe ? 'Me' : contactName}: ${m.body}`).join('\n');
    const prompt = `
You are a smart AI WhatsApp assistant. Based on the recent chat history below, generate 3 short, natural, appropriate reply options.

Recent Chat:
${context}

Respond ONLY with a valid JSON array of 3 strings:
["Professional reply...", "Casual reply...", "Direct action reply..."]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed.slice(0, 3);
    }
  } catch (err) {
    console.warn('[Gemini AI] Smart reply error:', err.message);
  }

  return defaultReplies;
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
    const isCasualGreeting = /^(good\s*(morning|afternoon|evening|night)|hi|hello|hey|gm|gn|hie|heyy+|how\s*are\s*you|thanks|thank\s*you|ok|okay|k|cool|great|nice|bye|take\s*care|tc|welcome)[!.,\s]*$/i.test(lowerMsg);
    if (isCasualGreeting) {
      tasksMap.delete(id);
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
      const isCasualGreeting = /^(good\s*(morning|afternoon|evening|night)|hi|hello|hey|gm|gn|hie|heyy+|how\s*are\s*you|thanks|thank\s*you|ok|okay|k|cool|great|nice|bye|take\s*care|tc|welcome)[!.,\s]*$/i.test(textLower);

      if (isCasualGreeting) {
        msg.aiAnalysis = {
          hasTask: false,
          taskTitle: null,
          priority: 'LOW',
          category: 'General',
          summary: 'Conversational greeting',
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
  const isCasualGreeting = /^(good\s*(morning|afternoon|evening|night)|hi|hello|hey|gm|gn|hie|heyy+|how\s*are\s*you|thanks|thank\s*you|ok|okay|k|cool|great|nice|bye|take\s*care|tc|welcome)[!.,\s]*$/i.test(lower);
  
  if (isCasualGreeting) {
    return {
      hasTask: false,
      taskTitle: null,
      priority: 'LOW',
      category: 'General',
      dueDate: null,
      sentiment: 'Positive',
      summary: 'Conversational greeting',
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
