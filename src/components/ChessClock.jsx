import React from 'react';
import { Clock } from 'lucide-react';

/**
 * Chess.com-style digital countdown clock badge.
 */
export default function ChessClock({
  timeMs = 0,
  isActive = false,
  playerName = 'Player',
  color = 'w',
  hasClock = true
}) {
  if (!hasClock) return null;

  const isLowTime = timeMs < 20000 && timeMs > 0;
  const isCriticalTime = timeMs < 10000 && timeMs > 0;
  const isZero = timeMs <= 0;

  // Format time display
  let timeDisplay = '00:00';
  if (isZero) {
    timeDisplay = '00:00';
  } else if (isCriticalTime) {
    const totalSec = Math.max(0, Math.floor(timeMs / 1000));
    const tenths = Math.max(0, Math.floor((timeMs % 1000) / 100));
    timeDisplay = `${totalSec.toString().padStart(2, '0')}.${tenths}`;
  } else {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-sm font-bold tracking-tight select-none transition-colors duration-150 ${
        isZero
          ? 'bg-[#b33434] text-white shadow-xs'
          : isLowTime
          ? 'bg-[#cc3333] text-white font-extrabold shadow-sm'
          : isActive
          ? 'bg-[#ffffff] text-[#191918] font-extrabold shadow-md'
          : 'bg-[#21201d] border border-[#363431] text-[#9b9994]'
      }`}
    >
      <Clock className={`w-3.5 h-3.5 ${isActive ? 'text-[#191918]' : 'text-current opacity-70'}`} />
      <span className="tabular-nums text-sm sm:text-base leading-none">
        {timeDisplay}
      </span>
    </div>
  );
}
