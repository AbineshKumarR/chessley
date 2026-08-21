import { PIECE_VALUES } from './bot';

/**
 * Coordinate helpers:
 * 0,0 is a8 (rank 8, file a); 7,7 is h1 (rank 1, file h).
 */
export function toSquare(row, col) {
  const file = String.fromCharCode(97 + col);
  const rank = 8 - row;
  return `${file}${rank}`;
}

export function toCoords(square) {
  const col = square.charCodeAt(0) - 97;
  const row = 8 - parseInt(square[1], 10);
  return { row, col };
}

export function isInsideBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/**
 * Get all squares attacked by a piece of specified color and type at (row, col).
 */
export function getAttacksFromSquare(board, row, col, type, color) {
  const attacks = [];
  const forward = color === 'w' ? -1 : 1;

  if (type === 'p') {
    // Pawn attacks diagonally forward
    const leftCol = col - 1;
    const rightCol = col + 1;
    const targetRow = row + forward;

    if (isInsideBoard(targetRow, leftCol)) {
      attacks.push({ row: targetRow, col: leftCol });
    }
    if (isInsideBoard(targetRow, rightCol)) {
      attacks.push({ row: targetRow, col: rightCol });
    }
  } else if (type === 'n') {
    // Knight attacks 8 L-shapes
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (isInsideBoard(nr, nc)) {
        attacks.push({ row: nr, col: nc });
      }
    }
  } else if (type === 'k') {
    // King attacks 8 adjacent squares
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (isInsideBoard(nr, nc)) {
          attacks.push({ row: nr, col: nc });
        }
      }
    }
  } else {
    // Sliding pieces (Bishop, Rook, Queen)
    const directions = [];
    if (type === 'b' || type === 'q') {
      directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (type === 'r' || type === 'q') {
      directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }

    for (const [dr, dc] of directions) {
      let nr = row + dr;
      let nc = col + dc;
      while (isInsideBoard(nr, nc)) {
        attacks.push({ row: nr, col: nc });
        // Ray stops upon hitting any piece
        if (board[nr][nc]) {
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  }

  return attacks;
}

/**
 * Returns a map of squareName -> Array of attacking piece objects { row, col, type, color, value }
 */
export function getAttackersMap(board, attackingColor) {
  const attackersMap = {};

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === attackingColor) {
        const attackedSquares = getAttacksFromSquare(board, r, c, piece.type, attackingColor);
        for (const target of attackedSquares) {
          const sqName = toSquare(target.row, target.col);
          if (!attackersMap[sqName]) {
            attackersMap[sqName] = [];
          }
          attackersMap[sqName].push({
            row: r,
            col: c,
            type: piece.type,
            color: attackingColor,
            value: PIECE_VALUES[piece.type] || 100
          });
        }
      }
    }
  }

  return attackersMap;
}

/**
 * Checks whether a specific piece on a square is hanging:
 * - Actively attacked by the enemy
 * - Completely undefended OR defended by strictly higher-value pieces against lower-value attackers
 * @param {Chess} game - chess.js instance
 * @param {string} square - square notation, e.g. 'e4'
 * @returns {boolean}
 */
export function isPieceHanging(game, square) {
  const piece = game.get(square);
  if (!piece || piece.type === 'k') return false;

  const enemyColor = piece.color === 'w' ? 'b' : 'w';
  const board = game.board();
  const enemyAttackers = getAttackersMap(board, enemyColor)[square];

  if (!enemyAttackers || enemyAttackers.length === 0) {
    return false;
  }

  const friendlyDefenders = getAttackersMap(board, piece.color)[square] || [];
  const pieceValue = PIECE_VALUES[piece.type] || 100;

  // Case 1: Completely undefended
  if (friendlyDefenders.length === 0) {
    return true;
  }

  // Case 2: An attacker of strictly lower value threatens this piece (e.g. Pawn attacking a Knight)
  const lowestAttackerValue = Math.min(...enemyAttackers.map(a => a.value));
  if (lowestAttackerValue < pieceValue) {
    return true;
  }

  // Case 3: Piece is defended ONLY by pieces of higher value and attacker count >= defender count
  const lowestDefenderValue = Math.min(...friendlyDefenders.map(d => d.value));
  if (lowestDefenderValue > pieceValue && enemyAttackers.length >= friendlyDefenders.length) {
    return true;
  }

  return false;
}

/**
 * Scans all friendly pieces and identifies squares actively attacked by enemy pieces.
 * @param {Chess} game - chess.js instance
 * @param {string} playerColor - 'w' or 'b'
 * @returns {string[]} List of square names under attack (e.g., ['e4', 'f7'])
 */
export function getUnderAttackSquares(game, playerColor = 'w') {
  const enemyColor = playerColor === 'w' ? 'b' : 'w';
  const board = game.board();
  const enemyAttackers = getAttackersMap(board, enemyColor);

  const attackedSquares = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === playerColor && piece.type !== 'k') {
        const sqName = toSquare(r, c);
        if (enemyAttackers[sqName] && enemyAttackers[sqName].length > 0) {
          attackedSquares.push(sqName);
        }
      }
    }
  }

  return attackedSquares;
}

/**
 * Detects attacked pieces that are hanging (undefended or under-defended).
 * @param {Chess} game - chess.js instance
 * @param {string} playerColor - 'w' or 'b'
 * @returns {string[]} List of square names of hanging pieces
 */
export function getHangingPieces(game, playerColor = 'w') {
  const board = game.board();
  const hangingSquares = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === playerColor && piece.type !== 'k') {
        const sqName = toSquare(r, c);
        if (isPieceHanging(game, sqName)) {
          hangingSquares.push(sqName);
        }
      }
    }
  }

  return hangingSquares;
}
