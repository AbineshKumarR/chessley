import React, { useEffect, useRef } from 'react';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Responsive Move History supporting:
 * 1. Desktop 2-column table with interactive stepper
 * 2. Mobile horizontal auto-scrolling ticker
 */
export default function MoveHistory({
  history = [],
  currentPlyIndex = null, // null = latest live position; number 0..N-1 = past move preview; -1 = start
  onStepMove, // (index: number | null) => void
  isMobileTicker = false
}) {
  const scrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  // Group cumulative moves into pairs (White & Black)
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: history[i],
      whiteIndex: i,
      black: history[i + 1] || null,
      blackIndex: i + 1 < history.length ? i + 1 : null
    });
  }

  const activeIndex = currentPlyIndex !== null ? currentPlyIndex : history.length - 1;

  // Auto-scroll desktop container to bottom
  useEffect(() => {
    if (scrollRef.current && currentPlyIndex === null) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length, currentPlyIndex]);

  // Auto-scroll mobile ticker container to right
  useEffect(() => {
    if (mobileScrollRef.current && currentPlyIndex === null) {
      mobileScrollRef.current.scrollLeft = mobileScrollRef.current.scrollWidth;
    }
  }, [history.length, currentPlyIndex]);

  // Stepper navigation handlers
  const handleFirst = () => {
    if (history.length > 0) onStepMove(-1); // -1 = starting board position before move 1
  };

  const handlePrev = () => {
    if (history.length === 0) return;
    const target = activeIndex > -1 ? activeIndex - 1 : -1;
    onStepMove(target);
  };

  const handleNext = () => {
    if (history.length === 0) return;
    if (activeIndex < history.length - 1) {
      onStepMove(activeIndex + 1);
    } else {
      onStepMove(null); // Return to live position
    }
  };

  const handleLast = () => {
    onStepMove(null); // Live position
  };

  // --- MOBILE HORIZONTAL TICKER ---
  if (isMobileTicker) {
    return (
      <div className="w-full flex items-center justify-between gap-1.5 px-2 py-1.5 bg-[#21201d] border-y border-[#363431] text-xs font-mono select-none">
        {/* Step Prev Button */}
        <button
          onClick={handlePrev}
          disabled={history.length === 0 || activeIndex === -1}
          className="p-1.5 rounded-lg bg-[#262522] text-[#8b8985] hover:text-white disabled:opacity-30 shrink-0 cursor-pointer"
          title="Previous move"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Horizontal Scrollable Move Strip */}
        <div
          ref={mobileScrollRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
        >
          {movePairs.length === 0 ? (
            <span className="text-[11px] text-[#8b8985] italic font-sans px-2">
              Moves will appear here
            </span>
          ) : (
            movePairs.map((pair) => {
              const isWhiteActive = activeIndex === pair.whiteIndex;
              const isBlackActive = activeIndex === pair.blackIndex;

              return (
                <div
                  key={pair.number}
                  className="flex items-center gap-1 bg-[#262522] px-2 py-1 rounded-md border border-[#3d3b37] shrink-0 text-xs"
                >
                  <span className="text-[11px] text-zinc-500 font-bold">{pair.number}.</span>
                  
                  {/* White move */}
                  <button
                    onClick={() => onStepMove(pair.whiteIndex)}
                    className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      isWhiteActive ? 'bg-[#484643] text-white ring-1 ring-[#81b64c]' : 'text-zinc-200 hover:text-white'
                    }`}
                  >
                    {pair.white?.san || pair.white}
                  </button>

                  {/* Black move */}
                  {pair.black && (
                    <button
                      onClick={() => onStepMove(pair.blackIndex)}
                      className={`px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        isBlackActive ? 'bg-[#484643] text-white ring-1 ring-[#81b64c]' : 'text-zinc-200 hover:text-white'
                      }`}
                    >
                      {pair.black?.san || pair.black}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Step Next Button */}
        <button
          onClick={handleNext}
          disabled={history.length === 0 || currentPlyIndex === null}
          className="p-1.5 rounded-lg bg-[#262522] text-[#8b8985] hover:text-white disabled:opacity-30 shrink-0 cursor-pointer"
          title="Next move"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // --- DESKTOP 2-COLUMN TABLE & STEPPER ---
  return (
    <div className="flex flex-col h-[600px] bg-[#262522] border border-[#3d3b37] rounded-xl overflow-hidden text-[#e1dfda] select-none shadow-lg">
      {/* 2-Column Header */}
      <div className="flex items-center px-4 py-2.5 bg-[#1f1e1b] border-b border-[#363431] text-xs font-extrabold text-zinc-400 uppercase tracking-wider">
        <span className="w-12">#</span>
        <span className="flex-1">White</span>
        <span className="flex-1">Black</span>
      </div>

      {/* Scrollable Move Table (Expanded height with comfortable padding & readable text) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1 font-mono text-sm"
      >
        {movePairs.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[220px] text-xs text-[#8b8985] italic font-sans">
            Moves will accumulate here as you play.
          </div>
        ) : (
          movePairs.map((pair, index) => {
            const isWhiteActive = activeIndex === pair.whiteIndex;
            const isBlackActive = activeIndex === pair.blackIndex;

            return (
              <div
                key={pair.number}
                className={`flex items-center px-3 py-1.5 rounded-lg transition-colors ${
                  index % 2 === 0 ? 'bg-[#21201d]' : 'bg-[#262522]'
                } hover:bg-[#31302c]`}
              >
                {/* Column 1: Move Number */}
                <span className="w-12 text-xs font-bold text-zinc-500 shrink-0">
                  {pair.number}.
                </span>

                {/* Column 2: White Move */}
                <button
                  onClick={() => onStepMove(pair.whiteIndex)}
                  className={`flex-1 text-left px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer truncate mr-1.5 ${
                    isWhiteActive
                      ? 'bg-[#363431] text-white ring-1 ring-[#81b64c] shadow-xs'
                      : 'text-[#e1dfda] hover:bg-[#383632]'
                  }`}
                  title={`Move ${pair.number}: White plays ${pair.white?.san || pair.white}`}
                >
                  {pair.white?.san || pair.white}
                </button>

                {/* Column 3: Black Move */}
                {pair.black ? (
                  <button
                    onClick={() => onStepMove(pair.blackIndex)}
                    className={`flex-1 text-left px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer truncate ${
                      isBlackActive
                        ? 'bg-[#363431] text-white ring-1 ring-[#81b64c] shadow-xs'
                        : 'text-[#e1dfda] hover:bg-[#383632]'
                    }`}
                    title={`Move ${pair.number}: Black plays ${pair.black?.san || pair.black}`}
                  >
                    {pair.black?.san || pair.black}
                  </button>
                ) : (
                  <span className="flex-1 text-[#52504c] px-2.5">—</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Stepper Navigation Bar: |< < > >| */}
      <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1f1e1b] border-t border-[#363431]">
        <button
          onClick={handleFirst}
          disabled={history.length === 0 || activeIndex === -1}
          className="p-2 rounded-lg hover:bg-[#31302c] active:bg-[#383632] text-[#8b8985] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          title="First Move (Start)"
        >
          <ChevronFirst className="w-4 h-4" />
        </button>

        <button
          onClick={handlePrev}
          disabled={history.length === 0 || activeIndex === -1}
          className="p-2 rounded-lg hover:bg-[#31302c] active:bg-[#383632] text-[#8b8985] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          title="Previous Move (Left Arrow)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleNext}
          disabled={history.length === 0 || currentPlyIndex === null}
          className="p-2 rounded-lg hover:bg-[#31302c] active:bg-[#383632] text-[#8b8985] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          title="Next Move (Right Arrow)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={handleLast}
          disabled={history.length === 0 || currentPlyIndex === null}
          className="p-2 rounded-lg hover:bg-[#31302c] active:bg-[#383632] text-[#8b8985] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          title="Current Position (Live)"
        >
          <ChevronLast className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
