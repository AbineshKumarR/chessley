import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const PROMOTION_PIECES = [
  { type: 'q', name: 'Queen', whiteGlyph: '♕', blackGlyph: '♛' },
  { type: 'n', name: 'Knight', whiteGlyph: '♘', blackGlyph: '♞' },
  { type: 'r', name: 'Rook', whiteGlyph: '♖', blackGlyph: '♜' },
  { type: 'b', name: 'Bishop', whiteGlyph: '♗', blackGlyph: '♝' }
];

/**
 * Minimalist Flat 2.0 Pawn Promotion Modal.
 */
export default function PromotionModal({
  isOpen = false,
  color = 'w',
  theme,
  onSelect,
  onCancel
}) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onCancel();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-md p-4 rounded-xl transition-all duration-150">
      <div className="relative w-full max-w-[280px] bg-zinc-900/95 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4 text-center">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div>
          <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
            Promote Pawn
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Select promotion piece
          </p>
        </div>

        {/* Piece Selection Grid */}
        <div className="grid grid-cols-2 gap-2">
          {PROMOTION_PIECES.map((piece) => (
            <button
              key={piece.type}
              onClick={() => onSelect(piece.type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-150 shadow-xs cursor-pointer group"
            >
              <span className="text-3xl leading-none text-zinc-100 group-hover:scale-105 transition-transform select-none">
                {color === 'w' ? piece.whiteGlyph : piece.blackGlyph}
              </span>
              <span className="text-[11px] font-semibold text-zinc-400 mt-1.5 group-hover:text-zinc-200">
                {piece.name}
              </span>
            </button>
          ))}
        </div>

        <div className="text-[10px] text-zinc-500 font-mono">
          Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400 text-[9px]">Esc</kbd> to cancel
        </div>
      </div>
    </div>
  );
}
