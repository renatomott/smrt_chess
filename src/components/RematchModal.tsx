import React from 'react';
import { useGameStore } from '../store/gameStore';
import { RotateCcw, Check, X } from 'lucide-react';

export const RematchModal: React.FC = () => {
  const isRematchOfferModalOpen = useGameStore((state) => state.isRematchOfferModalOpen);
  const acceptRematch = useGameStore((state) => state.acceptRematch);
  const declineRematch = useGameStore((state) => state.declineRematch);

  if (!isRematchOfferModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-center text-zinc-100">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3">
          <RotateCcw className="w-7 h-7" />
        </div>

        <h3 className="font-serif font-bold text-lg text-zinc-100">
          Pedido de Revanche!
        </h3>
        <p className="text-xs text-zinc-400 mt-1 mb-6 leading-relaxed">
          Seu adversário quer jogar novamente com as <strong>cores invertidas</strong>. Aceita o desafio?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={declineRematch}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Recusar</span>
          </button>
          <button
            onClick={acceptRematch}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Aceitar Revanche</span>
          </button>
        </div>
      </div>
    </div>
  );
};
