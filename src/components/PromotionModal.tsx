import React from 'react';
import type { PieceSymbol } from 'chess.js';
import { useGameStore } from '../store/gameStore';
import { Crown, Castle, Sparkles, Shield } from 'lucide-react';

export const PromotionModal: React.FC = () => {
  const pendingPromotion = useGameStore((state) => state.pendingPromotion);
  const confirmPromotion = useGameStore((state) => state.confirmPromotion);
  const cancelPromotion = useGameStore((state) => state.cancelPromotion);

  if (!pendingPromotion) return null;

  const isWhite = pendingPromotion.color === 'w';

  const choices: { type: PieceSymbol; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      type: 'q',
      label: 'Rainha',
      sub: 'Dama soberana',
      icon: <Crown className="w-8 h-8 text-amber-400" />,
    },
    {
      type: 'r',
      label: 'Torre',
      sub: 'Fortaleza defensora',
      icon: <Castle className="w-8 h-8 text-sky-400" />,
    },
    {
      type: 'b',
      label: 'Bispo',
      sub: 'Mestre tático',
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
    },
    {
      type: 'n',
      label: 'Cavalo',
      sub: 'Cavaleiro ágil',
      icon: <Shield className="w-8 h-8 text-emerald-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900/95 border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-amber-500/10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wider uppercase mb-3">
          Promoção de Peão
        </div>
        <h3 className="text-xl font-bold font-serif text-zinc-100 tracking-wide">
          Escolha a nova peça para {isWhite ? 'as Brancas' : 'as Pretas'}
        </h3>
        <p className="text-xs text-zinc-400 mt-1 mb-6">
          O peão alcançou a última fileira e deve ser promovido.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {choices.map((c) => (
            <button
              key={c.type}
              onClick={() => confirmPromotion(c.type)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/60 transition-all hover:scale-[1.03] active:scale-[0.98] group cursor-pointer"
            >
              <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-amber-950/40 mb-2 transition-colors">
                {c.icon}
              </div>
              <span className="font-bold text-zinc-100 text-sm">{c.label}</span>
              <span className="text-[11px] text-zinc-400">{c.sub}</span>
            </button>
          ))}
        </div>

        <button
          onClick={cancelPromotion}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer py-1 px-3"
        >
          Cancelar movimento
        </button>
      </div>
    </div>
  );
};
