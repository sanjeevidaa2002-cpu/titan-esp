import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { MessageCircle, Save, RotateCcw, Image as ImageIcon, X, RefreshCw } from 'lucide-react';
import { ImageField } from './ImageField';
import { SupportWidgetSettings } from '../types';
import { DEFAULT_SUPPORT_SETTINGS } from '../dataStore';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { compressImage } from '../utils/imageUtils';

export const AdminSupportSettingsTab: React.FC = () => {
  const { supportSettings, updateSupportSettings, triggerNotification } = useGame();
  
  const [localSettings, setLocalSettings] = useState<SupportWidgetSettings>(supportSettings || DEFAULT_SUPPORT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [activeSection, setActiveSection] = useState<'whatsapp' | 'telegram' | 'floating'>('whatsapp');

  useEffect(() => {
    if (supportSettings) {
      setLocalSettings(supportSettings);
    }
  }, [supportSettings]);

  const handleChange = (field: keyof SupportWidgetSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Document size check removed as images are now in Storage
    try {
      await updateSupportSettings(localSettings);
      triggerNotification("Settings Saved", "Support widget settings updated successfully.", "success" as any);
    } catch (e: any) {
      triggerNotification("Error", e.message, "alert");
    }
    setIsSaving(false);
  };

  const handleRestoreDefault = async () => {
    if (window.confirm("Restore default support widget settings?")) {
      setIsSaving(true);
      try {
        await updateSupportSettings(DEFAULT_SUPPORT_SETTINGS);
        triggerNotification("Restored", "Default support settings restored.", "info");
      } catch (e: any) {
        triggerNotification("Error", e.message, "alert");
      }
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File | null, field: keyof SupportWidgetSettings) => {
    if (file) {
      setIsSaving(true);
      setUploadProgress(prev => ({ ...prev, [field]: 0 }));
      try {
        // Compress first
        const compressedDataUrl = await compressImage(file, 0.1, 512);
        
        // Convert DataURL to Blob
        const response = await fetch(compressedDataUrl);
        const blob = await response.blob();
        
        // Upload to storage
        const storageRef = ref(storage, `support/${field}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, blob);
        
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(prev => ({ ...prev, [field]: progress }));
          },
          (error) => {
            console.error("Upload failed", error);
            triggerNotification("Error", "Failed to upload image.", "alert");
            setIsSaving(false);
            setUploadProgress(prev => ({ ...prev, [field]: 0 }));
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const newSettings = { ...localSettings, [field]: downloadURL };
            try {
              await updateSupportSettings(newSettings);
              handleChange(field, downloadURL);
              triggerNotification("Success", "Image saved.", "success");
            } catch (e: any) {
              triggerNotification("Error", "Failed to save image to database.", "alert");
            }
            setIsSaving(false);
            setUploadProgress(prev => ({ ...prev, [field]: 0 }));
          }
        );
      } catch (error) {
        console.error("Error processing/uploading image", error);
        triggerNotification("Error", "Failed to process image.", "alert");
        setIsSaving(false);
        setUploadProgress(prev => ({ ...prev, [field]: 0 }));
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent, field: keyof SupportWidgetSettings) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleImageUpload(file || null, field);
  };

  const renderInput = (label: string, field: keyof SupportWidgetSettings, type: string = 'text') => (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        value={localSettings[field] as any}
        onChange={(e) => handleChange(field, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
      />
    </div>
  );
  
  const renderCheckbox = (label: string, field: keyof SupportWidgetSettings) => (
    <div className="flex items-center gap-2">
      <input 
        type="checkbox" 
        id={field as string} 
        checked={localSettings[field] as boolean} 
        onChange={(e) => handleChange(field, e.target.checked)} 
        className="w-4 h-4 accent-gold-500 cursor-pointer" 
      />
      <label htmlFor={field as string} className="text-sm text-neutral-300 cursor-pointer">{label}</label>
    </div>
  );

  const renderImageUpload = (label: string, field: keyof SupportWidgetSettings) => (
    <ImageField
      label={label}
      value={localSettings[field] as string}
      onChange={(value) => handleChange(field, value)}
      onUpload={(file) => handleImageUpload(file, field)}
      onSave={async (value) => {
          const newSettings = { ...localSettings, [field]: value };
          await updateSupportSettings(newSettings);
          triggerNotification("Image Saved", "Image URL updated successfully.", "success" as any);
      }}
      progress={uploadProgress[field]}
      isSaving={isSaving}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-gold-500" />
            Support Settings
          </h2>
          <p className="text-xs text-neutral-400 font-sans">Configure floating chat widget, WhatsApp, and Telegram integrations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestoreDefault}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-bold uppercase rounded-lg border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Restore Default
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-gold-600 hover:bg-gold-500 text-black text-xs font-black uppercase rounded-lg shadow-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
          {[
            { id: 'whatsapp', label: 'WhatsApp Settings' },
            { id: 'telegram', label: 'Telegram Settings' },
            { id: 'floating', label: 'Floating Widget Config' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-3 rounded-xl text-left text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap ${
                activeSection === tab.id 
                  ? 'bg-gold-500/10 border border-gold-500/30 text-gold-400' 
                  : 'bg-[#101017] border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#101017] border border-white/5 rounded-2xl p-6 relative">
          
          {activeSection === 'whatsapp' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-lg font-bold text-white uppercase">WhatsApp Integration</h3>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="whatsappEnabled" 
                    checked={localSettings.whatsappEnabled} 
                    onChange={(e) => handleChange('whatsappEnabled', e.target.checked)} 
                    className="w-4 h-4 accent-gold-500" 
                  />
                  <label htmlFor="whatsappEnabled" className="text-sm font-bold text-white">Enable WhatsApp</label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInput('WhatsApp Group Invite Link', 'whatsappGroupLink')}
                {renderInput('WhatsApp Community Link', 'whatsappCommunityLink')}
                {renderInput('WhatsApp Contact Number', 'whatsappContactNumber')}
                {renderInput('Button Title', 'whatsappButtonTitle')}
                {renderInput('Button Description', 'whatsappButtonDescription')}
              </div>
              <div className="mt-4">
                {renderImageUpload('Custom WhatsApp Logo', 'whatsappCustomLogo')}
              </div>
            </div>
          )}

          {activeSection === 'telegram' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-lg font-bold text-white uppercase">Telegram Integration</h3>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="telegramEnabled" 
                    checked={localSettings.telegramEnabled} 
                    onChange={(e) => handleChange('telegramEnabled', e.target.checked)} 
                    className="w-4 h-4 accent-gold-500" 
                  />
                  <label htmlFor="telegramEnabled" className="text-sm font-bold text-white">Enable Telegram</label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInput('Telegram Group Invite Link', 'telegramGroupLink')}
                {renderInput('Telegram Channel Link', 'telegramChannelLink')}
                {renderInput('Telegram Username', 'telegramUsername')}
                {renderInput('Button Title', 'telegramButtonTitle')}
                {renderInput('Button Description', 'telegramButtonDescription')}
              </div>
              <div className="mt-4">
                {renderImageUpload('Custom Telegram Logo', 'telegramCustomLogo')}
              </div>
            </div>
          )}

          {activeSection === 'floating' && (
            <div className="space-y-8">
              
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-gold-500 uppercase border-b border-white/10 pb-2">General</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {renderCheckbox('Enable Widget', 'widgetEnabled')}
                  {renderCheckbox('Show on Desktop', 'showOnDesktop')}
                  {renderCheckbox('Show on Tablet', 'showOnTablet')}
                  {renderCheckbox('Show on Mobile', 'showOnMobile')}
                  {renderCheckbox('Show Before Login', 'showBeforeLogin')}
                  {renderCheckbox('Show After Login', 'showAfterLogin')}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-bold text-gold-500 uppercase border-b border-white/10 pb-2">Appearance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderInput('Icon (lucide-react name)', 'floatingIcon')}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Background Color</label>
                    <input
                      type="text"
                      value={localSettings.floatingBgColor}
                      onChange={(e) => handleChange('floatingBgColor', e.target.value)}
                      placeholder="e.g. rgba(13, 13, 20, 0.7)"
                      className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                  {renderInput('Border Color', 'floatingBorderColor')}
                  {renderInput('Shadow (CSS)', 'floatingShadow')}
                  {renderInput('Border Radius (%)', 'floatingBorderRadius', 'number')}
                  {renderInput('Opacity (0 to 1)', 'floatingOpacity', 'number')}
                  {renderInput('Button Size Desktop (px)', 'floatingSizeDesktop', 'number')}
                  {renderInput('Button Size Mobile (px)', 'floatingSizeMobile', 'number')}
                  {renderInput('Icon Size Desktop (px)', 'iconSizeDesktop', 'number')}
                  {renderInput('Icon Size Mobile (px)', 'iconSizeMobile', 'number')}
                </div>
              </section>
              
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-gold-500 uppercase border-b border-white/10 pb-2">Position & Movement</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Default Screen Position</label>
                    <select 
                      value={localSettings.floatingPosition}
                      onChange={(e) => handleChange('floatingPosition', e.target.value)}
                      className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                    </select>
                  </div>
                  
                  {renderInput('Margin X (px)', 'floatingMarginX', 'number')}
                  {renderInput('Margin Y (px)', 'floatingMarginY', 'number')}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {renderCheckbox('Enable Drag & Drop', 'enableDragAndDrop')}
                  {renderCheckbox('Enable Snap to Edge', 'enableSnapToEdge')}
                  {renderCheckbox('Save Position Automatically', 'savePositionAutomatically')}
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={() => {
                      localStorage.removeItem('supportWidgetPosition');
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase rounded-lg border border-red-500/20 transition-colors"
                  >
                    Reset Saved Position (Clears Storage & Reloads)
                  </button>
                </div>
              </section>
              
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-gold-500 uppercase border-b border-white/10 pb-2">Animations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderCheckbox('Background Pulse Animation', 'pulseAnimation')}
                  {renderCheckbox('Floating (Up/Down) Animation', 'floatingAnimation')}
                  {renderCheckbox('Hover Scaling', 'hoverAnimation')}
                  {renderCheckbox('Click Scaling', 'clickAnimation')}
                  {renderCheckbox('Neon Glow Effect', 'floatingGlowEffect')}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Popup Open Animation</label>
                    <select 
                      value={localSettings.floatingOpenAnimation}
                      onChange={(e) => handleChange('floatingOpenAnimation', e.target.value)}
                      className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                    >
                      <option value="bounce">Bounce</option>
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                      <option value="scale">Scale</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Popup Close Animation</label>
                    <select 
                      value={localSettings.floatingCloseAnimation}
                      onChange={(e) => handleChange('floatingCloseAnimation', e.target.value)}
                      className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-gold-500 focus:outline-none"
                    >
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                      <option value="scale">Scale</option>
                    </select>
                  </div>
                  {renderInput('Auto Close Timer (s, 0=off)', 'floatingAutoCloseTimer', 'number')}
                </div>
              </section>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
