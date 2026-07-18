/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Upload, ImageIcon, Check, Loader2, Save, Trash2, RotateCcw, X } from 'lucide-react';
import { uploadFileWithFallback } from '../utils/uploadHelper';
import { LoadingScreenSettings } from '../types';
import { TitanEsportsLogo } from './TitanEsportsLogo';

export const LoadingPageManager: React.FC = () => {
  const { loadingScreenSettings, updateLoadingScreenSettings, currentUser } = useGame();
  
  const [localSettings, setLocalSettings] = useState<LoadingScreenSettings>(loadingScreenSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // File Upload State Tracking
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setLocalSettings(loadingScreenSettings);
  }, [loadingScreenSettings]);

  const handleFieldChange = (field: keyof LoadingScreenSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(null);
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

    // Check size limit: 10 MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return 'File Too Large (Maximum size allowed is 10MB)';
    }

    const fileType = file.type?.toLowerCase();
    const fileName = file.name?.toLowerCase();
    const hasValidType = allowedTypes.includes(fileType);
    const hasValidExt = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidType && !hasValidExt) {
      return 'Invalid File Type (Supported formats: JPG, JPEG, PNG, WEBP, SVG)';
    }

    return null;
  };

  const processAndUploadFile = async (file: File) => {
    setUploadStatus('idle');
    setUploadError(null);
    setUploadProgress(0);

    const validationErr = validateFile(file);
    if (validationErr) {
      setUploadStatus('error');
      setUploadError(validationErr);
      return;
    }

    setUploadStatus('uploading');
    try {
      const uploadResult = await uploadFileWithFallback(
        file,
        `loading_screens/${Date.now()}_${file.name}`,
        (progress) => setUploadProgress(progress)
      );

      const downloadURL = uploadResult.url;
      
      // Implement cache busting
      const timestamp = Date.now();
      const cacheBustedUrl = `${downloadURL}${downloadURL.includes('?') ? '&' : '?'}v=${timestamp}`;

      // Create updated settings
      const updatedSettings: LoadingScreenSettings = {
        ...localSettings,
        loadingLogoUrl: cacheBustedUrl,
        loadingImageUrl: cacheBustedUrl,
        uploadedLogoUrl: cacheBustedUrl,
        loadingLogoType: 'upload',
        loadingLogoSource: 'upload',
        updatedAt: timestamp,
        updatedBy: currentUser?.email || 'titangaming4m@gmail.com'
      };

      // Instant DB Update
      await updateLoadingScreenSettings(updatedSettings);

      // Update local states
      setLocalSettings(updatedSettings);
      setImgError(false);
      setUploadStatus('success');
      setSaveSuccess("Upload Successful & Loading Screen Updated!");
      setTimeout(() => {
        setSaveSuccess(null);
        setUploadStatus('idle');
      }, 4000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadStatus('error');
      setUploadError(`Upload/Database Error: ${err.message || err}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAndUploadFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  const handleUrlChange = (val: string) => {
    const timestamp = Date.now();
    const cacheBustedUrl = val ? `${val}${val.includes('?') ? '&' : '?'}v=${timestamp}` : '';
    
    setLocalSettings(prev => ({
      ...prev,
      loadingLogoUrl: cacheBustedUrl,
      loadingImageUrl: cacheBustedUrl,
      directLogoUrl: val,
      loadingLogoType: val ? 'url' : 'default',
      updatedAt: timestamp,
      updatedBy: currentUser?.email || 'titangaming4m@gmail.com'
    }));
    setImgError(false);
    setSaveSuccess(null);
  };

  const handleRemoveLogo = () => {
    const timestamp = Date.now();
    setLocalSettings(prev => ({
      ...prev,
      loadingLogoUrl: '',
      loadingImageUrl: '',
      uploadedLogoUrl: '',
      directLogoUrl: '',
      loadingLogoType: 'default',
      loadingLogoSource: 'url',
      updatedAt: timestamp,
      updatedBy: currentUser?.email || 'titangaming4m@gmail.com'
    }));
    setImgError(false);
    setSaveSuccess(null);
  };

  const handleResetToDefaults = () => {
    const DEFAULT_LOADING_SCREEN: LoadingScreenSettings = {
      loadingLogoUrl: '',
      loadingImageUrl: '',
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
      loadingLogoType: 'default',
      updatedAt: Date.now(),
      updatedBy: currentUser?.email || 'titangaming4m@gmail.com'
    };
    setLocalSettings(DEFAULT_LOADING_SCREEN);
    setImgError(false);
    setSaveSuccess(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      const timestamp = Date.now();
      const settingsToSave = {
        ...localSettings,
        updatedAt: timestamp,
        updatedBy: currentUser?.email || 'titangaming4m@gmail.com'
      };
      
      // Ensure loadingImageUrl mirrors active logo URL
      if (settingsToSave.loadingLogoUrl) {
        settingsToSave.loadingImageUrl = settingsToSave.loadingLogoUrl;
      }
      
      await updateLoadingScreenSettings(settingsToSave);
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
      return localSettings.uploadedLogoUrl || localSettings.loadingImageUrl || localSettings.loadingLogoUrl || '';
    }
    if (localSettings.loadingLogoType === 'url') {
      return localSettings.directLogoUrl || localSettings.loadingImageUrl || localSettings.loadingLogoUrl || '';
    }
    return localSettings.loadingImageUrl || localSettings.loadingLogoUrl || '';
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
              <div className="space-y-3">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center w-full h-32 rounded-xl border border-dashed cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-gold-500 bg-gold-500/5 shadow-[0_0_15px_rgba(229,169,25,0.15)]' 
                      : 'border-white/20 bg-[#111116] hover:border-gold-500/40 hover:bg-white/5'
                  }`}
                >
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <Upload className={`w-7 h-7 mb-2 transition-transform ${isDragging ? 'scale-110 text-gold-400' : 'text-neutral-400'}`} />
                    <span className="text-xs text-neutral-300 font-bold">
                      {isDragging ? 'Drop to Upload' : 'Click or Drag & Drop to Upload'}
                    </span>
                    <span className="text-[10px] text-neutral-500 mt-1">
                      JPG, JPEG, PNG, WEBP, SVG (Max 10MB)
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {/* Upload Status Messages */}
                {uploadStatus === 'uploading' && (
                  <div className="bg-[#111116] border border-white/5 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-amber-400 font-bold flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading...
                      </span>
                      <span className="text-neutral-400 font-mono text-[11px]">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gold-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
                    <Check className="w-4 h-4 flex-shrink-0 bg-emerald-500/20 p-0.5 rounded-full" />
                    <span>Upload Successful! Image saved to database.</span>
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-start gap-2 text-xs font-semibold animate-fade-in">
                    <X className="w-4 h-4 flex-shrink-0 bg-red-500/20 p-0.5 rounded-full mt-0.5" />
                    <div className="flex-1">
                      <span className="block font-bold">Upload Failed</span>
                      <span className="text-[11px] text-red-400/80 mt-0.5 block">{uploadError}</span>
                    </div>
                  </div>
                )}

                {localSettings.uploadedLogoUrl && (
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-mono break-all bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Active URL: {localSettings.uploadedLogoUrl}</span>
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
