import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Volume2,
  VolumeX,
  Users,
  History,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { THEMES } from '../constants/themes';

/**
 * Top Navigation Bar with enlarged action icons (History, Theme picker, Sound toggle, and Bot return).
 */
export default function TopNav({
  theme,
  onSelectTheme,
  isMuted,
  onToggleMute,
  onOpenLobby,
  onOpenHistory,
  isInGame = false,
  botName = 'Bot'
}) {
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeRef = useRef(null);

  // Close desktop dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setIsThemeOpen(false);
      }
    }
    if (isThemeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isThemeOpen]);

  return (
    <header className="border-b border-[#363431] bg-[#1f1e1b]/95 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between">
        
        {/* Left: Branding & Lobby Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#262522] border border-[#3d3b37] flex items-center justify-center text-xl shadow-xs">
            ♟
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                Chess Studio
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30">
                Offline
              </span>
            </div>
          </div>

          {/* If inside an active game, show 'Change Opponent' button */}
          {isInGame && (
            <button
              onClick={onOpenLobby}
              className="ml-2 sm:ml-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#262522] hover:bg-[#31302c] text-[#e1dfda] hover:text-white border border-[#363431] transition-all cursor-pointer shadow-xs"
              title="Return to Bot Lobby"
            >
              <Users className="w-4 h-4 text-[#81b64c]" />
              <span className="hidden xs:inline">Bots</span>
            </button>
          )}
        </div>

        {/* Right: Enlarged Actions Toolbar (History, Theme, Mute) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Match History Modal Trigger */}
          <button
            onClick={onOpenHistory}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#262522] hover:bg-[#31302c] text-zinc-200 hover:text-white border border-[#363431] flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="View Completed Match History"
          >
            <History className="w-5 h-5 text-[#81b64c]" />
          </button>

          {/* Theme Switcher Button */}
          <div ref={themeRef} className="relative">
            <button
              onClick={() => setIsThemeOpen((prev) => !prev)}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                isThemeOpen
                  ? 'bg-[#31302c] border-[#81b64c] text-white'
                  : 'bg-[#262522] hover:bg-[#31302c] text-zinc-200 hover:text-white border-[#363431]'
              }`}
              title="Select Board Theme"
            >
              <Palette className="w-5 h-5 text-[#81b64c]" />
            </button>

            {/* Desktop Dropdown Popover */}
            {isThemeOpen && (
              <div className="hidden sm:block absolute right-0 top-full mt-2 w-56 bg-[#262522] border border-[#3d3b37] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold text-[#8b8985] uppercase tracking-wider px-2 py-1 mb-1 flex items-center justify-between">
                  <span>Board Themes</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#81b64c]" />
                </div>
                <div className="space-y-1">
                  {Object.values(THEMES).map((th) => {
                    const isSelected = theme === th.id;
                    return (
                      <button
                        key={th.id}
                        onClick={() => {
                          onSelectTheme(th.id);
                          setIsThemeOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-[#31302c] text-white ring-1 ring-[#81b64c]'
                            : 'text-[#8b8985] hover:text-[#e1dfda] hover:bg-[#2a2926]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded overflow-hidden flex border border-[#484642] shrink-0">
                            <div className="w-1/2 h-full" style={{ backgroundColor: th.preview[0] }} />
                            <div className="w-1/2 h-full" style={{ backgroundColor: th.preview[1] }} />
                          </div>
                          <span>{th.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#81b64c]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#262522] hover:bg-[#31302c] text-[#8b8985] hover:text-white border border-[#363431] flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-[#81b64c]" />}
          </button>
        </div>

      </div>

      {/* Mobile Slide-Up Drawer / Bottom Sheet */}
      {isThemeOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsThemeOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-Up Container */}
          <div className="relative w-full bg-[#262522] border-t border-[#3d3b37] rounded-t-2xl p-5 shadow-2xl z-50 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#363431] pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#81b64c]" />
                <span className="font-extrabold text-sm text-white">Choose Board Theme</span>
              </div>
              <button
                onClick={() => setIsThemeOpen(false)}
                className="p-1 rounded-lg text-[#8b8985] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.values(THEMES).map((th) => {
                const isSelected = theme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      onSelectTheme(th.id);
                      setIsThemeOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#31302c] border-[#81b64c] ring-1 ring-[#81b64c] text-white'
                        : 'bg-[#1f1e1b] border-[#363431] text-[#8b8985]'
                    }`}
                  >
                    <div className="w-5 h-5 rounded overflow-hidden flex border border-[#484642] shrink-0">
                      <div className="w-1/2 h-full" style={{ backgroundColor: th.preview[0] }} />
                      <div className="w-1/2 h-full" style={{ backgroundColor: th.preview[1] }} />
                    </div>
                    <span className="text-xs font-bold truncate">{th.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
