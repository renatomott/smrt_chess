import { create } from 'zustand';
import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js';
import type {
  GameMode,
  CameraPreset,
  MoveInfo,
  CapturedPieces,
  MaterialAdvantage,
  GameStatus,
  ClockSettings,
  ClockPreset,
} from '../game/chessTypes';
import { stockfishService } from '../engine/stockfishService';
import type { ComputerDifficulty, HintResult } from '../engine/engineTypes';
import { peerService } from '../net/peerService';
import type { NetConnectionStatus, NetMessage } from '../net/netTypes';
import {
  playMoveSound,
  playCaptureSound,
  playCastlingSound,
  playCheckSound,
  playCheckmateSound,
  playDrawSound,
  playPromoteSound,
} from '../utils/soundEffects';

interface PendingPromotion {
  from: Square;
  to: Square;
  color: Color;
}

export interface SecondaryMoveAnimation {
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
}

export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const CLOCK_PRESETS_CONFIG: Record<ClockPreset, { initialSeconds: number; incrementSeconds: number }> = {
  none: { initialSeconds: 0, incrementSeconds: 0 },
  '1+0': { initialSeconds: 60, incrementSeconds: 0 },
  '3+2': { initialSeconds: 180, incrementSeconds: 2 },
  '5+0': { initialSeconds: 300, incrementSeconds: 0 },
  '10+0': { initialSeconds: 600, incrementSeconds: 0 },
  '15+10': { initialSeconds: 900, incrementSeconds: 10 },
  custom: { initialSeconds: 600, incrementSeconds: 5 },
};

interface GameState {
  chess: Chess;
  fen: string;
  turn: Color;
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  secondaryMove: SecondaryMoveAnimation | null;
  enPassantCapturedSquare: Square | null;
  moveHistory: MoveInfo[];
  historyViewIndex: number | null; // null means live position
  capturedPieces: CapturedPieces;
  materialAdvantage: MaterialAdvantage;
  status: GameStatus;
  // Game mode & Computer AI
  gameMode: GameMode;
  playerColorChoice: 'w' | 'b' | 'random';
  assignedPlayerColor: Color;
  computerDifficulty: import('../engine/engineTypes').ComputerDifficulty;
  isComputerThinking: boolean;
  activeHint: import('../engine/engineTypes').HintResult | null;
  isModeModalOpen: boolean;

  // Online P2P Multiplayer
  netStatus: NetConnectionStatus;
  netRoomCode: string | null;
  netIsHost: boolean;
  netLatency: number;
  isOnlineModalOpen: boolean;
  isDrawOfferModalOpen: boolean;
  isRematchOfferModalOpen: boolean;
  drawOfferSent: boolean;
  rematchOfferSent: boolean;

  autoRotateBoard: boolean;
  cameraPreset: CameraPreset;
  pendingPromotion: PendingPromotion | null;
  soundEnabled: boolean;

  // Themes
  whiteThemeId: string;
  blackThemeId: string;
  isThemeModalOpen: boolean;

  // New features: Rules guide & Position loader & Post-Game Review
  isRulesModalOpen: boolean;
  isLoadPositionModalOpen: boolean;
  isReviewModalOpen: boolean;
  setIsRulesModalOpen: (open: boolean) => void;
  setIsLoadPositionModalOpen: (open: boolean) => void;
  setIsReviewModalOpen: (open: boolean) => void;
  loadFEN: (fen: string) => boolean;
  loadPGN: (pgn: string) => boolean;

  // Clocks
  clockSettings: ClockSettings;
  whiteTime: number; // in seconds
  blackTime: number; // in seconds
  isClockRunning: boolean;
  isClockModalOpen: boolean;

  // Actions
  selectSquare: (square: Square | null) => void;
  makeMove: (from: Square, to: Square, promotion?: PieceSymbol, isRemote?: boolean) => boolean;
  handleSquareClick: (square: Square) => void;
  confirmPromotion: (piece: PieceSymbol) => void;
  cancelPromotion: () => void;
  undoMove: () => boolean;
  resetGame: () => void;
  setAutoRotateBoard: (enabled: boolean) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setGameMode: (mode: GameMode) => void;
  toggleSound: () => void;

