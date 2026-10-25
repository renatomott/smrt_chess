import React from 'react';
import type { PieceSymbol, Color } from 'chess.js';
import { useGameStore, PIECE_VALUES } from '../store/gameStore';

const PIECE_UNICODE: Record<Color, Record<PieceSymbol, string>> = {
  w: {
    p: '♙',
    n: '♘',
    b: '♗',
    r: '♖',
    q: '♕',
    k: '♔',
  },
  b: {
    p: '♟',
    n: '♞',
    b: '♝',
    r: '♜',
    q: '♛',
    k: '♚',
  },
};

const PIECE_ORDER: PieceSymbol[] = ['p', 'n', 'b', 'r', 'q'];

export const CapturedPiecesBar: React.FC<{ playerColor: Color }> = ({ playerColor }) => {
  const capturedPieces = useGameStore((state) => state.capturedPieces);
  const materialAdvantage = useGameStore((state) => state.materialAdvantage);

  // If playerColor is 'w', they captured black pieces (stored in capturedPieces.b)
  // If playerColor is 'b', they captured white pieces (stored in capturedPieces.w)
  const capturedList = playerColor === 'w' ? capturedPieces.b : capturedPieces.w;
  const oppColor: Color = playerColor === 'w' ? 'b' : 'w';
  const advantage = playerColor === 'w' ? materialAdvantage.white : materialAdvantage.black;

  // Group by piece type
  const counts = new Map<PieceSymbol, number>();
  capturedList.forEach((p) => {
    counts.set(p, (counts.get(p) || 0) + 1);
  });

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs">
      <div className="flex items-center gap-1 min-h-[20px]">
        {capturedList.length === 0 ? (
          <span className="text-[10px] text-zinc-500 italic">Nenhuma captura</span>
        ) : (
          PIECE_ORDER.map((type) => {
            const count = counts.get(type);
            if (!count) return null;
            return (
              <span
                key={type}
                className="flex items-center text-sm font-serif leading-none tracking-tight text-zinc-200"
                title={`${count}x ${type.toUpperCase()}`}
              >
                {PIECE_UNICODE[oppColor][type]}
                {count > 1 && (
                  <span className="text-[9px] font-sans font-bold text-zinc-400 ml-0.5">
                    {count}
                  </span>
                )}
              </span>
            );
          })
        )}
      </div>

      {advantage > 0 && (
        <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
          +{advantage}
        </span>
      )}
    </div>
  );
};
