import React, { useState } from 'react';
import {
  Gamepad2,
  ScrollText,
  Sliders,
  RotateCcw,
  Flag,
  Undo2,
  Lightbulb,
  Volume2,
  VolumeX,
  Palette,
  Clock,
  Bot,
  Sparkles,
  Copy,
  Check,
  Download,
  Upload,
  AlertCircle
} from 'lucide-react';
import MoveHistory from './MoveHistory';
import GameStatus from './GameStatus';
import { THEMES } from '../constants/themes';
import { BOTS, BOT_CATEGORIES, DEFAULT_BOT_ID } from '../constants/bots';
import { Chess } from 'chess.js';

const TIME_CONTROLS = [
  { seconds: 0, label: 'Casual' },
  { seconds: 60, label: '1 min' },
  { seconds: 180, label: '3 min' },
  { seconds: 300, label: '5 min' },
  { seconds: 600, label: '10 min' }
];

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

export default function ChessSidebar({
  game,
  botId = DEFAULT_BOT_ID,
  onSelectBot,
  timeControl,
  onSelectTimeControl,
  theme,
  onSelectTheme,
  smartHints,
  onToggleSmartHints,
  isMuted,
  onToggleMute,
  onNewGame,
  onResign,
  onUndo,
  canUndo,
  isBotThinking,
  turn,
  isCheck,
  isCheckmate,
  isStalemate,
  isDraw,
  drawReason,
  timeoutWinner,
  isTimeoutDraw,
  moveHistory = [],
  currentPlyIndex = null,
  onStepMove,
  onImportFen,
  activeTab = 'play',
  setActiveTab
}) {
  // Tools state
  const [inputFen, setInputFen] = useState('');
  const [fenError, setFenError] = useState('');
  const [copiedType, setCopiedType] = useState(null);

  const handleCopyFen = async () => {
    try {
      await navigator.clipboard.writeText(game.fen());
      setCopiedType('fen');
      setTimeout(() => setCopiedType(null), 1800);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyPgn = async () => {
    try {
      const pgn = game.pgn() || '[Event "Chess.com Offline Studio"]\n[White "You"]\n[Black "Chess Bot"]\n*';
      await navigator.clipboard.writeText(pgn);
      setCopiedType('pgn');
      setTimeout(() => setCopiedType(null), 1800);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadFen = (targetFen) => {
    const target = (targetFen || inputFen).trim();
    if (!target) {
      setFenError('Please enter a valid FEN string.');
      return;
    }

    try {
      const test = new Chess(target);
      setFenError('');
      setInputFen('');
      onImportFen(test, target);
    } catch (e) {
      setFenError('Invalid FEN position string.');
    }
  };

  return (
    <div className="w-full bg-[#262522] border border-[#3d3b37] rounded-xl overflow-hidden shadow-xl flex flex-col h-[560px] sm:h-[620px]">
      
      {/* Top Tab Bar: Play, Moves, Tools */}
      <div className="grid grid-cols-3 bg-[#1f1e1b] border-b border-[#363431]">
        <button
          onClick={() => setActiveTab('play')}
          className={`py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'play'
              ? 'bg-[#262522] text-[#81b64c] border-b-2 border-[#81b64c]'
              : 'text-[#8b8985] hover:text-[#e1dfda] hover:bg-[#262522]/50'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Play</span>
        </button>

        <button
          onClick={() => setActiveTab('moves')}
          className={`py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'moves'
              ? 'bg-[#262522] text-[#81b64c] border-b-2 border-[#81b64c]'
              : 'text-[#8b8985] hover:text-[#e1dfda] hover:bg-[#262522]/50'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>Moves</span>
          {moveHistory.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#31302c] text-[#8b8985] font-mono">
              {Math.ceil(moveHistory.length / 2)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-[#262522] text-[#81b64c] border-b-2 border-[#81b64c]'
              : 'text-[#8b8985] hover:text-[#e1dfda] hover:bg-[#262522]/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Tools</span>
        </button>
      </div>

      {/* Main Tab Content Body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-4">
        
        {/* TAB 1: PLAY */}
        {activeTab === 'play' && (
          <div className="space-y-3.5">
            
            {/* Status Pill */}
            <GameStatus
              turn={turn}
              isCheck={isCheck}
              isCheckmate={isCheckmate}
              isStalemate={isStalemate}
              isDraw={isDraw}
              drawReason={drawReason}
              timeoutWinner={timeoutWinner}
              isTimeoutDraw={isTimeoutDraw}
              isBotThinking={isBotThinking}
            />

            {/* Time Control Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8b8985] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#81b64c]" />
                <span>Time Control</span>
              </label>
              <div className="grid grid-cols-5 gap-1 bg-[#1f1e1b] p-1.5 rounded-lg border border-[#363431]">
                {TIME_CONTROLS.map((tc) => {
                  const isSelected = timeControl === tc.seconds;
                  return (
                    <button
                      key={tc.seconds}
                      onClick={() => onSelectTimeControl(tc.seconds)}
                      disabled={isBotThinking}
                      className={`py-1.5 rounded-md text-xs font-bold font-mono transition-all text-center cursor-pointer disabled:opacity-50 ${
                        isSelected
                          ? 'bg-[#31302c] text-white shadow-xs border border-[#484642] ring-1 ring-[#81b64c]'
                          : 'text-[#8b8985] hover:text-[#e1dfda] hover:bg-[#282724]'
                      }`}
                    >
                      {tc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chess.com Style Bot Tier Ladder */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#8b8985] uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[#81b64c]" />
                <span>Choose Opponent Bot</span>
              </label>

              <div className="space-y-3">
                {BOT_CATEGORIES.map((cat) => {
                  const categoryBots = Object.values(BOTS).filter((b) => b.category === cat.id);
                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                        <span>{cat.name}</span>
                        <span className="text-zinc-500 font-mono">{cat.eloRange} Elo</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        {categoryBots.map((b) => {
                          const isSelected = botId === b.id;
                          return (
                            <button
                              key={b.id}
                              onClick={() => onSelectBot(b.id)}
                              disabled={isBotThinking}
                              className={`w-full p-2 rounded-lg border transition-all text-left flex items-center justify-between cursor-pointer disabled:opacity-50 ${
                                isSelected
                                  ? 'bg-[#31302c] border-[#81b64c] ring-1 ring-[#81b64c] shadow-sm'
                                  : 'bg-[#1f1e1b] border-[#363431] hover:bg-[#2a2926] text-[#8b8985] hover:text-[#e1dfda]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-md bg-[#262522] border border-[#3d3b37] flex items-center justify-center text-lg shrink-0">
                                  {b.avatar}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-white truncate">
                                      {b.name}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-[#81b64c]">
                                      ({b.rating})
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-zinc-400 truncate">
                                    {b.tagline}
                                  </div>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-[#81b64c]/20 border border-[#81b64c] flex items-center justify-center shrink-0 ml-2">
                                  <Check className="w-3 h-3 text-[#81b64c]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MOVES */}
        {activeTab === 'moves' && (
          <div className="h-full min-h-0 flex flex-col">
            <MoveHistory
              history={moveHistory}
              currentPlyIndex={currentPlyIndex}
              onStepMove={onStepMove}
            />
          </div>
        )}

        {/* TAB 3: TOOLS & SETTINGS */}
        {activeTab === 'tools' && (
          <div className="space-y-4">
            
            {/* Theme Swatches */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8b8985] uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#81b64c]" />
                <span>Board Theme</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.values(THEMES).map((th) => {
                  const isSelected = theme === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => onSelectTheme(th.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-[#31302c] border-[#81b64c] text-white ring-1 ring-[#81b64c]'
                          : 'bg-[#1f1e1b] border-[#363431] text-[#8b8985] hover:text-[#e1dfda]'
                      }`}
                    >
                      <div className="w-4 h-4 rounded overflow-hidden flex border border-[#484642] shrink-0">
                        <div className="w-1/2 h-full" style={{ backgroundColor: th.preview[0] }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: th.preview[1] }} />
                      </div>
                      <span className="text-xs font-semibold truncate">{th.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Export FEN / PGN */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8b8985] uppercase tracking-wider">
                Export Match Data
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyFen}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#1f1e1b] hover:bg-[#31302c] text-[#e1dfda] rounded-lg text-xs font-semibold border border-[#363431] transition-all cursor-pointer"
                >
                  {copiedType === 'fen' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#81b64c]" />
                      <span className="text-[#81b64c]">FEN Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8b8985]" />
                      <span>Copy FEN</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyPgn}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-[#1f1e1b] hover:bg-[#31302c] text-[#e1dfda] rounded-lg text-xs font-semibold border border-[#363431] transition-all cursor-pointer"
                >
                  {copiedType === 'pgn' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#81b64c]" />
                      <span className="text-[#81b64c]">PGN Copied!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-[#8b8985]" />
                      <span>Copy PGN</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Import FEN Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#8b8985] uppercase tracking-wider">
                Import FEN Position
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Paste FEN..."
                  value={inputFen}
                  onChange={(e) => {
                    setInputFen(e.target.value);
                    if (fenError) setFenError('');
                  }}
                  className="flex-1 bg-[#1f1e1b] text-white text-xs font-mono px-3 py-2 rounded-lg border border-[#363431] focus:outline-none focus:border-[#81b64c]"
                />
                <button
                  onClick={() => handleLoadFen()}
                  disabled={!inputFen.trim() || isBotThinking}
                  className="px-3 py-2 bg-[#81b64c] hover:bg-[#96c858] text-white font-bold rounded-lg text-xs transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>
              {fenError && (
                <div className="flex items-center gap-1.5 text-xs text-[#cc3333]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fenError}</span>
                </div>
              )}
            </div>

            {/* Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-[#8b8985] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#81b64c]" />
                <span>Practice Presets</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_POSITIONS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleLoadFen(preset.fen)}
                    className="text-left px-2.5 py-1.5 rounded-md bg-[#1f1e1b] hover:bg-[#31302c] text-[#e1dfda] border border-[#363431] text-[11px] font-medium transition-colors truncate cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Sticky Bottom Action Footer */}
      <div className="p-3 bg-[#1f1e1b] border-t border-[#363431] space-y-2">
        {/* Prominent Chess.com Green 'New Game' Button */}
        <button
          onClick={onNewGame}
          disabled={isBotThinking}
          className="w-full py-2.5 px-4 rounded-lg font-extrabold text-sm text-white bg-[#81b64c] hover:bg-[#96c858] active:scale-98 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          <span>New Game</span>
        </button>

        {/* Secondary Action Toolbar: Resign, Undo, Hints, Sound */}
        <div className="grid grid-cols-4 gap-1.5">
          {/* Resign */}
          <button
            onClick={onResign}
            disabled={isBotThinking || moveHistory.length === 0}
            className="flex items-center justify-center p-2 rounded-lg bg-[#262522] hover:bg-[#31302c] text-[#8b8985] hover:text-[#cc3333] border border-[#363431] transition-all disabled:opacity-30 cursor-pointer"
            title="Resign Game"
          >
            <Flag className="w-4 h-4" />
          </button>

          {/* Undo / Takeback */}
          <button
            onClick={onUndo}
            disabled={!canUndo || isBotThinking}
            className="flex items-center justify-center p-2 rounded-lg bg-[#262522] hover:bg-[#31302c] text-[#8b8985] hover:text-white border border-[#363431] transition-all disabled:opacity-30 cursor-pointer"
            title="Undo Move (Takeback)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Smart Hints */}
          <button
            onClick={onToggleSmartHints}
            className={`flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
              smartHints
                ? 'bg-[#31302c] border-[#81b64c] text-[#81b64c]'
                : 'bg-[#262522] border-[#363431] text-[#8b8985] hover:text-white'
            }`}
            title={smartHints ? 'Smart Hints: ON' : 'Smart Hints: OFF'}
          >
            <Lightbulb className="w-4 h-4" />
          </button>

          {/* Audio Mute */}
          <button
            onClick={onToggleMute}
            className="flex items-center justify-center p-2 rounded-lg bg-[#262522] hover:bg-[#31302c] text-[#8b8985] hover:text-white border border-[#363431] transition-all cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#81b64c]" />}
          </button>
        </div>
      </div>

    </div>
  );
}