  // AI & Mode Actions
  setIsModeModalOpen: (open: boolean) => void;
  startVsComputer: (difficulty: import('../engine/engineTypes').ComputerDifficulty, color: 'w' | 'b' | 'random') => void;
  startPvpLocal: () => void;
  requestHint: () => Promise<void>;
  dismissHint: () => void;
  triggerComputerMoveIfNeeded: () => Promise<void>;

  // Online Multiplayer Actions
  setIsOnlineModalOpen: (open: boolean) => void;
  setIsDrawOfferModalOpen: (open: boolean) => void;
  setIsRematchOfferModalOpen: (open: boolean) => void;
  createOnlineRoom: (code?: string) => Promise<string>;
  joinOnlineRoom: (code: string) => Promise<void>;
  leaveOnlineRoom: () => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  declineDraw: () => void;
  resignOnlineGame: () => void;
  offerRematch: () => void;
  acceptRematch: () => void;
  declineRematch: () => void;

  // Clock Actions
  setClockSettings: (settings: ClockSettings) => void;
  setIsClockModalOpen: (open: boolean) => void;
  tickClock: (deltaSeconds: number) => void;

  // Move review actions
  setHistoryViewIndex: (index: number | null) => void;
  returnToLiveGame: () => void;

  // Theme actions
  setWhiteTheme: (themeId: string) => void;
  setBlackTheme: (themeId: string) => void;
  setMatchThemes: (whiteThemeId: string, blackThemeId: string) => void;
  setIsThemeModalOpen: (open: boolean) => void;
}

function calculateCapturedAndMaterial(history: MoveInfo[]): {
  captured: CapturedPieces;
  advantage: MaterialAdvantage;
} {
  const captured: CapturedPieces = { w: [], b: [] };
  let whiteCapturedScore = 0; // Black pieces captured by White
  let blackCapturedScore = 0; // White pieces captured by Black

  for (const move of history) {
    if (move.captured) {
      if (move.color === 'w') {
        captured.b.push(move.captured);
        whiteCapturedScore += PIECE_VALUES[move.captured] || 0;
      } else {
        captured.w.push(move.captured);
        blackCapturedScore += PIECE_VALUES[move.captured] || 0;
      }
    }
  }

  const whiteAdv = Math.max(0, whiteCapturedScore - blackCapturedScore);
  const blackAdv = Math.max(0, blackCapturedScore - whiteCapturedScore);

  return {
    captured,
    advantage: { white: whiteAdv, black: blackAdv },
  };
}

function getGameStatus(chess: Chess, isTimeout = false, timeoutWinner?: Color): GameStatus {
  if (isTimeout) {
    return {
      isOver: true,
      isCheck: chess.inCheck(),
      isCheckmate: false,
      isStalemate: false,
      isDraw: false,
      isTimeout: true,
      winner: timeoutWinner,
    };
  }

  const isOver = chess.isGameOver();
  const isCheckmate = chess.isCheckmate();
  const isStalemate = chess.isStalemate();
  const isCheck = chess.inCheck();
  const isDraw = chess.isDraw();

  let drawReason: GameStatus['drawReason'] = null;
  if (isDraw) {
    if (isStalemate) drawReason = 'stalemate';
    else if (chess.isThreefoldRepetition()) drawReason = 'threefold';
    else if (chess.isInsufficientMaterial()) drawReason = 'insufficient-material';
    else drawReason = 'fifty-moves';
  }

  let winner: GameStatus['winner'] = null;
  if (isCheckmate) {
    winner = chess.turn() === 'w' ? 'b' : 'w';
  } else if (isDraw) {
    winner = 'draw';
  }

  return {
    isOver,
    isCheck,
    isCheckmate,
    isStalemate,
    isDraw,
    isTimeout: false,
    drawReason,
    winner,
  };
}

const DEFAULT_CLOCK_SETTING: ClockSettings = {
  preset: '10+0',
  initialSeconds: 600,
  incrementSeconds: 0,
};

