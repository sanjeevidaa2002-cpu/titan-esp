/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { Trophy } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { TitanEsportsLogo } from './TitanEsportsLogo';

interface SplashScreenProps {
  onFinished: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);
  const { brandingSettings } = useGame();
  const [cacheBuster] = useState(() => Date.now().toString());

  const getCacheBustedUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    
    // Split to remove any existing v= from the stored database URL
    const baseUrl = url.split('?v=')[0].split('&v=')[0];
    
    // Use updatedAt if present, otherwise cacheBuster
    const version = brandingSettings?.updatedAt || cacheBuster;
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}v=${version}`;
  };

  // Helper values with defaults - prioritize explicit center and loading specific keys
  const logo1 = brandingSettings?.loadingMainLogo;
  const logo2 = brandingSettings?.loadingCenterLogo || brandingSettings?.loadingCenterLogoUrl || brandingSettings?.splashLogo || brandingSettings?.splashFallbackLogo;
  const logo3 = brandingSettings?.loadingLogo;
  const displayLogoUrl = logo2;
  const bgImageUrl = brandingSettings?.loadingBackgroundImage || brandingSettings?.loadingBgImage || brandingSettings?.splashBgImage;

  // Derive mainTitle and secondaryTitle from loadingTitle if present
  const mainTitle = brandingSettings?.splashMainTitle || brandingSettings?.loadingTitle || 'VICTORY';
  const secondaryTitle = brandingSettings?.splashSecondaryTitle || 'ARENA';
  // titleWords logic removed
  // mainTitle declared above
  // secondaryTitle declared above

  const subtitle = brandingSettings?.loadingSubtitle || brandingSettings?.splashSubtitle || 'PREPARE FOR BATTLE';
  const loadingText = brandingSettings?.loadingLoadingText || brandingSettings?.loadingText || brandingSettings?.splashLoadingText || 'INITIALIZING SECURE CONNECTION...';
  const loadingTextColor = brandingSettings?.splashLoadingTextColor || '#a3a3a3';
  const minLoadingTime = brandingSettings?.splashMinLoadingTime ?? 1000;
  const maxLoadingTime = brandingSettings?.splashMaxLoadingTime ?? 5000;
  const loadingDuration = brandingSettings?.loadingDuration || brandingSettings?.splashLoadingDuration || 2500;
  const redirectDelay = brandingSettings?.splashAutoRedirectTime ?? 800;

  // Track progress bar updates
  useEffect(() => {
    // Generate a speed that matches the loadingDuration
    const intervalTime = Math.max(20, loadingDuration / 100);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onFinished();
          }, redirectDelay);
          return 100;
        }
        // Small random steps
        const step = Math.floor(Math.random() * 8) + 2;
        return Math.min(prev + step, 100);
      });
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [onFinished, loadingDuration, redirectDelay]);

  // Typing animation for loading text if configured
  const [typedText, setTypedText] = useState("");
  useEffect(() => {
    if (brandingSettings?.splashTextAnimation === 'typing') {
      let index = 0;
      setTypedText("");
      const interval = setInterval(() => {
        setTypedText((prev) => prev + loadingText.charAt(index));
        index++;
        if (index >= loadingText.length) {
          clearInterval(interval);
        }
      }, 40);
      return () => clearInterval(interval);
    } else {
      setTypedText(loadingText);
    }
  }, [loadingText, brandingSettings?.splashTextAnimation]);

  // Render dynamic lucide icon
  const renderBadgeIcon = (iconName: string, color: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || Trophy;
    return <IconComponent className="w-3.5 h-3.5" style={{ color }} />;
  };

  // Maps Logo Animation string to motion properties
  const getLogoAnimationProps = () => {
    const anim = (brandingSettings?.loadingAnimation || brandingSettings?.splashLogoAnimation || 'pulse').toLowerCase();
    switch (anim) {
      case 'none':
        return {};
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
          animate: { boxShadow: [`0 0 10px ${brandingSettings?.splashGlowColor || '#e5a919'}80`, `0 0 30px ${brandingSettings?.splashGlowColor || '#e5a919'}ff`, `0 0 10px ${brandingSettings?.splashGlowColor || '#e5a919'}80`] },
          transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
        };
      default:
        return {
          animate: { scale: [0.95, 1.05, 0.95] },
          transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
        };
    }
  };

  // Maps Text Animation to motion properties
  const getTextAnimationProps = () => {
    const anim = brandingSettings?.splashTextAnimation || 'fade-in';
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
    <div 
      id="splash_screen_root" 
      className="fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden px-6"
      style={{ 
        backgroundColor: brandingSettings?.loadingBackgroundColor || brandingSettings?.splashBgColor || '#07070a',
        backgroundImage: bgImageUrl ? `url(${getCacheBustedUrl(bgImageUrl)})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Background radial soft light or custom linear gradient */}
      {!bgImageUrl && (
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: brandingSettings?.splashBgGradient || 'linear-gradient(to bottom, #07070a, #0d0d14)'
          }}
        />
      )}
      
      {/* Overlay Color Mask & Opacity & Background Blur */}
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
          backgroundColor: brandingSettings?.splashBgOverlayColor || 'rgba(0, 0, 0, 0.4)',
          opacity: brandingSettings?.splashBgOverlayOpacity ?? 0.4,
          backdropFilter: brandingSettings?.splashBgBlur ? `blur(${brandingSettings.splashBgBlur}px)` : 'none'
        }}
      />

      <div className="relative flex flex-col items-center max-w-sm w-full text-center z-10">
        
        {/* Website Name */}
        {brandingSettings?.splashWebsiteName && (
          <div className="mb-4 text-xs tracking-[0.3em] font-black uppercase text-white/50">
            {brandingSettings.splashWebsiteName}
          </div>
        )}
        
        {/* Logo 1 - Top Position */}
        {logo1 && (
          <motion.div className="mb-6 h-16 flex items-center justify-center">
            <img src={getCacheBustedUrl(logo1)} alt="Loading Logo 1" className="h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          </motion.div>
        )}
        
        {/* Animated Orbits & Victory Logo Container */}
        <motion.div 
          className="relative w-36 h-36 mb-8 flex items-center justify-center"
          {...getLogoAnimationProps()}
        >
          {/* External golden rotating orbit */}
          <div className="absolute inset-0 border border-dashed border-gold-500/30 rounded-full animate-spin [animation-duration:12s]" />
          
          {/* Inner purple orbit */}
          <div className="absolute inset-2 border border-dotted border-purple-500/50 rounded-full animate-spin [animation-duration:6s] [animation-direction:reverse]" />
          
          {/* Logo Main Emblem */}
          <div 
            className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#13131a] via-[#1f1f2e] to-[#252538] flex items-center justify-center border relative overflow-hidden group"
            style={{
              borderColor: `${brandingSettings?.splashMainTitleColor || '#e5a919'}40`,
              boxShadow: `0 0 30px ${brandingSettings?.splashGlowColor || '#e5a919'}30`
            }}
          >
            {/* Glossy shine */}
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-[shimmer_2.5s_infinite]" />
            
            {/* Victory Mascot Logo representation */}
            <div className="relative flex flex-col items-center justify-center w-full h-full p-2">
              {(() => {
                const logoType = brandingSettings?.splashLogoType || (displayLogoUrl ? 'custom' : 'titan');
                if (logoType === 'titan') {
                  return <TitanEsportsLogo className="w-20 h-20 max-w-full max-h-full object-contain animate-pulse" />;
                } else if (logoType === 'icon') {
                  const IconComp = (LucideIcons as any)[brandingSettings?.splashCenterIcon || 'Trophy'] || Trophy;
                  return <IconComp className="w-10 h-10 text-gold-400 animate-pulse" />;
                } else {
                  if (displayLogoUrl) {
                    return (
                      <img 
                        src={getCacheBustedUrl(displayLogoUrl)} 
                        alt="Splash Logo" 
                        className="max-w-full max-h-full object-contain"
                      />
                    );
                  }
                  return <TitanEsportsLogo className="w-20 h-20 max-w-full max-h-full object-contain animate-pulse" />;
                }
              })()}
            </div>
          </div>
        </motion.div>

        {/* Text Logo Titles */}
        <motion.div 
          className="mb-6"
          {...getTextAnimationProps()}
          key={brandingSettings?.splashTextAnimation}
        >
          <div className="flex flex-wrap items-center justify-center gap-2 font-extrabold tracking-widest text-3xl md:text-4xl drop-shadow-[0_2px_10px_rgba(229,169,25,0.2)] mb-1.5 uppercase font-sans">
            <span style={{ color: brandingSettings?.splashMainTitleColor || '#e5a919' }}>
              {mainTitle}
            </span>
            <span style={{ color: brandingSettings?.splashSecondaryTitleColor || '#ffffff' }}>
              {secondaryTitle}
            </span>
          </div>
          
          <p 
            className="text-xs tracking-[0.25em] font-semibold uppercase mt-1"
            style={{ color: brandingSettings?.splashSubtitleColor || '#a855f7' }}
          >
            {subtitle}
          </p>
        </motion.div>

        {/* Quick bullet highlights / dynamic badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8 w-full text-xs">
          {brandingSettings?.splashBadges && brandingSettings.splashBadges.length > 0 ? (
            brandingSettings.splashBadges
              .filter(badge => badge.enabled)
              .sort((a, b) => a.order - b.order)
              .map(badge => (
                <div 
                  key={badge.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-neutral-300 shadow-md transition-all font-semibold"
                  style={{
                    backgroundColor: badge.bgColor,
                    borderColor: badge.borderColor
                  }}
                >
                  {renderBadgeIcon(badge.icon, badge.iconColor)}
                  <span>{badge.text}</span>
                </div>
              ))
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-neutral-300 shadow-lg">
                {renderBadgeIcon('Trophy', '#e5a919')}
                <span>Tournaments</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-neutral-300 shadow-lg">
                {renderBadgeIcon('Zap', '#fbbf24')}
                <span>Instant Pay</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-neutral-300 shadow-lg">
                {renderBadgeIcon('ShieldAlert', '#4ade80')}
                <span>Authentic</span>
              </div>
            </>
          )}
        </div>

        {/* Logo 3 - Bottom Position */}
        {logo3 && (
          <div className="mt-2 mb-6 h-12 flex items-center justify-center">
            <img src={getCacheBustedUrl(logo3)} alt="Loading Logo 3" className="h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
          </div>
        )}
        
        {/* Loading progress bar */}
        {brandingSettings?.splashShowProgressBar !== false && (
          <div 
            className="w-full relative overflow-hidden mb-3 border border-white/5"
            style={{
              height: `${brandingSettings?.splashProgressBarHeight ?? 6}px`,
              width: brandingSettings?.splashProgressBarWidth || '100%',
              backgroundColor: brandingSettings?.splashProgressBarBgColor || '#171717',
              borderRadius: `${brandingSettings?.splashProgressBarRadius ?? 9999}px`
            }}
          >
            <div 
              className="h-full rounded-full transition-all duration-150 ease-out"
              style={{ 
                width: `${progress}%`,
                backgroundColor: brandingSettings?.splashProgressBarColor || '#e5a919',
                boxShadow: brandingSettings?.splashProgressBarStyle === 'glow' ? `0 0 10px ${brandingSettings?.splashProgressBarColor || '#e5a919'}` : 'none'
              }}
            />
          </div>
        )}

        {/* Loading text feedback */}
        <div className="flex items-center justify-between w-full text-[10px] font-mono tracking-widest uppercase">
          {brandingSettings?.splashShowLoadingText !== false && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: brandingSettings?.splashProgressBarColor || '#e5a919' }} />
              <span style={{ color: loadingTextColor }}>{typedText}</span>
            </div>
          )}
          
          {brandingSettings?.splashShowPercentage !== false && (
            <span className="font-bold animate-pulse" style={{ color: brandingSettings?.splashProgressBarColor || '#e5a919' }}>
              {brandingSettings?.loadingProgressText || `${Math.min(progress, 100)}%`}
            </span>
          )}
        </div>

        {/* Custom Optional Footer Text */}
        {brandingSettings?.splashFooterText && (
          <p className="text-[8px] tracking-[0.3em] text-neutral-600 font-bold uppercase mt-8">
            {brandingSettings.splashFooterText}
          </p>
        )}

        {/* Optional Skip Option */}
        {brandingSettings?.splashAllowSkip && (
          <button 
            onClick={onFinished}
            className="mt-6 px-4 py-1.5 border border-white/10 hover:border-white/20 bg-black/40 hover:bg-black/60 rounded-full text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            Skip Loading Screen
          </button>
        )}
      </div>
    </div>
  );
};
