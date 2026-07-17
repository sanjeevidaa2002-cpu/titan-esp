import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Send, X, HeadphonesIcon, Clock, Check } from 'lucide-react';

interface ChatBoxProps {
  isFloating?: boolean;
  onClose?: () => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ isFloating = false, onClose }) => {
  const { currentUser, userProfile, submitSupportMessage, supportSettings } = useGame();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) setDeviceType('mobile');
      else if (w < 1200) setDeviceType('tablet');
      else setDeviceType('desktop');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const msgsRef = collection(db, 'support_messages');
    const q = query(msgsRef, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => {
        const timeA = a.dateTime ? new Date(a.dateTime).getTime() : 0;
        const timeB = b.dateTime ? new Date(b.dateTime).getTime() : 0;
        return timeA - timeB;
      });
      setMessages(list);
    }, (err) => {
      console.warn("Error syncing user support messages:", err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const welcomeMessage = {
    id: 'welcome',
    name: 'Arena Support',
    message: `Hey ${userProfile?.nickname || 'there'}! Welcome to Victory Arena Live Support. How can we help you today? If you have queries about tournaments, deposits, or withdrawals, feel free to type below. Our moderators verify and reply manually in 10-15 mins!`,
    dateTime: new Date(Date.now() - 60000).toISOString(),
    isSystem: true
  };

  const displayMessages = [welcomeMessage, ...messages];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    const textToSend = inputText.trim();
    setInputText('');

    try {
      await submitSupportMessage(
        userProfile?.nickname || 'User',
        userProfile?.mobileNumber || '9876543210',
        textToSend,
        'contact_form'
      );
    } catch (err) {
      console.error("Failed to send support message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const containerClasses = isFloating
    ? deviceType === 'mobile'
      ? 'fixed inset-x-0 top-0 bottom-16 z-50 flex flex-col bg-[#08080c] border-b border-white/10 animate-fade-in'
      : deviceType === 'tablet'
        ? 'fixed bottom-[90px] right-5 z-50 w-[360px] h-[520px] rounded-2xl flex flex-col bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 shadow-2xl animate-fade-in'
        : 'fixed bottom-[95px] right-6 z-50 w-[390px] h-[560px] rounded-2xl flex flex-col bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 shadow-2xl animate-fade-in'
    : 'w-full h-[500px] rounded-2xl flex flex-col bg-[#111116]/80 border border-white/5 shadow-xl overflow-hidden';

  return (
    <div className={containerClasses} id="chat_box_root">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-white/5 bg-[#0d0d14]/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20 text-gold-400">
            <HeadphonesIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">Live Arena Chat</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            <p className="text-[9px] text-neutral-400 uppercase tracking-widest mt-0.5 font-semibold">Average reply: 10 mins</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#08080c]/30">
        {/* Quick Channel Pills (WhatsApp & Telegram) */}
        {(supportSettings?.whatsappEnabled || supportSettings?.telegramEnabled) && (
          <div className="flex flex-wrap gap-2 mb-4 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider w-full mb-1">Community Channels:</p>
            {supportSettings?.whatsappEnabled && (
              <a 
                href={supportSettings.whatsappGroupLink || supportSettings.whatsappCommunityLink || '#'}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
            {supportSettings?.telegramEnabled && (
              <a 
                href={supportSettings.telegramGroupLink || supportSettings.telegramChannelLink || '#'}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram" className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>
            )}
          </div>
        )}

        {displayMessages.map((msg, idx) => {
          const isUser = msg.userId === currentUser?.uid && !msg.isSystem;
          const formattedTime = new Date(msg.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={msg.id || idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${isUser ? 'ml-auto' : 'mr-auto'}`}
            >
              {/* Sender Name */}
              <span className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1 font-mono">
                {isUser ? 'You' : msg.name}
              </span>
              
              {/* Message Bubble */}
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-tr from-gold-500 to-amber-600 text-neutral-950 font-semibold rounded-tr-none shadow-[0_4px_12px_rgba(229,169,25,0.2)]'
                    : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                }`}
              >
                {msg.message}
              </div>

              {/* Message Footer */}
              <div className="flex items-center gap-1 mt-1 font-mono text-[8px] text-neutral-500">
                <Clock className="w-2.5 h-2.5" />
                <span>{formattedTime}</span>
                {isUser && <Check className="w-2.5 h-2.5 text-gold-500 ml-0.5" />}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-[#0d0d14]/90 border-t border-white/5 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message here..."
          disabled={isSending}
          className="flex-1 bg-[#161622] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500/50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 bg-gradient-to-r from-gold-500 to-amber-600 text-neutral-950 rounded-xl transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center shrink-0 cursor-pointer shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