export const useGameStore = create<GameState>((set, get) => {
  const initialChess = new Chess();
  const initialData = calculateCapturedAndMaterial([]);

  return {
    chess: initialChess,
    fen: initialChess.fen(),
    turn: 'w',
    selectedSquare: null,
    legalMoves: [],
    lastMove: null,
    secondaryMove: null,
    enPassantCapturedSquare: null,
    moveHistory: [],
    historyViewIndex: null,
    capturedPieces: initialData.captured,
    materialAdvantage: initialData.advantage,
    status: getGameStatus(initialChess),

    // Game mode & AI
    gameMode: 'pvp_local',
    playerColorChoice: 'w',
    assignedPlayerColor: 'w',
    computerDifficulty: 'casual',
    isComputerThinking: false,
    activeHint: null,
    isModeModalOpen: false,

    // Online P2P Multiplayer
    netStatus: 'disconnected',
    netRoomCode: null,
    netIsHost: false,
    netLatency: 0,
    isOnlineModalOpen: false,
    isDrawOfferModalOpen: false,
    isRematchOfferModalOpen: false,
    drawOfferSent: false,
    rematchOfferSent: false,

    autoRotateBoard: false,
    cameraPreset: 'default',
    pendingPromotion: null,
    soundEnabled: true,

    // Themes
    whiteThemeId: typeof window !== 'undefined' ? localStorage.getItem('chess3d_white_theme') || 'classic' : 'classic',
    blackThemeId: typeof window !== 'undefined' ? localStorage.getItem('chess3d_black_theme') || 'classic' : 'classic',
    isThemeModalOpen: false,

    // New features: Rules guide & Position loader & Post-Game Review
    isRulesModalOpen: false,
    isLoadPositionModalOpen: false,
    isReviewModalOpen: false,

    // Clock
    clockSettings: DEFAULT_CLOCK_SETTING,
    whiteTime: DEFAULT_CLOCK_SETTING.initialSeconds,
    blackTime: DEFAULT_CLOCK_SETTING.initialSeconds,
    isClockRunning: false,
    isClockModalOpen: false,

    selectSquare: (square) => {
      const {
        chess,
        status,
        historyViewIndex,
        gameMode,
        assignedPlayerColor,
        isComputerThinking,
        netStatus,
      } = get();
      if (status.isOver || historyViewIndex !== null || isComputerThinking) return;

      if (gameMode === 'vs_computer' && chess.turn() !== assignedPlayerColor) {
        return;
      }

      if (gameMode === 'pvp_online') {
        if (netStatus !== 'connected' || chess.turn() !== assignedPlayerColor) {
          return;
        }
      }

      if (!square) {
        set({ selectedSquare: null, legalMoves: [] });
        return;
      }

      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        const moves = chess.moves({ square, verbose: true });
        const legalDestinations = moves.map((m) => m.to as Square);
        set({ selectedSquare: square, legalMoves: legalDestinations });
      } else {
        set({ selectedSquare: null, legalMoves: [] });
      }
    },

    handleSquareClick: (targetSquare: Square) => {
      const {
        chess,
        selectedSquare,
        legalMoves,
        selectSquare,
        makeMove,
        status,
        historyViewIndex,
        returnToLiveGame,
        gameMode,
        assignedPlayerColor,
        isComputerThinking,
        netStatus,
      } = get();

      if (historyViewIndex !== null) {
        returnToLiveGame();
        return;
      }

      if (status.isOver || isComputerThinking) return;

      if (gameMode === 'vs_computer' && chess.turn() !== assignedPlayerColor) {
        return;
      }

      if (gameMode === 'pvp_online') {
        if (netStatus !== 'connected' || chess.turn() !== assignedPlayerColor) {
          return;
        }
      }

      if (selectedSquare) {
        if (selectedSquare === targetSquare) {
          selectSquare(null);
          return;
        }

        if (legalMoves.includes(targetSquare)) {
          const piece = chess.get(selectedSquare);
          const isPawn = piece && piece.type === 'p';
          const isPromotionRank =
            (piece?.color === 'w' && targetSquare[1] === '8') ||
            (piece?.color === 'b' && targetSquare[1] === '1');

          if (isPawn && isPromotionRank) {
            set({
              pendingPromotion: {
                from: selectedSquare,
                to: targetSquare,
                color: piece.color,
              },
            });
            return;
          }

          makeMove(selectedSquare, targetSquare);
          return;
        }

        const targetPiece = chess.get(targetSquare);
        if (targetPiece && targetPiece.color === chess.turn()) {
          selectSquare(targetSquare);
          return;
        }

        selectSquare(null);
      } else {
        const piece = chess.get(targetSquare);
        if (piece && piece.color === chess.turn()) {
          selectSquare(targetSquare);
        }
      }
    },

    confirmPromotion: (promotionPiece: PieceSymbol) => {
      const { pendingPromotion, makeMove } = get();
      if (!pendingPromotion) return;
      makeMove(pendingPromotion.from, pendingPromotion.to, promotionPiece);
      set({ pendingPromotion: null });
    },

    cancelPromotion: () => {
      set({ pendingPromotion: null, selectedSquare: null, legalMoves: [] });
    },

    makeMove: (from, to, promotion = 'q', isRemote = false) => {
      const {
        chess,
        moveHistory,
        clockSettings,
        whiteTime,
        blackTime,
        gameMode,
        assignedPlayerColor,
      } = get();

      const movingPiece = chess.get(from);
      const isCastling =
        movingPiece?.type === 'k' && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) > 1;

      const isEnPassant =
        movingPiece?.type === 'p' &&
        from[0] !== to[0] &&
        !chess.get(to);

      let epCapturedSq: Square | null = null;
      if (isEnPassant) {
        epCapturedSq = `${to[0]}${from[1]}` as Square;
      }

      let secMove: SecondaryMoveAnimation | null = null;
      if (isCastling) {
        if (to === 'g1') secMove = { from: 'h1', to: 'f1', piece: 'r', color: 'w' };
        else if (to === 'c1') secMove = { from: 'a1', to: 'd1', piece: 'r', color: 'w' };
        else if (to === 'g8') secMove = { from: 'h8', to: 'f8', piece: 'r', color: 'b' };
        else if (to === 'c8') secMove = { from: 'a8', to: 'd8', piece: 'r', color: 'b' };
      }

      try {
        const moveResult = chess.move({
          from,
          to,
          promotion,
        });

        if (!moveResult) return false;

        const updatedHistory: MoveInfo[] = [
          ...moveHistory,
          {
            from: moveResult.from as Square,
            to: moveResult.to as Square,
            piece: moveResult.piece,
            color: moveResult.color,
            san: moveResult.san,
            captured: moveResult.captured,
            isCheck: chess.inCheck(),
            isCheckmate: chess.isCheckmate(),
            fenAfter: chess.fen(),
          },
        ];

        const updatedStatus = getGameStatus(chess);
        const { captured, advantage } = calculateCapturedAndMaterial(updatedHistory);

        let nextWhiteTime = whiteTime;
        let nextBlackTime = blackTime;
        if (clockSettings.preset !== 'none') {
          if (moveResult.color === 'w') {
            nextWhiteTime += clockSettings.incrementSeconds;
          } else {
            nextBlackTime += clockSettings.incrementSeconds;
          }
        }

        const shouldRunClock =
          clockSettings.preset !== 'none' && !updatedStatus.isOver;

        set({
          fen: chess.fen(),
          turn: chess.turn(),
          selectedSquare: null,
          legalMoves: [],
          lastMove: { from, to },
          secondaryMove: secMove,
          enPassantCapturedSquare: epCapturedSq,
          moveHistory: updatedHistory,
          historyViewIndex: null,
          capturedPieces: captured,
          materialAdvantage: advantage,
          status: updatedStatus,
          whiteTime: nextWhiteTime,
          blackTime: nextBlackTime,
          isClockRunning: shouldRunClock,
          activeHint: null,
        });

        // Play procedural physical sound effects
        if (get().soundEnabled) {
          if (updatedStatus.isCheckmate) {
            playCheckmateSound();
          } else if (updatedStatus.isDraw) {
            playDrawSound();
          } else if (updatedStatus.isCheck) {
            playCheckSound();
          } else if (isCastling) {
            playCastlingSound();
          } else if (moveResult.captured || epCapturedSq) {
            playCaptureSound();
          } else if (moveResult.promotion) {
            playPromoteSound();
          } else {
            playMoveSound();
          }
        }

        // Broadcast to Peer if online and not a remote incoming move
        if (gameMode === 'pvp_online' && !isRemote) {
          peerService.sendMessage({
            type: 'MOVE',
            from,
            to,
            promotion,
          });

          if (get().netIsHost) {
            peerService.sendMessage({
              type: 'SYNC_TIME',
              whiteTime: nextWhiteTime,
              blackTime: nextBlackTime,
            });
          }
        }

        // Trigger AI move if game is vs computer and it is now the computer's turn
        if (gameMode === 'vs_computer' && chess.turn() !== assignedPlayerColor && !updatedStatus.isOver) {
          setTimeout(() => {
            get().triggerComputerMoveIfNeeded();
          }, 50);
        }

        return true;
      } catch {
        return false;
      }
    },

    triggerComputerMoveIfNeeded: async () => {
      const {
        gameMode,
        assignedPlayerColor,
        chess,
        status,
        computerDifficulty,
        makeMove,
        isComputerThinking,
      } = get();

      if (gameMode !== 'vs_computer' || status.isOver || isComputerThinking) return;
      if (chess.turn() === assignedPlayerColor) return;

      set({ isComputerThinking: true });

      const bestMove = await stockfishService.getBestMove(chess.fen(), computerDifficulty);

      set({ isComputerThinking: false });

      if (bestMove && !get().status.isOver) {
        makeMove(bestMove.from, bestMove.to, bestMove.promotion || 'q');
      }
    },

    requestHint: async () => {
      const { chess, status, isComputerThinking } = get();
      if (status.isOver || isComputerThinking) return;

      const hint = await stockfishService.getHint(chess.fen());
      if (hint) {
        set({ activeHint: hint });
      }
    },

    dismissHint: () => {
      set({ activeHint: null });
    },

    undoMove: () => {
      const { chess, moveHistory, gameMode, assignedPlayerColor } = get();
      if (moveHistory.length === 0) return false;

      // In vs_computer mode, undo 2 plies if it is player's turn, so it stays player's turn
      let movesToUndo = 1;
      if (gameMode === 'vs_computer' && chess.turn() === assignedPlayerColor && moveHistory.length >= 2) {
        movesToUndo = 2;
      }

      for (let i = 0; i < movesToUndo; i++) {
        chess.undo();
      }

      const updatedHistory = moveHistory.slice(0, -movesToUndo);
      const prevMove =
        updatedHistory.length > 0 ? updatedHistory[updatedHistory.length - 1] : null;

      const { captured, advantage } = calculateCapturedAndMaterial(updatedHistory);
      const updatedStatus = getGameStatus(chess);

      stockfishService.stopThinking();

      set({
        fen: chess.fen(),
        turn: chess.turn(),
        selectedSquare: null,
        legalMoves: [],
        lastMove: prevMove ? { from: prevMove.from, to: prevMove.to } : null,
        secondaryMove: null,
        enPassantCapturedSquare: null,
        moveHistory: updatedHistory,
        historyViewIndex: null,
        capturedPieces: captured,
        materialAdvantage: advantage,
        status: updatedStatus,
        pendingPromotion: null,
        isComputerThinking: false,
        activeHint: null,
        isClockRunning: updatedHistory.length > 0 && !updatedStatus.isOver,
      });

      return true;
    },

    startVsComputer: (difficulty, color) => {
      const assigned = color === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : color;
      const { clockSettings } = get();
      const freshChess = new Chess();
      const { captured, advantage } = calculateCapturedAndMaterial([]);

      stockfishService.stopThinking();

      set({
        chess: freshChess,
        fen: freshChess.fen(),
        turn: 'w',
        selectedSquare: null,
        legalMoves: [],
        lastMove: null,
        secondaryMove: null,
        enPassantCapturedSquare: null,
        moveHistory: [],
        historyViewIndex: null,
        capturedPieces: captured,
        materialAdvantage: advantage,
        status: getGameStatus(freshChess),
        pendingPromotion: null,
        whiteTime: clockSettings.initialSeconds,
        blackTime: clockSettings.initialSeconds,
        isClockRunning: false,
        gameMode: 'vs_computer',
        playerColorChoice: color,
        assignedPlayerColor: assigned,
        computerDifficulty: difficulty,
        isComputerThinking: false,
        activeHint: null,
        isModeModalOpen: false,
        cameraPreset: assigned === 'b' ? 'black' : 'white',
      });

      // If human is Black, computer is White and must make the first move
      if (assigned === 'b') {
        setTimeout(() => {
          get().triggerComputerMoveIfNeeded();
        }, 600);
      }
    },

    startPvpLocal: () => {
      const { clockSettings } = get();
      const freshChess = new Chess();
      const { captured, advantage } = calculateCapturedAndMaterial([]);

      stockfishService.stopThinking();

      set({
        chess: freshChess,
        fen: freshChess.fen(),
        turn: 'w',
        selectedSquare: null,
        legalMoves: [],
        lastMove: null,
        secondaryMove: null,
        enPassantCapturedSquare: null,
        moveHistory: [],
        historyViewIndex: null,
        capturedPieces: captured,
        materialAdvantage: advantage,
        status: getGameStatus(freshChess),
        pendingPromotion: null,
        whiteTime: clockSettings.initialSeconds,
        blackTime: clockSettings.initialSeconds,
        isClockRunning: false,
        gameMode: 'pvp_local',
        isComputerThinking: false,
        activeHint: null,
        isModeModalOpen: false,
        cameraPreset: 'default',
      });
    },

    resetGame: () => {
      const { clockSettings, gameMode, assignedPlayerColor } = get();
      const freshChess = new Chess();
      const { captured, advantage } = calculateCapturedAndMaterial([]);

      stockfishService.stopThinking();

      set({
        chess: freshChess,
        fen: freshChess.fen(),
        turn: 'w',
        selectedSquare: null,
        legalMoves: [],
        lastMove: null,
        secondaryMove: null,
        enPassantCapturedSquare: null,
        moveHistory: [],
        historyViewIndex: null,
        capturedPieces: captured,
        materialAdvantage: advantage,
        status: getGameStatus(freshChess),
        pendingPromotion: null,
        whiteTime: clockSettings.initialSeconds,
        blackTime: clockSettings.initialSeconds,
        isClockRunning: false,
        isComputerThinking: false,
        activeHint: null,
      });

      if (gameMode === 'vs_computer' && assignedPlayerColor === 'b') {
        setTimeout(() => {
          get().triggerComputerMoveIfNeeded();
        }, 600);
      }
    },

    setClockSettings: (newSettings) => {
      set({
        clockSettings: newSettings,
        whiteTime: newSettings.initialSeconds,
        blackTime: newSettings.initialSeconds,
        isClockRunning: false,
        isClockModalOpen: false,
      });
    },

    setIsClockModalOpen: (open) => set({ isClockModalOpen: open }),
    setIsModeModalOpen: (open) => set({ isModeModalOpen: open }),

    // Theme Actions
    setIsThemeModalOpen: (open) => set({ isThemeModalOpen: open }),
    setWhiteTheme: (themeId) => {
      if (typeof window !== 'undefined') localStorage.setItem('chess3d_white_theme', themeId);
      set({ whiteThemeId: themeId });
    },
    setBlackTheme: (themeId) => {
      if (typeof window !== 'undefined') localStorage.setItem('chess3d_black_theme', themeId);
      set({ blackThemeId: themeId });
    },
    setMatchThemes: (whiteThemeId, blackThemeId) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('chess3d_white_theme', whiteThemeId);
        localStorage.setItem('chess3d_black_theme', blackThemeId);
      }
      set({ whiteThemeId, blackThemeId });
    },

    tickClock: (deltaSeconds: number) => {
      const {
        isClockRunning,
        turn,
        whiteTime,
        blackTime,
        clockSettings,
        chess,
        status,
      } = get();

      if (!isClockRunning || clockSettings.preset === 'none' || status.isOver) return;

      if (turn === 'w') {
        const nextTime = Math.max(0, whiteTime - deltaSeconds);
        if (nextTime <= 0) {
          set({
            whiteTime: 0,
            isClockRunning: false,
            status: getGameStatus(chess, true, 'b'),
          });
        } else {
          set({ whiteTime: nextTime });
        }
      } else {
        const nextTime = Math.max(0, blackTime - deltaSeconds);
        if (nextTime <= 0) {
          set({
            blackTime: 0,
            isClockRunning: false,
            status: getGameStatus(chess, true, 'w'),
          });
        } else {
          set({ blackTime: nextTime });
        }
      }
    },

    setHistoryViewIndex: (index: number | null) => {
      const { moveHistory } = get();
      if (index === null || index >= moveHistory.length - 1) {
        set({
          historyViewIndex: null,
          selectedSquare: null,
          legalMoves: [],
        });
        return;
      }

      set({
        historyViewIndex: index,
        selectedSquare: null,
        legalMoves: [],
      });
    },

    returnToLiveGame: () => {
      set({
        historyViewIndex: null,
        selectedSquare: null,
        legalMoves: [],
      });
    },

    // Online Multiplayer Actions
    setIsOnlineModalOpen: (open) => set({ isOnlineModalOpen: open }),
    setIsDrawOfferModalOpen: (open) => set({ isDrawOfferModalOpen: open }),
    setIsRematchOfferModalOpen: (open) => set({ isRematchOfferModalOpen: open }),

    createOnlineRoom: async (customCode?: string) => {
      const { resetGame } = get();
      resetGame();
      setupPeerListeners(set, get);
      const code = await peerService.createRoom(customCode);
      set({
        gameMode: 'pvp_online',
        netRoomCode: code,
        netIsHost: true,
        assignedPlayerColor: 'w',
        cameraPreset: 'white',
        netStatus: 'hosting_waiting',
      });
      return code;
    },

    joinOnlineRoom: async (code: string) => {
      const { resetGame } = get();
      resetGame();
      setupPeerListeners(set, get);
      await peerService.joinRoom(code);
      set({
        gameMode: 'pvp_online',
        netRoomCode: code.toUpperCase(),
        netIsHost: false,
        assignedPlayerColor: 'b',
        cameraPreset: 'black',
        netStatus: 'connecting',
      });
    },

    leaveOnlineRoom: () => {
      peerService.disconnect();
      set({
        gameMode: 'pvp_local',
        netStatus: 'disconnected',
        netRoomCode: null,
        netIsHost: false,
        cameraPreset: 'default',
        isOnlineModalOpen: false,
      });
      get().resetGame();
    },

    offerDraw: () => {
      peerService.sendMessage({ type: 'OFFER_DRAW' });
      set({ drawOfferSent: true });
    },

    acceptDraw: () => {
      peerService.sendMessage({ type: 'ACCEPT_DRAW' });
      const currentStatus = get().status;
      set({
        isDrawOfferModalOpen: false,
        status: {
          ...currentStatus,
          isOver: true,
          isDraw: true,
          winner: 'draw',
          drawReason: null,
        },
      });
    },

    declineDraw: () => {
      peerService.sendMessage({ type: 'DECLINE_DRAW' });
      set({ isDrawOfferModalOpen: false });
    },

    resignOnlineGame: () => {
      peerService.sendMessage({ type: 'RESIGN' });
      const currentStatus = get().status;
      const opponentColor = get().assignedPlayerColor === 'w' ? 'b' : 'w';
      set({
        status: {
          ...currentStatus,
          isOver: true,
          winner: opponentColor,
        },
      });
    },

    offerRematch: () => {
      peerService.sendMessage({ type: 'OFFER_REMATCH' });
      set({ rematchOfferSent: true });
    },

    acceptRematch: () => {
      peerService.sendMessage({ type: 'ACCEPT_REMATCH' });
      const newColor = get().assignedPlayerColor === 'w' ? 'b' : 'w';
      set({ isRematchOfferModalOpen: false, rematchOfferSent: false });
      get().resetGame();
      set({
        assignedPlayerColor: newColor,
        cameraPreset: newColor === 'b' ? 'black' : 'white',
      });
    },

    declineRematch: () => {
      peerService.sendMessage({ type: 'DECLINE_REMATCH' });
      set({ isRematchOfferModalOpen: false });
    },

    setAutoRotateBoard: (enabled) => set({ autoRotateBoard: enabled }),
    setCameraPreset: (preset) => set({ cameraPreset: preset }),
    setGameMode: (mode) => set({ gameMode: mode }),
    toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

    setIsRulesModalOpen: (open: boolean) => set({ isRulesModalOpen: open }),
    setIsLoadPositionModalOpen: (open: boolean) => set({ isLoadPositionModalOpen: open }),
    setIsReviewModalOpen: (open: boolean) => set({ isReviewModalOpen: open }),

    loadFEN: (fenString: string) => {
      try {
        const testChess = new Chess();
        testChess.load(fenString.trim());
        const { captured, advantage } = calculateCapturedAndMaterial([]);
        stockfishService.stopThinking();
        set({
          chess: testChess,
          fen: testChess.fen(),
          turn: testChess.turn(),
          selectedSquare: null,
          legalMoves: [],
          lastMove: null,
          secondaryMove: null,
          enPassantCapturedSquare: null,
          moveHistory: [],
          historyViewIndex: null,
          capturedPieces: captured,
          materialAdvantage: advantage,
          status: getGameStatus(testChess),
          pendingPromotion: null,
          isClockRunning: false,
          isLoadPositionModalOpen: false,
        });
        return true;
      } catch {
        return false;
      }
    },

    loadPGN: (pgnString: string) => {
      try {
        const testChess = new Chess();
        testChess.loadPgn(pgnString.trim());
        const historyVerbose = testChess.history({ verbose: true });
        const replayChess = new Chess();
        const rebuiltHistory: MoveInfo[] = [];

        for (const m of historyVerbose) {
          const res = replayChess.move({ from: m.from, to: m.to, promotion: m.promotion });
          if (res) {
            rebuiltHistory.push({
              from: res.from as Square,
              to: res.to as Square,
              piece: res.piece,
              color: res.color,
              san: res.san,
              captured: res.captured,
              isCheck: replayChess.inCheck(),
              isCheckmate: replayChess.isCheckmate(),
              fenAfter: replayChess.fen(),
            });
          }
        }

        const { captured, advantage } = calculateCapturedAndMaterial(rebuiltHistory);
        stockfishService.stopThinking();
        set({
          chess: replayChess,
          fen: replayChess.fen(),
          turn: replayChess.turn(),
          selectedSquare: null,
          legalMoves: [],
          lastMove:
            rebuiltHistory.length > 0
              ? {
                  from: rebuiltHistory[rebuiltHistory.length - 1].from,
                  to: rebuiltHistory[rebuiltHistory.length - 1].to,
                }
              : null,
          secondaryMove: null,
          enPassantCapturedSquare: null,
          moveHistory: rebuiltHistory,
          historyViewIndex: null,
          capturedPieces: captured,
          materialAdvantage: advantage,
          status: getGameStatus(replayChess),
          pendingPromotion: null,
          isClockRunning: false,
          isLoadPositionModalOpen: false,
        });
        return true;
      } catch {
        return false;
      }
    },
  };
});

