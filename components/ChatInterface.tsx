import React, { useState, useRef, useEffect } from 'react';
import { NiktoService } from '../services/geminiService';
import { ChatMessage, NiktoResponse, Transaction } from '../types';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onTaskCreated: (task: NiktoResponse) => void;
  onTransactionCreated: (t: Omit<Transaction, 'id' | 'date'>) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, setMessages, onTaskCreated, onTransactionCreated }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, type: 'text' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      // Check for explicit "Search" intent
      if (input.toLowerCase().includes('search for') || input.toLowerCase().startsWith('google ')) {
        const result = await NiktoService.searchWeb(input);
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: result.text,
          type: 'text',
          groundingUrls: result.sources
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // Default: Manager Logic
        const result: NiktoResponse = await NiktoService.processManagerRequest(input);
        
        // Handle Side Effects
        if (result.IsTask) onTaskCreated(result);
        if (result.TransactionData) {
            onTransactionCreated(result.TransactionData);
        }

        // Determine UI Type
        let msgType: ChatMessage['type'] = 'text';
        if (result.IsTask) msgType = 'task_card';
        if (result.DocumentContent) msgType = 'document_card';
        if (result.TransactionData) msgType = 'transaction_card';

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: result.TaskName, // Short text confirmation
          type: msgType,
          rawJson: result
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "System Error: " + String(error), type: 'text' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Audio Recording Logic
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
           const blob = new Blob(chunks, { type: 'audio/mp3' }); // Container usually webm but logic handles generic
           const reader = new FileReader();
           reader.onloadend = async () => {
             const base64 = reader.result as string;
             setInput("Transcribing...");
             const text = await NiktoService.transcribeAudio(base64);
             setInput(text);
           };
           reader.readAsDataURL(blob);
           stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (e) {
        console.error("Mic error", e);
        alert("Could not access microphone.");
      }
    }
  };

  // --- Document Generation Functions ---
  
  const downloadPDF = (title: string, content: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);

    doc.setFontSize(18);
    doc.text(title || "Document", margin, 20);
    
    doc.setFontSize(12);
    // Simple text wrapping - for more complex formatting in production, HTML-to-PDF libraries are preferred
    const lines = doc.splitTextToSize(content || "", maxLineWidth);
    
    let y = 35;
    lines.forEach((line: string) => {
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
        doc.text(line, margin, y);
        y += 7;
    });

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  const downloadDOC = (title: string, content: string) => {
    // Generate an HTML-compatible Word document structure
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title></head>
      <body>
        <h1>${title}</h1>
        <div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${content}</div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/\s+/g, '_')}.doc`;
    link.click();
  };

  const exportChatLog = () => {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text("Nikto IT - Conversation Log", 10, y);
    y += 10;
    doc.setFontSize(12);
    
    messages.forEach(msg => {
       if (y > 280) { doc.addPage(); y = 10; }
       const prefix = msg.role === 'user' ? "User: " : "AI: ";
       // Strip markdown slightly for log
       const cleanContent = msg.content.replace(/[#*`]/g, '');
       const lines = doc.splitTextToSize(prefix + cleanContent, 180);
       doc.text(lines, 10, y);
       y += (lines.length * 7) + 5;
    });
    
    doc.save('nikto-log.pdf');
  };

  const clearHistory = () => {
    if(window.confirm("Clear chat history?")) {
        setMessages([{
            id: 'welcome',
            role: 'ai',
            type: 'text',
            content: "Hello. I am the Nikto IT Central AI Manager. Assign me a task, ask a strategic question, or ask me to generate a document (e.g., 'Create a proposal')."
        }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-nikto-primary text-white shadow-lg shadow-red-900/20' : 'bg-slate-700 text-gray-100'}`}>
              
              {/* Task Card UI */}
              {msg.type === 'task_card' && msg.rawJson && (
                 <div className="border border-green-500/50 bg-green-900/20 p-3 rounded-lg mb-2">
                    <div className="flex items-center gap-2 mb-2 text-green-400 font-bold border-b border-green-500/30 pb-2">
                        <i className="fas fa-check-circle"></i> Task Registered
                    </div>
                    <p className="font-semibold text-white">{msg.rawJson.TaskName}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2 text-gray-300">
                        <span><i className="far fa-clock mr-1"></i> {msg.rawJson.Deadline}</span>
                        <span><i className="far fa-flag mr-1"></i> {msg.rawJson.Priority}</span>
                    </div>
                 </div>
              )}

              {/* Transaction Card UI */}
              {msg.type === 'transaction_card' && msg.rawJson && msg.rawJson.TransactionData && (
                 <div className={`border p-3 rounded-lg mb-2 ${msg.rawJson.TransactionData.type === 'income' ? 'border-green-500/50 bg-green-900/20' : 'border-red-500/50 bg-red-900/20'}`}>
                    <div className={`flex items-center gap-2 mb-2 font-bold border-b pb-2 ${msg.rawJson.TransactionData.type === 'income' ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'}`}>
                        <i className={`fas ${msg.rawJson.TransactionData.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i> 
                        {msg.rawJson.TransactionData.type === 'income' ? 'Income Logged' : 'Expense Logged'}
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-white">{msg.rawJson.TransactionData.description}</p>
                        <p className="font-bold text-xl">${msg.rawJson.TransactionData.amount}</p>
                    </div>
                    <div className="text-xs mt-2 opacity-70 bg-black/20 inline-block px-2 py-1 rounded">
                        {msg.rawJson.TransactionData.category}
                    </div>
                 </div>
              )}

              {/* Document Card UI */}
              {msg.type === 'document_card' && msg.rawJson && msg.rawJson.DocumentContent && (
                  <div className="border border-blue-500/50 bg-blue-900/20 p-4 rounded-lg mb-3">
                      <div className="flex items-center gap-2 mb-3 text-blue-300 font-bold border-b border-blue-500/30 pb-2">
                        <i className="fas fa-file-alt"></i> Document Draft
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">{msg.rawJson.DocumentTitle}</h3>
                      <div className="bg-slate-900/50 p-3 rounded text-sm text-gray-300 max-h-40 overflow-y-auto mb-3 font-mono border border-slate-600">
                          {msg.rawJson.DocumentContent.substring(0, 200)}...
                      </div>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => downloadPDF(msg.rawJson!.DocumentTitle!, msg.rawJson!.DocumentContent!)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded flex items-center gap-1"
                          >
                             <i className="fas fa-file-pdf"></i> Download PDF
                          </button>
                          <button 
                            onClick={() => downloadDOC(msg.rawJson!.DocumentTitle!, msg.rawJson!.DocumentContent!)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded flex items-center gap-1"
                          >
                             <i className="fas fa-file-word"></i> Download DOC
                          </button>
                      </div>
                  </div>
              )}

              <div className="prose prose-invert max-w-none text-sm md:text-base">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {/* Grounding Sources */}
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-3 text-xs bg-black/20 p-2 rounded">
                    <p className="font-bold text-gray-400 mb-1">Sources:</p>
                    <ul className="list-disc pl-4">
                        {msg.groundingUrls.map((s, i) => (
                            <li key={i}>
                                <a href={s.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                    {s.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
            <div className="flex justify-start">
                <div className="bg-slate-700 p-3 rounded-2xl text-cyan-400">
                    <i className="fas fa-circle-notch fa-spin mr-2"></i> Nikto Manager is thinking...
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800 border-t border-gray-700 rounded-t-xl">
        <div className="flex gap-2">
           <button onClick={clearHistory} className="hidden md:flex p-3 rounded-full w-12 h-12 bg-slate-600 hover:bg-red-600 items-center justify-center text-gray-300 hover:text-white transition-colors" title="Clear History">
              <i className="fas fa-trash-alt"></i>
           </button>
           <button onClick={toggleRecording} className={`p-3 rounded-full w-12 h-12 flex items-center justify-center transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600 hover:bg-slate-500'}`}>
             <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
           </button>
           <button onClick={exportChatLog} className="p-3 rounded-full w-12 h-12 bg-slate-600 hover:bg-slate-500 flex items-center justify-center" title="Export PDF Log">
             <i className="fas fa-file-contract"></i>
           </button>
           <input 
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
             placeholder="Task, Question, or 'Add expense $50 for hosting'"
             className="flex-1 bg-slate-900 border border-gray-600 rounded-lg px-4 text-white focus:ring-2 focus:ring-nikto-primary outline-none"
           />
           <button onClick={handleSendMessage} className="bg-nikto-primary hover:bg-red-500 text-white px-6 rounded-lg font-bold">
             <i className="fas fa-paper-plane"></i>
           </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;