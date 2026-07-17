/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Mail, MessageSquare, Send, PhoneCall, HelpCircle, ArrowLeft, Check, Compass } from 'lucide-react';
import { ChatBox } from './ChatBox';

interface SupportProps {
  onBack: () => void;
}

export const Support: React.FC<SupportProps> = ({ onBack }) => {
  const { submitSupportMessage, userProfile, supportSettings } = useGame();
  
  const [name, setName] = useState(userProfile?.nickname ?? '');
  const [mobile, setMobile] = useState(userProfile?.mobileNumber ?? '');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !message.trim()) return;
    
    setLoading(true);
    await submitSupportMessage(name.trim(), mobile.trim(), message.trim(), 'contact_form');
    setLoading(false);
    setSuccess(true);
    setMessage('');
    
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  return (
    <div id="support_tab_root" className="space-y-6 pb-24 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 bg-[#111116] border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Help & Support Channels</h2>
      </div>

      {/* Dual column responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Instant Links & FAQ */}
        <div className="lg:col-span-6 space-y-6">
          {/* Grid of direct visual links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Telegram Direct Channel */}
            <a 
              href={supportSettings?.telegramGroupLink || supportSettings?.telegramChannelLink || (supportSettings?.telegramUsername ? `https://t.me/${supportSettings.telegramUsername.replace('@', '')}` : "https://t.me/PixelToAppOfficial")} 
              target="_blank" 
              rel="noreferrer"
              className="bg-gradient-to-br from-[#0c1f3c] to-[#0f3d7a] border border-blue-500/10 rounded-2xl p-4 flex flex-col justify-between h-28 relative cursor-pointer hover:border-blue-500/30 transition-all group shadow-md"
            >
              <div className="absolute right-3 top-3 bg-blue-500/10 text-blue-400 p-2 rounded-xl group-hover:scale-105 transition-all">
                <Send className="w-5 h-5 fill-current text-transparent" />
              </div>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">
                Live Chat
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {supportSettings?.telegramButtonTitle || "Telegram Admin"}
                </h4>
                <p className="text-[9px] text-neutral-400 mt-0.5">
                  {supportSettings?.telegramButtonDescription || "Instant manual queries"}
                </p>
              </div>
            </a>

            {/* WhatsApp Direct Group */}
            <a 
              href={supportSettings?.whatsappGroupLink || supportSettings?.whatsappCommunityLink || (supportSettings?.whatsappContactNumber ? `https://wa.me/${supportSettings.whatsappContactNumber.replace(/[^0-9]/g, '')}` : "https://chat.whatsapp.com/your-invite-link")} 
              target="_blank" 
              rel="noreferrer"
              className="bg-gradient-to-br from-[#0a2f1d] to-[#0f5431] border border-green-500/10 rounded-2xl p-4 flex flex-col justify-between h-28 relative cursor-pointer hover:border-green-500/30 transition-all group shadow-md"
            >
              <div className="absolute right-3 top-3 bg-green-500/10 text-green-400 p-2 rounded-xl group-hover:scale-105 transition-all">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[9px] bg-green-500/20 text-green-300 font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">
                24/7 Helpline
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {supportSettings?.whatsappButtonTitle || "WhatsApp Support"}
                </h4>
                <p className="text-[9px] text-neutral-400 mt-0.5">
                  {supportSettings?.whatsappButtonDescription || "Quick automatic updates"}
                </p>
              </div>
            </a>

            {/* Discord Server */}
            <a 
              href="https://discord.com" 
              target="_blank" 
              rel="noreferrer"
              className="bg-gradient-to-br from-[#1d123a] to-[#3a1d7a] border border-neon-purple/10 rounded-2xl p-4 flex flex-col justify-between h-28 relative cursor-pointer hover:border-neon-purple/30 transition-all group shadow-md"
            >
              <div className="absolute right-3 top-3 bg-neon-purple/10 text-purple-400 p-2 rounded-xl group-hover:scale-105 transition-all">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[9px] bg-neon-purple/20 text-purple-300 font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">
                Match Rooms
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Discord Guild</h4>
                <p className="text-[9px] text-neutral-400 mt-0.5">Custom Room distribution</p>
              </div>
            </a>

            {/* Call Back request */}
            <div 
              className="bg-[#111116] border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-28 relative group shadow-md"
            >
              <div className="absolute right-3 top-3 bg-white/5 text-neutral-400 p-2 rounded-xl group-hover:scale-105 transition-all">
                <PhoneCall className="w-5 h-5" />
              </div>
              <span className="text-[9px] bg-white/5 text-neutral-400 font-bold px-2 py-0.5 rounded-full w-max uppercase tracking-wider">
                Self-help
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Moderators</h4>
                <p className="text-[9px] text-neutral-400 mt-0.5">Submit query ticket below</p>
              </div>
            </div>
          </div>

          {/* FAQ Dropdown notice */}
          <div className="bg-[#111116] border border-white/5 rounded-2xl p-4 space-y-2 shadow-md">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-neutral-500" />
              <span>Frequently Asked Questions</span>
            </h4>
            <div className="space-y-2 text-[9px] text-neutral-400 leading-relaxed font-sans">
              <div>
                <p className="font-bold text-neutral-200">Q: When will I get Room ID and Password?</p>
                <p>A: Room credentials unlock exactly 15 minutes before the match start time, ONLY for registered players.</p>
              </div>
              <div className="pt-1.5 border-t border-white/5">
                <p className="font-bold text-neutral-200">Q: My deposit UTR failed, what should I do?</p>
                <p>A: Do not worry. Submit the form above with your 12-digit transaction ID and we will verify manually within 10 minutes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Support Chat */}
        <div className="lg:col-span-6">
          <ChatBox isFloating={false} />
        </div>
      </div>
    </div>
  );
};
