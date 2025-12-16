import React, { useState, useEffect } from 'react';

const Settings: React.FC = () => {
  const [chatId, setChatId] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('nikto_telegram_chat_id');
    if (stored) setChatId(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('nikto_telegram_chat_id', chatId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-white border-b border-gray-700 pb-4 flex items-center gap-3">
        <i className="fas fa-cog text-nikto-primary"></i>System Settings
      </h2>
      
      <div className="bg-nikto-surface p-8 rounded-xl border border-gray-700 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl">
                <i className="fab fa-telegram-plane"></i>
            </div>
            <div>
                <h3 className="text-xl font-bold text-white">Telegram Notifications</h3>
                <p className="text-gray-400 text-sm">Configure real-time alerts for deadlines and high-priority tasks.</p>
            </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-lg border border-gray-700 mb-6 text-sm text-gray-300 space-y-2">
          <p><i className="fas fa-step-forward mr-2 text-nikto-primary"></i>Start a chat with the bot: <a href="https://t.me/NiktoIT_Central_AI_ManagerBot" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-bold">@NiktoIT_Central_AI_ManagerBot</a></p>
          <p><i className="fas fa-question-circle mr-2 text-nikto-primary"></i>Get your ID: Message <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">@userinfobot</a> to find your numeric Chat ID.</p>
        </div>

        <label className="block text-gray-400 text-sm font-bold mb-2">Your Telegram Chat ID</label>
        <div className="flex gap-4">
            <input 
                type="text" 
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. 123456789"
                className="flex-1 bg-slate-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-nikto-primary outline-none transition-all placeholder-gray-600"
            />
            <button 
                onClick={handleSave}
                className={`font-bold py-3 px-8 rounded-lg transition-all flex items-center gap-2 ${saved ? 'bg-green-600 hover:bg-green-700' : 'bg-nikto-primary hover:bg-red-500'} text-white shadow-lg`}
            >
                {saved ? <><i className="fas fa-check"></i> Saved</> : <><i className="fas fa-save"></i> Save Configuration</>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;