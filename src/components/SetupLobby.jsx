import React, { useState } from 'react';
import { BOTS, BOT_CATEGORIES, DEFAULT_BOT_ID } from '../constants/bots';
import { Swords, Check, HelpCircle, ChevronRight, Sparkles } from 'lucide-react';

const TIME_CONTROLS = [
  { seconds: 0, label: 'Casual' },
  { seconds: 60, label: '1 min' },
  { seconds: 180, label: '3 min' },
  { seconds: 300, label: '5 min' },
  { seconds: 600, label: '10 min' }
];

export default function SetupLobby({
  selectedBotId = DEFAULT_BOT_ID,
  onSelectBot,
  selectedTimeControl = 300,
  onSelectTimeControl,
  userColor = 'w',
  onSelectColor,
  onStartGame
}) {
  const [activeCategory, setActiveCategory] = useState('all');

  const botList = Object.values(BOTS);
  const filteredBots = activeCategory === 'all'
    ? botList
    : botList.filter((b) => b.category === activeCategory);

  const activeBot = BOTS[selectedBotId] || BOTS[DEFAULT_BOT_ID];

  const handlePlayClick = () => {
    let chosenColor = userColor;
    if (userColor === 'random') {
      chosenColor = Math.random() < 0.5 ? 'w' : 'b';
    }
    onStartGame(selectedBotId, selectedTimeControl, chosenColor);
  };

  return (
    <div className="h-full w-full bg-zinc-950 text-white select-none overflow-hidden flex flex-col md:flex-row">
      
      {/* ========================================================= */}
      {/* LEFT PANE (Desktop) / TOP & BOTTOM SECTIONS (Mobile)     */}
      {/* Contains: Selected Bot Showcase + Match Settings & Play  */}
      {/* ========================================================= */}
      <div className="w-full md:w-[380px] lg:w-[420px] xl:w-[460px] flex flex-col shrink-0 md:border-r border-zinc-800/80 bg-zinc-900/60 md:justify-between md:h-full overflow-hidden">
        
        {/* TOP: Constrained Bot Showcase / Description Panel */}
        <div className="shrink-0 w-full max-h-[220px] md:max-h-[260px] p-4 flex flex-col items-center justify-center border-b border-zinc-800 overflow-hidden bg-zinc-900/40 text-center">
          
          {/* Bot Avatar Badge with DiceBear v10 image */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 mx-auto rounded-full ring-2 ring-zinc-700/60 overflow-hidden bg-zinc-800 flex items-center justify-center shadow-xl transition-all">
              <img
                src={activeBot.avatar}
                alt={activeBot.name}
                className="w-full h-full object-cover rounded-full"
                loading="lazy"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black font-mono bg-[#81b64c] text-zinc-950 border border-zinc-900 shadow-sm z-10">
              {activeBot.rating}
            </span>
          </div>

          {/* Stylized Speech Bubble */}
          <div className="relative bg-zinc-800 border border-zinc-700/80 rounded-2xl px-3.5 py-2 mt-2.5 text-center shadow-lg max-w-xs sm:max-w-sm w-full before:content-[''] before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:border-x-8 before:border-x-transparent before:border-b-8 before:border-b-zinc-800">
            <p className="line-clamp-2 text-xs sm:text-sm text-zinc-300 italic font-medium leading-snug">
              "{activeBot.quote || activeBot.tagline}"
            </p>
            <div className="text-sm sm:text-base font-extrabold text-white mt-1 flex items-center justify-center gap-1.5">
              <span>{activeBot.name}</span>
              <span className="text-xs text-[#81b64c] font-mono font-bold">({activeBot.rating} Elo)</span>
            </div>
          </div>
        </div>

        {/* BOTTOM: Game Settings & Play Button (Desktop: Bottom of Left Pane) */}
        <div className="hidden md:flex shrink-0 w-full p-4 md:p-6 bg-zinc-900 border-t border-zinc-800 flex-col gap-4 z-10 mt-auto">
          
          {/* Color Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider block">
              I Play As
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 h-11 items-center">
              <button
                onClick={() => onSelectColor('w')}
                className={`h-full rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  userColor === 'w'
                    ? 'bg-zinc-800 text-white shadow-xs ring-1 ring-[#81b64c]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-sm">♔</span>
                <span>White</span>
              </button>

              <button
                onClick={() => onSelectColor('random')}
                className={`h-full rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  userColor === 'random'
                    ? 'bg-zinc-800 text-white shadow-xs ring-1 ring-[#81b64c]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#81b64c]" />
                <span>Random</span>
              </button>

              <button
                onClick={() => onSelectColor('b')}
                className={`h-full rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  userColor === 'b'
                    ? 'bg-zinc-800 text-white shadow-xs ring-1 ring-[#81b64c]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-sm">♚</span>
                <span>Black</span>
              </button>
            </div>
          </div>

          {/* Time Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider block">
              Time Control
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {TIME_CONTROLS.map((tc) => {
                const isSelected = selectedTimeControl === tc.seconds;
                return (
                  <button
                    key={tc.seconds}
                    onClick={() => onSelectTimeControl(tc.seconds)}
                    className={`h-10 px-1 rounded-xl text-center text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'bg-zinc-800 border border-[#81b64c] ring-1 ring-[#81b64c] text-white shadow-md'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    {tc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Massive Play Button */}
          <button
            onClick={handlePlayClick}
            className="w-full h-14 bg-[#81b64c] hover:bg-[#96c858] active:scale-98 text-white rounded-xl text-base lg:text-lg font-black shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0"
          >
            <Swords className="w-5 h-5" />
            <span>Play vs {activeBot.name}</span>
            <ChevronRight className="w-5 h-5 opacity-75" />
          </button>
        </div>

      </div>

      {/* ========================================================= */}
      {/* RIGHT PANE (Desktop) / MIDDLE SCROLL (Mobile)             */}
      {/* Contains: Category Filter Tabs + Scrollable Bot Grid      */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 h-full overflow-hidden">
        
        {/* Category Header Tabs */}
        <div className="shrink-0 p-3 sm:p-4 border-b border-zinc-850 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-zinc-800 text-white ring-1 ring-[#81b64c] shadow-xs'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              All (14)
            </button>
            {BOT_CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;
              const count = botList.filter((b) => b.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 text-white ring-1 ring-[#81b64c] shadow-xs'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#81b64c]" />
            <span>250 to 1800 Elo</span>
          </div>
        </div>

        {/* Scrollable Bot Grid - Absorb height changes */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(145px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5 p-6 pb-8">
            {filteredBots.map((bot) => {
              const isSelected = selectedBotId === bot.id;
              return (
                <button
                  key={bot.id}
                  onClick={() => onSelectBot(bot.id)}
                  className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-1.5 hover:shadow-2xl hover:z-20 cursor-pointer group relative text-center ${
                    isSelected
                      ? 'bg-zinc-900 ring-2 sm:ring-3 ring-[#81b64c] shadow-xl'
                      : 'bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Selected Checkmark Badge */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#81b64c] text-zinc-950 flex items-center justify-center shadow-xs z-10">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Circular Avatar with DiceBear v10 Avataaars */}
                  <div
                    className={`w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full ring-2 ring-zinc-700/60 overflow-hidden bg-zinc-800 flex items-center justify-center shadow-inner shrink-0 ${
                      isSelected ? 'ring-[#81b64c]' : ''
                    }`}
                  >
                    <img
                      src={bot.avatar}
                      alt={bot.name}
                      className="w-full h-full object-cover rounded-full"
                      loading="lazy"
                    />
                  </div>

                  {/* Bot Name */}
                  <span className="text-base font-bold text-zinc-100 mt-2 truncate max-w-full">
                    {bot.name}
                  </span>

                  {/* Rating Badge */}
                  <span className="text-xs font-semibold text-zinc-400 mt-0.5 font-mono">
                    {bot.rating} Elo
                  </span>

                  {/* Tagline */}
                  <span className="hidden sm:block text-[11px] text-zinc-500 line-clamp-1 mt-1 font-sans">
                    {bot.tagline}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* MOBILE ONLY BOTTOM CONTROLS (Sticky Bottom on < md)       */}
      {/* ========================================================= */}
      <div className="md:hidden shrink-0 w-full p-3 bg-zinc-900 border-t border-zinc-800 shadow-2xl flex flex-col gap-2.5 z-10">
        
        {/* Color & Time Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Color 3-Way Switch */}
          <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 shrink-0 h-9 items-center">
            <button
              onClick={() => onSelectColor('w')}
              className={`px-2 h-full rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                userColor === 'w'
                  ? 'bg-zinc-800 text-white ring-1 ring-[#81b64c]'
                  : 'text-zinc-400'
              }`}
              title="Play as White"
            >
              <span>♔</span>
              <span className="text-[10px]">White</span>
            </button>
            <button
              onClick={() => onSelectColor('random')}
              className={`px-2 h-full rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                userColor === 'random'
                  ? 'bg-zinc-800 text-white ring-1 ring-[#81b64c]'
                  : 'text-zinc-400'
              }`}
              title="Random Color"
            >
              <HelpCircle className="w-3 h-3 text-[#81b64c]" />
              <span className="text-[10px]">Auto</span>
            </button>
            <button
              onClick={() => onSelectColor('b')}
              className={`px-2 h-full rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                userColor === 'b'
                  ? 'bg-zinc-800 text-white ring-1 ring-[#81b64c]'
                  : 'text-zinc-400'
              }`}
              title="Play as Black"
            >
              <span>♚</span>
              <span className="text-[10px]">Black</span>
            </button>
          </div>

          {/* Time Selector Chips */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 justify-end">
            {TIME_CONTROLS.map((tc) => {
              const isSelected = selectedTimeControl === tc.seconds;
              return (
                <button
                  key={tc.seconds}
                  onClick={() => onSelectTimeControl(tc.seconds)}
                  className={`h-8 px-2 rounded-lg text-center text-[10px] font-bold font-mono transition-all cursor-pointer whitespace-nowrap flex items-center justify-center ${
                    isSelected
                      ? 'bg-zinc-800 border border-[#81b64c] text-white shadow-xs'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400'
                  }`}
                >
                  {tc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Full-Width Mobile Play CTA */}
        <button
          onClick={handlePlayClick}
          className="w-full h-12 bg-[#81b64c] hover:bg-[#96c858] active:scale-98 text-white rounded-xl text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Swords className="w-4 h-4" />
          <span>Play vs {activeBot.name} ({activeBot.rating})</span>
          <ChevronRight className="w-4 h-4 opacity-75" />
        </button>

      </div>

    </div>
  );
}
