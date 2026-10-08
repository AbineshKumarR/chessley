import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import TopNav from './TopNav';
import SetupLobby from './SetupLobby';
import PlayerRibbon from './PlayerRibbon';
import MoveHistory from './MoveHistory';
import GameStatus from './GameStatus';
import PromotionModal from './PromotionModal';
import GameOverModal from './GameOverModal';
import GameHistoryModal from './GameHistoryModal';
import { THEMES, DEFAULT_THEME } from '../constants/themes';
import { BOTS, DEFAULT_BOT_ID } from '../constants/bots';
import { findBestMove, PIECE_VALUES } from '../engine/bot';
import { getUnderAttackSquares, getHangingPieces } from '../engine/threats';
import { saveMatch } from '../utils/storage';
import {
  RotateCcw,
  Flag,
  Undo2,
  Lightbulb,
  Users,
  History
} from 'lucide-react';
import {
  playMove,
  playCapture,
  playCheck,
  playGameOver,
  isSoundMuted,
  setSoundMuted,
  toggleSoundMute
} from '../engine/sound';

/**
 * Check if a color has sufficient mating material under FIDE Art. 6.9.
 */
function hasSufficientMatingMaterial(board, color) {
  let pawns = 0;
  let rooks = 0;
  let queens = 0;
  let minors = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        if (p.type === 'p') pawns++;
        else if (p.type === 'r') rooks++;
        else if (p.type === 'q') queens++;
        else if (p.type === 'b' || p.type === 'n') minors++;
      }
    }
  }

  return pawns > 0 || rooks > 0 || queens > 0 || minors >= 2;
}

