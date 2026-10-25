import React, { useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { CameraPreset } from '../game/chessTypes';
import { DIFFICULTY_CONFIGS } from '../engine/engineTypes';
import { ChessClock } from './ChessClock';
import { CapturedPiecesBar } from './CapturedPiecesBar';
import {
  RotateCcw,
  Undo2,
  Eye,
  Compass,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Crown,
  AlertCircle,
  Timer,
  Bot,
  Users,
  Lightbulb,
  Cpu,
  Globe2,
  Scale,
  Flag,
  LogOut,
  Radio,
  Shirt,
  Palette,
  BookOpen,
} from 'lucide-react';
import { THEMES } from '../themes/themes';

export const ChessHUD: React.FC = () => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'reset' | 'resign' | 'leave' | null>(null);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerConfirmation = (action: 'reset' | 'resign' | 'leave', onConfirm: () => void) => {
    if (confirmAction === action) {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      setConfirmAction(null);
      onConfirm();
    } else {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      setConfirmAction(action);
      confirmTimeoutRef.current = setTimeout(() => {
        setConfirmAction(null);
      }, 3500);
    }
  };

  const turn = useGameStore((state) => state.turn);
  const status = useGameStore((state) => state.status);
  const cameraPreset = useGameStore((state) => state.cameraPreset);
  const setCameraPreset = useGameStore((state) => state.setCameraPreset);
  const autoRotateBoard = useGameStore((state) => state.autoRotateBoard);
  const setAutoRotateBoard = useGameStore((state) => state.setAutoRotateBoard);
  const undoMove = useGameStore((state) => state.undoMove);
  const resetGame = useGameStore((state) => state.resetGame);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const moveHistory = useGameStore((state) => state.moveHistory);
  const setIsClockModalOpen = useGameStore((state) => state.setIsClockModalOpen);
  const clockSettings = useGameStore((state) => state.clockSettings);

  // AI & Mode states
  const gameMode = useGameStore((state) => state.gameMode);
  const computerDifficulty = useGameStore((state) => state.computerDifficulty);
  const isComputerThinking = useGameStore((state) => state.isComputerThinking);
  const assignedPlayerColor = useGameStore((state) => state.assignedPlayerColor);
  const setIsModeModalOpen = useGameStore((state) => state.setIsModeModalOpen);
  const requestHint = useGameStore((state) => state.requestHint);
  const activeHint = useGameStore((state) => state.activeHint);

  // Online P2P states & actions
  const netStatus = useGameStore((state) => state.netStatus);
  const netRoomCode = useGameStore((state) => state.netRoomCode);
  const netIsHost = useGameStore((state) => state.netIsHost);
  const netLatency = useGameStore((state) => state.netLatency);
  const setIsOnlineModalOpen = useGameStore((state) => state.setIsOnlineModalOpen);
  const offerDraw = useGameStore((state) => state.offerDraw);
  const resignOnlineGame = useGameStore((state) => state.resignOnlineGame);
  const leaveOnlineRoom = useGameStore((state) => state.leaveOnlineRoom);
  const drawOfferSent = useGameStore((state) => state.drawOfferSent);

  // Themes state
  const whiteThemeId = useGameStore((state) => state.whiteThemeId);
  const blackThemeId = useGameStore((state) => state.blackThemeId);
  const setIsThemeModalOpen = useGameStore((state) => state.setIsThemeModalOpen);
  const setIsRulesModalOpen = useGameStore((state) => state.setIsRulesModalOpen);

  const cameraOptions: { id: CameraPreset; label: string }[] = [
    { id: 'default', label: '3D Livre' },
    { id: 'top', label: 'Topo' },
    { id: 'white', label: 'Brancas' },
    { id: 'black', label: 'Pretas' },
    { id: 'cinematic', label: 'Cine' },
  ];

  const diffConfig = DIFFICULTY_CONFIGS[computerDifficulty];
  const whiteTheme = THEMES[whiteThemeId] || THEMES.classic;
  const blackTheme = THEMES[blackThemeId] || THEMES.classic;

  // Dynamic player labels based on active game mode and team themes
  let whitePlayerLabel = whiteTheme.name;
  let blackPlayerLabel = blackTheme.name;

  if (gameMode === 'vs_computer') {
    whitePlayerLabel = assignedPlayerColor === 'w' ? `Você (${whiteTheme.nickname})` : `IA (${diffConfig.name})`;
    blackPlayerLabel = assignedPlayerColor === 'b' ? `Você (${blackTheme.nickname})` : `IA (${diffConfig.name})`;
  } else if (gameMode === 'pvp_online') {
    whitePlayerLabel = netIsHost ? `Você (${whiteTheme.nickname})` : `Adversário (${whiteTheme.nickname})`;
    blackPlayerLabel = !netIsHost ? `Você (${blackTheme.nickname})` : `Adversário (${blackTheme.nickname})`;
  } else {
    whitePlayerLabel = `${whiteTheme.nickname} (Brancas)`;
    blackPlayerLabel = `${blackTheme.nickname} (Pretas)`;
  }

  return (
    <div className="pointer-events-none absolute inset-0 select-none flex flex-col justify-between p-2.5 sm:p-4 z-20">
      {/* Top Header: Brand, Clocks, Captured Pieces, Turn Badge, Online Status */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-6xl mx-auto gap-2">
        {/* Left: Brand + Mode Switcher + White Player Status */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
          <button
            onClick={() => {
              if (gameMode === 'pvp_online') {
                setIsOnlineModalOpen(true);
              } else {
                setIsModeModalOpen(true);
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 shadow-xl transition-all cursor-pointer group"
            title="Alterar modo de jogo ou ver código da sala"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              {gameMode === 'vs_computer' ? (
                <Bot className="w-4 h-4" />
              ) : gameMode === 'pvp_online' ? (
                <Globe2 className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </div>
            <div className="text-left">
              <h1 className="font-serif font-bold text-xs tracking-wider text-zinc-100 uppercase leading-tight">
                SMRT Chess
              </h1>
              <div className="flex items-center gap-1.5 text-[9px] text-amber-300 font-medium">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    gameMode === 'pvp_online'
                      ? netStatus === 'connected'
                        ? 'bg-emerald-500'
                        : 'bg-amber-400 animate-ping'
                      : 'bg-emerald-500'
                  }`}
                />
                {gameMode === 'vs_computer'
                  ? `IA: ${diffConfig.name}`
                  : gameMode === 'pvp_online'
                  ? netStatus === 'connected'
                    ? `Online • ${netRoomCode}`
                    : `Sala ${netRoomCode} (Aguardando)`
                  : 'PVP Local'}
              </div>
            </div>
          </button>

          {/* Quick Online Challenge Shortcut */}
          {gameMode !== 'pvp_online' && (
            <button
              onClick={() => setIsOnlineModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-semibold text-xs shadow-lg transition-all cursor-pointer group"
              title="Convidar amigo para jogar online à distância"
            >
              <Globe2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Jogar Online</span>
              <span className="sm:hidden">Online</span>
            </button>
          )}

          {/* Theme / Club Switcher Button */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 shadow-xl transition-all cursor-pointer group"
            title="Escolher clubes e temas das peças"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Shirt className="w-4 h-4" />
            </div>
            <div className="text-left hidden md:block">
              <span className="font-serif font-bold text-xs tracking-wider text-zinc-100 uppercase leading-tight block">
                Times
              </span>
              <div className="text-[9px] text-amber-300 font-medium truncate max-w-[110px]">
                {whiteTheme.nickname}
              </div>
            </div>
          </button>

          {/* White Clock & Captured */}
          <div className="flex items-center gap-1.5">
            <ChessClock color="w" label={whitePlayerLabel} />
            <CapturedPiecesBar playerColor="w" />
          </div>
        </div>

        {/* Center/Right: Black Player Status, Clock, Turn Alert, Online Latency */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-end">
          {/* AI Thinking Indicator */}
          {isComputerThinking && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-950/40 backdrop-blur-sm animate-pulse">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>IA pensando...</span>
            </div>
          )}

          {/* Online Connection Pill */}
          {gameMode === 'pvp_online' && netStatus === 'connected' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{netLatency > 0 ? `${netLatency}ms` : 'P2P'}</span>
            </div>
          )}

          {/* Black Clock & Captured */}
          <div className="flex items-center gap-1.5">
            <CapturedPiecesBar playerColor="b" />
            <ChessClock color="b" label={blackPlayerLabel} />
          </div>

          {/* Turn Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/85 border border-zinc-800 shadow-xl">
            <div
              className={`w-3 h-3 rounded-full border ${
                turn === 'w'
                  ? 'bg-amber-100 border-amber-300 shadow-sm shadow-amber-200'
                  : 'bg-zinc-900 border-zinc-600'
              }`}
            />
            <span className="text-xs font-bold text-zinc-200 tracking-wide">
              {turn === 'w' ? 'Vez das Brancas' : 'Vez das Pretas'}
            </span>
          </div>

          {status.isCheck && !status.isCheckmate && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-600/50 text-red-300 text-xs font-bold animate-bounce shadow-lg shadow-red-950/50">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              Xeque!
            </div>
          )}
        </div>
      </div>

      {/* Unified Bottom Control Dock */}
      <div className="pointer-events-auto self-center w-full max-w-4xl flex flex-col items-center transition-all duration-300 mb-1">
        {/* Collapse toggle badge */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 mb-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-semibold text-zinc-300 transition-colors cursor-pointer shadow-md"
          title={isDockCollapsed ? 'Expandir painel' : 'Ocultar painel'}
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3 text-amber-400" />
              <span>Controles</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 text-amber-400" />
              <span>Ocultar</span>
            </>
          )}
        </button>

        {/* Main Dock Container */}
        {!isDockCollapsed && (
          <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            {/* Camera Presets */}
            <div className="flex items-center gap-1 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/80 w-full sm:w-auto justify-center overflow-x-auto scrollbar-none">
              <Eye className="w-3.5 h-3.5 text-zinc-400 ml-1.5 mr-0.5 shrink-0" />
              {cameraOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCameraPreset(opt.id)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs ${
                    cameraPreset === opt.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-center flex-wrap">
              {/* Game Mode / Difficulty Selector */}
              <button
                onClick={() => {
                  if (gameMode === 'pvp_online') {
                    setIsOnlineModalOpen(true);
                  } else {
                    setIsModeModalOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer"
                title="Trocar modo de jogo"
              >
                {gameMode === 'vs_computer' ? (
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                ) : gameMode === 'pvp_online' ? (
                  <Globe2 className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="text-[11px]">
                  {gameMode === 'vs_computer'
                    ? diffConfig.name
                    : gameMode === 'pvp_online'
                    ? `Sala ${netRoomCode || ''}`
                    : 'PVP Local'}
                </span>
              </button>

              {/* Themes & Clubs Button */}
              <button
                onClick={() => setIsThemeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer"
                title="Alterar temas e times das peças"
              >
                <Shirt className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Times</span>
              </button>

              {/* Online Mode Specific Controls: Offer Draw & Resign */}
              {gameMode === 'pvp_online' && netStatus === 'connected' && !status.isOver && (
                <>
                  <button
                    onClick={offerDraw}
                    disabled={drawOfferSent}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-medium border transition-all cursor-pointer ${
                      drawOfferSent
                        ? 'bg-zinc-800/40 border-zinc-700 text-zinc-500'
                        : 'bg-zinc-800/60 hover:bg-zinc-800 border-zinc-700/60 text-zinc-300 hover:text-zinc-100'
                    }`}
                    title="Propor empate ao adversário"
                  >
                    <Scale className="w-3.5 h-3.5 text-sky-400" />
                    <span>{drawOfferSent ? 'Empate Proposto' : 'Empate'}</span>
                  </button>

                  <button
                    onClick={() => triggerConfirmation('resign', resignOnlineGame)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-medium border transition-all cursor-pointer ${
                      confirmAction === 'resign'
                        ? 'bg-red-600 text-white border-red-500 animate-pulse'
                        : 'bg-zinc-800/60 hover:bg-red-950/50 border-zinc-700/60 hover:border-red-600/50 text-zinc-300 hover:text-red-300'
                    }`}
                    title="Desistir da partida"
                  >
                    <Flag className="w-3.5 h-3.5 text-red-400" />
                    <span>{confirmAction === 'resign' ? 'Confirmar?' : 'Desistir'}</span>
                  </button>
                </>
              )}

              {/* Leave Online Room Button */}
              {gameMode === 'pvp_online' && (
                <button
                  onClick={() => triggerConfirmation('leave', leaveOnlineRoom)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-medium border transition-all cursor-pointer ${
                    confirmAction === 'leave'
                      ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                      : 'bg-zinc-800/60 hover:bg-zinc-800 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Sair da sala online"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{confirmAction === 'leave' ? 'Sair agora?' : 'Sair'}</span>
                </button>
              )}

              {/* Tactical Hint (Dica) - only against computer or in local PVP training */}
              {gameMode !== 'pvp_online' && (
                <button
                  onClick={() => requestHint()}
                  disabled={status.isOver || isComputerThinking}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
                    activeHint
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-zinc-800/60 hover:bg-zinc-800 border-zinc-700/60 text-zinc-300 hover:text-zinc-100'
                  }`}
                  title="Solicitar dica tática da engine"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dica</span>
                </button>
              )}

              {/* Clock Settings (disabled during active online game to keep both clocks in sync) */}
              {gameMode !== 'pvp_online' && (
                <button
                  onClick={() => setIsClockModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer"
                  title="Configurar relógio de jogo"
                >
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">
                    {clockSettings.preset === 'none' ? 'Sem Relógio' : clockSettings.preset}
                  </span>
                </button>
              )}

              {/* Auto Rotate on turn (mainly for PVP local) */}
              {gameMode === 'pvp_local' && (
                <button
                  onClick={() => setAutoRotateBoard(!autoRotateBoard)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border transition-all cursor-pointer ${
                    autoRotateBoard
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Girar a visão do tabuleiro a cada turno"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Girar</span>
                </button>
              )}

              {/* Undo Move - allowed only against computer and local PVP as required */}
              {gameMode !== 'pvp_online' && (
                <button
                  onClick={() => undoMove()}
                  disabled={moveHistory.length === 0 || isComputerThinking}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium bg-zinc-800/60 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none border border-zinc-700/60 text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer"
                  title="Desfazer último lance"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Desfazer</span>
                </button>
              )}

              {/* Reset Game (only for local / computer) */}
              {gameMode !== 'pvp_online' && (
                <button
                  onClick={() => triggerConfirmation('reset', resetGame)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border transition-all cursor-pointer ${
                    confirmAction === 'reset'
                      ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                      : 'bg-zinc-800/60 hover:bg-zinc-800 border-zinc-700/60 text-zinc-300 hover:text-zinc-100'
                  }`}
                  title="Iniciar uma nova partida"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{confirmAction === 'reset' ? 'Reiniciar?' : 'Novo'}</span>
                </button>
              )}

              {/* Rules Guide Button */}
              <button
                onClick={() => setIsRulesModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-amber-400 transition-all cursor-pointer"
                title="Guia & Regras Oficiais da FIDE"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Regras</span>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                title={soundEnabled ? 'Silenciar' : 'Ativar som'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
