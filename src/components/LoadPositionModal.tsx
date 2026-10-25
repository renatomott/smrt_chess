import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { FileCode, X, Check, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

const PRESET_POSITIONS = [
  {
    name: 'Posição Inicial',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    desc: 'Posição clássica padrão de abertura',
  },
  {
    name: 'Mate do Pastor (Xeque-Mate)',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 5',
    desc: 'Brancas com dama em f3 e bispo em c4 ameaçando f7',
  },
  {
    name: 'Final de Torres & Peões',
    fen: '8/5pk1/4p1p1/7p/7P/5RP1/4rPK1/8 w - - 0 40',
    desc: 'Final clássico para treino de técnica de torres',
  },
  {
    name: 'Tática: Garfo de Cavalo',
    fen: 'r1b1k2r/pppp1ppp/8/2b1N3/2B1n3/8/PPP2PPP/RNB2RK1 b kq - 1 8',
    desc: 'Posição com oportunidades táticas dinâmicas',
  },
];

export const LoadPositionModal: React.FC = () => {
  const isLoadPositionModalOpen = useGameStore((state) => state.isLoadPositionModalOpen);
  const setIsLoadPositionModalOpen = useGameStore((state) => state.setIsLoadPositionModalOpen);
  const loadFEN = useGameStore((state) => state.loadFEN);
  const loadPGN = useGameStore((state) => state.loadPGN);

  const [mode, setMode] = useState<'fen' | 'pgn'>('fen');
  const [inputVal, setInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isLoadPositionModalOpen) return null;

  const handleLoad = () => {
    setErrorMsg(null);
    const trimmed = inputVal.trim();
    if (!trimmed) {
      setErrorMsg('Por favor, cole ou digite uma string válida.');
      return;
    }

    if (mode === 'fen') {
      const ok = loadFEN(trimmed);
      if (!ok) {
        setErrorMsg('FEN inválido. Verifique o formato e as posições das peças.');
      }
    } else {
      const ok = loadPGN(trimmed);
      if (!ok) {
        setErrorMsg('PGN inválido. Verifique os lances da partida.');
      }
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-zinc-100">
                Carregar Posição / Partida
              </h2>
              <p className="text-xs text-zinc-400">
                Importe uma posição FEN ou histórico PGN
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLoadPositionModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Tabs */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => {
                setMode('fen');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                mode === 'fen' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Notação FEN
            </button>
            <button
              onClick={() => {
                setMode('pgn');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                mode === 'pgn' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Partida PGN
            </button>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1">
              {mode === 'fen' ? 'Cole o código FEN completo:' : 'Cole o texto da notação PGN:'}
            </label>
            <textarea
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                mode === 'fen'
                  ? 'Ex: rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
                  : 'Ex: 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 ...'
              }
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-200 focus:outline-none focus:border-amber-500/70"
            />
          </div>

          {/* Presets */}
          {mode === 'fen' && (
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">
                Exemplos rápidos para carregar:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_POSITIONS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputVal(p.fen);
                      setErrorMsg(null);
                    }}
                    className="text-left p-2 rounded-lg bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/40 transition-colors cursor-pointer"
                  >
                    <p className="font-bold text-amber-300 text-[11px]">{p.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <button
            onClick={() => setIsLoadPositionModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleLoad}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Carregar no Tabuleiro 3D
          </button>
        </div>
      </div>
    </div>
  );
};
