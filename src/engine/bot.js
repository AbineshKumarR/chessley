import { getPieceSquareScore } from './pst';
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
 * Check if the position is in endgame phase.
 */
function isEndgamePosition(board) {
  let whiteQueenCount = 0;
  let blackQueenCount = 0;
  let whiteMinorMajorCount = 0;
  let blackMinorMajorCount = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      if (piece.type === 'q') {
        if (piece.color === 'w') whiteQueenCount++;
        else blackQueenCount++;
      } else if (piece.type !== 'p' && piece.type !== 'k') {
        if (piece.color === 'w') whiteMinorMajorCount++;
        else blackMinorMajorCount++;
      }
    }
  }

  const whiteNoQueen = whiteQueenCount === 0;
  const blackNoQueen = blackQueenCount === 0;
  const whiteQueenSingleMinor = whiteQueenCount === 1 && whiteMinorMajorCount <= 1;
  const blackQueenSingleMinor = blackQueenCount === 1 && blackMinorMajorCount <= 1;

  return (whiteNoQueen || whiteQueenSingleMinor) && (blackNoQueen || blackQueenSingleMinor);
}

/**
 * Static evaluation function of the chess board.
 * Positive score = White advantage, Negative score = Black advantage.
 * @param {Chess} game - Instance of Chess
 * @param {boolean} usePST - Whether to include piece-square table bonuses
 * @param {boolean} queenAttackBonus - Aggressive queen bonus (Nelson)
 * @returns {number} Score in centipawns
 */
export function evaluateBoard(game, usePST = true, queenAttackBonus = false) {
  if (game.isGameOver()) {
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? -100000 : 100000;
    }
    if (game.isDraw()) {
      return 0;
    }
  }

  const board = game.board();
  const isEndgame = isEndgamePosition(board);
  let totalEvaluation = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece) continue;

      const pieceValue = PIECE_VALUES[piece.type] || 0;
      const positionalBonus = usePST ? getPieceSquareScore(piece.type, piece.color, row, col, isEndgame) : 0;
      let pieceScore = pieceValue + positionalBonus;

      // Nelson queen attack heuristic: extra aggression for black queen development
      if (queenAttackBonus && piece.type === 'q' && piece.color === 'b' && row > 1) {
        pieceScore += 45;
      }

      if (piece.color === 'w') {
        totalEvaluation += pieceScore;
      } else {
        totalEvaluation -= pieceScore;
      }
    }
  }

  return totalEvaluation;
}

/**
 * Score moves for MVV-LVA Move Ordering in Alpha-Beta search.
 */
function scoreMoveForOrdering(move) {
  let score = 0;

  // Most Valuable Victim - Least Valuable Attacker (MVV-LVA)
  if (move.captured) {
    const victimValue = PIECE_VALUES[move.captured] || 100;
    const attackerValue = PIECE_VALUES[move.piece] || 100;
    score += 1000 + (victimValue * 10 - attackerValue);
  }

  // Pawn promotion priority
  if (move.promotion) {
    score += 900;
  }

  // Check moves
  if (move.san && move.san.includes('+')) {
    score += 500;
  }

  return score;
}

/**
 * Order moves to maximize Alpha-Beta branch cutoffs.
 */
function orderMoves(moves) {
  return moves
    .map(move => ({ move, score: scoreMoveForOrdering(move) }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.move);
}

/**
 * Fast Minimax Search with Alpha-Beta Pruning.
 * Maximum depth capped strictly at 3 ply for rapid execution (<100ms).
 */
function searchAlphaBeta(game, depth, alpha, beta, isMaximizing, config) {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game, config.usePST, config.queenAttackBonus);
  }

  const rawMoves = game.moves({ verbose: true });
  const moves = orderMoves(rawMoves);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const evaluation = searchAlphaBeta(game, depth - 1, alpha, beta, false, config);
      game.undo();

      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break; // Alpha-beta cutoff
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const evaluation = searchAlphaBeta(game, depth - 1, alpha, beta, true, config);
      game.undo();

      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        break; // Alpha-beta cutoff
      }
    }
    return minEval;
  }
}

/**
 * Find the best move for the selected bot profile.
 * - Strict max depth of 3-ply
 * - Configurable blunder rate & evaluation noise
 * - Natural artificial thinking delay between 250ms and 450ms
 * @param {Chess} game - Instance of Chess
 * @param {string|object} botOrConfig - Bot ID (e.g. 'martin', 'nelson', 'wojtek') or Bot config object
 * @returns {Promise<object|null>} Chosen move object
 */
export async function findBestMove(game, botOrConfig = DEFAULT_BOT_ID) {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  // Resolve bot configuration
  const botConfig = typeof botOrConfig === 'string'
    ? BOTS[botOrConfig] || BOTS[DEFAULT_BOT_ID]
    : botOrConfig || BOTS[DEFAULT_BOT_ID];

  // Strictly cap search depth to 3 ply
  const effectiveDepth = Math.min(Math.max(botConfig.depth || 1, 1), 3);

  // Natural artificial thinking delay between 250ms and 450ms
  const thinkingTime = Math.floor(Math.random() * 200) + 250;

  return new Promise(resolve => {
    setTimeout(() => {
      // 1. Check for intentional blunder / uncalculated move based on blunderRate
      if (botConfig.blunderRate > 0 && Math.random() < botConfig.blunderRate) {
        const randomIndex = Math.floor(Math.random() * legalMoves.length);
        resolve(legalMoves[randomIndex]);
        return;
      }

      // 2. Run Alpha-Beta search
      let bestMove = legalMoves[0];
      let bestScore = Infinity; // Black minimizes
      let alpha = -Infinity;
      let beta = Infinity;

      const orderedMoves = orderMoves(legalMoves);

      for (const move of orderedMoves) {
        game.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });

        let score = 0;
        if (effectiveDepth <= 1) {
          score = evaluateBoard(game, botConfig.usePST, botConfig.queenAttackBonus);
        } else {
          score = searchAlphaBeta(game, effectiveDepth - 1, alpha, beta, true, botConfig);
        }

        // Add evaluation noise for beginner / intermediate tiers
        if (botConfig.evalNoise > 0) {
          const noise = (Math.random() - 0.5) * 2 * botConfig.evalNoise;
          score += noise;
        }

        game.undo();

        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }

        beta = Math.min(beta, bestScore);
      }

      resolve(bestMove || legalMoves[0]);
    }, thinkingTime);
  });
}
