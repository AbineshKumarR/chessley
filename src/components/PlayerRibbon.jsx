import React from 'react';
import CapturedPieces from './CapturedPieces';
import ChessClock from './ChessClock';
import { BOTS, DEFAULT_BOT_ID, DEFAULT_PLAYER_AVATAR } from '../constants/bots';

export default function PlayerRibbon({
  isBot = false,
  botId = DEFAULT_BOT_ID,
  captured = [],
  color = 'w',
  advantage = 0,
  timeMs = 0,
  isActive = false,
  hasClock = true,
  isThinking = false
}) {
  const currentBot = BOTS[botId] || BOTS[DEFAULT_BOT_ID];
  const username = isBot ? currentBot.name : 'You';
  const rating = isBot ? currentBot.rating : 1500;
  const avatarUrl = isBot ? currentBot.avatar : DEFAULT_PLAYER_AVATAR;

  return (
    <div className="w-full max-w-[560px] flex items-center justify-between px-3 py-2 bg-[#262522] border-x border-[#363431] select-none">
      {/* Left: Avatar & Player Info */}
      <div className="flex items-center gap-2.5">
        {/* Avatar Badge with DiceBear Avataaars Image */}
        <div className="w-9 h-9 rounded-full ring-2 ring-zinc-700/60 overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm">
          <img
            src={avatarUrl}
            alt={username}
            className="w-full h-full object-cover rounded-full"
            loading="lazy"
          />
        </div>

        {/* Name, Tag & Rating */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-tight">
            {isBot && (
              <span className="px-1 py-0.2 rounded text-[9px] font-extrabold uppercase bg-[#383632] text-[#81b64c] border border-[#484642]">
                BOT
              </span>
            )}
            <span className="text-xs sm:text-sm font-bold text-[#e1dfda] truncate max-w-[130px] sm:max-w-[170px]">
              {username}
            </span>
            <span className="text-[11px] font-mono font-bold text-[#81b64c]">
              ({rating})
            </span>
          </div>

          {/* Thinking status or subtitle */}
          <div className="flex items-center gap-1 mt-0.5">
            {isThinking ? (
              <span className="text-[10px] text-[#81b64c] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#81b64c] animate-ping"></span>
                Thinking...
              </span>
            ) : (
              <span className="text-[10px] text-[#8b8985] font-medium">
                {isBot ? currentBot.tagline : (color === 'w' ? 'White' : 'Black')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Captured Tray & Digital Clock */}
      <div className="flex items-center gap-3">
        <CapturedPieces
          captured={captured}
          color={color}
          advantage={advantage}
        />
        <ChessClock
          timeMs={timeMs}
          isActive={isActive}
          playerName={username}
          color={color}
          hasClock={hasClock}
        />
      </div>
    </div>
  );
}
