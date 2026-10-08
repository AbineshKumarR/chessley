import { BOTS, DEFAULT_BOT_ID } from '../constants/bots';

export const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

/**
 * Determine timeMs safety limit based on bot rating tier.
 */
function getTimeMsForBot(botConfig) {
  const rating = botConfig.rating || 1000;
  if (rating <= 700) return 800;       // Beginner: ~800ms
  if (rating <= 1300) return 1400;     // Intermediate: ~1400ms
  return 2000;                         // Advanced: ~2000ms
}

/**
 * Find the best move for the selected bot profile using 100% Native C++ engine.
 * @param {Chess} game - Instance of Chess.js
 * @param {string|object} botOrConfig - Bot ID (e.g. 'martin', 'nelson', 'wojtek') or Bot config object
 * @returns {Promise<object|null>} Chosen move object
 */
export async function findBestMove(game, botOrConfig = DEFAULT_BOT_ID) {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  const botConfig = typeof botOrConfig === 'string'
    ? BOTS[botOrConfig] || BOTS[DEFAULT_BOT_ID]
    : botOrConfig || BOTS[DEFAULT_BOT_ID];

  const fen = game.fen();

  // Diagnostics:
  console.log(`[STAGE B1: bot.js] FEN Passed from Gameplay: "${fen}"`);
  console.log(`[STAGE B2: bot.js] Bot Config Actually Used:`, JSON.stringify(botConfig));

  const windowAvailable = typeof window !== 'undefined';
  const engineAvailable = windowAvailable && !!window.chessEngine && window.chessEngine.isAvailable === true;

  console.log(`[STAGE B CHECK: bot.js] typeof window !== 'undefined': ${windowAvailable} | window.chessEngine present: ${!!(windowAvailable && window.chessEngine)} | isAvailable: ${engineAvailable}`);

  // Strictly check that Native C++ Engine is exposed via IPC
  if (!engineAvailable) {
    console.error('[STAGE B FAILURE] window.chessEngine is NOT available! Check if running inside Electron window.');
    throw new Error('Chessley Native C++ Engine is not available. JS fallbacks are strictly disabled.');
  }

  const timeMs = getTimeMsForBot(botConfig);
  const searchParams = {
    targetDepth: botConfig.searchDepth || 5,
    timeMs,
    maxEvalLoss: botConfig.maxEvalLoss !== undefined ? botConfig.maxEvalLoss : 0,
    usePST: botConfig.usePST !== false,
    useBook: botConfig.useBook !== false,
    queenBonus: !!botConfig.queenAttackBonus
  };

  console.log(`[STAGE B3: bot.js] targetDepth Actually Passed: ${searchParams.targetDepth}`);
  console.log(`[STAGE B4: bot.js] timeMs Actually Passed: ${searchParams.timeMs}`);
  console.log(`[STAGE B5: bot.js] maxEvalLoss Actually Passed: ${searchParams.maxEvalLoss}`);

  try {
    const result = await window.chessEngine.search(fen, searchParams);

    console.log(`[STAGE F: bot.js <- preload] IPC Search Result Received by bot.js:`, JSON.stringify(result));

    if (!result || result.error || !result.from || !result.to) {
      throw new Error(`Native C++ Engine search failed for position: ${result ? result.error : 'No response'}`);
    }

    const match = legalMoves.find(m =>
      m.from === result.from &&
      m.to === result.to &&
      (result.promotion ? m.promotion === result.promotion : true)
    );

    if (!match) {
      throw new Error(`Native C++ Engine returned move ${result.from}${result.to} which is illegal in chess.js`);
    }

    console.log(`[STAGE B10: bot.js] Move Returned by bot.js: from="${match.from}", to="${match.to}", promo="${match.promotion || ''}"`);

    return {
      ...match,
      rawRequest: result.rawRequest,
      rawResponse: result.rawResponse
    };
  } catch (err) {
    console.error('Chessley Native C++ Engine error in bot.js:', err);
    throw err;
  }
}
