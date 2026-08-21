import React, { useState } from 'react';
import { Chess } from 'chess.js';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Download,
  Upload,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const PRESET_POSITIONS = [
  {
    name: 'Standard Start',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  },
  {
    name: "Scholar's Trap",
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4'
  },
  {
    name: 'Opera Game',
    fen: '4kb1r/p2rqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 14'
  },
  {
    name: 'K+P Endgame',
    fen: '8/8/8/4k3/8/8/4P3/4K3 w - - 0 1'
  }
];

/**
 * Minimalist Flat 2.0 Game Tools Accordion.
 */
export default function GameTools({ game, onImportFen, isBotThinking }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputFen, setInputFen] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedType, setCopiedType] = useState(null);

  const handleCopyFen = async () => {
    try {
      const fen = game.fen();
      await navigator.clipboard.writeText(fen);
      setCopiedType('fen');
      setTimeout(() => setCopiedType(null), 1800);
    } catch (err) {
      console.error('Failed to copy FEN:', err);
    }
  };

  const handleCopyPgn = async () => {
    try {
      const pgn = game.pgn() || '[Event "Casual Studio Match"]\n[White "Player"]\n[Black "Bot"]\n*';
      await navigator.clipboard.writeText(pgn);
      setCopiedType('pgn');
      setTimeout(() => setCopiedType(null), 1800);
    } catch (err) {
      console.error('Failed to copy PGN:', err);
    }
  };

  const handleLoadFen = (fenToLoad) => {
    const target = (fenToLoad || inputFen).trim();
    if (!target) {
      setErrorMsg('Please enter a valid FEN string.');
      return;
    }

    try {
      const testGame = new Chess(target);
      setErrorMsg('');
      setInputFen('');
      onImportFen(testGame, target);
    } catch (err) {
      setErrorMsg('Invalid FEN syntax or board state.');
    }
  };

  return (
    <div className="bg-zinc-900/90 rounded-xl border border-zinc-800/80 shadow-xs overflow-hidden transition-all">
      {/* Accordion Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-zinc-850/40 hover:bg-zinc-850/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-[11px] font-semibold tracking-wider text-zinc-300 uppercase">
            Game Tools (FEN / PGN)
          </h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        )}
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-3.5 space-y-3.5 border-t border-zinc-800">
          
          {/* 1-Click Copy Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyFen}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-lg text-xs font-medium border border-zinc-700/80 transition-all active:scale-98"
            >
              {copiedType === 'fen' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">FEN Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy FEN</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyPgn}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-lg text-xs font-medium border border-zinc-700/80 transition-all active:scale-98"
            >
              {copiedType === 'pgn' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">PGN Copied!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy PGN</span>
                </>
              )}
            </button>
          </div>

          {/* Import Position Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Import Position
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Paste FEN position string..."
                value={inputFen}
                onChange={(e) => {
                  setInputFen(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                disabled={isBotThinking}
                className="flex-1 bg-zinc-950 text-zinc-200 text-xs font-mono px-2.5 py-1.5 rounded-lg border border-zinc-700/80 focus:outline-none focus:border-zinc-500 placeholder:text-zinc-600 disabled:opacity-50"
              />
              <button
                onClick={() => handleLoadFen()}
                disabled={isBotThinking || !inputFen.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Upload className="w-3 h-3" />
                <span>Load</span>
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 p-2 rounded-md bg-rose-950/40 border border-rose-800 text-rose-300 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Preset Practice Puzzles */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-zinc-400" />
              <span>Presets</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_POSITIONS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleLoadFen(preset.fen)}
                  disabled={isBotThinking}
                  className="text-left px-2 py-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-mono transition-colors truncate disabled:opacity-50"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
