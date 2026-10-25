import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { DIFFICULTY_CONFIGS, type ComputerDifficulty } from '../engine/engineTypes';
import { Bot, Users, Cpu, Shield, Sparkles, X, Check, Dices, Globe2 } from 'lucide-react';

export const GameModeModal: React.FC = () => {
  const isModeModalOpen = useGameStore((state) => state.isModeModalOpen);
  const setIsModeModalOpen = useGameStore((state) => state.setIsModeModalOpen);
  const setIsOnlineModalOpen = useGameStore((state) => state.setIsOnlineModalOpen);
  const gameMode = useGameStore((state) => state.gameMode);
  const currentDifficulty = useGameStore((state) => state.computerDifficulty);
  const startVsComputer = useGameStore((state) => state.startVsComputer);
  const startPvpLocal = useGameStore((state) => state.startPvpLocal);

  const [activeTab, setActiveTab] = useState<'computer' | 'local' | 'online'>('computer');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ComputerDifficulty>(currentDifficulty);
  const [selectedColor, setSelectedColor] = useState<'w' | 'b' | 'random'>('w');

  if (!isModeModalOpen) return null;

  const difficulties = Object.values(DIFFICULTY_CONFIGS);

  const handleStart = () => {
    if (activeTab === 'computer') {
      startVsComputer(selectedDifficulty, selectedColor);
    } else if (activeTab === 'local') {
      startPvpLocal();
    } else {
      setIsModeModalOpen(false);
      setIsOnlineModalOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl relative text-zinc-100 flex flex-col max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsModeModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-zinc-100">
              Modos de Jogo
            </h2>
            <p className="text-xs text-zinc-400">
              Escolha seu oponente e configure os parâmetros da partida
            </p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 mb-5">
          <button
            onClick={() => setActiveTab('computer')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'computer'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="truncate">Contra a IA</span>
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'local'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="truncate">PVP Local</span>
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'online'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span className="truncate">PVP Online</span>
          </button>
        </div>

        {/* Tab 1: Contra o Computador */}
        {activeTab === 'computer' && (
          <div className="space-y-4">
            {/* Difficulty Level Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Nível de Dificuldade da IA
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {difficulties.map((diff) => {
                  const isSelected = selectedDifficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      onClick={() => setSelectedDifficulty(diff.id)}
                      className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/70 text-amber-200 ring-1 ring-amber-500/40 shadow-sm'
                          : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-sm text-zinc-100">{diff.name}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700 text-amber-300 font-semibold">
                          {diff.elo}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                        {diff.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Choice */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Escolha suas Peças
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedColor('w')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedColor === 'w'
                      ? 'bg-amber-500/15 border-amber-500/70 text-amber-200 ring-1 ring-amber-500/40'
                      : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300 mb-1 shadow-sm" />
                  <span className="text-xs font-bold text-zinc-100">Brancas</span>
                  <span className="text-[10px] text-zinc-400">Joga 1º</span>
                </button>

                <button
                  onClick={() => setSelectedColor('random')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedColor === 'random'
                      ? 'bg-amber-500/15 border-amber-500/70 text-amber-200 ring-1 ring-amber-500/40'
                      : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Dices className="w-5 h-5 text-amber-400 mb-1" />
                  <span className="text-xs font-bold text-zinc-100">Aleatório</span>
                  <span className="text-[10px] text-zinc-400">Sorteio</span>
                </button>

                <button
                  onClick={() => setSelectedColor('b')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedColor === 'b'
                      ? 'bg-amber-500/15 border-amber-500/70 text-amber-200 ring-1 ring-amber-500/40'
                      : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-600 mb-1 shadow-sm" />
                  <span className="text-xs font-bold text-zinc-100">Pretas</span>
                  <span className="text-[10px] text-zinc-400">IA joga 1º</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PVP Local */}
        {activeTab === 'local' && (
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Users className="w-5 h-5" />
              <span>Duelo no Mesmo Aparelho</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Dois jogadores se enfrentam na mesma tela alternando as jogadas. Você pode ativar a opção <strong>"Girar no Turno"</strong> no dock inferior para que a câmera 3D gire automaticamente para o jogador da vez.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Suporte total a relógio de xadrez e desfazer lances.</span>
            </div>
          </div>
        )}

        {/* Tab 3: PVP Online */}
        {activeTab === 'online' && (
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Globe2 className="w-5 h-5" />
              <span>Duelo Online P2P (WebRTC PeerJS)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Jogue contra um amigo em outro computador ou celular em tempo real. Crie uma sala para obter um código de 5 letras ou link direto, ou entre no jogo de alguém.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sem necessidade de cadastro. Sincronização direta ponto-a-ponto com reconexão automática e oferta de empate/desistência.</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-zinc-800">
          <button
            onClick={() => setIsModeModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleStart}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] cursor-pointer"
          >
            Começar Partida
          </button>
        </div>
      </div>
    </div>
  );
};