function setupPeerListeners(set: any, get: any) {
  peerService.onStatusChange = (status) => {
    set({ netStatus: status });
    if (status === 'connected') {
      const state = get();
      if (state.netIsHost) {
        peerService.sendMessage({
          type: 'INIT_SYNC',
          clockSettings: state.clockSettings,
          hostColor: state.assignedPlayerColor,
          fen: state.fen,
        });
      }
    }
  };

  peerService.onLatencyChange = (latency) => {
    set({ netLatency: latency });
  };

  peerService.onMessage = (msg) => {
    const state = get();

    if (msg.type === 'INIT_SYNC') {
      const guestColor = msg.hostColor === 'w' ? 'b' : 'w';
      set({
        clockSettings: msg.clockSettings,
        assignedPlayerColor: guestColor,
        cameraPreset: guestColor === 'b' ? 'black' : 'white',
        whiteTime: msg.clockSettings.initialSeconds,
        blackTime: msg.clockSettings.initialSeconds,
      });
    } else if (msg.type === 'MOVE') {
      get().makeMove(msg.from, msg.to, msg.promotion, true);
    } else if (msg.type === 'SYNC_TIME') {
      set({
        whiteTime: msg.whiteTime,
        blackTime: msg.blackTime,
      });
    } else if (msg.type === 'OFFER_DRAW') {
      set({ isDrawOfferModalOpen: true });
    } else if (msg.type === 'ACCEPT_DRAW') {
      set({
        drawOfferSent: false,
        status: {
          ...state.status,
          isOver: true,
          isDraw: true,
          winner: 'draw',
          drawReason: null,
        },
      });
    } else if (msg.type === 'DECLINE_DRAW') {
      set({ drawOfferSent: false });
    } else if (msg.type === 'RESIGN') {
      set({
        status: {
          ...state.status,
          isOver: true,
          winner: state.assignedPlayerColor,
        },
      });
    } else if (msg.type === 'OFFER_REMATCH') {
      set({ isRematchOfferModalOpen: true });
    } else if (msg.type === 'ACCEPT_REMATCH') {
      const newColor = state.assignedPlayerColor === 'w' ? 'b' : 'w';
      set({ rematchOfferSent: false });
      state.resetGame();
      set({
        assignedPlayerColor: newColor,
        cameraPreset: newColor === 'b' ? 'black' : 'white',
      });
    } else if (msg.type === 'DECLINE_REMATCH') {
      set({ rematchOfferSent: false });
    }
  };
}

