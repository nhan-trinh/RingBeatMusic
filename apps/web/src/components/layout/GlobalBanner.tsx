import { useEffect, useState } from 'react';
import { useSystemStore } from '../../stores/system.store';
import { AlertTriangle, X } from 'lucide-react';

export const GlobalBanner = () => {
  const { settings, fetchSettings } = useSystemStore();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings?.global_banner_enabled && settings.global_banner_text) {
      const savedDismissedText = localStorage.getItem('dismissedBannerText');
      if (savedDismissedText !== settings.global_banner_text) {
        setIsDismissed(false);
      } else {
        setIsDismissed(true);
      }
    }
  }, [settings?.global_banner_enabled, settings?.global_banner_text]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (settings?.global_banner_text) {
      localStorage.setItem('dismissedBannerText', settings.global_banner_text);
    }
  };

  if (!settings?.global_banner_enabled || !settings.global_banner_text || isDismissed) {
    return null;
  }

  return (
    <div className="relative isolate overflow-hidden bg-[#1db954] px-6 py-3 sm:px-3.5 sm:before:flex-1 animate-in slide-in-from-top duration-500 z-50 shadow-[0_0_30px_rgba(29,185,84,0.3)]">
      {/* Industrial Striping Background */}
      <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] pointer-events-none" />
      
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none mix-blend-overlay" />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 relative z-10 w-full max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-4 flex-1">
          {/* High Contrast Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-black text-[#1db954] shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
            <AlertTriangle size={14} className="animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] pt-0.5">SYS_ALERT</span>
          </div>

          {/* Main Text */}
          <p className="text-[15px] font-black text-black uppercase tracking-wide flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
            </span>
            <span className="drop-shadow-sm">{settings.global_banner_text}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={handleDismiss}
            className="p-1.5 focus-visible:outline-none bg-black/10 hover:bg-black text-black hover:text-[#1db954] rounded transition-all duration-300 border border-black/20 hover:border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 group flex items-center justify-center"
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-5 w-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
