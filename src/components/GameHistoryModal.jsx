import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  Download,
  Eye,
  Trash2,
  Trophy,
  AlertTriangle,
  HelpCircle,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { getMatchHistory, clearMatchHistory } from '../utils/storage';

export default function GameHistoryModal({
  isOpen = false,
  onClose,
  onLoadGamePgn // (pgnString, matchInfo) => void
}) {
  const [matches, setMatches] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMatches(getMatchHistory());
      setConfirmClear(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportSinglePgn = (match) => {
    const pgnData = match.pgn || `[Event "Offline Chess Match"]\n[White "You"]\n[Black "${match.opponentName}"]\n[Result "${match.result}"]\n\n*`;
    const blob = new Blob([pgnData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `match-${match.opponentName.toLowerCase()}-${new Date(match.date).toISOString().slice(0, 10)}.pgn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    clearMatchHistory();
    setMatches([]);
    setConfirmClear(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#262522] border border-[#3d3b37] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#1f1e1b] border-b border-[#363431]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#31302c] border border-[#484642] flex items-center justify-center text-[#81b64c]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Match History</span>
                <span className="text-xs font-mono font-bold px-2 py-0.2 rounded-full bg-[#31302c] text-zinc-400 border border-[#3d3b37]">
                  {matches.length} {matches.length === 1 ? 'game' : 'games'}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Completed offline games saved locally on your device.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {matches.length > 0 && (
              <>
                {confirmClear ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <button
                      onClick={handleClear}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#cc3333] hover:bg-[#e03e3e] text-white transition-colors cursor-pointer"
                    >
                      Confirm Clear
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 text-[11px] font-bold rounded-lg bg-[#31302c] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-[#cc3333] hover:bg-[#31302c] border border-transparent hover:border-[#484642] transition-colors cursor-pointer"
                    title="Clear all saved games"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear History</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#31302c] transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Matches List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#1f1e1b] border border-[#363431] flex items-center justify-center text-2xl text-zinc-500">
                ♟
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No match history yet</h3>
                <p className="text-xs text-zinc-500 max-w-xs">
                  Games you complete against the bot ladder will automatically be recorded here.
                </p>
              </div>
            </div>
          ) : (
            matches.map((m) => {
              const isWin = m.result === 'Win';
              const isLoss = m.result === 'Loss';
              const formattedDate = new Date(m.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={m.id}
                  className="bg-[#1f1e1b] hover:bg-[#252420] border border-[#363431] rounded-xl p-3 sm:p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Opponent & Result */}
                  <div className="flex items-center gap-3 min-w-0">
                    
                    {/* Result Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isWin
                          ? 'bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/40'
                          : isLoss
                          ? 'bg-[#cc3333]/20 text-[#cc3333] border border-[#cc3333]/40'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {isWin ? (
                        <Trophy className="w-5 h-5" />
                      ) : isLoss ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <HelpCircle className="w-5 h-5" />
                      )}
                    </div>

                    {/* Opponent Details & Reason */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full ring-1 ring-zinc-700/60 overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                          {m.opponentAvatar && m.opponentAvatar.startsWith('http') ? (
                            <img
                              src={m.opponentAvatar}
                              alt={m.opponentName}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-xs leading-none">{m.opponentAvatar || '🤖'}</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-white truncate">
                          {m.opponentName}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#81b64c]">
                          ({m.opponentRating})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span
                          className={`font-bold ${
                            isWin
                              ? 'text-[#81b64c]'
                              : isLoss
                              ? 'text-[#cc3333]'
                              : 'text-zinc-400'
                          }`}
                        >
                          {m.result}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-400">{m.reason}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Meta & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2b2a26]">
                    <div className="text-left sm:text-right text-[11px] text-zinc-500 font-mono">
                      <div>{formattedDate}</div>
                      <div>{m.moveCount} moves</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Review Game */}
                      {onLoadGamePgn && (
                        <button
                          onClick={() => {
                            onLoadGamePgn(m.pgn, m);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2a2926] hover:bg-[#363431] text-zinc-200 hover:text-white border border-[#3d3b37] text-xs font-bold transition-colors cursor-pointer"
                          title="Load and review this match on the board"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#81b64c]" />
                          <span>Review</span>
                        </button>
                      )}

                      {/* Export PGN */}
                      <button
                        onClick={() => handleExportSinglePgn(m)}
                        className="p-1.5 rounded-lg bg-[#2a2926] hover:bg-[#363431] text-zinc-300 hover:text-white border border-[#3d3b37] transition-colors cursor-pointer"
                        title="Download PGN for this match"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#1f1e1b] border-t border-[#363431] flex items-center justify-between text-xs text-zinc-500">
          <span>Exported matches comply with standard PGN format.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold bg-[#31302c] text-white hover:bg-[#3d3b37] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
