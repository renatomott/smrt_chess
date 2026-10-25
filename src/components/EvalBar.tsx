import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { evaluateBoard } from '../utils/evaluation';
import { Activity, Eye, EyeOff } from 'lucide-react';

export const EvalBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const chess = useGameStore((state) => state.chess);
  const fen = useGameStore((state) => state.fen);
  const assignedPlayerColor = useGameStore((state) => state.assignedPlayerColor);
  const gameMode = useGameStore((state) => state.gameMode);

  // Re-calculate whenever FEN changes
  const evalResult = useMemo(() => {
    return evaluateBoard(chess);
  }, [chess, fen]);

  // If player is Black, flip perspective
  const isBlackPerspective = gameMode === 'vs_computer' && assignedPlayerColor === 'b';
  const playerPercent = isBlackPerspective
    ? 100 - evalResult.whitePercentage
    : evalResult.whitePercentage;

  return (
    <div className="pointer-events-auto fixed left-2 sm:left-3 top-28 sm:top-20 bottom-24 z-30 flex items-center gap-1 sm:gap-1.5 select-none">
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-400 hover:text-zinc-200 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
        title={isVisible ? 'Ocultar barra de avaliação' : 'Exibir barra de avaliação'}
      >
        {isVisible ? <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />}
      </button>

      {/* Main Bar */}
      {isVisible && (
        <div className="relative w-5 sm:w-6 h-full max-h-[260px] sm:max-h-[380px] bg-zinc-900/90 border border-zinc-700/80 rounded-full overflow-hidden shadow-2xl flex flex-col backdrop-blur-md">
          {/* Black Side (Top) */}
          <div
            className="w-full bg-gradient-to-b from-zinc-900 to-zinc-800 transition-all duration-500 ease-out flex items-start justify-center pt-1.5"
            style={{ height: `${100 - playerPercent}%` }}
          >
            {playerPercent <= 45 && (
              <span className="text-[10px] font-mono font-black text-zinc-300 drop-shadow">
                {evalResult.formatted}
              </span>
            )}
          </div>

          {/* White Side (Bottom) */}
          <div
            className="w-full bg-gradient-to-b from-amber-100 to-amber-200 transition-all duration-500 ease-out flex items-end justify-center pb-1.5"
            style={{ height: `${playerPercent}%` }}
          >
            {playerPercent > 45 && (
              <span className="text-[10px] font-mono font-black text-zinc-900 drop-shadow-sm">
                {evalResult.formatted}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
