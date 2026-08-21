import React from 'react';
import {
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  Lightbulb,
  Cpu,
  Clock,
  Palette
} from 'lucide-react';
import { THEMES } from '../constants/themes';

const DIFFICULTY_LEVELS = [
  { id: 1, name: 'Easy', detail: '1-ply' },
  { id: 2, name: 'Medium', detail: '2-ply' },
  { id: 3, name: 'Hard', detail: '3-ply' }
];

const TIME_CONTROLS = [
  { seconds: 0, label: 'Casual' },
  { seconds: 60, label: '1m' },
  { seconds: 180, label: '3m' },
  { seconds: 300, label: '5m' },
  { seconds: 600, label: '10m' }
];

/**
 * Minimalist Flat 2.0 Game Controls.
 */
export default function GameControls({
  difficulty,
  onSelectDifficulty,
  timeControl,
  onSelectTimeControl,
  theme,
  onSelectTheme,
  smartHints,
  onToggleSmartHints,
  onNewGame,
  onUndo,
  canUndo,
  isMuted,
  onToggleMute,
  isBotThinking
}) {
  return (
    <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800/80 shadow-xs space-y-3.5">
      {/* Bot Difficulty: Segmented Control */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-zinc-500" />
            <span>Difficulty</span>
          </label>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {DIFFICULTY_LEVELS.map((lvl) => {
            const isSelected = difficulty === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => onSelectDifficulty(lvl.id)}
                disabled={isBotThinking}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-all duration-150 flex flex-col items-center disabled:opacity-50 ${
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <span>{lvl.name}</span>
                <span className="text-[10px] font-normal text-zinc-500 font-mono">
                  {lvl.detail}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Control: Segmented Pills */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>Timer Mode</span>
          </label>
        </div>
        <div className="grid grid-cols-5 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {TIME_CONTROLS.map((tc) => {
            const isSelected = timeControl === tc.seconds;
            return (
              <button
                key={tc.seconds}
                onClick={() => onSelectTimeControl(tc.seconds)}
                disabled={isBotThinking}
                className={`py-1.5 rounded-md text-xs font-semibold font-mono transition-all duration-150 text-center disabled:opacity-50 ${
                  isSelected
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                {tc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Board Theme Selector: Minimalist Color Tiles */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-zinc-500" />
            <span>Board Theme</span>
          </label>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {Object.values(THEMES).map((th) => {
            const isSelected = theme === th.id;
            return (
              <button
                key={th.id}
                onClick={() => onSelectTheme(th.id)}
                className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all duration-150 text-left ${
                  isSelected
                    ? 'bg-zinc-800 border-zinc-500 text-zinc-100 ring-1 ring-zinc-500/30'
                    : 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded shrink-0 overflow-hidden flex border border-zinc-700">
                  <div className="w-1/2 h-full" style={{ backgroundColor: th.preview[0] }} />
                  <div className="w-1/2 h-full" style={{ backgroundColor: th.preview[1] }} />
                </div>
                <span className="text-[11px] font-medium truncate">
                  {th.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action Toolbar */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onNewGame}
          disabled={isBotThinking}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-900 shadow-xs active:scale-98 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Game</span>
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo || isBotThinking}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700/80 active:scale-98 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>
      </div>

      {/* Utilities Toggle Row */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <button
          onClick={onToggleSmartHints}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-150 ${
            smartHints
              ? 'bg-zinc-800 border-zinc-600 text-zinc-200 shadow-xs'
              : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
          }`}
          title="Toggle move dots and threat highlights"
        >
          <Lightbulb className={`w-3 h-3 ${smartHints ? 'text-amber-400' : 'text-zinc-500'}`} />
          <span>Hints {smartHints ? 'On' : 'Off'}</span>
        </button>

        <button
          onClick={onToggleMute}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-150 ${
            isMuted
              ? 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              : 'bg-zinc-800 border-zinc-700 text-zinc-200 shadow-xs'
          }`}
          title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3 h-3" />
              <span>Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3 h-3" />
              <span>Audio On</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
