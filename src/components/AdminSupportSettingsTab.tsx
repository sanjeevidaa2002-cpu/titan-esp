import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Save, RotateCcw } from 'lucide-react';
import { SupportSettings } from '../types';
import { DEFAULT_SUPPORT_SETTINGS } from '../dataStore';

export const AdminSupportSettingsTab: React.FC = () => {
  const { supportSettings, updateSupportSettings, triggerNotification } = useGame();
  
  const [localSettings, setLocalSettings] = useState<SupportSettings>(supportSettings || DEFAULT_SUPPORT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (supportSettings) {
      setLocalSettings(supportSettings);
    }
  }, [supportSettings]);

  const handleChange = (field: keyof SupportSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const processed = { 
        ...localSettings,
        updatedAt: Date.now()
      };
      
      await updateSupportSettings(processed);
      triggerNotification("Success", "Support settings updated successfully.", "success");
    } catch (err) {
      console.error(err);
      triggerNotification("Error", "Failed to save settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset to default settings?")) {
      setLocalSettings(DEFAULT_SUPPORT_SETTINGS);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Support Settings</h2>
          <p className="text-xs text-neutral-400 mt-1">Configure your official WhatsApp and Telegram channels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Settings */}
        <div className="bg-[#111116] border border-[#25D366]/20 rounded-2xl overflow-hidden relative shadow-[0_0_30px_rgba(37,211,102,0.03)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#25D366] to-[#128C7E]"></div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">W</span>
                WhatsApp
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={localSettings.whatsappStatus}
                  onChange={(e) => handleChange('whatsappStatus', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">WhatsApp Number or Link</label>
                <input 
                  type="text" 
                  value={localSettings.whatsappLink} 
                  onChange={(e) => handleChange('whatsappLink', e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#25D366] focus:outline-none focus:ring-1 focus:ring-[#25D366] transition-all"
                  placeholder="https://wa.me/1234567890"
                />
                <p className="text-[9px] text-neutral-500 mt-1.5 leading-relaxed">Enter your direct wa.me link, invite link, or phone number.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Settings */}
        <div className="bg-[#111116] border border-[#0088cc]/20 rounded-2xl overflow-hidden relative shadow-[0_0_30px_rgba(0,136,204,0.03)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0088cc] to-[#005580]"></div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#0088cc]/20 flex items-center justify-center text-[#0088cc]">T</span>
                Telegram
              </h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={localSettings.telegramStatus}
                  onChange={(e) => handleChange('telegramStatus', e.target.checked)}
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0088cc]"></div>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Telegram Username or Link</label>
                <input 
                  type="text" 
                  value={localSettings.telegramLink} 
                  onChange={(e) => handleChange('telegramLink', e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-[#0088cc] focus:outline-none focus:ring-1 focus:ring-[#0088cc] transition-all"
                  placeholder="https://t.me/yourusername"
                />
                <p className="text-[9px] text-neutral-500 mt-1.5 leading-relaxed">Enter your direct t.me link for your group, channel, or username.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-white/5">
        <button 
          onClick={handleReset}
          className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 rounded-xl bg-gold-500 text-black font-black text-xs uppercase tracking-widest hover:bg-gold-400 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,169,25,0.3)] disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save & Update'}
        </button>
      </div>
    </div>
  );
};
