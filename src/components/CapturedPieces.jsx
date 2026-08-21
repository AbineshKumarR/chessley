import React from 'react';

const PIECE_SYMBOLS = {
  w: {
    p: '♙',
    n: '♘',
    b: '♗',
    r: '♖',
    q: '♕'
  },
  b: {
    p: '♟',
    n: '♞',
    b: '♝',
    r: '♜',
    q: '♛'
  }
};

const PIECE_ORDER = ['q', 'r', 'b', 'n', 'p'];

/**
 * Renders minimalist captured piece silhouettes and material advantage pill.
 */
export default function CapturedPieces({ captured = [], color = 'w', advantage = 0 }) {
  const counts = captured.reduce((acc, piece) => {
    acc[piece] = (acc[piece] || 0) + 1;
    return acc;
  }, {});

  const isPositiveAdvantage = (color === 'w' && advantage > 0) || (color === 'b' && advantage < 0);
  const displayAdvantage = Math.abs(advantage);

  return (
    <div className="flex items-center gap-2 min-h-[24px] text-xs select-none">
      <div className="flex items-center flex-wrap gap-1">
        {PIECE_ORDER.map((type) => {
          const count = counts[type];
          if (!count) return null;

          return (
            <div
              key={type}
              className="flex items-center bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60 shadow-xs"
            >
              <span className={`text-sm font-medium ${color === 'w' ? 'text-zinc-200' : 'text-zinc-400'}`}>
                {PIECE_SYMBOLS[color][type]}
              </span>
              {count > 1 && (
                <span className="text-[10px] font-bold font-mono text-zinc-400 ml-0.5">
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {isPositiveAdvantage && displayAdvantage > 0 && (
        <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold font-mono rounded bg-zinc-800 border border-zinc-700 text-zinc-200 shadow-xs">
          +{displayAdvantage}
        </span>
      )}
    </div>
  );
}
