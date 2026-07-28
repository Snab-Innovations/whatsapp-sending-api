import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import MainDashboard from './components/MainDashboard';
import QRModal from './components/QRModal';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import TaskKanban from './components/TaskKanban';
import AIAnalyticsPage from './components/AIAnalyticsPage';
import NewChatModal from './components/NewChatModal';
import {
  subscribeToEvents,
  getStatus,
  getChats,
  getChatMessages,
  sendMessage,
  logoutSession,
  restartClient,
  syncChats,
  getTasks,
  updateTask,
  deleteTask
} from './services/api';

const isSameChatId = (id1, id2) => {
  if (!id1 || !id2) return false;
  if (id1 === id2) return true;
  const user1 = String(id1).split('@')[0].split(':')[0];
  const user2 = String(id2).split('@')[0].split(':')[0];
  return user1 === user2;
};

export default function App() {
  const [clientState, setClientState] = useState({
    status: 'INITIALIZING',
    qrCodeDataUrl: null,
    userInfo: null,
    error: null
  });

  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD' | 'CHATS' | 'KANBAN' | 'ANALYTICS'
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Subscribe to SSE updates
  useEffect(() => {
    getStatus()
      .then(state => setClientState(state))
      .catch(err => console.error('Status fetch error:', err));

    const unsubscribe = subscribeToEvents((data) => {
      if (data.eventType === 'NEW_MESSAGE') {
        const { message, chat: updatedChat } = data;

        if (activeChatRef.current && isSameChatId(activeChatRef.current.id, message.chatId)) {
          setMessages((prevMsgs) => {
            if (prevMsgs.some(m => m.id === message.id)) return prevMsgs;
            return [...prevMsgs, message];
          });
        }

        setChats((prevChats) => {
          const chatExists = prevChats.some((c) => isSameChatId(c.id, message.chatId));
          if (chatExists) {
            return prevChats.map((c) => {
              if (isSameChatId(c.id, message.chatId)) {
                const isCurrentActive = isSameChatId(activeChatRef.current?.id, message.chatId);
                const newUnread = (!message.fromMe && !isCurrentActive) ? (c.unreadCount + 1) : c.unreadCount;
                return {
                  ...c,
                  timestamp: message.timestamp,
                  unreadCount: newUnread,
                  lastMessage: {
                    body: message.body,
                    timestamp: message.timestamp,
                    fromMe: message.fromMe,
                    type: message.type
                  }
                };
              }
              return c;
            }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          } else if (updatedChat) {
            return [updatedChat, ...prevChats];
          }
          return prevChats;
        });

      } else if (data.eventType === 'NEW_TASK') {
        setTasks((prevTasks) => {
          if (prevTasks.some(t => t.id === data.task.id)) return prevTasks;
          return [data.task, ...prevTasks];
        });
      } else if (data.eventType === 'BULK_ANALYSIS_COMPLETE') {
        fetchTasks();
        fetchChats();
      } else {
        setClientState(data);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch chats and tasks when status changes to READY or when window comes into view
  useEffect(() => {
    if (clientState.status === 'READY') {
      fetchChats();
      fetchTasks();
      
      // Auto-sync polling every 4 seconds to guarantee zero missed messages in Direct Messages
      const pollInterval = setInterval(() => {
        fetchChats();
        fetchTasks();
        if (activeChatRef.current) {
          getChatMessages(activeChatRef.current.id, 100)
            .then((res) => {
              if (res && Array.isArray(res.messages)) {
                setMessages((prev) => {
                  if (res.messages.length !== prev.length || (res.messages.length > 0 && prev.length > 0 && res.messages[res.messages.length - 1].id !== prev[prev.length - 1].id)) {
                    return res.messages;
                  }
                  return prev;
                });
              }
            })
            .catch(() => null);
        }
      }, 4000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchChats();
          fetchTasks();
        }
      };
      window.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(pollInterval);
        window.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      setChats([]);
      setActiveChat(null);
      setMessages([]);
      setTasks([]);
    }
  }, [clientState.status]);

  // Sync chats and tasks whenever activeTab changes
  useEffect(() => {
    if (clientState.status === 'READY') {
      fetchChats();
      fetchTasks();
    }
  }, [activeTab]);

  const fetchChats = async () => {
    try {
      setLoadingChats(true);
      const res = await getChats();
      setChats(res.chats || []);
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await getTasks();
      setTasks(res.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const handleSelectChat = async (chat) => {
    setActiveChat(chat);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
    try {
      setLoadingMessages(true);
      const res = await getChatMessages(chat.id, 50);
      setMessages(res.messages || []);
    } catch (err) {
      console.error(`Failed to fetch messages for ${chat.name}:`, err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!activeChat) return;
    const res = await sendMessage(activeChat.id, text);
    if (res.success && res.message) {
      setMessages((prev) => {
        if (prev.some(m => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });

      setChats((prevChats) =>
        prevChats.map((c) =>
          isSameChatId(c.id, activeChat.id)
            ? {
                ...c,
                timestamp: res.message.timestamp,
                lastMessage: {
                  body: res.message.body,
                  timestamp: res.message.timestamp,
                  fromMe: true
                }
              }
            : c
        ).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      );
    }
  };

  const handleSendDirectMessage = async (phoneNumber, messageText) => {
    const res = await sendMessage(phoneNumber, messageText);
    if (res.success && res.message) {
      const targetJid = res.message.chatId || (phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`);
      const newChatObj = {
        id: targetJid,
        name: phoneNumber,
        isGroup: false,
        isArchived: false,
        isPinned: false,
        unreadCount: 0,
        timestamp: res.message.timestamp,
        lastMessage: {
          body: messageText,
          timestamp: res.message.timestamp,
          fromMe: true
        }
      };

      setChats((prev) => {
        const exists = prev.some(c => isSameChatId(c.id, targetJid));
        if (exists) {
          return prev.map(c => isSameChatId(c.id, targetJid) ? newChatObj : c).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        return [newChatObj, ...prev];
      });

      handleSelectChat(newChatObj);
      setIsNewChatModalOpen(false);
      setActiveTab('CHATS');
    }
  };

  const handleUpdateTaskStatus = async (id, newStatus) => {
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
      await updateTask(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      await deleteTask(id);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleJumpToChat = (chatId) => {
    if (!chatId) return;
    const targetChat = chats.find(c => c.id === chatId || c.id.split('@')[0] === chatId.split('@')[0]);
    if (targetChat) {
      handleSelectChat(targetChat);
    } else {
      const fallbackChat = { id: chatId, name: chatId.split('@')[0], isGroup: false };
      handleSelectChat(fallbackChat);
    }
    setActiveTab('CHATS');
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out? You will need to re-scan the QR code.')) {
      try {
        await logoutSession();
      } catch (err) {
        alert('Logout error: ' + err.message);
      }
    }
  };

  const handleRestart = async () => {
    try {
      await restartClient();
    } catch (err) {
      alert('Restart error: ' + err.message);
    }
  };

  const handleSyncChats = async () => {
    try {
      setLoadingChats(true);
      await syncChats();
      setTimeout(() => {
        fetchChats();
        fetchTasks();
      }, 1500);
    } catch (err) {
      console.error('Sync chats error:', err);
    } finally {
      setTimeout(() => setLoadingChats(false), 2000);
    }
  };

  const isModalOpen = clientState.status !== 'READY';

  return (
    <div className="flex flex-col h-screen bg-[#0b141a] text-[#e9edef] overflow-hidden">
      <Header
        clientState={clientState}
        onSync={handleSyncChats}
        onLogout={handleLogout}
        loadingSync={loadingChats}
        onOpenNewChat={() => setIsNewChatModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        taskCount={tasks.filter(t => t.status !== 'COMPLETED').length}
      />

      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'DASHBOARD' && (
          <MainDashboard
            tasks={tasks}
            chats={chats}
            messages={messages}
            onSelectChat={handleSelectChat}
            onJumpToChat={handleJumpToChat}
            onOpenNewChat={() => setIsNewChatModalOpen(true)}
            onTabChange={setActiveTab}
            onRefreshTasks={fetchTasks}
          />
        )}

        {(activeTab === 'CHATS' || activeTab === 'WORKSPACE') && (
          <>
            <ChatList
              chats={chats}
              activeChatId={activeChat?.id}
              onSelectChat={handleSelectChat}
              onSyncChats={handleSyncChats}
              loading={loadingChats}
            />

            <ChatWindow
              chat={activeChat}
              messages={messages}
              loadingMessages={loadingMessages}
              onSendMessage={handleSendMessage}
            />
          </>
        )}

        {activeTab === 'KANBAN' && (
          <TaskKanban
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onJumpToChat={handleJumpToChat}
          />
        )}

        {activeTab === 'ANALYTICS' && (
          <AIAnalyticsPage
            tasks={tasks}
            onJumpToChat={handleJumpToChat}
            onRefreshTasks={fetchTasks}
          />
        )}
      </main>

      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onSendDirectMessage={handleSendDirectMessage}
      />

      {isModalOpen && (
        <QRModal
          clientState={clientState}
          onRestart={handleRestart}
          onResetSession={handleLogout}
        />
      )}
    </div>
  );
}
