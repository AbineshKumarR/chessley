import React from 'react';
import { Trophy, RotateCcw, Eye, X, AlertTriangle, HelpCircle } from 'lucide-react';
import { BOTS, DEFAULT_BOT_ID } from '../constants/bots';

export default function GameOverModal({
  isOpen = false,
  winner = null, // 'w' | 'b' | 'draw'
  reason = 'Checkmate',
  botId = DEFAULT_BOT_ID,
  moveCount = 0,
  onNewGame,
  onReviewMoves,
  onClose
}) {
  if (!isOpen) return null;

  const currentBot = BOTS[botId] || BOTS[DEFAULT_BOT_ID];
  const botName = currentBot?.name || 'Opponent';
  const isPlayerWin = winner === 'w';
  const isBotWin = winner === 'b';
  const isDraw = winner === 'draw' || !winner;

  let title = 'Game Over';
  if (isPlayerWin) {
    title = `You won against ${botName}!`;
  } else if (isBotWin) {
    const formattedReason = reason ? (reason.toLowerCase().startsWith('by') ? reason : `by ${reason}`) : 'by Checkmate';
    title = `${botName} won ${formattedReason}`;
  } else {
    title = `Draw vs ${botName}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#262522] border border-[#3d3b37] rounded-2xl p-6 shadow-2xl text-center space-y-5">
        
        {/* Dismiss / Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b8985] hover:text-white hover:bg-[#31302c] transition-colors cursor-pointer"
          title="Close to inspect board"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Outcome Graphic */}
        <div className="flex justify-center pt-2">
          {isPlayerWin ? (
            <div className="w-16 h-16 rounded-2xl bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center text-[#81b64c] shadow-lg">
              <Trophy className="w-9 h-9" />
            </div>
          ) : isBotWin ? (
            <div className="w-16 h-16 rounded-2xl bg-[#cc3333]/20 border border-[#cc3333]/40 flex items-center justify-center text-[#cc3333] shadow-lg">
              <AlertTriangle className="w-9 h-9" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#52504c]/30 border border-[#52504c]/60 flex items-center justify-center text-[#e1dfda] shadow-lg">
              <HelpCircle className="w-9 h-9" />
            </div>
          )}
        </div>

        {/* Title & Reason */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
            {title}
          </h2>
          <p className="text-xs font-semibold text-[#8b8985] uppercase tracking-wider">
            {reason}
          </p>
        </div>

        {/* Match Summary Pill Card */}
        <div className="grid grid-cols-2 gap-2 bg-[#1f1e1b] p-3 rounded-xl border border-[#363431] text-xs items-center">
          <div className="text-left">
            <span className="text-[10px] text-[#8b8985] uppercase font-bold tracking-wider block mb-1">
              Opponent
            </span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full ring-1 ring-zinc-700/60 overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                {currentBot.avatar?.startsWith('http') || currentBot.avatar?.startsWith('/') ? (
                  <img
                    src={currentBot.avatar}
                    alt={botName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-xs leading-none">{currentBot.avatar || '🤖'}</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-white truncate block text-xs">{botName}</span>
                <span className="text-[10px] font-mono text-[#81b64c] block leading-none">
                  ({currentBot.rating})
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#8b8985] uppercase font-bold tracking-wider block">
              Total Moves
            </span>
            <span className="font-bold text-white font-mono text-sm mt-0.5 block">{moveCount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onNewGame}
            className="w-full py-3 px-4 rounded-xl font-extrabold text-sm text-white bg-[#81b64c] hover:bg-[#96c858] active:scale-98 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rematch / New Game</span>
          </button>

          <button
            onClick={onReviewMoves}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-[#e1dfda] bg-[#31302c] hover:bg-[#3d3b37] active:scale-98 border border-[#3d3b37] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#8b8985]" />
            <span>Review Moves</span>
          </button>
        </div>

      </div>
    </div>
  );
}