export default function ChessGame() {
  // --- View Mode: 'lobby' | 'game' ---
  const [viewMode, setViewMode] = useState('lobby');

  // --- Persistent Preferences ---
  const [theme, setTheme] = useState(() => localStorage.getItem('chess_theme') || DEFAULT_THEME);
  const [botId, setBotId] = useState(() => {
    const saved = localStorage.getItem('chess_bot_id');
    return saved && BOTS[saved] ? saved : DEFAULT_BOT_ID;
  });
  const [timeControl, setTimeControl] = useState(() => {
    const saved = localStorage.getItem('chess_time_control');
    return saved !== null ? Number(saved) : 300;
  });
  const [playerColor, setPlayerColor] = useState(() => {
    const saved = localStorage.getItem('chess_player_color');
    return saved === 'b' ? 'b' : saved === 'random' ? 'random' : 'w';
  });
  const [smartHints, setSmartHints] = useState(() => {
    const saved = localStorage.getItem('chess_smart_hints');
    return saved !== null ? saved === 'true' : true;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('chess_muted');
    const mutedVal = saved === 'true';
    setSoundMuted(mutedVal);
    return mutedVal;
  });

  const effectivePlayerColor = playerColor === 'b' ? 'b' : 'w';
  const effectiveBotColor = effectivePlayerColor === 'w' ? 'b' : 'w';

  const handleSelectTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('chess_theme', newTheme);
  };

  const handleSelectBot = (newBotId) => {
    setBotId(newBotId);
    localStorage.setItem('chess_bot_id', newBotId);
  };

  const handleSelectTimeControl = (newTc) => {
    setTimeControl(newTc);
    localStorage.setItem('chess_time_control', newTc.toString());
    setWhiteTimeMs(newTc * 1000);
    setBlackTimeMs(newTc * 1000);
    setTimeoutWinner(null);
    setIsTimeoutDraw(false);
  };

  const handleToggleSmartHints = () => {
    setSmartHints((prev) => {
      const next = !prev;
      localStorage.setItem('chess_smart_hints', next.toString());
      return next;
    });
  };

  const handleToggleMute = () => {
    const nextMuteState = toggleSoundMute();
    setIsMuted(nextMuteState);
    localStorage.setItem('chess_muted', nextMuteState.toString());
  };

  // --- Persistent Chess.js Engine Instance & Cumulative History ---
  const [game, setGame] = useState(() => new Chess());
  const [gameFen, setGameFen] = useState(() => game.fen());
  const [moveHistory, setMoveHistory] = useState(() => game.history({ verbose: true }));
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Move Stepping / History Position Preview
  const [viewingPlyIndex, setViewingPlyIndex] = useState(null); // null = live game

  // Visual selection & move highlights
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);

  // Pawn Promotion Modal State
  const [pendingPromotion, setPendingPromotion] = useState(null);

  // Post-Game Modal State
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [gameOverResult, setGameOverResult] = useState(null); // { winner: 'w'|'b'|'draw', reason: string }

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Timers & Clocks
  const [whiteTimeMs, setWhiteTimeMs] = useState(timeControl * 1000);
  const [blackTimeMs, setBlackTimeMs] = useState(timeControl * 1000);
  const [timeoutWinner, setTimeoutWinner] = useState(null);
  const [isTimeoutDraw, setIsTimeoutDraw] = useState(false);
  const lastTickRef = useRef(Date.now());

  // Responsive board calculation
  const desktopContainerRef = useRef(null);
  const mobileContainerRef = useRef(null);
  const [desktopBoardWidth, setDesktopBoardWidth] = useState(600);
  const [mobileBoardWidth, setMobileBoardWidth] = useState(360);

  useEffect(() => {
    function handleResize() {
      // Desktop calculation: scaled up to fill space generously
      if (desktopContainerRef.current) {
        const containerW = desktopContainerRef.current.offsetWidth;
        const winH = window.innerHeight;
        const verticalBudget = winH * 0.82 - 90;
        const widthBudget = containerW - 16;
        const calculated = Math.min(widthBudget, verticalBudget, 700);
        setDesktopBoardWidth(Math.max(380, Math.floor(calculated)));
      } else {
        setDesktopBoardWidth(Math.min(window.innerWidth - 32, 600));
      }

      // Mobile calculation: fit within screen width and height budget
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const maxW = winW - 20;
      const maxH = winH - 270;
      const mobileSize = Math.max(260, Math.min(maxW, maxH, 460));
      setMobileBoardWidth(Math.floor(mobileSize));
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const isLiveGameOver = game.isGameOver() || !!timeoutWinner || isTimeoutDraw || (gameOverResult && gameOverResult.winner);
  const isClockActive = timeControl > 0 && moveHistory.length > 0 && !isLiveGameOver && viewMode === 'game';

  // Build History Positions for Stepping (derived from cumulative moveHistory)
  const historyPositions = useMemo(() => {
    if (moveHistory.length === 0) {
      return [gameFen];
    }
    const initialFen = moveHistory[0].before || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    return [initialFen, ...moveHistory.map((m) => m.after)];
  }, [moveHistory, gameFen]);

  // Current display FEN (either live or historical step)
  const displayFen = useMemo(() => {
    if (viewingPlyIndex === null) return gameFen;
    if (viewingPlyIndex === -1) return historyPositions[0];
    return historyPositions[viewingPlyIndex + 1] || gameFen;
  }, [viewingPlyIndex, gameFen, historyPositions]);

  // Save match record automatically upon game completion
  const recordCompletedMatch = useCallback((resultType, reasonText) => {
    const currentBot = BOTS[botId] || BOTS[DEFAULT_BOT_ID];
    let resultLabel = 'Draw';
    if (resultType === effectivePlayerColor) resultLabel = 'Win';
    else if (resultType === effectiveBotColor) resultLabel = 'Loss';

    saveMatch({
      opponentName: currentBot.name,
      opponentRating: currentBot.rating,
      opponentAvatar: currentBot.avatar,
      userColor: effectivePlayerColor,
      result: resultLabel,
      reason: reasonText || 'Game Finished',
      moveCount: Math.ceil(game.history().length / 2),
      pgn: game.pgn() || ''
    });
  }, [botId, effectivePlayerColor, effectiveBotColor, game]);

  // Arrow key navigation for move stepping
  useEffect(() => {
    function handleKeyDown(e) {
      if (viewMode !== 'game') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const movesCount = moveHistory.length;
      if (movesCount === 0) return;

      const currentIndex = viewingPlyIndex !== null ? viewingPlyIndex : movesCount - 1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const nextIdx = currentIndex > -1 ? currentIndex - 1 : -1;
        setViewingPlyIndex(nextIdx);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < movesCount - 1) {
          setViewingPlyIndex(currentIndex + 1);
        } else {
          setViewingPlyIndex(null);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingPlyIndex, moveHistory.length, viewMode]);

  // High-precision clock timer loop
  useEffect(() => {
    if (!isClockActive) {
      lastTickRef.current = Date.now();
      return;
    }

    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      const currentTurn = game.turn();

      if (currentTurn === 'w') {
        setWhiteTimeMs((prev) => {
          const next = prev - delta;
          if (next <= 0) {
            clearInterval(interval);
            const blackCanMate = hasSufficientMatingMaterial(game.board(), 'b');
            if (blackCanMate) {
              setTimeoutWinner('b');
              setGameOverResult({ winner: 'b', reason: 'by Timeout' });
              recordCompletedMatch('b', 'Loss by Timeout');
            } else {
              setIsTimeoutDraw(true);
              setGameOverResult({ winner: 'draw', reason: 'Timeout vs. Insufficient Material' });
              recordCompletedMatch('draw', 'Draw (Timeout vs. Insufficient Material)');
            }
            setIsGameOverModalOpen(true);
            playGameOver();
            return 0;
          }
          return next;
        });
      } else {
        setBlackTimeMs((prev) => {
          const next = prev - delta;
          if (next <= 0) {
            clearInterval(interval);
            const whiteCanMate = hasSufficientMatingMaterial(game.board(), 'w');
            if (whiteCanMate) {
              setTimeoutWinner('w');
              setGameOverResult({ winner: 'w', reason: 'by Timeout' });
              recordCompletedMatch('w', 'Win by Timeout');
            } else {
              setIsTimeoutDraw(true);
              setGameOverResult({ winner: 'draw', reason: 'Timeout vs. Insufficient Material' });
              recordCompletedMatch('draw', 'Draw (Timeout vs. Insufficient Material)');
            }
            setIsGameOverModalOpen(true);
            playGameOver();
            return 0;
          }
          return next;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isClockActive, game, recordCompletedMatch]);

  // Material & captured piece calculations
  const { capturedWhite, capturedBlack, materialScore } = useMemo(() => {
    const startingCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentCounts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
    };

    let whiteMaterial = 0;
    let blackMaterial = 0;

    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        if (piece.type !== 'k') {
          currentCounts[piece.color][piece.type] = (currentCounts[piece.color][piece.type] || 0) + 1;
        }
        if (piece.color === 'w') {
          whiteMaterial += (PIECE_VALUES[piece.type] || 0);
        } else {
          blackMaterial += (PIECE_VALUES[piece.type] || 0);
        }
      }
    }

    const capturedW = [];
    const capturedB = [];

    ['q', 'r', 'b', 'n', 'p'].forEach((type) => {
      const missingBlack = startingCounts[type] - currentCounts.b[type];
      for (let i = 0; i < missingBlack; i++) capturedW.push(type);

      const missingWhite = startingCounts[type] - currentCounts.w[type];
      for (let i = 0; i < missingWhite; i++) capturedB.push(type);
    });

    const diffInPawns = Math.round((whiteMaterial - blackMaterial) / 100);

    return {
      capturedWhite: capturedW,
      capturedBlack: capturedB,
      materialScore: effectivePlayerColor === 'w' ? diffInPawns : -diffInPawns
    };
  }, [gameFen, game, effectivePlayerColor]);

  // Threat & Hanging pieces
  const threats = useMemo(() => {
    if (!smartHints || isLiveGameOver || isBotThinking) {
      return { attacked: [], hanging: [] };
    }
    return {
      attacked: getUnderAttackSquares(game, effectivePlayerColor),
      hanging: getHangingPieces(game, effectivePlayerColor)
    };
  }, [gameFen, game, smartHints, isLiveGameOver, isBotThinking, effectivePlayerColor]);

  // King check highlight square
  const kingInCheckSquare = useMemo(() => {
    if (!game.isCheck()) return null;
    const turn = game.turn();
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          const file = String.fromCharCode(97 + c);
          const rank = 8 - r;
          return `${file}${rank}`;
        }
      }
    }
    return null;
  }, [gameFen, game]);

  const handleSoundEffects = useCallback((moveResult, gameInstance) => {
    if (gameInstance.isGameOver()) {
      playGameOver();
    } else if (gameInstance.isCheck()) {
      playCheck();
    } else if (moveResult && moveResult.captured) {
      playCapture();
    } else {
      playMove();
    }
  }, []);

  // Bot move execution
  const makeBotMove = useCallback(async (overrideGame, overrideBotColor) => {
    const targetGame = overrideGame || game;
    const targetBotColor = overrideBotColor || effectiveBotColor;
    const currentFen = targetGame.fen();
    const fenSide = currentFen.split(' ')[1] || targetGame.turn();
    const gameTurn = targetGame.turn();
    const shouldBotMove = !targetGame.isGameOver() && gameTurn === targetBotColor && !isLiveGameOver;

    if (!shouldBotMove) {
      console.log(`\n[Chess Debug]\nhumanColor=${effectivePlayerColor}\nbotColor=${targetBotColor}\nfen=${currentFen}\nfenSide=${fenSide}\ngameTurn=${gameTurn}\nshouldBotMove=${shouldBotMove}\nengineRequest=N/A\nengineResponse=N/A\nchessMove=N/A\nresultingFen=N/A\n`);
      return;
    }

    setIsBotThinking(true);
    const botConfig = BOTS[botId] || BOTS[DEFAULT_BOT_ID];
    const botGameCopy = new Chess(currentFen);

    try {
      const bestMove = await findBestMove(botGameCopy, botId);
      if (bestMove) {
        const moveArg = {
          from: bestMove.from,
          to: bestMove.to,
          promotion: bestMove.promotion || 'q'
        };

        const moveResult = targetGame.move(moveArg);
        const resultingFen = targetGame.fen();

        console.log(`\n[Chess Debug]\nhumanColor=${effectivePlayerColor}\nbotColor=${targetBotColor}\nfen=${currentFen}\nfenSide=${fenSide}\ngameTurn=${gameTurn}\nshouldBotMove=${shouldBotMove}\nengineRequest=${bestMove.rawRequest || 'N/A'}\nengineResponse=${bestMove.rawResponse || 'N/A'}\nchessMove=${JSON.stringify(moveArg)}\nresultingFen=${resultingFen}\n`);

        if (moveResult) {
          const updatedHistory = targetGame.history({ verbose: true });
          setGameFen(resultingFen);
          setMoveHistory([...updatedHistory]);
          setLastMove({ from: bestMove.from, to: bestMove.to });
          setViewingPlyIndex(null);
          handleSoundEffects(moveResult, targetGame);

          if (targetGame.isGameOver()) {
            if (targetGame.isCheckmate()) {
              setGameOverResult({ winner: targetBotColor, reason: 'by Checkmate' });
              recordCompletedMatch(targetBotColor, 'Loss by Checkmate');
            } else if (targetGame.isStalemate()) {
              setGameOverResult({ winner: 'draw', reason: 'by Stalemate' });
              recordCompletedMatch('draw', 'Draw by Stalemate');
            } else {
              setGameOverResult({ winner: 'draw', reason: 'Game Drawn' });
              recordCompletedMatch('draw', 'Draw');
            }
            setIsGameOverModalOpen(true);
          }
        }
      }
    } catch (err) {
      console.error('[GAME BOT TURN ERROR]', err);
    } finally {
      setIsBotThinking(false);
    }
  }, [game, botId, effectiveBotColor, effectivePlayerColor, handleSoundEffects, isLiveGameOver, recordCompletedMatch]);

  // Human move execution
  const makeAMove = useCallback((move) => {
    if (isLiveGameOver) return false;

    try {
      const moveArg = typeof move === 'string' ? move : {
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q'
      };

      const result = game.move(moveArg);

      if (result) {
        const updatedHistory = game.history({ verbose: true });
        setGameFen(game.fen());
        setMoveHistory([...updatedHistory]);
        setLastMove({ from: result.from, to: result.to });
        setViewingPlyIndex(null);
        setSelectedSquare(null);
        setPossibleMoves([]);
        handleSoundEffects(result, game);

        if (game.isGameOver()) {
          if (game.isCheckmate()) {
            setGameOverResult({ winner: effectivePlayerColor, reason: 'by Checkmate' });
            recordCompletedMatch(effectivePlayerColor, 'Win by Checkmate');
          } else if (game.isStalemate()) {
            setGameOverResult({ winner: 'draw', reason: 'by Stalemate' });
            recordCompletedMatch('draw', 'Draw by Stalemate');
          } else {
            setGameOverResult({ winner: 'draw', reason: 'Game Drawn' });
            recordCompletedMatch('draw', 'Draw');
          }
          setIsGameOverModalOpen(true);
        } else if (game.turn() === effectiveBotColor) {
          setTimeout(() => {
            makeBotMove();
          }, 50);
        }
        return true;
      }
    } catch (err) {
      return false;
    }
    return false;
  }, [game, effectiveBotColor, effectivePlayerColor, isLiveGameOver, handleSoundEffects, makeBotMove, recordCompletedMatch]);

  // Check if move triggers pawn promotion
  const checkIsPromotionMove = (sourceSquare, targetSquare) => {
    const piece = game.get(sourceSquare);
    if (!piece || piece.type !== 'p') return false;

    const isWhitePromotion = piece.color === 'w' && sourceSquare[1] === '7' && targetSquare[1] === '8';
    const isBlackPromotion = piece.color === 'b' && sourceSquare[1] === '2' && targetSquare[1] === '1';

    if (!isWhitePromotion && !isBlackPromotion) return false;

    const legalMoves = game.moves({ verbose: true });
    return legalMoves.some(
      (m) => m.from === sourceSquare && m.to === targetSquare && m.promotion
    );
  };

  const onPieceDrop = (sourceSquare, targetSquare) => {
    if (isBotThinking || game.turn() !== effectivePlayerColor || isLiveGameOver || pendingPromotion) {
      return false;
    }

    if (viewingPlyIndex !== null) {
      setViewingPlyIndex(null);
    }

    if (checkIsPromotionMove(sourceSquare, targetSquare)) {
      setPendingPromotion({
        from: sourceSquare,
        to: targetSquare,
        color: game.turn()
      });
      return false;
    }

    return makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    });
  };

  const onSquareClick = (square) => {
    if (isBotThinking || game.turn() !== effectivePlayerColor || isLiveGameOver || pendingPromotion) {
      return;
    }

    if (viewingPlyIndex !== null) {
      setViewingPlyIndex(null);
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    if (selectedSquare && possibleMoves.includes(square)) {
      if (checkIsPromotionMove(selectedSquare, square)) {
        setPendingPromotion({
          from: selectedSquare,
          to: square,
          color: game.turn()
        });
        return;
      }

      makeAMove({
        from: selectedSquare,
        to: square,
        promotion: 'q'
      });
      return;
    }

    const piece = game.get(square);
    if (piece && piece.color === effectivePlayerColor) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setPossibleMoves(moves.map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const handlePromotionSelect = (pieceType) => {
    if (!pendingPromotion) return;
    const move = {
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: pieceType
    };
    setPendingPromotion(null);
    makeAMove(move);
  };

  const handlePromotionCancel = () => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  const handleNewGame = (overrideBotColor = effectiveBotColor) => {
    const newGame = new Chess();
    setGame(newGame);
    setGameFen(newGame.fen());
    setMoveHistory([]);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setViewingPlyIndex(null);
    setPendingPromotion(null);
    setIsBotThinking(false);
    setTimeoutWinner(null);
    setIsTimeoutDraw(false);
    setGameOverResult(null);
    setIsGameOverModalOpen(false);
    setWhiteTimeMs(timeControl * 1000);
    setBlackTimeMs(timeControl * 1000);

    // If bot plays White, bot makes the first move
    if (overrideBotColor === 'w') {
      setTimeout(() => {
        makeBotMove(newGame, 'w');
      }, 300);
    }
  };

  const handleResign = () => {
    if (isLiveGameOver || isBotThinking || moveHistory.length === 0) return;
    setGameOverResult({ winner: effectiveBotColor, reason: 'by Resignation' });
    setIsGameOverModalOpen(true);
    playGameOver();
    recordCompletedMatch(effectiveBotColor, 'Loss by Resignation');
  };

  const handleUndo = () => {
    if (isBotThinking || isLiveGameOver || pendingPromotion) return;

    const history = game.history();
    if (history.length >= 2) {
      game.undo(); // Undo bot move
      game.undo(); // Undo player move
    } else if (history.length === 1) {
      game.undo();
    } else {
      return;
    }

    const updatedHistory = game.history({ verbose: true });
    setGameFen(game.fen());
    setMoveHistory([...updatedHistory]);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setViewingPlyIndex(null);
    setPendingPromotion(null);

    if (updatedHistory.length > 0) {
      const last = updatedHistory[updatedHistory.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }
  };

  // Instant PGN file export download
  const handleExportPgn = () => {
    const currentBot = BOTS[botId] || BOTS[DEFAULT_BOT_ID];
    const whitePlayer = effectivePlayerColor === 'w' ? 'You' : currentBot.name;
    const blackPlayer = effectivePlayerColor === 'w' ? currentBot.name : 'You';
    const pgnData = game.pgn() || `[Event "Offline Chess Match"]\n[White "${whitePlayer}"]\n[Black "${blackPlayer}"]\n[Result "*"]\n\n*`;
    const blob = new Blob([pgnData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `match-vs-${currentBot.name.toLowerCase()}-${Date.now()}.pgn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartGameFromLobby = (chosenBotId, chosenTc, chosenColor) => {
    handleSelectBot(chosenBotId);
    handleSelectTimeControl(chosenTc);
    setPlayerColor(chosenColor);
    localStorage.setItem('chess_player_color', chosenColor);

    const chosenBotColor = chosenColor === 'w' ? 'b' : 'w';
    setViewMode('game');
    handleNewGame(chosenBotColor);
  };

  // Load a completed match from history for review
  const handleLoadGamePgn = (pgnString, matchInfo) => {
    try {
      const loaded = new Chess();
      loaded.loadPgn(pgnString);
      setGame(loaded);
      setGameFen(loaded.fen());
      setMoveHistory([...loaded.history({ verbose: true })]);
      setViewingPlyIndex(0); // Start reviewing at move 1
      setViewMode('game');
    } catch (err) {
      console.error('Failed to load match PGN:', err);
    }
  };

  const currentTheme = THEMES[theme] || THEMES.emerald;
  const currentBot = BOTS[botId] || BOTS[DEFAULT_BOT_ID];

  let drawReason = '';
  if (game.isDraw()) {
    if (game.isThreefoldRepetition()) drawReason = 'Threefold Repetition';
    else if (game.isInsufficientMaterial()) drawReason = 'Insufficient Material';
    else drawReason = '50-Move Rule';
  }

  // Consistent Square Styles
  const customSquareStyles = useMemo(() => {
    const styles = {};

    // 1. Threat Highlights
    if (smartHints && !isLiveGameOver && viewingPlyIndex === null) {
      threats.attacked.forEach((sq) => {
        styles[sq] = {
          ...styles[sq],
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(239, 68, 68, 0.15) 70%, transparent 100%)',
          borderRadius: '4px'
        };
      });

      threats.hanging.forEach((sq) => {
        styles[sq] = {
          ...styles[sq],
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(239, 68, 68, 0.15) 70%, transparent 100%)',
          boxShadow: 'inset 0 0 10px 2px rgba(239, 68, 68, 0.85)',
          borderRadius: '4px'
        };
      });
    }

    // 2. Last Move Overlay
    if (lastMove && viewingPlyIndex === null) {
      styles[lastMove.from] = {
        ...styles[lastMove.from],
        background: 'rgba(247, 247, 105, 0.38)'
      };
      styles[lastMove.to] = {
        ...styles[lastMove.to],
        background: 'rgba(247, 247, 105, 0.48)'
      };
    }

    // 3. Selected piece square
    if (selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        background: 'rgba(247, 247, 105, 0.55)'
      };
    }

    // 4. Legal destination targets
    possibleMoves.forEach((sq) => {
      const targetPiece = game.get(sq);
      if (targetPiece) {
        styles[sq] = {
          ...styles[sq],
          background: 'radial-gradient(circle, transparent 55%, rgba(239, 68, 68, 0.7) 56%, rgba(239, 68, 68, 0.7) 70%, transparent 71%)',
          borderRadius: '50%'
        };
      } else {
        styles[sq] = {
          ...styles[sq],
          background: smartHints
            ? 'radial-gradient(circle, rgba(74, 222, 128, 0.7) 22%, transparent 23%)'
            : 'radial-gradient(circle, rgba(0, 0, 0, 0.25) 25%, transparent 28%)',
          borderRadius: '50%'
        };
      }
    });

    // 5. King in check
    if (kingInCheckSquare) {
      styles[kingInCheckSquare] = {
        ...styles[kingInCheckSquare],
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.6) 50%, transparent 80%)',
        borderRadius: '50%'
      };
    }

    return styles;
  }, [lastMove, selectedSquare, possibleMoves, kingInCheckSquare, threats, smartHints, viewingPlyIndex, isLiveGameOver, game]);

  // ==========================================
  // VIEW 1: PRE-GAME LOBBY VIEW
  // ==========================================
  if (viewMode === 'lobby') {
    return (
      <div className="h-[100dvh] max-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden select-none">
        <TopNav
          theme={theme}
          onSelectTheme={handleSelectTheme}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onExportPgn={handleExportPgn}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          isInGame={false}
        />
        <main className="flex-1 min-h-0 w-full overflow-hidden flex">
          <SetupLobby
            selectedBotId={botId}
            onSelectBot={handleSelectBot}
            selectedTimeControl={timeControl}
            onSelectTimeControl={handleSelectTimeControl}
            userColor={playerColor}
            onSelectColor={(col) => {
              setPlayerColor(col);
              localStorage.setItem('chess_player_color', col);
            }}
            onStartGame={handleStartGameFromLobby}
            onOpenHistory={() => setIsHistoryModalOpen(true)}
          />
        </main>

        <GameHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          onLoadGamePgn={handleLoadGamePgn}
        />
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE GAME (RESPONSIVE DUAL LAYOUT)
  // ==========================================
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between select-none">
      
      {/* Top Navigation */}
      <TopNav
        theme={theme}
        onSelectTheme={handleSelectTheme}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onExportPgn={handleExportPgn}
        onOpenLobby={() => setViewMode('lobby')}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        isInGame={true}
        botName={currentBot.name}
      />

      {/* MOBILE ACTIVE GAME LAYOUT: Top Nav -> Bot Profile -> Board -> Player Profile -> Ticker -> Action Bar */}
      <div className="lg:hidden flex flex-col h-[calc(100dvh-54px)] justify-between overflow-hidden bg-zinc-950 px-2 py-1.5">
        
        {/* 1. Bot Profile Ribbon (Opponent) */}
        <PlayerRibbon
          isBot
          botId={botId}
          captured={effectivePlayerColor === 'w' ? capturedBlack : capturedWhite}
          color={effectiveBotColor}
          advantage={materialScore}
          timeMs={effectiveBotColor === 'b' ? blackTimeMs : whiteTimeMs}
          isActive={isClockActive && game.turn() === effectiveBotColor}
          hasClock={timeControl > 0}
          isThinking={isBotThinking}
        />

        {/* 2. Board Canvas */}
        <div ref={mobileContainerRef} className="flex-1 flex items-center justify-center relative my-1">
          <div className="relative shadow-2xl border border-[#363431] bg-zinc-950 flex items-center justify-center">
            <Chessboard
              position={displayFen}
              onPieceDrop={onPieceDrop}
              onSquareClick={onSquareClick}
              onPieceDragBegin={(piece, sourceSquare) => {
                if (
                  piece.startsWith(effectivePlayerColor) &&
                  game.turn() === effectivePlayerColor &&
                  !isBotThinking &&
                  !isLiveGameOver &&
                  viewingPlyIndex === null
                ) {
                  setSelectedSquare(sourceSquare);
                  const moves = game.moves({ square: sourceSquare, verbose: true });
                  setPossibleMoves(moves.map((m) => m.to));
                }
              }}
              boardWidth={mobileBoardWidth}
              boardOrientation={effectivePlayerColor === 'w' ? 'white' : 'black'}
              arePremovesAllowed={false}
              isDraggablePiece={({ piece }) =>
                piece.startsWith(effectivePlayerColor) &&
                game.turn() === effectivePlayerColor &&
                !isBotThinking &&
                !isLiveGameOver &&
                !pendingPromotion &&
                viewingPlyIndex === null
              }
              customBoardStyle={{ borderRadius: '0px' }}
              customDarkSquareStyle={{ backgroundColor: currentTheme.darkSquare }}
              customLightSquareStyle={{ backgroundColor: currentTheme.lightSquare }}
              customSquareStyles={customSquareStyles}
              animationDuration={180}
            />

            {/* Interactive Pawn Promotion Modal */}
            <PromotionModal
              isOpen={!!pendingPromotion}
              color={pendingPromotion?.color || effectivePlayerColor}
              theme={currentTheme}
              onSelect={handlePromotionSelect}
              onCancel={handlePromotionCancel}
            />
          </div>
        </div>

        {/* 3. Player Profile Ribbon (User) */}
        <PlayerRibbon
          isBot={false}
          captured={effectivePlayerColor === 'w' ? capturedWhite : capturedBlack}
          color={effectivePlayerColor}
          advantage={materialScore}
          timeMs={effectivePlayerColor === 'w' ? whiteTimeMs : blackTimeMs}
          isActive={isClockActive && game.turn() === effectivePlayerColor}
          hasClock={timeControl > 0}
        />

        {/* 4. Horizontal Auto-scrolling Move History Ticker */}
        <div className="my-1">
          <MoveHistory
            history={moveHistory}
            currentPlyIndex={viewingPlyIndex}
            onStepMove={setViewingPlyIndex}
            isMobileTicker={true}
          />
        </div>

        {/* 5. Mobile Bottom Action Bar */}
        <div className="grid grid-cols-5 gap-1.5 p-2 bg-[#1f1e1b] rounded-xl border border-[#363431]">
          {/* New Game */}
          <button
            onClick={() => handleNewGame()}
            disabled={isBotThinking}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-[#81b64c] hover:bg-[#96c858] text-white font-bold transition-all disabled:opacity-50 cursor-pointer"
            title="New Game"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Rematch</span>
          </button>

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={moveHistory.length === 0 || isBotThinking || isLiveGameOver || !!pendingPromotion}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-[#262522] hover:bg-[#31302c] text-[#8b8985] hover:text-white border border-[#363431] transition-all disabled:opacity-30 cursor-pointer"
            title="Undo move"
          >
            <Undo2 className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Undo</span>
          </button>

          {/* Smart Hints */}
          <button
            onClick={handleToggleSmartHints}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border transition-all cursor-pointer ${
              smartHints
                ? 'bg-[#31302c] border-[#81b64c] text-[#81b64c]'
                : 'bg-[#262522] border-[#363431] text-[#8b8985]'
            }`}
            title="Toggle Smart Hints"
          >
            <Lightbulb className="w-4 h-4" />
            <span className="text-[9px] mt-0.5">Hints</span>
          </button>

          {/* Match History */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-[#262522] hover:bg-[#31302c] text-[#8b8985] hover:text-white border border-[#363431] transition-all cursor-pointer"
            title="Match History"
          >
            <History className="w-4 h-4 text-[#81b64c]" />
            <span className="text-[9px] mt-0.5">History</span>
          </button>

          {/* Change Bot / Lobby */}
          <button
            onClick={() => setViewMode('lobby')}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg bg-[#262522] hover:bg-[#31302c] text-[#8b8985] hover:text-white border border-[#363431] transition-all cursor-pointer"
            title="Change Bot"
          >
            <Users className="w-4 h-4 text-[#81b64c]" />
            <span className="text-[9px] mt-0.5">Bots</span>
          </button>
        </div>
      </div>

      {/* DESKTOP ACTIVE GAME LAYOUT: 8 cols Center-Left Board & Ribbons, 4 cols Right Move History & Actions */}
      <main className="hidden lg:flex flex-1 w-full max-w-7xl mx-auto items-center justify-center p-4 md:p-6">
        <div className="w-full grid grid-cols-12 gap-8 items-center justify-center">
          
          {/* 8 Columns: Center-Left Board & Player Ribbons */}
          <div ref={desktopContainerRef} className="col-span-8 flex flex-col items-center justify-center">
            
            {/* Top Attached Opponent Ribbon */}
            <PlayerRibbon
              isBot
              botId={botId}
              captured={effectivePlayerColor === 'w' ? capturedBlack : capturedWhite}
              color={effectiveBotColor}
              advantage={materialScore}
              timeMs={effectiveBotColor === 'b' ? blackTimeMs : whiteTimeMs}
              isActive={isClockActive && game.turn() === effectiveBotColor}
              hasClock={timeControl > 0}
              isThinking={isBotThinking}
            />

            {/* Board Canvas (Scaled up and centered) */}
            <div className="relative shadow-2xl border-x border-[#363431] bg-zinc-950 flex items-center justify-center">
              <Chessboard
                position={displayFen}
                onPieceDrop={onPieceDrop}
                onSquareClick={onSquareClick}
                onPieceDragBegin={(piece, sourceSquare) => {
                  if (
                    piece.startsWith(effectivePlayerColor) &&
                    game.turn() === effectivePlayerColor &&
                    !isBotThinking &&
                    !isLiveGameOver &&
                    viewingPlyIndex === null
                  ) {
                    setSelectedSquare(sourceSquare);
                    const moves = game.moves({ square: sourceSquare, verbose: true });
                    setPossibleMoves(moves.map((m) => m.to));
                  }
                }}
                boardWidth={desktopBoardWidth}
                boardOrientation={effectivePlayerColor === 'w' ? 'white' : 'black'}
                arePremovesAllowed={false}
                isDraggablePiece={({ piece }) =>
                  piece.startsWith(effectivePlayerColor) &&
                  game.turn() === effectivePlayerColor &&
                  !isBotThinking &&
                  !isLiveGameOver &&
                  !pendingPromotion &&
                  viewingPlyIndex === null
                }
                customBoardStyle={{ borderRadius: '0px' }}
                customDarkSquareStyle={{ backgroundColor: currentTheme.darkSquare }}
                customLightSquareStyle={{ backgroundColor: currentTheme.lightSquare }}
                customSquareStyles={customSquareStyles}
                animationDuration={180}
              />

              {/* Interactive Pawn Promotion Modal */}
              <PromotionModal
                isOpen={!!pendingPromotion}
                color={pendingPromotion?.color || effectivePlayerColor}
                theme={currentTheme}
                onSelect={handlePromotionSelect}
                onCancel={handlePromotionCancel}
              />
            </div>

            {/* Bottom Attached Player Ribbon */}
            <PlayerRibbon
              isBot={false}
              captured={effectivePlayerColor === 'w' ? capturedWhite : capturedBlack}
              color={effectivePlayerColor}
              advantage={materialScore}
              timeMs={effectivePlayerColor === 'w' ? whiteTimeMs : blackTimeMs}
              isActive={isClockActive && game.turn() === effectivePlayerColor}
              hasClock={timeControl > 0}
            />
          </div>

          {/* 4 Columns: Right Sidebar (Move History 2-Column Table, Status & Actions) */}
          <div className="col-span-4 h-full min-h-[580px] xl:min-h-[640px] flex flex-col justify-between space-y-4">
            
            {/* Real-time Status Card */}
            <GameStatus
              turn={game.turn()}
              isCheck={game.isCheck()}
              isCheckmate={game.isCheckmate()}
              isStalemate={game.isStalemate()}
              isDraw={game.isDraw()}
              drawReason={drawReason}
              timeoutWinner={timeoutWinner}
              isTimeoutDraw={isTimeoutDraw}
              isBotThinking={isBotThinking}
            />

            {/* 2-Column Move Notation Table with Stepper (fills available height) */}
            <div className="flex-1 min-h-[320px] flex flex-col">
              <MoveHistory
                history={moveHistory}
                currentPlyIndex={viewingPlyIndex}
                onStepMove={setViewingPlyIndex}
                isMobileTicker={false}
              />
            </div>

            {/* Sticky Action Footer */}
            <div className="p-3.5 bg-[#1f1e1b] rounded-2xl border border-[#363431] space-y-2.5 shadow-lg">
              {/* Massive Green New Game CTA */}
              <button
                onClick={() => handleNewGame()}
                disabled={isBotThinking}
                className="w-full py-3.5 px-4 rounded-xl font-black text-sm text-white bg-[#81b64c] hover:bg-[#96c858] active:scale-98 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>New Game / Rematch</span>
              </button>

              {/* Action Toolbar */}
              <div className="grid grid-cols-5 gap-1.5">
                {/* Resign */}
                <button
                  onClick={handleResign}
                  disabled={isBotThinking || moveHistory.length === 0 || isLiveGameOver}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-[#262522] hover:bg-[#31302c] text-[#8b8985] hover:text-[#cc3333] border border-[#363431] transition-all disabled:opacity-30 cursor-pointer"
                  title="Resign Match"
                >
                  <Flag className="w-4 h-4" />
                </button>

                {/* Undo */}
                <button
                  onClick={handleUndo}
                  disabled={moveHistory.length === 0 || isBotThinking || isLiveGameOver || !!pendingPromotion}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-[#262522] hover:bg-[#31302c] text-[#8b8985] hover:text-white border border-[#363431] transition-all disabled:opacity-30 cursor-pointer"
                  title="Undo Move"
                >
                  <Undo2 className="w-4 h-4" />
                </button>

                {/* Hints */}
                <button
                  onClick={handleToggleSmartHints}
                  className={`flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    smartHints
                      ? 'bg-[#31302c] border-[#81b64c] text-[#81b64c]'
                      : 'bg-[#262522] border-[#363431] text-[#8b8985] hover:text-white'
                  }`}
                  title={smartHints ? 'Smart Hints: ON' : 'Smart Hints: OFF'}
                >
                  <Lightbulb className="w-4 h-4" />
                </button>

                {/* History */}
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-[#262522] hover:bg-[#31302c] text-[#8b8985] hover:text-white border border-[#363431] transition-all cursor-pointer"
                  title="Completed Match History"
                >
                  <History className="w-4 h-4 text-[#81b64c]" />
                </button>

                {/* Change Bot / Lobby */}
                <button
                  onClick={() => setViewMode('lobby')}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-[#262522] hover:bg-[#31302c] text-[#8b8985] hover:text-white border border-[#363431] transition-all cursor-pointer"
                  title="Change Opponent Bot"
                >
                  <Users className="w-4 h-4 text-[#81b64c]" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Post-Game Outcome Modal */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        winner={gameOverResult?.winner}
        reason={gameOverResult?.reason}
        botId={botId}
        moveCount={Math.ceil(moveHistory.length / 2)}
        onNewGame={() => handleNewGame()}
        onReviewMoves={() => setIsGameOverModalOpen(false)}
        onClose={() => setIsGameOverModalOpen(false)}
      />

      {/* Completed Match History Modal */}
      <GameHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onLoadGamePgn={handleLoadGamePgn}
      />
    </div>
  );
}
