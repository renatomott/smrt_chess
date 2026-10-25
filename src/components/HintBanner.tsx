import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Lightbulb, X, ArrowRight } from 'lucide-react';

export const HintBanner: React.FC = () => {
  const activeHint = useGameStore((state) => state.activeHint);
  const dismissHint = useGameStore((state) => state.dismissHint);

  if (!activeHint) return null;

  return (
    <div className="pointer-events-auto fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-3 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="bg-gradient-to-r from-emerald-950/90 to-zinc-900/95 border border-emerald-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-zinc-100 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                Dica da Engine
              </span>
              <span className="flex items-center gap-1 font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/40">
                {activeHint.from.toUpperCase()}
                <ArrowRight className="w-3 h-3 text-emerald-400" />
                {activeHint.to.toUpperCase()} ({activeHint.san})
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {activeHint.advice}
            </p>
          </div>
        </div>

        <button
          onClick={dismissHint}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          title="Fechar dica"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
