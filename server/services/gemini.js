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
 * Analyzes a WhatsApp message for tasks, priorities, categories, and sentiment
 */
async function analyzeMessage(text, senderName = 'Contact') {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  // 1. Try Gemini AI API if available
  if (genAI) {
    try {
      const prompt = `
You are an expert AI productivity assistant analyzing a WhatsApp message.
Analyze the following message text and extract task action items, priority, due date, category, and sentiment.

Sender: "${senderName}"
Message: "${text}"

Respond ONLY with a valid JSON object matching this exact schema (no markdown fences, no extra text):
{
  "hasTask": true_or_false,
  "taskTitle": "Short actionable task title if hasTask is true, else null",
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "category": "Urgent" | "Meeting" | "Work" | "Follow-up" | "Payment" | "General",
  "dueDate": "YYYY-MM-DD or relative time text like 'Tomorrow' or 'Today' if specified, else null",
  "sentiment": "Positive" | "Neutral" | "Urgent" | "Frustrated",
  "summary": "1 concise sentence summarizing key point"
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
      console.warn('[Gemini AI] Analysis error, reverting to heuristic fallback:', err.message);
    }
  }

  // 2. Heuristic Rule-Based Fallback
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
 * Bulk analyzes all stored messages across all chats
 */
async function batchAnalyzeAllMessages(chatsMap, messagesMap, tasksMap) {
  let analyzedCount = 0;
  let newTasksExtracted = 0;
  const chatSummaries = [];

  for (const [chatId, messages] of messagesMap.entries()) {
    const chatObj = chatsMap.get(chatId);
    const chatName = chatObj ? chatObj.name : chatId.split('@')[0];

    let chatTaskCount = 0;
    const chatTasks = [];

    const targetMsgs = messages.slice(-20);
    for (const msg of targetMsgs) {
      if (!msg.body || msg.body.trim().length === 0) continue;
      analyzedCount++;

      if (!msg.aiAnalysis) {
        const analysis = await analyzeMessage(msg.body, chatName).catch(() => null);
        if (analysis) {
          msg.aiAnalysis = analysis;
          if (analysis.hasTask) {
            const taskId = `task-batch-${msg.id || Date.now()}`;
            const taskObj = {
              id: taskId,
              title: analysis.taskTitle || msg.body,
              chatId,
              chatName,
              originalMessage: msg.body,
              priority: analysis.priority || 'MEDIUM',
              category: analysis.category || 'General',
              status: 'TO_DO',
              dueDate: analysis.dueDate || 'Upcoming',
              sentiment: analysis.sentiment || 'Neutral',
              summary: analysis.summary || '',
              createdAt: new Date().toISOString()
            };

            if (!tasksMap.has(taskId)) {
              tasksMap.set(taskId, taskObj);
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
 * Rule-based heuristic analyzer fallback
 */
function fallbackAnalyze(text) {
  const lower = text.toLowerCase();

  const isUrgent = lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately') || lower.includes('critical');
  const isMeeting = lower.includes('meeting') || lower.includes('call') || lower.includes('zoom') || lower.includes('google meet') || lower.includes('sync');
  const isWork = lower.includes('submit') || lower.includes('report') || lower.includes('task') || lower.includes('project') || lower.includes('send') || lower.includes('fix') || lower.includes('documents') || lower.includes('card');
  const isPayment = lower.includes('payment') || lower.includes('invoice') || lower.includes('bill') || lower.includes('pay') || lower.includes('cheque');
  const isFollowUp = lower.includes('check') || lower.includes('update') || lower.includes('status') || lower.includes('reminder');

  const hasTask = isUrgent || isMeeting || isWork || isPayment || isFollowUp || lower.includes('please') || lower.includes('by ');

  let priority = 'LOW';
  if (isUrgent || lower.includes('today')) priority = 'HIGH';
  else if (isMeeting || isWork || isPayment) priority = 'MEDIUM';

  let category = 'General';
  if (isUrgent) category = 'Urgent';
  else if (isMeeting) category = 'Meeting';
  else if (isWork) category = 'Work';
  else if (isPayment) category = 'Payment';
  else if (isFollowUp) category = 'Follow-up';

  let dueDate = null;
  if (lower.includes('today')) dueDate = 'Today';
  else if (lower.includes('tomorrow')) dueDate = 'Tomorrow';
  else if (lower.includes('friday')) dueDate = 'Friday';
  else if (lower.includes('monday')) dueDate = 'Monday';

  let taskTitle = null;
  if (hasTask) {
    taskTitle = text.length > 50 ? text.substring(0, 47) + '...' : text;
  }

  return {
    hasTask,
    taskTitle,
    priority,
    category,
    dueDate,
    sentiment: isUrgent ? 'Urgent' : 'Neutral',
    summary: text.length > 60 ? text.substring(0, 57) + '...' : text
  };
}

module.exports = {
  analyzeMessage,
  generateSmartReplies,
  batchAnalyzeAllMessages
};
