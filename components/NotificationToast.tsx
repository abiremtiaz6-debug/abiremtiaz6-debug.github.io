import React, { useEffect } from 'react';
import { Notification } from '../types';

interface Props {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<Props> = ({ notifications, onDismiss }) => {
  // Auto-dismiss logic could be added here, but for now we keep them until clicked or simple manual dismiss
  
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {notifications.map(n => (
        <div 
          key={n.id} 
          className={`
            pointer-events-auto min-w-[320px] max-w-sm p-4 rounded-lg shadow-2xl border-l-4 animate-bounce-in flex items-start justify-between bg-slate-800 text-white backdrop-blur-md bg-opacity-95
            ${n.type === 'alert' ? 'border-nikto-primary shadow-red-900/50' : n.type === 'warning' ? 'border-yellow-500 shadow-yellow-900/50' : 'border-blue-500 shadow-blue-900/50'}
          `}
        >
          <div className="flex gap-3">
            <div className={`mt-1 text-lg ${n.type === 'alert' ? 'text-nikto-primary' : n.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>
               {n.type === 'alert' ? <i className="fas fa-exclamation-circle"></i> : n.type === 'warning' ? <i className="fas fa-clock"></i> : <i className="fas fa-info-circle"></i>}
            </div>
            <div>
              <h4 className={`font-bold text-sm uppercase tracking-wide ${n.type === 'alert' ? 'text-red-400' : n.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>
                {n.title}
              </h4>
              <p className="text-sm text-gray-300 mt-1 leading-snug">{n.message}</p>
            </div>
          </div>
          <button onClick={() => onDismiss(n.id)} className="text-gray-500 hover:text-white transition-colors ml-4">
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;