import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Scale, Check, X } from 'lucide-react';

export const DrawOfferModal: React.FC = () => {
  const isDrawOfferModalOpen = useGameStore((state) => state.isDrawOfferModalOpen);
  const acceptDraw = useGameStore((state) => state.acceptDraw);
  const declineDraw = useGameStore((state) => state.declineDraw);

  if (!isDrawOfferModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl text-center text-zinc-100">
        <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto mb-3">
          <Scale className="w-7 h-7" />
        </div>

        <h3 className="font-serif font-bold text-lg text-zinc-100">
          Proposta de Empate
        </h3>
        <p className="text-xs text-zinc-400 mt-1 mb-6 leading-relaxed">
          Seu oponente propôs finalizar a partida em empate. Você aceita?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={declineDraw}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Recusar</span>
          </button>
          <button
            onClick={acceptDraw}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Aceitar Empate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
