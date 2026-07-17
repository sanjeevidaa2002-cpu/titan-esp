import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send } from 'lucide-react';

export const FloatingSupportWidget: React.FC = () => {
  const { supportSettings } = useGame();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  if (!supportSettings) return null;
  if (!supportSettings.whatsappStatus && !supportSettings.telegramStatus) return null;

  return (
    <div className="fixed z-[100] right-4 bottom-[80px] md:right-5 md:bottom-[85px] lg:right-6 lg:bottom-[90px]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-[70px] right-0 w-[280px] sm:w-[320px] bg-[#0d0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl"
          >
            <div className="bg-gradient-to-r from-gold-600/20 to-purple-600/20 p-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-wider">Premium Support</h3>
                <p className="text-[10px] text-neutral-400">Choose a platform to reach us</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {supportSettings.whatsappStatus && supportSettings.whatsappLink && (
                <a 
                  href={supportSettings.whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#25D366]/10 to-transparent hover:from-[#25D366]/20 border border-[#25D366]/20 hover:border-[#25D366]/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_0_15px_rgba(37,211,102,0.4)] group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">WhatsApp</h4>
                    <p className="text-[10px] text-[#25D366]">Fastest Response</p>
                  </div>
                </a>
              )}

              {supportSettings.telegramStatus && supportSettings.telegramLink && (
                <a 
                  href={supportSettings.telegramLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#0088cc]/10 to-transparent hover:from-[#0088cc]/20 border border-[#0088cc]/20 hover:border-[#0088cc]/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center shadow-[0_0_15px_rgba(0,136,204,0.4)] group-hover:scale-110 transition-transform">
                    <Send className="w-5 h-5 text-white -ml-0.5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Telegram</h4>
                    <p className="text-[10px] text-[#0088cc]">Join our Community</p>
                  </div>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center justify-center font-bold outline-none border transition-colors backdrop-blur-md cursor-pointer rounded-full bg-[#0d0d14] border-gold-500/30 shadow-[0_8px_32px_rgba(229,169,25,0.2)]"
        style={{
          width: '56px',
          height: '56px',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        }}
      >
        <div className="absolute inset-0 rounded-full blur-md opacity-50 pointer-events-none transition-opacity bg-gold-500/20" />
        {isOpen ? (
          <X className="w-6 h-6 text-gold-400 drop-shadow-[0_0_8px_rgba(229,169,25,0.8)] relative z-10" />
        ) : (
          <MessageCircle className="w-6 h-6 text-gold-400 drop-shadow-[0_0_8px_rgba(229,169,25,0.8)] relative z-10" />
        )}
      </motion.button>
    </div>
  );
};
