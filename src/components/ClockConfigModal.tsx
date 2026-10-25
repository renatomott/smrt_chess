import React, { useState } from 'react';
import { useGameStore, CLOCK_PRESETS_CONFIG } from '../store/gameStore';
import type { ClockPreset } from '../game/chessTypes';
import { Timer, X, Check } from 'lucide-react';

export const ClockConfigModal: React.FC = () => {
  const isClockModalOpen = useGameStore((state) => state.isClockModalOpen);
  const setIsClockModalOpen = useGameStore((state) => state.setIsClockModalOpen);
  const clockSettings = useGameStore((state) => state.clockSettings);
  const setClockSettings = useGameStore((state) => state.setClockSettings);

  const [selectedPreset, setSelectedPreset] = useState<ClockPreset>(clockSettings.preset);
  const [customMins, setCustomMins] = useState(Math.max(1, Math.floor(clockSettings.initialSeconds / 60)));
  const [customInc, setCustomInc] = useState(clockSettings.incrementSeconds);

  if (!isClockModalOpen) return null;

  const presets: { id: ClockPreset; label: string; sub: string }[] = [
    { id: 'none', label: 'Sem Relógio', sub: 'Partida livre e casual' },
    { id: '1+0', label: '1 min', sub: 'Bullet acelerado (1+0)' },
    { id: '3+2', label: '3 min + 2s', sub: 'Blitz competitivo (3+2)' },
    { id: '5+0', label: '5 min', sub: 'Blitz tradicional (5+0)' },
    { id: '10+0', label: '10 min', sub: 'Rápido padrão (10+0)' },
    { id: '15+10', label: '15 min + 10s', sub: 'FIDE Rápido com incremento' },
    { id: 'custom', label: 'Personalizado', sub: 'Defina minutos e incremento' },
  ];

  const handleSave = () => {
    if (selectedPreset === 'custom') {
      const initialSeconds = Math.max(10, customMins * 60);
      const incrementSeconds = Math.max(0, customInc);
      setClockSettings({
        preset: 'custom',
        initialSeconds,
        incrementSeconds,
      });
    } else {
      const config = CLOCK_PRESETS_CONFIG[selectedPreset];
      setClockSettings({
        preset: selectedPreset,
        initialSeconds: config.initialSeconds,
        incrementSeconds: config.incrementSeconds,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl relative text-zinc-100">
        <button
          onClick={() => setIsClockModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-zinc-100">
              Controle de Tempo
            </h3>
            <p className="text-xs text-zinc-400">
              Escolha a cadência do relógio para a partida
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          {presets.map((p) => {
            const isSelected = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPreset(p.id)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-sm'
                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-zinc-100">{p.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <span className="text-[11px] text-zinc-400 mt-0.5">{p.sub}</span>
              </button>
            );
          })}
        </div>

        {selectedPreset === 'custom' && (
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 mb-5 flex gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Tempo Inicial (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={customMins}
                onChange={(e) => setCustomMins(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Incremento (segundos)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={customInc}
                onChange={(e) => setCustomInc(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setIsClockModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs tracking-wide shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            Aplicar Relógio
          </button>
        </div>
      </div>
    </div>
  );
};
