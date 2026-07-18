/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Upload, ImageIcon, Check, Loader2, Save, Trash2, RotateCcw } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { LoadingScreenSettings } from '../types';
import { TitanEsportsLogo } from './TitanEsportsLogo';

export const LoadingPageManager: React.FC = () => {
  const { loadingScreenSettings, updateLoadingScreenSettings } = useGame();
  
  const [localSettings, setLocalSettings] = useState<LoadingScreenSettings>(loadingScreenSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLocalSettings(loadingScreenSettings);
  }, [loadingScreenSettings]);

  const handleFieldChange = (field: keyof LoadingScreenSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `loading_screens/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        null,
        (error) => {
          console.error("Upload failed:", error);
          alert("Upload failed: " + error.message);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setLocalSettings(prev => ({
            ...prev,
            loadingLogoUrl: downloadURL,
            uploadedLogoUrl: downloadURL,
            loadingLogoType: 'upload',
            loadingLogoSource: 'upload'
          }));
          setImgError(false);
          setSaveSuccess(null);
        }
      );
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Upload error.");
    }
  };

  const handleUrlChange = (val: string) => {
    setLocalSettings(prev => ({
      ...prev,
      loadingLogoUrl: val,
      directLogoUrl: val,
      loadingLogoType: val ? 'url' : 'default'
    }));
    setImgError(false);
    setSaveSuccess(null);
  };

  const handleRemoveLogo = () => {
    setLocalSettings(prev => ({
      ...prev,
      loadingLogoUrl: '',
      uploadedLogoUrl: '',
      directLogoUrl: '',
      loadingLogoType: 'default',
      loadingLogoSource: 'url'
    }));
    setImgError(false);
    setSaveSuccess(null);
  };

  const handleResetToDefaults = () => {
    const DEFAULT_LOADING_SCREEN: LoadingScreenSettings = {
      loadingLogoUrl: '',
      loadingLogoSource: 'url',
      loadingTitle: 'TITAN ESPORTS',
      loadingSubtitle: 'PREMIUM GAMING',
      loadingText: 'INITIALIZING SYSTEM',
      backgroundColor: '#08080c',
      backgroundImage: '',
      progressBarEnabled: true,
      animationEnabled: true,
      uploadedLogoUrl: '',
      directLogoUrl: '',
      loadingLogoType: 'default'
    };
    setLocalSettings(DEFAULT_LOADING_SCREEN);
    setImgError(false);
    setSaveSuccess(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      await updateLoadingScreenSettings(localSettings);
      setSaveSuccess("Loading Screen Updated Successfully.");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error: any) {
      console.error("Error saving loading settings:", error);
      alert("Failed to save settings: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getPreviewLogoUrl = () => {
    if (localSettings.loadingLogoType === 'default') return '';
    if (localSettings.loadingLogoType === 'upload') {
      return localSettings.uploadedLogoUrl || localSettings.loadingLogoUrl || '';
    }
    if (localSettings.loadingLogoType === 'url') {
      return localSettings.directLogoUrl || localSettings.loadingLogoUrl || '';
    }
    return localSettings.loadingLogoUrl || '';
  };

  const currentImageUrl = getPreviewLogoUrl();

  return (
    <div className="bg-[#0d0d15] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="bg-[#111116] border-b border-white/5 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            🚀 Loading Screen Manager
          </h2>
          <p className="text-[10px] text-neutral-400 mt-1">
            Configure the visual appearance and text of the initial application loading screen.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-gold-500 hover:from-amber-400 hover:to-gold-400 text-neutral-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(229,169,25,0.3)] hover:shadow-[0_0_30px_rgba(229,169,25,0.5)] disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : 'Save & Update'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Settings Panel */}
        <div className="w-full lg:w-1/2 space-y-6">
          
          {/* Logo Section */}
          <div className="bg-[#0a0a0f] border border-white/5 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wide">Loading Logo</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5">Choose an image upload or specify an external URL.</p>
              </div>
              {localSettings.loadingLogoType && localSettings.loadingLogoType !== 'default' && (
                <button
                  onClick={handleRemoveLogo}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/35 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Logo
                </button>
              )}
            </div>

            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={localSettings.loadingLogoSource === 'upload'} 
                  onChange={() => {
                    handleFieldChange('loadingLogoSource', 'upload');
                    setLocalSettings(prev => ({
                      ...prev,
                      loadingLogoType: prev.uploadedLogoUrl ? 'upload' : 'default'
                    }));
                  }}
                  className="accent-gold-500"
                />
                <span className="text-xs text-neutral-300">Upload Image</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={localSettings.loadingLogoSource === 'url'} 
                  onChange={() => {
                    handleFieldChange('loadingLogoSource', 'url');
                    setLocalSettings(prev => ({
                      ...prev,
                      loadingLogoType: prev.directLogoUrl ? 'url' : 'default'
                    }));
                  }}
                  className="accent-gold-500"
                />
                <span className="text-xs text-neutral-300">Image URL</span>
              </label>
            </div>

            {localSettings.loadingLogoSource === 'upload' ? (
              <div className="space-y-2">
                <label className="flex items-center justify-center w-full h-24 bg-[#111116] border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-gold-500/50 transition-colors">
                  <div className="flex flex-col items-center">
                    <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                    <span className="text-xs text-neutral-300">Click to upload Logo</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                {localSettings.uploadedLogoUrl && (
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono break-all bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg">
                    <Check className="w-3 h-3 flex-shrink-0" />
                    Uploaded: {localSettings.uploadedLogoUrl}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={localSettings.directLogoUrl || localSettings.loadingLogoUrl || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-gold-500 outline-none font-mono"
              />
            )}

            <div className="pt-2 border-t border-white/5 flex justify-end">
              <button
                onClick={handleResetToDefaults}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-white/10 hover:border-white/25 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* Text Settings */}
          <div className="bg-[#0a0a0f] border border-white/5 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">Text Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Loading Title</label>
                <input
                  type="text"
                  value={localSettings.loadingTitle}
                  onChange={(e) => handleFieldChange('loadingTitle', e.target.value)}
                  className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Loading Subtitle</label>
                <input
                  type="text"
                  value={localSettings.loadingSubtitle}
                  onChange={(e) => handleFieldChange('loadingSubtitle', e.target.value)}
                  className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Loading Text (e.g. Initializing System)</label>
                <input
                  type="text"
                  value={localSettings.loadingText}
                  onChange={(e) => handleFieldChange('loadingText', e.target.value)}
                  className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Appearance & Toggles */}
          <div className="bg-[#0a0a0f] border border-white/5 p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide">Appearance</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Background Color (Hex, RGB, etc.)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={localSettings.backgroundColor || '#08080c'}
                    onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
                    className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localSettings.backgroundColor}
                    onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
                    className="flex-1 bg-[#111116] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono focus:border-gold-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase tracking-wider mb-1">Background Image URL (Optional)</label>
                <input
                  type="text"
                  value={localSettings.backgroundImage}
                  onChange={(e) => handleFieldChange('backgroundImage', e.target.value)}
                  placeholder="Leave empty for solid color"
                  className="w-full bg-[#111116] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono focus:border-gold-500"
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-neutral-300 font-bold">Enable Progress Bar</span>
                  <div className={`w-10 h-5 rounded-full flex items-center p-1 transition-colors ${localSettings.progressBarEnabled ? 'bg-gold-500' : 'bg-neutral-700'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${localSettings.progressBarEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={localSettings.progressBarEnabled} onChange={(e) => handleFieldChange('progressBarEnabled', e.target.checked)} />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-neutral-300 font-bold">Enable Animation</span>
                  <div className={`w-10 h-5 rounded-full flex items-center p-1 transition-colors ${localSettings.animationEnabled ? 'bg-gold-500' : 'bg-neutral-700'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${localSettings.animationEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={localSettings.animationEnabled} onChange={(e) => handleFieldChange('animationEnabled', e.target.checked)} />
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Live Preview Panel */}
        <div className="w-full lg:w-1/2 bg-[#050508] border border-white/10 rounded-2xl overflow-hidden relative min-h-[400px] flex items-center justify-center" style={{ backgroundColor: localSettings.backgroundColor, backgroundImage: localSettings.backgroundImage ? `url(${localSettings.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest z-10">
            Live Preview
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center p-8 w-full max-w-sm text-center">
            
            {/* Logo */}
            <div className={`w-32 h-32 mb-8 flex items-center justify-center ${localSettings.animationEnabled ? 'animate-pulse' : ''}`}>
              {currentImageUrl && !imgError ? (
                <img 
                  src={currentImageUrl} 
                  alt="Loading Logo" 
                  className="max-w-full max-h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  onError={() => setImgError(true)}
                />
              ) : (
                <TitanEsportsLogo className="w-20 h-20 max-w-full max-h-full object-contain" />
              )}
            </div>

            {/* Texts */}
            <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em] drop-shadow-lg">
              {localSettings.loadingTitle}
            </h1>
            
            {localSettings.loadingSubtitle && (
              <p className="text-gold-400 font-mono text-sm mt-2 font-bold tracking-widest uppercase">
                {localSettings.loadingSubtitle}
              </p>
            )}

            {/* Progress */}
            {localSettings.progressBarEnabled && (
              <div className="w-full mt-10">
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-2 uppercase tracking-wider">
                  <span>{localSettings.loadingText}</span>
                  <span>45%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                  <div className="h-full w-[45%] bg-gradient-to-r from-amber-500 to-gold-500 relative">
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {saveSuccess && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 backdrop-blur-md z-50">
          <Check className="w-4 h-4" />
          {saveSuccess}
        </div>
      )}
    </div>
  );
};

export default LoadingPageManager;
