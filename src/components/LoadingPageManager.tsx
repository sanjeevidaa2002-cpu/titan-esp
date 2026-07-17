/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Zap, 
  ShieldAlert, 
  Trash2,
  Upload, 

  Image as ImageIcon, 
  RefreshCw, 
  Plus, 
  Check, 
  Eye, 
  Gamepad, 
  Play, 
  Settings as SettingsIcon, 
  Palette, 
  Sliders, 
  Type, 
  Layers, 
  Clock, 
  CheckCircle,
  HelpCircle,
  EyeOff,
  Sparkles,
  Undo,
  X
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useGame } from '../context/GameContext';
import { TitanEsportsLogo } from './TitanEsportsLogo';
import { BrandingSettings, SplashBadge } from '../types';
import { DEFAULT_BRANDING } from '../dataStore';

export const LoadingPageManager: React.FC = () => {
  const { brandingSettings, updateBrandingSettings } = useGame();

  // Local state for all fields (uncommitted until saved/published)
  const [localSettings, setLocalSettings] = useState<BrandingSettings>({
    ...DEFAULT_BRANDING,
    ...brandingSettings
  });

  const [activeSubTab, setActiveSubTab] = useState<'text' | 'logos' | 'badges' | 'background' | 'colors' | 'progress' | 'loading' | 'animations'>('text');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(45);
  const [typingTrigger, setTypingTrigger] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Sync state if backend updates
  useEffect(() => {
    if (brandingSettings) {
      const merged = { ...brandingSettings };
      
      // Enforce the requested default image link
      const imgUrl = 'https://i.postimg.cc/gcN77Wr7/file-0000000066b471fb99e9222be8dc0b65.png';
      if (!merged.loadingMainLogo) merged.loadingMainLogo = imgUrl;
      if (!merged.loadingCenterLogo) merged.loadingCenterLogo = imgUrl;
      if (!merged.splashFallbackLogo) merged.splashFallbackLogo = imgUrl;

      setLocalSettings(prev => ({
        ...prev,
        ...merged
      }));
    }
  }, [brandingSettings]);

  // Handle typing effect for the preview
  const [typedLoadingText, setTypedLoadingText] = useState("");
  const targetLoadingText = localSettings.splashLoadingText || 'INITIALIZING SECURE CONNECTION...';

  useEffect(() => {
    if (localSettings.splashTextAnimation === 'typing') {
      let index = 0;
      setTypedLoadingText("");
      const text = targetLoadingText;
      const interval = setInterval(() => {
        setTypedLoadingText(prev => prev + text.charAt(index));
        index++;
        if (index >= text.length) {
          clearInterval(interval);
        }
      }, 40);
      return () => clearInterval(interval);
    } else {
      setTypedLoadingText(targetLoadingText);
    }
  }, [targetLoadingText, localSettings.splashTextAnimation, typingTrigger]);

  // Helper for progress loop inside Admin Preview
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setPreviewProgress(prev => {
        if (prev >= 100) {
          return 0;
        }
        return prev + 1;
      });
    }, 100);
    return () => clearInterval(progressInterval);
  }, []);

  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof BrandingSettings) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validFormats.includes(file.type)) {
      alert("Unsupported format! Choose a valid PNG, JPG, JPEG, WEBP, SVG, or ICO.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const compressed = await resizeAndCompressImage(base64, 512, 512);

        const response = await fetch(compressed);
        const blob = await response.blob();

        const storageRef = ref(storage, `branding/${key}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on('state_changed',
          null,
          (error) => {
            console.error("Firebase Storage upload failed:", error);
            alert("Upload failed: " + error.message);
            setIsSaving(false);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const cacheBustedUrl = `${downloadURL}${downloadURL.includes('?') ? '&' : '?'}v=${Date.now()}`;
              
              setLocalSettings(prev => {
                const updated = { ...prev, [key]: cacheBustedUrl };
                return updated;
              });

              // Also persist it so it takes effect instantly
              await updateBrandingSettings({ [key]: cacheBustedUrl });

              setSaveSuccess("Primary Loading Logo Updated Successfully.");
              setTimeout(() => setSaveSuccess(null), 4000);
            } catch (dbErr: any) {
              console.error("Failed to save to database:", dbErr);
              alert("Image uploaded but database save failed: " + dbErr.message);
            } finally {
              setIsSaving(false);
            }
          }
        );
      } catch (err) {
        console.error("Error compressing/uploading image:", err);
        alert("Upload error.");
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const resizeAndCompressImage = (base64Str: string, maxW: number, maxH: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width *= ratio;
          height *= ratio;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 0.9));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
      img.src = base64Str;
    });
  };

const handleFieldChange = (key: keyof BrandingSettings, value: any) => {
    setLocalSettings(prev => {
      const updated = { ...prev, [key]: value };
      if (value && (key === 'splashLogo' || key === 'loadingMainLogo' || key === 'loadingLogo' || key === 'splashFallbackLogo' || key === 'loadingCenterLogo')) {
        updated.splashLogoType = 'custom';
      }
      return updated;
    });
  };

  // Save changes to Firestore
  const handleSave = async (showNotification = true) => {
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      // Clean and version image URLs if entered manually
      const processedSettings = { ...localSettings };
      
      const imageKeys: (keyof BrandingSettings)[] = [
        'splashLogo', 'splashFallbackLogo', 'splashBgImage',
        'loadingMainLogo', 'loadingCenterLogo', 'loadingCenterLogoUrl', 'loadingBackgroundImage',
        'loadingLogo', 'loadingBgImage'
      ];
      imageKeys.forEach(key => {
        const url = processedSettings[key];
        if (typeof url === 'string' && url.trim() !== '') {
          const trimmed = url.trim();
          processedSettings[key] = trimmed;
          // If it starts with http and does not have a version tag already, append a cache-buster
          if (trimmed.startsWith('http') && !trimmed.includes('v=')) {
            processedSettings[key] = `${trimmed}${trimmed.includes('?') ? '&' : '?'}v=${Date.now()}`;
          }
        }
      });

      // Removed logo synchronization so Logo 1, Logo 2, and Logo 3 can exist independently

      // loadingCenterLogo is independent too

      if (processedSettings.loadingBackgroundImage) {
        processedSettings.splashBgImage = processedSettings.loadingBackgroundImage;
        processedSettings.loadingBgImage = processedSettings.loadingBackgroundImage;
      } else if (processedSettings.splashBgImage) {
        processedSettings.loadingBackgroundImage = processedSettings.splashBgImage;
        processedSettings.loadingBgImage = processedSettings.splashBgImage;
      } else if (processedSettings.loadingBgImage) {
        processedSettings.loadingBackgroundImage = processedSettings.loadingBgImage;
        processedSettings.splashBgImage = processedSettings.loadingBgImage;
      }

      // Synchronize text and color keys for complete Loading Page Configuration compliance
      processedSettings.loadingTitle = processedSettings.splashMainTitle || processedSettings.loadingTitle || 'VICTORY';
      processedSettings.loadingSubtitle = processedSettings.loadingSubtitle || processedSettings.splashSubtitle || 'PREPARE FOR BATTLE';
      processedSettings.loadingLoadingText = processedSettings.loadingLoadingText || processedSettings.splashLoadingText || 'INITIALIZING SECURE CONNECTION...';
      processedSettings.loadingText = processedSettings.loadingLoadingText;
      processedSettings.loadingProgressText = processedSettings.loadingProgressText || '';
      processedSettings.loadingProgressBarColor = processedSettings.splashProgressBarColor || '#e5a919';
      processedSettings.loadingBackgroundColor = processedSettings.splashBgColor || '#07070a';
      processedSettings.loadingDuration = Number(processedSettings.splashLoadingDuration) || 2500;
      processedSettings.loadingAnimation = processedSettings.splashLogoAnimation || 'pulse';
      processedSettings.updatedAt = Date.now();

      await updateBrandingSettings(processedSettings);
      
      // Sync localSettings state with the processed ones
      setLocalSettings(processedSettings);

      if (showNotification) {
        setSaveSuccess("Loading Page Settings Saved Successfully.");
        setTimeout(() => setSaveSuccess(null), 4000);
      }
    } catch (err: any) {
      alert("Error saving settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Default Values
  const handleRestoreDefault = () => {
    if (window.confirm("Are you sure you want to restore all Loading Page settings to the factory system defaults? This will erase custom backgrounds, badges, and colors.")) {
      setLocalSettings(prev => ({
        ...prev,
        splashWebsiteName: DEFAULT_BRANDING.splashWebsiteName,
        splashMainTitle: DEFAULT_BRANDING.splashMainTitle,
        splashSecondaryTitle: DEFAULT_BRANDING.splashSecondaryTitle,
        splashTitle: DEFAULT_BRANDING.splashTitle,
        splashSubtitle: DEFAULT_BRANDING.splashSubtitle,
        splashLoadingText: DEFAULT_BRANDING.splashLoadingText,
        splashLoadingDuration: DEFAULT_BRANDING.splashLoadingDuration,
        splashAutoRedirectTime: DEFAULT_BRANDING.splashAutoRedirectTime,
        splashLogo: DEFAULT_BRANDING.splashLogo,
        splashMainLogo: DEFAULT_BRANDING.splashMainLogo,
        splashCenterIcon: DEFAULT_BRANDING.splashCenterIcon,
        splashFallbackLogo: DEFAULT_BRANDING.splashFallbackLogo,
        splashBgImage: DEFAULT_BRANDING.splashBgImage,
        splashBgColor: DEFAULT_BRANDING.splashBgColor,
        splashBgGradient: DEFAULT_BRANDING.splashBgGradient,
        splashBgOverlayColor: DEFAULT_BRANDING.splashBgOverlayColor,
        splashBgOverlayOpacity: DEFAULT_BRANDING.splashBgOverlayOpacity,
        splashBgBlur: DEFAULT_BRANDING.splashBgBlur,
        splashMainTitleColor: DEFAULT_BRANDING.splashMainTitleColor,
        splashSecondaryTitleColor: DEFAULT_BRANDING.splashSecondaryTitleColor,
        splashSubtitleColor: DEFAULT_BRANDING.splashSubtitleColor,
        splashLoadingTextColor: DEFAULT_BRANDING.splashLoadingTextColor,
        splashProgressBarColor: DEFAULT_BRANDING.splashProgressBarColor,
        splashProgressBarBgColor: DEFAULT_BRANDING.splashProgressBarBgColor,
        splashGlowColor: DEFAULT_BRANDING.splashGlowColor,
        splashShowProgressBar: DEFAULT_BRANDING.splashShowProgressBar,
        splashProgressBarHeight: DEFAULT_BRANDING.splashProgressBarHeight,
        splashProgressBarWidth: DEFAULT_BRANDING.splashProgressBarWidth,
        splashProgressBarRadius: DEFAULT_BRANDING.splashProgressBarRadius,
        splashProgressBarAnimation: DEFAULT_BRANDING.splashProgressBarAnimation,
        splashMinLoadingTime: DEFAULT_BRANDING.splashMinLoadingTime,
        splashMaxLoadingTime: DEFAULT_BRANDING.splashMaxLoadingTime,
        splashAllowSkip: DEFAULT_BRANDING.splashAllowSkip,
        splashShowPercentage: DEFAULT_BRANDING.splashShowPercentage,
        splashShowLoadingText: DEFAULT_BRANDING.splashShowLoadingText,
        splashLogoAnimation: DEFAULT_BRANDING.splashLogoAnimation,
        splashTextAnimation: DEFAULT_BRANDING.splashTextAnimation,
        splashBadges: DEFAULT_BRANDING.splashBadges,
        splashFooterText: DEFAULT_BRANDING.splashFooterText
      }));
    }
  };

  const handleResetAll = () => {
    if (window.confirm("Discard all uncommitted local modifications and reload current database settings?")) {
      setLocalSettings({
        ...DEFAULT_BRANDING,
        ...brandingSettings
      });
    }
  };

  // Badge Management Helper functions
  const handleBadgeChange = (id: string, updates: Partial<SplashBadge>) => {
    const badges = localSettings.splashBadges || [];
    const updatedBadges = badges.map(b => b.id === id ? { ...b, ...updates } : b);
    setLocalSettings(prev => ({
      ...prev,
      splashBadges: updatedBadges
    }));
  };

  const handleAddBadge = () => {
    const badges = localSettings.splashBadges || [];
    const newBadge: SplashBadge = {
      id: `badge_${Date.now()}`,
      text: 'New Badge',
      icon: 'Trophy',
      iconColor: '#e5a919',
      bgColor: 'rgba(0,0,0,0.3)',
      borderColor: 'rgba(255,255,255,0.1)',
      enabled: true,
      order: badges.length + 1
    };
    setLocalSettings(prev => ({
      ...prev,
      splashBadges: [...badges, newBadge]
    }));
  };

  const handleDeleteBadge = (id: string) => {
    const badges = localSettings.splashBadges || [];
    const filtered = badges.filter(b => b.id !== id);
    setLocalSettings(prev => ({
      ...prev,
      splashBadges: filtered
    }));
  };

  // Render Dynamic Badge Icon helper
  const renderBadgeIcon = (iconName: string, color: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || Trophy;
    return <IconComponent className="w-3.5 h-3.5" style={{ color }} />;
  };

  // Maps Logo Animation string to motion properties
  const getLogoAnimationProps = () => {
    const anim = localSettings.splashLogoAnimation || 'pulse';
    switch (anim) {
      case 'fade':
        return {
          animate: { opacity: [0.4, 1, 0.4] },
          transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
        };
      case 'zoom':
        return {
          animate: { scale: [0.95, 1.05, 0.95] },
          transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
        };
      case 'pulse':
        return {
          animate: { scale: [0.9, 1.08, 0.9], opacity: [0.8, 1, 0.8] },
          transition: { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
        };
      case 'rotate':
        return {
          animate: { rotate: 360 },
          transition: { repeat: Infinity, duration: 8, ease: "linear" }
        };
      case 'bounce':
        return {
          animate: { y: [0, -12, 0] },
          transition: { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
        };
      case 'glow':
        return {
          animate: { boxShadow: [`0 0 10px ${localSettings.splashGlowColor || '#e5a919'}80`, `0 0 30px ${localSettings.splashGlowColor || '#e5a919'}ff`, `0 0 10px ${localSettings.splashGlowColor || '#e5a919'}80`] },
          transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
        };
      default:
        return {};
    }
  };

  // Maps Text Animation to motion properties
  const getTextAnimationProps = () => {
    const anim = localSettings.splashTextAnimation || 'fade-in';
    switch (anim) {
      case 'slide-up':
        return {
          initial: { opacity: 0, y: 15 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6 }
        };
      case 'slide-down':
        return {
          initial: { opacity: 0, y: -15 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6 }
        };
      case 'zoom':
        return {
          initial: { opacity: 0, scale: 0.85 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.6 }
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.8 }
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111116] border border-white/5 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-wider uppercase">
            <Sliders className="w-5 h-5 text-gold-400" />
            Loading Page Manager
          </h2>
          <p className="text-xs text-neutral-400">
            Configure, style, and customize the frontend Splash / Loading Screen. Real-time updates with no source code modifications.
          </p>
        </div>

        {/* TOP LEVEL ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRestoreDefault}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Undo className="w-3.5 h-3.5" />
            Restore Defaults
          </button>
          
          <button
            onClick={handleResetAll}
            className="px-4 py-2 bg-red-950/40 hover:bg-red-950/70 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Changes
          </button>

          <button
            onClick={() => setShowFullPreview(true)}
            className="px-4 py-2 bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 animate-pulse" />
            Full Screen Preview
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-gold-500 text-neutral-950 text-xs font-black uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-gold-500/20 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                SAVING...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                PUBLISH LIVE
              </>
            )}
          </button>
        </div>
      </div>

      {/* SAVE SUCCESS NOTIFICATION */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2.5"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400 animate-bounce" />
            {saveSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDE-BY-SIDE EDITOR AND REAL-TIME PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CONTROL TABS AND SETTINGS (7 COLS) */}
        <div className="lg:col-span-7 bg-[#111116] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          
          {/* Sub Navigation */}
          <div className="flex flex-wrap border-b border-white/5 bg-[#0a0a0f] p-1.5 gap-1">
            {[
              { id: 'text', label: 'Texts', icon: Type },
              { id: 'logos', label: 'Logos', icon: ImageIcon },
              { id: 'badges', label: 'Badges', icon: Trophy },
              { id: 'background', label: 'Background', icon: Layers },
              { id: 'colors', label: 'Colors', icon: Palette },
              { id: 'progress', label: 'Progress Bar', icon: Sliders },
              { id: 'loading', label: 'Loading Metrics', icon: Clock },
              { id: 'animations', label: 'Animations', icon: Sparkles }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeSubTab === tab.id
                      ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="p-5 flex-1 min-h-[480px]">
            
            {/* TEXT FIELDS PANEL */}
            {activeSubTab === 'text' && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4 text-gold-400" />
                  Splash Screen Text Configurations
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Main Title</label>
                    <input
                      type="text"
                      value={localSettings.splashMainTitle || localSettings.loadingTitle || ''}
                      onChange={e => {
                        setLocalSettings(p => ({ 
                          ...p, 
                          splashMainTitle: e.target.value,
                          loadingTitle: e.target.value
                        }));
                      }}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 outline-none transition-all font-semibold"
                      placeholder="e.g. VICTORY"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Secondary Title</label>
                    <input
                      type="text"
                      value={localSettings.splashSecondaryTitle || ''}
                      onChange={e => {
                        setLocalSettings(p => ({ 
                          ...p, 
                          splashSecondaryTitle: e.target.value
                        }));
                      }}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 outline-none transition-all font-semibold"
                      placeholder="e.g. ARENA"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Loading Subtitle</label>
                    <input
                      type="text"
                      value={localSettings.loadingSubtitle || ''}
                      onChange={e => setLocalSettings(p => ({ ...p, loadingSubtitle: e.target.value, splashSubtitle: e.target.value }))}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 outline-none transition-all font-semibold"
                      placeholder="e.g. PREPARE FOR BATTLE"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Loading Message (Loading Text)</label>
                    <input
                      type="text"
                      value={localSettings.loadingLoadingText || localSettings.splashLoadingText || ''}
                      onChange={e => setLocalSettings(p => ({ ...p, loadingLoadingText: e.target.value, splashLoadingText: e.target.value, loadingText: e.target.value }))}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 outline-none transition-all font-semibold"
                      placeholder="e.g. INITIALIZING SECURE CONNECTION..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Progress Text / Percentage Fallback</label>
                    <input
                      type="text"
                      value={localSettings.loadingProgressText || ''}
                      onChange={e => setLocalSettings(p => ({ ...p, loadingProgressText: e.target.value }))}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 outline-none transition-all font-semibold"
                      placeholder="e.g. PLEASE WAIT... (leave empty for dynamic 0-100% percentage)"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Website Name</label>
                    <input
                      type="text"
                      value={localSettings.splashWebsiteName || ''}
                      onChange={e => setLocalSettings(p => ({ ...p, splashWebsiteName: e.target.value }))}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 outline-none transition-all font-semibold"
                      placeholder="e.g. VICTORY ARENA"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Bottom Footer Text</label>
                    <input
                      type="text"
                      value={localSettings.splashFooterText || ''}
                      onChange={e => setLocalSettings(p => ({ ...p, splashFooterText: e.target.value }))}
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 outline-none transition-all font-semibold"
                      placeholder="e.g. SECURE SERVER DECK"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* LOGOS PANEL */}
            {activeSubTab === 'logos' && (
              <div className="space-y-6">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gold-400" />
                  Logo & Icon Visual Settings
                </h3>

                {/* LOGO TYPE SELECTOR */}
                <div className="bg-[#0a0a0f]/80 border border-white/5 rounded-2xl p-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Select Active Logo Display Style</h4>
                    <p className="text-[10px] text-neutral-400 mt-1">Choose which brand asset to display in the primary center position on your loading and splash screens.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Option 1: Premium Titan Mascot */}
                    <button
                      type="button"
                      onClick={() => setLocalSettings(p => ({ ...p, splashLogoType: 'titan' }))}
                      className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-36 cursor-pointer ${
                        (localSettings.splashLogoType === 'titan' || !localSettings.splashLogoType)
                          ? 'bg-gradient-to-br from-amber-500/10 to-gold-500/5 border-gold-500/40 text-white shadow-lg shadow-gold-500/5'
                          : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className="px-2 py-0.5 bg-gold-500/20 text-gold-400 text-[8px] font-black tracking-widest rounded-full uppercase">MASCOT</span>
                        <div className="w-12 h-12 rounded-lg bg-[#07070a] border border-white/10 flex items-center justify-center p-1 overflow-hidden">
                          <TitanEsportsLogo className="w-10 h-10 object-contain" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-black uppercase tracking-wider">Titan Esports mascot</p>
                        <p className="text-[9px] text-neutral-400 mt-0.5 leading-relaxed">Elegant built-in vector character logo with premium gold outline.</p>
                      </div>
                    </button>

                    {/* Option 2: Custom URL */}
                    <button
                      type="button"
                      onClick={() => setLocalSettings(p => ({ ...p, splashLogoType: 'custom' }))}
                      className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-36 cursor-pointer ${
                        localSettings.splashLogoType === 'custom'
                          ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/40 text-white shadow-lg shadow-purple-500/5'
                          : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[8px] font-black tracking-widest rounded-full uppercase">CUSTOM</span>
                        <div className="w-12 h-12 rounded-lg bg-[#07070a] border border-white/10 flex items-center justify-center p-1 overflow-hidden">
                          {localSettings.splashFallbackLogo || localSettings.splashLogo ? (
                            <img src={localSettings.splashFallbackLogo || localSettings.splashLogo} alt="Custom Logo" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-neutral-500" />
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-black uppercase tracking-wider">Custom Image URL</p>
                        <p className="text-[9px] text-neutral-400 mt-0.5 leading-relaxed">Link your own gaming logo, guild crest, or sponsor branding image.</p>
                      </div>
                    </button>

                    {/* Option 3: Lucide Preset Icon */}
                    <button
                      type="button"
                      onClick={() => setLocalSettings(p => ({ ...p, splashLogoType: 'icon' }))}
                      className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-36 cursor-pointer ${
                        localSettings.splashLogoType === 'icon'
                          ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/40 text-white shadow-lg shadow-blue-500/5'
                          : 'bg-[#111116] border-white/5 text-neutral-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[8px] font-black tracking-widest rounded-full uppercase">VECTOR ICON</span>
                        <div className="w-12 h-12 rounded-lg bg-[#07070a] border border-white/10 flex items-center justify-center p-1">
                          {(() => {
                            const IconC = (LucideIcons as any)[localSettings.splashCenterIcon || 'Trophy'] || Trophy;
                            return <IconC className="w-5 h-5 text-blue-400" />;
                          })()}
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-black uppercase tracking-wider">Minimalist Vector Preset</p>
                        <p className="text-[9px] text-neutral-400 mt-0.5 leading-relaxed">Select a clean preset vector icon (Trophy, Zap, Flame, Gamepad, etc.).</p>
                      </div>
                    </button>
                  </div>
                </div>

                {[
                  { key: 'loadingMainLogo', label: 'Primary Loading Logo', desc: 'Appears at the top of the loading screen' },
                  { key: 'loadingCenterLogo', label: 'Loading Logo 2', desc: 'Appears inside the decorative orbital ring in the center' },
                  { key: 'loadingLogo', label: 'Loading Logo 3', desc: 'Appears at the bottom above the progress bar' }
                ].map((item) => {
                  const imageSrc = localSettings[item.key as keyof BrandingSettings] as string;
                  return (
                    <div key={item.key} className="bg-[#0a0a0f] border border-white/5 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-sm">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wide">{item.label}</h4>
                        <p className="text-[10px] text-neutral-400">{item.desc}</p>
                        
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={imageSrc || ''}
                            onChange={e => {
                                handleFieldChange(item.key as any, e.target.value);
                                setImgErrors(prev => ({ ...prev, [item.key]: false }));
                            }}
                            placeholder="Enter image web URL"
                            className="bg-[#111116] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:border-gold-500 outline-none w-48 font-mono"
                          />
                          <span className="text-[10px] text-neutral-500 font-bold uppercase">OR</span>
                          <label className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            Upload
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/x-icon, image/vnd.microsoft.icon"
                              onChange={e => handleImageUpload(e, item.key as any)}
                              className="hidden"
                            />
                          </label>
                          
                        </div>
                      </div>

                      {/* Live Image Preview & Helper Commands */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-16 h-16 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden relative group">
                          {imageSrc ? (
                            <img src={imageSrc} alt="Preview" className="max-w-full max-h-full object-contain" onError={() => setImgErrors(prev => ({ ...prev, [item.key]: true }))} />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-neutral-600" />
                          )}
                        </div>
                        {imgErrors[item.key] && imageSrc && (
                          <div className="text-[10px] text-red-400 font-bold max-w-[80px] text-center leading-tight">
                            Invalid or inaccessible URL
                          </div>
                        )}
                        {imageSrc && (
                          <div className="flex gap-1.5">
                            
                            <button
                              onClick={() => handleFieldChange(item.key as any, '')}
                              className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-500/20 text-[9px] font-extrabold uppercase rounded hover:bg-red-900"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => handleFieldChange(item.key as any, DEFAULT_BRANDING[item.key as keyof BrandingSettings])}
                              className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 border border-white/10 text-[9px] font-extrabold uppercase rounded hover:bg-neutral-700"
                            >
                              Default
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* CENTER ICON SELECTOR */}
                <div className="bg-[#0a0a0f] border border-white/5 p-4 rounded-xl space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">Center Icon (Mascot Icon Backup)</h4>
                    <p className="text-[10px] text-neutral-400">Displays in orbital center when no main custom logo is linked.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Column 1: Preset Vector Icon */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 block">Option A: Preset Vector Icon</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Trophy', 'Zap', 'ShieldAlert', 'Gamepad2', 'Flame', 'Sparkles', 'Sliders', 'Award', 'Lock'].map(iconName => {
                          const IconComponent = (LucideIcons as any)[iconName] || Trophy;
                          const isSelected = localSettings.splashLogoType === 'icon' && localSettings.splashCenterIcon === iconName;
                          return (
                            <button
                              key={iconName}
                              type="button"
                              onClick={() => {
                                setLocalSettings(p => ({ 
                                  ...p, 
                                  splashCenterIcon: iconName,
                                  splashLogoType: 'icon'
                                }));
                              }}
                              className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] font-bold border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-gold-500/10 border-gold-500/40 text-gold-400 shadow-md shadow-gold-500/5'
                                  : 'bg-[#111116] border-white/5 text-neutral-400 hover:text-white hover:border-white/20'
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                              <span className="text-[9px] truncate max-w-full">{iconName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 2: Custom Mascot URL */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold-500 block">Option B: Custom Mascot URL</span>
                      <div className="bg-[#111116] border border-white/5 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex flex-col gap-1.5 w-full">
                          <input
                            type="text"
                            value={localSettings.splashFallbackLogo || ''}
                            onChange={e => handleFieldChange('splashFallbackLogo', e.target.value)}
                            placeholder="Mascot Image URL"
                            className="bg-[#0a0a0f] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-gold-500 outline-none w-full font-mono"
                          />
                          
                        </div>

                        {/* Thumbnail preview */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div className="w-14 h-14 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden relative">
                            {localSettings.splashFallbackLogo ? (
                              <img src={localSettings.splashFallbackLogo} alt="Mascot Custom" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-neutral-700" />
                            )}
                          </div>
                          {localSettings.splashFallbackLogo && (
                            <div className="flex gap-1">
                              
                              <button
                                type="button"
                                onClick={() => handleFieldChange('splashFallbackLogo', '')}
                                className="px-1 py-0.5 bg-red-950 text-red-400 border border-red-500/20 text-[8px] font-extrabold uppercase rounded hover:bg-red-900"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-[9px] text-neutral-400 leading-normal">
                        * Custom linked mascot takes priority over preset icons.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BADGES & BUTTONS PANEL */}
            {activeSubTab === 'badges' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-gold-400" />
                      Dynamic Highlights & Badges Manager
                    </h3>
                    <p className="text-[10px] text-neutral-400">Manage fully editable bullet points/badges displayed on the Splash layout.</p>
                  </div>
                  <button
                    onClick={handleAddBadge}
                    className="px-2.5 py-1 bg-gold-500 hover:bg-gold-600 text-neutral-950 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Badge
                  </button>
                </div>

                <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {(localSettings.splashBadges || []).map((badge) => (
                    <div key={badge.id} className="bg-[#0a0a0f] border border-white/5 p-3.5 rounded-xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-neutral-500">#{badge.id.substring(badge.id.length - 4)}</span>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-xs text-white border border-white/5">
                            {renderBadgeIcon(badge.icon, badge.iconColor)}
                            <span className="text-[10px] font-bold">{badge.text || 'Unlabeled'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={badge.enabled}
                              onChange={e => handleBadgeChange(badge.id, { enabled: e.target.checked })}
                              className="w-3 h-3 rounded border-white/10 bg-neutral-950 text-gold-500"
                            />
                            <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-wide">Enabled</span>
                          </label>
                          <button
                            onClick={() => handleDeleteBadge(badge.id)}
                            className="p-1 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 rounded transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Badge Text</label>
                          <input
                            type="text"
                            value={badge.text}
                            onChange={e => handleBadgeChange(badge.id, { text: e.target.value })}
                            className="w-full bg-[#111116] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:border-gold-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Lucide Icon</label>
                          <select
                            value={badge.icon}
                            onChange={e => handleBadgeChange(badge.id, { icon: e.target.value })}
                            className="w-full bg-[#111116] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-gold-500 outline-none"
                          >
                            {['Trophy', 'Zap', 'ShieldAlert', 'Flame', 'Award', 'Lock', 'CheckCircle', 'RefreshCw', 'HelpCircle', 'Sparkles'].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Display Order</label>
                          <input
                            type="number"
                            value={badge.order}
                            onChange={e => handleBadgeChange(badge.id, { order: Number(e.target.value) })}
                            className="w-full bg-[#111116] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-gold-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1">
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Icon Color</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={badge.iconColor}
                              onChange={e => handleBadgeChange(badge.id, { iconColor: e.target.value })}
                              className="w-5 h-5 rounded border border-white/10 bg-transparent cursor-pointer"
                            />
                            <input
                              type="text"
                              value={badge.iconColor}
                              onChange={e => handleBadgeChange(badge.id, { iconColor: e.target.value })}
                              className="bg-[#111116] border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-mono text-white w-16"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Background Color</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={badge.bgColor.startsWith('rgba') ? '#000000' : badge.bgColor}
                              onChange={e => handleBadgeChange(badge.id, { bgColor: e.target.value })}
                              className="w-5 h-5 rounded border border-white/10 bg-transparent cursor-pointer"
                            />
                            <input
                              type="text"
                              value={badge.bgColor}
                              onChange={e => handleBadgeChange(badge.id, { bgColor: e.target.value })}
                              className="bg-[#111116] border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-mono text-white w-16"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Border Color</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={badge.borderColor.startsWith('rgba') ? '#ffffff' : badge.borderColor}
                              onChange={e => handleBadgeChange(badge.id, { borderColor: e.target.value })}
                              className="w-5 h-5 rounded border border-white/10 bg-transparent cursor-pointer"
                            />
                            <input
                              type="text"
                              value={badge.borderColor}
                              onChange={e => handleBadgeChange(badge.id, { borderColor: e.target.value })}
                              className="bg-[#111116] border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-mono text-white w-16"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(localSettings.splashBadges || []).length === 0 && (
                    <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-neutral-500 font-bold uppercase text-[10px] tracking-widest bg-black/10">
                      No Badges Configured. Click "Add Badge" above.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BACKGROUND SETTINGS PANEL */}
            {activeSubTab === 'background' && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gold-400" />
                  Background Frame Canvas Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0a0a0f] border border-white/5 p-4 rounded-xl">
                  {/* Background Image Options */}
                  <div className="space-y-2.5">
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Background Image</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={localSettings.splashBgImage || ''}
                        onChange={e => handleFieldChange('splashBgImage', e.target.value)}
                        placeholder="Paste image web URL"
                        className="bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-gold-500 outline-none font-mono"
                      />
                      
                    </div>
                    {localSettings.splashBgImage && (
                      <button
                        onClick={() => handleFieldChange('splashBgImage', '')}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wide block"
                      >
                        Remove Background Image
                      </button>
                    )}
                  </div>

                  {/* Gradient & Solid Background Color */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Fallback Solid Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={localSettings.splashBgColor}
                          onChange={e => setLocalSettings(p => ({ ...p, splashBgColor: e.target.value }))}
                          className="w-7 h-7 rounded border border-white/10 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={localSettings.splashBgColor}
                          onChange={e => setLocalSettings(p => ({ ...p, splashBgColor: e.target.value }))}
                          className="bg-[#111116] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white w-24"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Linear Gradient Rule</label>
                      <input
                        type="text"
                        value={localSettings.splashBgGradient || ''}
                        onChange={e => setLocalSettings(p => ({ ...p, splashBgGradient: e.target.value }))}
                        placeholder="e.g. linear-gradient(to bottom, #07070a, #0d0d14)"
                        className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-gold-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0a0a0f] border border-white/5 p-4 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Overlay Mask Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={localSettings.splashBgOverlayColor || '#000000'}
                        onChange={e => setLocalSettings(p => ({ ...p, splashBgOverlayColor: e.target.value }))}
                        className="w-6 h-6 rounded border border-white/10 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={localSettings.splashBgOverlayColor || ''}
                        onChange={e => setLocalSettings(p => ({ ...p, splashBgOverlayColor: e.target.value }))}
                        className="bg-[#111116] border border-white/10 rounded px-2 py-1 text-[11px] font-mono text-white w-24"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Overlay Opacity ({localSettings.splashBgOverlayOpacity ?? 0.4})</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={localSettings.splashBgOverlayOpacity ?? 0.4}
                      onChange={e => setLocalSettings(p => ({ ...p, splashBgOverlayOpacity: Number(e.target.value) }))}
                      className="w-full accent-gold-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Background Blur: {localSettings.splashBgBlur ?? 0}px</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={localSettings.splashBgBlur ?? 0}
                      onChange={e => setLocalSettings(p => ({ ...p, splashBgBlur: Number(e.target.value) }))}
                      className="w-full accent-gold-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* COLOR SETTINGS PANEL */}
            {activeSubTab === 'colors' && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gold-400" />
                  Dynamic Accent & Color Palette
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0a0a0f] border border-white/5 p-4 rounded-xl">
                  {[
                    { key: 'splashMainTitleColor', label: 'Main Title Color', default: '#e5a919' },
                    { key: 'splashSecondaryTitleColor', label: 'Secondary Title Color', default: '#ffffff' },
                    { key: 'splashSubtitleColor', label: 'Subtitle Accent Color', default: '#a855f7' },
                    { key: 'splashLoadingTextColor', label: 'Loading Info Color', default: '#a3a3a3' },
                    { key: 'splashProgressBarColor', label: 'Progress Bar Solid', default: '#e5a919' },
                    { key: 'splashProgressBarBgColor', label: 'Progress Bar Track', default: '#171717' },
                    { key: 'splashGlowColor', label: 'Mascot Orb Glow Color', default: '#e5a919' }
                  ].map(colorOpt => {
                    const value = (localSettings[colorOpt.key as keyof BrandingSettings] as string) || colorOpt.default;
                    return (
                      <div key={colorOpt.key} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-none last:pb-0">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">{colorOpt.label}</span>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={value}
                            onChange={e => setLocalSettings(p => ({ ...p, [colorOpt.key]: e.target.value }))}
                            className="w-6 h-6 rounded border border-white/10 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={e => setLocalSettings(p => ({ ...p, [colorOpt.key]: e.target.value }))}
                            className="bg-[#111116] border border-white/10 rounded px-2 py-1 text-[11px] font-mono text-white w-20"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PROGRESS BAR PANEL */}
            {activeSubTab === 'progress' && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-gold-400" />
                  Decorative Loading Progress Bar
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0a0a0f] border border-white/5 p-4 rounded-xl">
                  <div className="flex items-center justify-between col-span-2 border-b border-white/5 pb-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">Show Loading Progress Bar</h4>
                      <p className="text-[10px] text-neutral-400">Enable or disable visual loading bar element.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.splashShowProgressBar ?? true}
                        onChange={e => setLocalSettings(p => ({ ...p, splashShowProgressBar: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Progress Bar Height (pixels)</label>
                    <input
                      type="number"
                      value={localSettings.splashProgressBarHeight ?? 6}
                      onChange={e => setLocalSettings(p => ({ ...p, splashProgressBarHeight: Number(e.target.value) }))}
                      className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Progress Bar Width (percentage)</label>
                    <input
                      type="text"
                      value={localSettings.splashProgressBarWidth ?? '100%'}
                      onChange={e => setLocalSettings(p => ({ ...p, splashProgressBarWidth: e.target.value }))}
                      className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      placeholder="e.g. 100% or 80%"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Corner Roundness (Border Radius)</label>
                    <input
                      type="number"
                      value={localSettings.splashProgressBarRadius ?? 9999}
                      onChange={e => setLocalSettings(p => ({ ...p, splashProgressBarRadius: Number(e.target.value) }))}
                      className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Progress Bar Style Preset</label>
                    <select
                      value={localSettings.splashProgressBarStyle || 'solid'}
                      onChange={e => setLocalSettings(p => ({ ...p, splashProgressBarStyle: e.target.value }))}
                      className="w-full bg-[#111116] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-gold-500 outline-none"
                    >
                      <option value="solid">Flat Solid Matte</option>
                      <option value="gradient">Prismatic Linear Gradient</option>
                      <option value="glow">Nebula Shadow Glow</option>
                      <option value="cyber">Cyberpunk High-Contrast Border</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* LOADING SETTINGS PANEL */}
            {activeSubTab === 'loading' && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold-400" />
                  Loading Screen Sync Mechanics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0a0a0f] border border-white/5 p-4 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Minimum Duration (seconds)</label>
                    <select
                      value={(localSettings.splashLoadingDuration || 2500) / 1000}
                      onChange={e => setLocalSettings(p => ({ ...p, splashLoadingDuration: Number(e.target.value) * 1000 }))}
                      className="w-full bg-[#111116] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-gold-500 outline-none"
                    >
                      <option value={1}>1 Second</option>
                      <option value={2}>2 Seconds</option>
                      <option value={3}>3 Seconds</option>
                      <option value={5}>5 Seconds</option>
                      <option value={10}>10 Seconds</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Interactive Auto Redirect delay (ms)</label>
                    <input
                      type="number"
                      value={localSettings.splashAutoRedirectTime ?? 800}
                      onChange={e => setLocalSettings(p => ({ ...p, splashAutoRedirectTime: Number(e.target.value) }))}
                      className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-2 md:col-span-2">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">Show Percentage Display</h4>
                      <p className="text-[10px] text-neutral-400">Display current percentage loading state (e.g. 100%).</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.splashShowPercentage ?? true}
                        onChange={e => setLocalSettings(p => ({ ...p, splashShowPercentage: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-2 md:col-span-2">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">Show Interactive Status Label</h4>
                      <p className="text-[10px] text-neutral-400">Render current system state descriptions below progress bar.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.splashShowLoadingText ?? true}
                        onChange={e => setLocalSettings(p => ({ ...p, splashShowLoadingText: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between md:col-span-2">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wide">Allow User to Skip Loading Screen</h4>
                      <p className="text-[10px] text-neutral-400">Renders a "Skip" button for instant entry to application lobby.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.splashAllowSkip ?? false}
                        onChange={e => setLocalSettings(p => ({ ...p, splashAllowSkip: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ANIMATIONS PANEL */}
            {activeSubTab === 'animations' && (
              <div className="space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-400" />
                  Graphic Entry & Cyclic Animations
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0a0a0f] border border-white/5 p-4 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Mascot Logo Animation loop</label>
                    <select
                      value={localSettings.splashLogoAnimation || 'pulse'}
                      onChange={e => setLocalSettings(p => ({ ...p, splashLogoAnimation: e.target.value }))}
                      className="w-full bg-[#111116] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-gold-500 outline-none"
                    >
                      <option value="none">None (Static Solid)</option>
                      <option value="fade">Atmospheric Fade Pulse</option>
                      <option value="zoom">Rhythmic Zoom Breathe</option>
                      <option value="pulse">Pulse Scaling Vibrance</option>
                      <option value="rotate">Centrifugal Loop Rotation</option>
                      <option value="bounce">Bounce Gravity Jump</option>
                      <option value="glow">Orbital Neon Glow shadow</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Headline Typography Animation</label>
                    <select
                      value={localSettings.splashTextAnimation || 'fade-in'}
                      onChange={e => setLocalSettings(p => ({ ...p, splashTextAnimation: e.target.value }))}
                      className="w-full bg-[#111116] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white focus:border-gold-500 outline-none"
                    >
                      <option value="fade-in">Classic Soft Fade In</option>
                      <option value="slide-up">Slide-Up Kinetic Velocity</option>
                      <option value="slide-down">Slide-Down Gravity Fall</option>
                      <option value="zoom">Magnified Kinetic Bounce</option>
                      <option value="typing">Authentic Retro Typewriter Effect</option>
                    </select>
                    {localSettings.splashTextAnimation === 'typing' && (
                      <button
                        onClick={() => setTypingTrigger(prev => prev + 1)}
                        className="text-[9px] text-gold-400 hover:text-gold-300 font-bold uppercase mt-1 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Re-trigger Typing Effect Preview
                      </button>
                    )}
                  </div>

                  <div className="md:col-span-2 bg-[#111116] p-3 rounded-xl border border-white/5 text-[10px] text-neutral-400">
                    <p className="font-semibold text-white uppercase mb-1">💡 Professional Tip</p>
                    Ensure your Logo Animation style matches your Background settings. For example, pairing "Centrifugal Loop Rotation" with "Nebula Shadow Glow" yields an extremely premium cybernetic visual.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME INTERACTIVE PREVIEW (5 COLS) */}
        <div className="lg:col-span-5 bg-[#111116] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          <div className="bg-[#0a0a0f] border-b border-white/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-white uppercase tracking-wider">Live Sandbox Simulator</span>
            </div>
            <span className="text-[9px] font-mono text-neutral-500 uppercase">Interactive Preview</span>
          </div>

          <div className="flex-1 p-6 bg-neutral-950 flex items-center justify-center relative overflow-hidden min-h-[500px]">
            {/* Embedded Live Preview Simulator Window */}
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden px-4 select-none"
              style={{
                backgroundColor: localSettings.splashBgColor || '#07070a',
                backgroundImage: localSettings.splashBgImage ? `url(${localSettings.splashBgImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: `blur(${localSettings.splashBgBlur ?? 0}px)`
              }}
            >
              {/* Fallback CSS Gradient/Grid overlay */}
              {!localSettings.splashBgImage && (
                <div 
                  className="absolute inset-0 opacity-20" 
                  style={{
                    backgroundImage: localSettings.splashBgGradient || 'none'
                  }}
                />
              )}

              {/* Overlay shadow mask */}
              <div 
                className="absolute inset-0"
                style={{
                  backgroundColor: localSettings.splashBgOverlayColor || 'rgba(0,0,0,0.4)',
                  opacity: localSettings.splashBgOverlayOpacity ?? 0.4
                }}
              />

              {/* Active contents */}
              <div className="relative flex flex-col items-center w-full max-w-xs text-center z-10 scale-95 transition-all">
                
                {/* Logo with Dynamic Rotation and Animations */}
                <motion.div 
                  className="relative w-28 h-28 mb-5 flex items-center justify-center"
                  {...getLogoAnimationProps()}
                >
                  <div className="absolute inset-0 border border-dashed border-gold-500/30 rounded-full animate-spin [animation-duration:12s]" />
                  <div className="absolute inset-2 border border-dotted border-purple-500/50 rounded-full animate-spin [animation-duration:6s] [animation-direction:reverse]" />
                  
                  <div 
                    className="w-18 h-18 rounded-2xl bg-[#111116] flex items-center justify-center border border-white/10 relative overflow-hidden"
                    style={{
                      borderColor: `${localSettings.splashMainTitleColor || '#e5a919'}40`,
                      boxShadow: `0 0 20px ${(localSettings.splashGlowColor || '#e5a919')}25`
                    }}
                  >
                    {(() => {
                      const logoType = localSettings.splashLogoType || (localSettings.loadingCenterLogo || localSettings.splashFallbackLogo || localSettings.splashLogo ? 'custom' : 'titan');
                      if (logoType === 'titan') {
                        return <TitanEsportsLogo className="w-14 h-14 max-w-full max-h-full object-contain" />;
                      } else if (logoType === 'icon') {
                        const IconComp = (LucideIcons as any)[localSettings.splashCenterIcon || 'Trophy'] || Trophy;
                        return <IconComp className="w-7 h-7 text-gold-400 animate-pulse" />;
                      } else {
                        const customUrl = localSettings.loadingCenterLogo || localSettings.splashLogo || localSettings.splashFallbackLogo;
                        if (customUrl) {
                          return <img src={customUrl} alt="Center Logo" className="max-w-full max-h-full object-contain" />;
                        }
                        return <TitanEsportsLogo className="w-14 h-14 max-w-full max-h-full object-contain" />;
                      }
                    })()}
                  </div>
                </motion.div>

                {/* Animated Texts */}
                <motion.div 
                  className="space-y-1 mb-6"
                  {...getTextAnimationProps()}
                  key={`${localSettings.splashTextAnimation}_${typingTrigger}`}
                >
                  <div className="flex flex-wrap items-center justify-center gap-1 font-black text-2xl tracking-widest uppercase">
                    <span style={{ color: localSettings.splashMainTitleColor || '#e5a919' }}>
                      {localSettings.splashMainTitle || 'VICTORY'}
                    </span>
                    <span style={{ color: localSettings.splashSecondaryTitleColor || '#ffffff' }}>
                      {localSettings.splashSecondaryTitle || 'ARENA'}
                    </span>
                  </div>
                  
                  <p 
                    className="text-[9px] tracking-[0.25em] font-extrabold uppercase"
                    style={{ color: localSettings.splashSubtitleColor || '#a855f7' }}
                  >
                    {localSettings.splashSubtitle || 'PREPARE FOR BATTLE'}
                  </p>
                </motion.div>

                {/* Badges and highlights */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6 w-full text-[9px]">
                  {(localSettings.splashBadges || [])
                    .filter(b => b.enabled)
                    .sort((a, b) => a.order - b.order)
                    .map(badge => (
                      <div 
                        key={badge.id} 
                        className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-md border font-semibold shadow-md transition-all text-neutral-300"
                        style={{
                          backgroundColor: badge.bgColor,
                          borderColor: badge.borderColor
                        }}
                      >
                        {renderBadgeIcon(badge.icon, badge.iconColor)}
                        <span>{badge.text}</span>
                      </div>
                    ))}
                </div>

                {/* Progress bar and loading text indicator */}
                {localSettings.splashShowProgressBar !== false && (
                  <div 
                    className="bg-neutral-900/80 rounded-full border border-white/5 relative overflow-hidden mb-2"
                    style={{ 
                      height: `${localSettings.splashProgressBarHeight ?? 6}px`,
                      width: localSettings.splashProgressBarWidth || '100%',
                      backgroundColor: localSettings.splashProgressBarBgColor || '#171717',
                      borderRadius: `${localSettings.splashProgressBarRadius ?? 9999}px`
                    }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-150 ease-out"
                      style={{ 
                        width: `${previewProgress}%`,
                        backgroundColor: localSettings.splashProgressBarColor || '#e5a919',
                        boxShadow: localSettings.splashProgressBarStyle === 'glow' ? `0 0 10px ${localSettings.splashProgressBarColor || '#e5a919'}` : 'none'
                      }}
                    />
                  </div>
                )}

                {/* Logo 3 - Bottom Position */}
                {localSettings.loadingLogo && (
                  <div className="mt-2 mb-6 h-12 flex items-center justify-center">
                    <img src={localSettings.loadingLogo} alt="Loading Logo 3" className="h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                  </div>
                )}
                
                {/* Loading Text and Percentage Indicator */}
                <div className="flex items-center justify-between w-full text-[8px] font-mono tracking-widest text-neutral-500 uppercase">
                  {localSettings.splashShowLoadingText !== false && (
                    <div className="flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: localSettings.splashProgressBarColor || '#e5a919' }} />
                      <span style={{ color: localSettings.splashLoadingTextColor || '#a3a3a3' }}>{typedLoadingText}</span>
                    </div>
                  )}

                  {localSettings.splashShowPercentage !== false && (
                    <span className="font-bold" style={{ color: localSettings.splashProgressBarColor || '#e5a919' }}>
                      {previewProgress}%
                    </span>
                  )}
                </div>

                {/* Footer Text */}
                {localSettings.splashFooterText && (
                  <p className="text-[7px] tracking-[0.3em] text-neutral-600 font-extrabold uppercase mt-6">
                    {localSettings.splashFooterText}
                  </p>
                )}

                {/* Skip option */}
                {localSettings.splashAllowSkip && (
                  <button className="mt-4 px-3 py-1 border border-white/10 hover:border-white/20 bg-black/40 hover:bg-black/60 rounded-full text-[8px] font-extrabold uppercase tracking-widest text-neutral-400 hover:text-white transition-all cursor-pointer">
                    Skip Loading
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL SCREEN MODAL SYSTEM PREVIEW */}
      <AnimatePresence>
        {showFullPreview && (
          <div className="fixed inset-0 bg-[#07070a] z-[10000] flex flex-col">
            
            {/* Header controls for Full Screen Preview */}
            <div className="bg-black/60 border-b border-white/5 p-4 flex items-center justify-between z-50">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-gold-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">Loading Page Sandbox Full Screen Monitor</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave(true)}
                  className="px-3.5 py-1.5 bg-gold-500 hover:bg-gold-600 text-neutral-950 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  Publish Live
                </button>
                <button
                  onClick={() => setShowFullPreview(false)}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Exit Simulator
                </button>
              </div>
            </div>

            {/* Simulated Live Splash Page */}
            <div 
              className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6"
              style={{
                backgroundColor: localSettings.splashBgColor || '#07070a',
                backgroundImage: localSettings.splashBgImage ? `url(${localSettings.splashBgImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!localSettings.splashBgImage && (
                <div 
                  className="absolute inset-0 opacity-25" 
                  style={{
                    backgroundImage: localSettings.splashBgGradient || 'none'
                  }}
                />
              )}

              <div 
                className="absolute inset-0"
                style={{
                  backgroundColor: localSettings.splashBgOverlayColor || 'rgba(0,0,0,0.4)',
                  opacity: localSettings.splashBgOverlayOpacity ?? 0.4,
                  backdropFilter: `blur(${localSettings.splashBgBlur ?? 0}px)`
                }}
              />

              <div className="relative flex flex-col items-center max-w-sm w-full text-center z-10">
                
                {/* Website Name */}
                {localSettings.splashWebsiteName && (
                  <div className="mb-4 text-xs tracking-[0.3em] font-black uppercase text-white/50">
                    {localSettings.splashWebsiteName}
                  </div>
                )}
                
                {/* Logo 1 - Top Position */}
                {localSettings.loadingMainLogo && (
                  <motion.div className="mb-6 h-16 flex items-center justify-center">
                    <img src={localSettings.loadingMainLogo} alt="Primary Loading Logo" className="h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                  </motion.div>
                )}
                
                {/* Orbital mascot and ring */}
                <motion.div 
                  className="relative w-36 h-36 mb-8 flex items-center justify-center"
                  {...getLogoAnimationProps()}
                >
                  <div className="absolute inset-0 border border-dashed border-gold-500/30 rounded-full animate-spin [animation-duration:12s]" />
                  <div className="absolute inset-2 border border-dotted border-purple-500/50 rounded-full animate-spin [animation-duration:6s] [animation-direction:reverse]" />
                  
                  <div 
                    className="w-24 h-24 rounded-2xl bg-[#111116] flex items-center justify-center border border-white/10 relative overflow-hidden"
                    style={{
                      borderColor: `${localSettings.splashMainTitleColor || '#e5a919'}40`,
                      boxShadow: `0 0 30px ${(localSettings.splashGlowColor || '#e5a919')}35`
                    }}
                  >
                    {(() => {
                      const logoType = localSettings.splashLogoType || (localSettings.loadingCenterLogo || localSettings.splashFallbackLogo || localSettings.splashLogo ? 'custom' : 'titan');
                      if (logoType === 'titan') {
                        return <TitanEsportsLogo className="w-20 h-20 max-w-full max-h-full object-contain animate-pulse" />;
                      } else if (logoType === 'icon') {
                        const IconComp = (LucideIcons as any)[localSettings.splashCenterIcon || 'Trophy'] || Trophy;
                        return <IconComp className="w-10 h-10 text-gold-400 animate-pulse" />;
                      } else {
                        const customUrl = localSettings.loadingCenterLogo || localSettings.splashLogo || localSettings.splashFallbackLogo;
                        if (customUrl) {
                          return <img src={customUrl} alt="Center Logo" className="max-w-full max-h-full object-contain" />;
                        }
                        return <TitanEsportsLogo className="w-20 h-20 max-w-full max-h-full object-contain animate-pulse" />;
                      }
                    })()}
                  </div>
                </motion.div>

                {/* Headlines */}
                <motion.div 
                  className="space-y-1 mb-8"
                  {...getTextAnimationProps()}
                  key={`fullscreen_${localSettings.splashTextAnimation}_${typingTrigger}`}
                >
                  <div className="flex flex-wrap items-center justify-center gap-2.5 font-black text-4xl md:text-5xl tracking-widest uppercase">
                    <span style={{ color: localSettings.splashMainTitleColor || '#e5a919' }}>
                      {localSettings.splashMainTitle || 'VICTORY'}
                    </span>
                    <span style={{ color: localSettings.splashSecondaryTitleColor || '#ffffff' }}>
                      {localSettings.splashSecondaryTitle || 'ARENA'}
                    </span>
                  </div>
                  
                  <p 
                    className="text-xs tracking-[0.25em] font-extrabold uppercase pt-1"
                    style={{ color: localSettings.splashSubtitleColor || '#a855f7' }}
                  >
                    {localSettings.splashSubtitle || 'PREPARE FOR BATTLE'}
                  </p>
                </motion.div>

                {/* Highlight badges */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-10 w-full text-xs">
                  {(localSettings.splashBadges || [])
                    .filter(b => b.enabled)
                    .sort((a, b) => a.order - b.order)
                    .map(badge => (
                      <div 
                        key={badge.id} 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border font-extrabold shadow-lg transition-all text-neutral-300"
                        style={{
                          backgroundColor: badge.bgColor,
                          borderColor: badge.borderColor
                        }}
                      >
                        {renderBadgeIcon(badge.icon, badge.iconColor)}
                        <span>{badge.text}</span>
                      </div>
                    ))}
                </div>

                {/* Progress bar element */}
                {localSettings.splashShowProgressBar !== false && (
                  <div 
                    className="bg-neutral-900/80 rounded-full border border-white/5 relative overflow-hidden mb-3"
                    style={{ 
                      height: `${localSettings.splashProgressBarHeight ?? 6}px`,
                      width: localSettings.splashProgressBarWidth || '100%',
                      backgroundColor: localSettings.splashProgressBarBgColor || '#171717',
                      borderRadius: `${localSettings.splashProgressBarRadius ?? 9999}px`
                    }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-150 ease-out"
                      style={{ 
                        width: `${previewProgress}%`,
                        backgroundColor: localSettings.splashProgressBarColor || '#e5a919',
                        boxShadow: localSettings.splashProgressBarStyle === 'glow' ? `0 0 10px ${localSettings.splashProgressBarColor || '#e5a919'}` : 'none'
                      }}
                    />
                  </div>
                )}

                {/* Progress texts */}
                <div className="flex items-center justify-between w-full text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
                  {localSettings.splashShowLoadingText !== false && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: localSettings.splashProgressBarColor || '#e5a919' }} />
                      <span style={{ color: localSettings.splashLoadingTextColor || '#a3a3a3' }}>{typedLoadingText}</span>
                    </div>
                  )}

                  {localSettings.splashShowPercentage !== false && (
                    <span className="font-bold" style={{ color: localSettings.splashProgressBarColor || '#e5a919' }}>
                      {previewProgress}%
                    </span>
                  )}
                </div>

                {/* Footer text */}
                {localSettings.splashFooterText && (
                  <p className="text-[9px] tracking-[0.3em] text-neutral-600 font-extrabold uppercase mt-12">
                    {localSettings.splashFooterText}
                  </p>
                )}

                {/* Skip loading */}
                {localSettings.splashAllowSkip && (
                  <button 
                    onClick={() => setShowFullPreview(false)}
                    className="mt-6 px-4 py-1.5 border border-white/10 hover:border-white/20 bg-black/40 hover:bg-black/60 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 hover:text-white transition-all cursor-pointer"
                  >
                    Skip Loading Screen
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default LoadingPageManager;
