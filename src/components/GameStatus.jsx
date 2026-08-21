import React from 'react';
import {
  AlertCircle,
  Loader2,
  Trophy,
  HelpCircle,
  ClockAlert
} from 'lucide-react';

/**
 * Minimalist Flat 2.0 Game Status banner.
 */
export default function GameStatus({
  turn,
  isCheck,
  isCheckmate,
  isStalemate,
  isDraw,
  drawReason,
  timeoutWinner,
  isTimeoutDraw,
  isBotThinking
}) {
  // Timeout victory condition
  if (timeoutWinner) {
    const isPlayerWinner = timeoutWinner === 'w';
    return (
      <div
        className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
          isPlayerWinner
            ? 'bg-zinc-900 border-emerald-500/50 text-zinc-100 shadow-xs'
            : 'bg-zinc-900 border-rose-500/50 text-zinc-100 shadow-xs'
        }`}
      >
        <div className={`p-2 rounded-lg ${isPlayerWinner ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          <ClockAlert className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-semibold text-xs sm:text-sm text-zinc-100 leading-tight">
            {isPlayerWinner ? 'Victory on Time' : 'Defeat on Time'}
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {isPlayerWinner ? "Black's clock expired." : "White's clock expired."}
          </p>
        </div>
      </div>
    );
  }

  // Timeout vs Insufficient Material Draw
  if (isTimeoutDraw) {
    return (
      <div className="p-3 rounded-xl border bg-zinc-900 border-zinc-700 text-zinc-100 flex items-center gap-3 shadow-xs">
        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-semibold text-xs sm:text-sm text-zinc-100 leading-tight">
            Draw • Timeout vs. Insufficient Material
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Clock expired, but opponent lacks mating material.
          </p>
        </div>
      </div>
    );
  }

  // Checkmate condition
  if (isCheckmate) {
    const winnerIsWhite = turn === 'b';
    return (
      <div
        className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
          winnerIsWhite
            ? 'bg-zinc-900 border-emerald-500/50 text-zinc-100 shadow-xs'
            : 'bg-zinc-900 border-rose-500/50 text-zinc-100 shadow-xs'
        }`}
      >
        <div className={`p-2 rounded-lg ${winnerIsWhite ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          <Trophy className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-semibold text-xs sm:text-sm text-zinc-100 leading-tight">
            Checkmate • {winnerIsWhite ? 'You Won' : 'Bot Won'}
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {winnerIsWhite ? 'White delivered checkmate.' : 'Black delivered checkmate.'}
          </p>
        </div>
      </div>
    );
  }

  // Stalemate condition
  if (isStalemate) {
    return (
      <div className="p-3 rounded-xl border bg-zinc-900 border-zinc-700 text-zinc-100 flex items-center gap-3 shadow-xs">
        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-semibold text-xs sm:text-sm text-zinc-100 leading-tight">
            Stalemate • Draw
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            No legal moves available and not in check.
          </p>
        </div>
      </div>
    );
  }

  // Other Draw conditions
  if (isDraw) {
    return (
      <div className="p-3 rounded-xl border bg-zinc-900 border-zinc-700 text-zinc-100 flex items-center gap-3 shadow-xs">
        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-semibold text-xs sm:text-sm text-zinc-100 leading-tight">
            Game Drawn
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {drawReason || 'The match ended in a draw.'}
          </p>
        </div>
      </div>
    );
  }

  // In check alert
  if (isCheck) {
    const kingInCheck = turn === 'w' ? 'Your King' : "Bot's King";
    return (
      <div className="p-2.5 rounded-xl border bg-zinc-900 border-rose-500/60 text-zinc-100 flex items-center gap-2.5 shadow-xs">
        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <span className="font-semibold text-xs text-rose-300">Check:</span>{' '}
          <span className="text-[11px] text-zinc-300">{kingInCheck} is under direct attack.</span>
        </div>
      </div>
    );
  }

  // Normal turn & Bot thinking indicator
  return (
    <div className="px-3 py-2.5 rounded-xl border bg-zinc-900/90 border-zinc-800 text-zinc-200 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-2.5 h-2.5 rounded-full border ${
            turn === 'w'
              ? 'bg-zinc-100 border-zinc-300 shadow-xs'
              : 'bg-zinc-900 border-zinc-600'
          }`}
        />
        <span className="text-xs font-semibold text-zinc-200">
          {turn === 'w' ? 'White to move (You)' : 'Black to move (Bot)'}
        </span>
      </div>

      {isBotThinking && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-mono">
          <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
          <span>Thinking</span>
        </div>
      )}
    </div>
  );
}
