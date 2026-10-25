import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  ScrollText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
  RotateCcw,
  X,
  Play,
  FileCode,
  BarChart3,
} from 'lucide-react';

export const MoveHistoryDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const moveHistory = useGameStore((state) => state.moveHistory);
  const historyViewIndex = useGameStore((state) => state.historyViewIndex);
  const setHistoryViewIndex = useGameStore((state) => state.setHistoryViewIndex);
  const returnToLiveGame = useGameStore((state) => state.returnToLiveGame);
  const chess = useGameStore((state) => state.chess);
  const setIsLoadPositionModalOpen = useGameStore((state) => state.setIsLoadPositionModalOpen);
  const setIsReviewModalOpen = useGameStore((state) => state.setIsReviewModalOpen);

  const activeIndex = historyViewIndex !== null ? historyViewIndex : moveHistory.length - 1;

  // Build pairs of White & Black moves
  const movePairs: { turnNum: number; whiteIndex: number; blackIndex?: number }[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      turnNum: Math.floor(i / 2) + 1,
      whiteIndex: i,
      blackIndex: i + 1 < moveHistory.length ? i + 1 : undefined,
    });
  }

  const handleCopyPGN = () => {
    const pgn = chess.pgn();
    navigator.clipboard.writeText(pgn || '1. ');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStep = (direction: 'first' | 'prev' | 'next' | 'last') => {
    if (moveHistory.length === 0) return;

    if (direction === 'first') {
      setHistoryViewIndex(0);
    } else if (direction === 'prev') {
      const target = activeIndex > 0 ? activeIndex - 1 : 0;
      setHistoryViewIndex(target);
    } else if (direction === 'next') {
      if (activeIndex < moveHistory.length - 1) {
        setHistoryViewIndex(activeIndex + 1);
      } else {
        returnToLiveGame();
      }
    } else if (direction === 'last') {
      returnToLiveGame();
    }
  };

  return (
    <>
      {/* Toggle button on the right edge */}
      <div className="pointer-events-auto fixed top-20 right-3 z-30 flex flex-col items-end gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border shadow-xl transition-all cursor-pointer ${
            isOpen
              ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
              : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-700/80 font-medium'
          }`}
          title="Histórico de lances e PGN"
        >
          <ScrollText className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Lances</span>
          {moveHistory.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isOpen ? 'bg-zinc-950 text-amber-300' : 'bg-zinc-800 text-amber-400'
              }`}
            >
              {moveHistory.length}
            </span>
          )}
        </button>

        {/* Floating review warning banner if inspecting past moves */}
        {historyViewIndex !== null && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/60 text-amber-200 text-xs font-semibold shadow-2xl backdrop-blur-md">
            <span>Revisando lance #{historyViewIndex + 1}</span>
            <button
              onClick={returnToLiveGame}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-[10px] hover:bg-amber-400 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              Ao Vivo
            </button>
          </div>
        )}
      </div>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="pointer-events-auto fixed top-16 right-3 bottom-24 w-80 max-w-[calc(100vw-24px)] z-40 bg-zinc-900/95 border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-amber-400" />
              <h3 className="font-serif font-bold text-sm text-zinc-100">
                Histórico da Partida
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {moveHistory.length > 0 && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Abrir relatório de erros e melhores lances Stockfish"
                >
                  <BarChart3 className="w-3 h-3 text-amber-400" />
                  <span>Análise</span>
                </button>
              )}
              <button
                onClick={() => setIsLoadPositionModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 text-[11px] font-medium transition-colors cursor-pointer"
                title="Carregar posição FEN ou PGN"
              >
                <FileCode className="w-3 h-3 text-amber-400" />
                <span>Carregar</span>
              </button>
              <button
                onClick={handleCopyPGN}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 text-[11px] font-medium transition-colors cursor-pointer"
                title="Copiar notação PGN para a área de transferência"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado!' : 'PGN'}</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Moves list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-mono">
            {movePairs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-12 px-4">
                <ScrollText className="w-8 h-8 stroke-1 mb-2 opacity-50" />
                <p className="font-sans text-xs">Nenhum lance efetuado ainda.</p>
                <p className="font-sans text-[11px] text-zinc-600 mt-1">
                  Os movimentos em notação algébrica aparecerão aqui.
                </p>
              </div>
            ) : (
              movePairs.map((pair) => {
                const whiteMove = moveHistory[pair.whiteIndex];
                const blackMove =
                  pair.blackIndex !== undefined ? moveHistory[pair.blackIndex] : null;

                const isWhiteActive = activeIndex === pair.whiteIndex;
                const isBlackActive =
                  pair.blackIndex !== undefined && activeIndex === pair.blackIndex;

                return (
                  <div
                    key={pair.turnNum}
                    className="grid grid-cols-[36px_1fr_1fr] items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-800/40"
                  >
                    <span className="text-zinc-500 text-[11px] font-sans font-semibold">
                      {pair.turnNum}.
                    </span>

                    {/* White move button */}
                    <button
                      onClick={() => setHistoryViewIndex(pair.whiteIndex)}
                      className={`text-left px-2 py-1 rounded-md transition-all cursor-pointer font-bold ${
                        isWhiteActive
                          ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-sm'
                          : 'text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {whiteMove.san}
                    </button>

                    {/* Black move button */}
                    {blackMove ? (
                      <button
                        onClick={() => setHistoryViewIndex(pair.blackIndex!)}
                        className={`text-left px-2 py-1 rounded-md transition-all cursor-pointer font-bold ${
                          isBlackActive
                            ? 'bg-amber-500 text-zinc-950 font-extrabold shadow-sm'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {blackMove.san}
                      </button>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Navigation Controls Bar */}
          <div className="p-2.5 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between gap-1">
            <button
              onClick={() => handleStep('first')}
              disabled={moveHistory.length === 0}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Primeiro lance"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleStep('prev')}
              disabled={moveHistory.length === 0}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Lance anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={returnToLiveGame}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                historyViewIndex === null
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Ao Vivo</span>
            </button>

            <button
              onClick={() => handleStep('next')}
              disabled={moveHistory.length === 0}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Próximo lance"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleStep('last')}
              disabled={moveHistory.length === 0}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Último lance ao vivo"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
