import React, { useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessSceneManager } from '../three/ChessScene';
import { useGameStore } from '../store/gameStore';

export const ChessCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<ChessSceneManager | null>(null);

  const chess = useGameStore((state) => state.chess);
  const fen = useGameStore((state) => state.fen);
  const turn = useGameStore((state) => state.turn);
  const selectedSquare = useGameStore((state) => state.selectedSquare);
  const legalMoves = useGameStore((state) => state.legalMoves);
  const lastMove = useGameStore((state) => state.lastMove);
  const secondaryMove = useGameStore((state) => state.secondaryMove);
  const enPassantCapturedSquare = useGameStore((state) => state.enPassantCapturedSquare);
  const status = useGameStore((state) => state.status);
  const cameraPreset = useGameStore((state) => state.cameraPreset);
  const autoRotateBoard = useGameStore((state) => state.autoRotateBoard);
  const handleSquareClick = useGameStore((state) => state.handleSquareClick);
  const historyViewIndex = useGameStore((state) => state.historyViewIndex);
  const moveHistory = useGameStore((state) => state.moveHistory);

  const whiteThemeId = useGameStore((state) => state.whiteThemeId);
  const blackThemeId = useGameStore((state) => state.blackThemeId);

  // Initialize scene once
  useEffect(() => {
    if (!mountRef.current) return;

    const manager = new ChessSceneManager(mountRef.current, (sq) => {
      handleSquareClick(sq);
    });

    manager.setThemes(whiteThemeId, blackThemeId);
    sceneManagerRef.current = manager;

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, [handleSquareClick]);

  // Sync themes to 3D scene on theme changes
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setThemes(whiteThemeId, blackThemeId);
  }, [whiteThemeId, blackThemeId]);

  const activeHint = useGameStore((state) => state.activeHint);

  // Sync pieces and board highlights when game state or history navigation changes
  useEffect(() => {
    if (!sceneManagerRef.current) return;

    let currentBoard = chess.board();
    let currentInCheck = status.isCheck;
    let currentTurn = turn;
    let currentLastMove = lastMove;

    if (historyViewIndex !== null && moveHistory[historyViewIndex]) {
      const historicItem = moveHistory[historyViewIndex];
      const tempChess = new Chess(historicItem.fenAfter);
      currentBoard = tempChess.board();
      currentInCheck = tempChess.inCheck();
      currentTurn = tempChess.turn();
      currentLastMove = { from: historicItem.from, to: historicItem.to };
    }

    sceneManagerRef.current.syncFromBoardState(
      currentBoard,
      selectedSquare,
      legalMoves,
      currentLastMove,
      secondaryMove,
      enPassantCapturedSquare,
      currentInCheck,
      currentTurn,
      activeHint ? { from: activeHint.from, to: activeHint.to } : null
    );
  }, [
    chess,
    fen,
    selectedSquare,
    legalMoves,
    lastMove,
    secondaryMove,
    enPassantCapturedSquare,
    status.isCheck,
    turn,
    historyViewIndex,
    moveHistory,
    activeHint,
  ]);

  // Sync camera preset & auto-rotation
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.setCameraPreset(cameraPreset, turn, autoRotateBoard);
  }, [cameraPreset, turn, autoRotateBoard]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden touch-none"
    />
  );
};
