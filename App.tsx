import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import ImageStudio from './components/ImageStudio';
import Settings from './components/Settings';
import Accounts from './components/Accounts';
import NotificationToast from './components/NotificationToast';
import Login from './components/Login';
import { TelegramService } from './services/telegramService';
import { NiktoResponse, TaskItem, Notification, ChatMessage, Transaction } from './types';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
      return localStorage.getItem('nikto_auth') === 'true';
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
     const saved = localStorage.getItem('nikto_tasks');
     return saved ? JSON.parse(saved) : [];
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
     const saved = localStorage.getItem('nikto_transactions');
     return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Chat History State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nikto_chat_history');
    return saved ? JSON.parse(saved) : [{
        id: 'welcome',
        role: 'ai',
        type: 'text',
        content: "Hello. I am the Nikto IT Central AI Manager. Assign me a task, ask a strategic question, or ask me to generate a document (e.g., 'Create a proposal')."
    }];
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('nikto_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('nikto_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('nikto_transactions', JSON.stringify(transactions));
  }, [transactions]);


  // Add Notification
  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'alert') => {
    const id = Date.now().toString() + Math.random();
    setNotifications(prev => [...prev, { id, title, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleLogin = () => {
      localStorage.setItem('nikto_auth', 'true');
      setIsAuthenticated(true);
      addNotification('System Access', 'Welcome back, Commander.', 'info');
  };

  const handleLogout = () => {
      if (window.confirm('Terminate session and logout?')) {
        localStorage.removeItem('nikto_auth');
        setIsAuthenticated(false);
      }
  };

  const handleTaskCreated = async (newTaskResponse: NiktoResponse) => {
    if (newTaskResponse.IsTask) {
        const newTask: TaskItem = {
            ...newTaskResponse,
            id: Date.now().toString(),
            createdAt: Date.now(),
            notified: false,
            status: 'Pending' // Default status
        };
        setTasks(prev => [newTask, ...prev]);

        const chatId = localStorage.getItem('nikto_telegram_chat_id');
        // Always notify in UI
        if (newTask.Priority === 'High') {
            addNotification('High Priority Task', `New task assigned: ${newTask.TaskName}`, 'alert');
            if (chatId) await TelegramService.sendTaskAlert(chatId, newTask.TaskName, newTask.Deadline, newTask.Priority);
        } else {
            addNotification('Task Created', newTask.TaskName, 'info');
        }
    } else if (newTaskResponse.DocumentTitle) {
        // Just notify
        addNotification('Document Generated', `Draft created: ${newTaskResponse.DocumentTitle}`, 'info');
    }
  };

  const handleTaskStatusUpdate = (id: string, status: 'Pending' | 'In Progress' | 'Completed') => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleBulkTaskUpdate = (ids: string[], updates: Partial<TaskItem>) => {
      setTasks(prev => prev.map(t => ids.includes(t.id) ? { ...t, ...updates } : t));
      const updateCount = ids.length;
      const updateTypes = Object.keys(updates).join(', ');
      addNotification('Bulk Update', `Updated ${updateCount} tasks (${updateTypes})`, 'info');
  };

  const handleAddTransaction = (newTrans: Omit<Transaction, 'id' | 'date'>) => {
      const transaction: Transaction = {
          ...newTrans,
          id: Date.now().toString(),
          date: Date.now()
      };
      setTransactions(prev => [transaction, ...prev]);
      addNotification('Transaction Added', `$${newTrans.amount} ${newTrans.type}`, 'info');
  };

  const handleDeleteTransaction = (id: string) => {
      if(window.confirm("Delete this transaction?")) {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
  };

  // Check for deadlines periodically
  useEffect(() => {
    const checkDeadlines = () => {
        const chatId = localStorage.getItem('nikto_telegram_chat_id');
        const now = new Date();
        
        tasks.forEach(task => {
            if (!task.IsTask || !task.Deadline || task.notified || task.status === 'Completed') return;

            // Simple parse attempt
            const deadlineDate = new Date(task.Deadline);
            if (isNaN(deadlineDate.getTime())) return;

            const diff = deadlineDate.getTime() - now.getTime();
            const hoursLeft = diff / (1000 * 60 * 60);

            // Alert if within 24 hours and not notified yet
            if (hoursLeft > 0 && hoursLeft < 24) {
                 addNotification('Deadline Approaching', `Task "${task.TaskName}" is due soon!`, 'warning');
                 if (chatId) {
                     TelegramService.sendMessage(chatId, `⚠️ *Deadline Warning*: Task *${task.TaskName}* is due in less than 24 hours!`);
                 }
                 setTasks(prev => prev.map(t => t.id === task.id ? { ...t, notified: true } : t));
            }
        });
    };

    if (isAuthenticated) {
        const interval = setInterval(checkDeadlines, 60000); // Check every minute
        return () => clearInterval(interval);
    }
  }, [tasks, isAuthenticated]);

  // Render Login if not authenticated
  if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-nikto-dark text-nikto-text font-sans overflow-hidden">
        {/* Sidebar */}
        <div className="w-20 md:w-64 bg-slate-900 border-r border-gray-800 flex flex-col">
          {/* Logo Section */}
          <div className="p-4 md:p-6 border-b border-gray-800 flex flex-col items-center md:items-start">
             <div className="flex items-center gap-3 mb-2 md:mb-1">
                {/* Logo Icon: Stylized Laptop */}
                <div className="relative flex items-center justify-center">
                    <i className="fas fa-laptop text-nikto-primary text-3xl md:text-4xl drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]"></i>
                    {/* Visual accent for the 'screen' content or logo detail */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mb-1">
                        <div className="w-3 h-2 bg-nikto-dark opacity-50"></div>
                    </div>
                </div>
                
                {/* Logo Text */}
                <div className="hidden md:flex flex-col justify-center">
                    <div className="flex items-baseline leading-none">
                        <span className="text-2xl font-black text-white tracking-tighter">NIKTO</span>
                        <span className="text-2xl font-black text-nikto-primary ml-0.5 tracking-tighter relative" style={{fontFamily: 'Orbitron, sans-serif'}}>
                            IT
                            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-nikto-primary rounded-full animate-ping opacity-75"></span>
                        </span>
                    </div>
                </div>
             </div>
             
             {/* Slogan */}
             <div className="hidden md:block w-full">
                 <div className="h-px w-full bg-gradient-to-r from-nikto-primary via-red-900 to-transparent mb-1.5 opacity-50"></div>
                 <span className="block text-[0.5rem] font-bold uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap text-center md:text-left">
                    Your Online Career Supporter
                 </span>
             </div>
             
             {/* Mobile Logo Fallback */}
             <div className="md:hidden text-[0.6rem] font-bold text-nikto-primary mt-1 tracking-widest">NIKTO IT</div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavLink to="/" className={({isActive}) => `flex items-center gap-4 p-3 rounded-xl transition-all ${isActive ? 'bg-nikto-primary text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>
                <i className="fas fa-columns w-6 text-center"></i>
                <span className="hidden md:block">Dashboard</span>
            </NavLink>
            <NavLink to="/chat" className={({isActive}) => `flex items-center gap-4 p-3 rounded-xl transition-all ${isActive ? 'bg-nikto-primary text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>
                <i className="fas fa-comments w-6 text-center"></i>
                <span className="hidden md:block">Manager AI</span>
            </NavLink>
            <NavLink to="/accounts" className={({isActive}) => `flex items-center gap-4 p-3 rounded-xl transition-all ${isActive ? 'bg-nikto-primary text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>
                <i className="fas fa-wallet w-6 text-center"></i>
                <span className="hidden md:block">Accounts</span>
            </NavLink>
            <NavLink to="/studio" className={({isActive}) => `flex items-center gap-4 p-3 rounded-xl transition-all ${isActive ? 'bg-nikto-primary text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>
                <i className="fas fa-paint-brush w-6 text-center"></i>
                <span className="hidden md:block">Image Studio</span>
            </NavLink>
            <NavLink to="/settings" className={({isActive}) => `flex items-center gap-4 p-3 rounded-xl transition-all ${isActive ? 'bg-nikto-primary text-white shadow-lg shadow-red-900/20' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>
                <i className="fas fa-cog w-6 text-center"></i>
                <span className="hidden md:block">Settings</span>
            </NavLink>
          </nav>

          <div className="p-4 border-t border-gray-800">
             {/* Logout Button */}
             <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full p-2 rounded-lg bg-slate-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors text-sm font-bold mb-3"
             >
                <i className="fas fa-sign-out-alt"></i>
                <span className="hidden md:inline">Logout</span>
             </button>

             <div className="text-center text-xs text-gray-600 hidden md:block">
                Status: <span className="text-green-500">● Online</span><br/>
                Env: Gemini 3.0 Pro
             </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <header className="h-16 bg-slate-900/50 backdrop-blur border-b border-gray-800 flex items-center justify-between px-6">
             <h1 className="font-semibold text-lg text-gray-200">Nikto IT Central AI Manager</h1>
             <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">{new Date().toDateString()}</div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-slate-600 border-2 border-white/20"></div>
             </div>
          </header>

          <main className="flex-1 overflow-auto bg-[#0f172a] relative">
             <Routes>
                <Route path="/" element={<Dashboard tasks={tasks} onUpdateTaskStatus={handleTaskStatusUpdate} onBulkUpdate={handleBulkTaskUpdate} />} />
                <Route 
                    path="/chat" 
                    element={<ChatInterface 
                        onTaskCreated={handleTaskCreated} 
                        onTransactionCreated={handleAddTransaction}
                        messages={messages} 
                        setMessages={setMessages} 
                    />} 
                />
                <Route path="/accounts" element={<Accounts transactions={transactions} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} />} />
                <Route path="/studio" element={<ImageStudio />} />
                <Route path="/settings" element={<Settings />} />
             </Routes>
             
             {/* Notification Container */}
             <NotificationToast notifications={notifications} onDismiss={(id) => setNotifications(p => p.filter(n => n.id !== id))} />
          </main>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;