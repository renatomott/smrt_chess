import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { analyzeGameHistory, type AnalyzedMove, type MoveClassification } from '../utils/gameAnalysis';
import {
  BarChart3,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Flame,
  Check,
  Eye,
  TrendingUp,
  Filter,
  Play,
  RotateCcw,
} from 'lucide-react';

const CLASSIFICATION_CONFIG: Record<
  MoveClassification,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  brilliant: {
    label: 'Brilhante',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/40',
    icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
  },
  best: {
    label: 'Melhor Lance',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  },
  good: {
    label: 'Bom',
    color: 'text-teal-400',
    bg: 'bg-teal-500/15',
    border: 'border-teal-500/40',
    icon: <Check className="w-3.5 h-3.5 text-teal-400" />,
  },
  inaccuracy: {
    label: 'Imprecisão',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
  },
  mistake: {
    label: 'Erro',
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/40',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
  },
  blunder: {
    label: 'Gafe (Blunder)',
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    icon: <Flame className="w-3.5 h-3.5 text-red-400" />,
  },
};

export const GameReviewModal: React.FC = () => {
  const isReviewModalOpen = useGameStore((state) => state.isReviewModalOpen);
  const setIsReviewModalOpen = useGameStore((state) => state.setIsReviewModalOpen);
  const moveHistory = useGameStore((state) => state.moveHistory);
  const setHistoryViewIndex = useGameStore((state) => state.setHistoryViewIndex);

  const [filter, setFilter] = useState<'all' | 'blunders' | 'best'>('all');
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);

  // Analyze the complete game history
  const report = useMemo(() => {
    return analyzeGameHistory(moveHistory);
  }, [moveHistory]);

  if (!isReviewModalOpen) return null;

  const filteredMoves = report.moves.filter((m) => {
    if (filter === 'blunders') return m.classification === 'blunder' || m.classification === 'mistake';
    if (filter === 'best') return m.classification === 'best' || m.classification === 'brilliant';
    return true;
  });

  const handleInspectMove = (index: number) => {
    setSelectedMoveIndex(index);
    setHistoryViewIndex(index);
    // Keep modal open or minimize slightly so player sees the board
  };

  // Sparkline calculation for evaluation momentum
  const graphPoints = report.evalGraph;
  const maxEval = 6;
  const minEval = -6;
  const graphWidth = 400;
  const graphHeight = 70;
  const polylineCoords = graphPoints
    .map((val, idx) => {
      const clamped = Math.max(minEval, Math.min(maxEval, val));
      const x = (idx / Math.max(1, graphPoints.length - 1)) * graphWidth;
      // Invert Y so positive is at the top
      const y = graphHeight / 2 - (clamped / maxEval) * (graphHeight / 2 - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-zinc-100 flex items-center gap-2">
                Relatório de Análise Stockfish
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                  Pós-Partida
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Detecção automática de gafes (blunders), erros táticos e precisão de jogo
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsReviewModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Top Accuracies Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* White Player Accuracy */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase text-zinc-400 block mb-0.5">
                  Brancas
                </span>
                <span className="font-bold text-sm text-zinc-200">Precisão FIDE</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-red-400 font-mono font-bold">
                    {report.whiteStats.blunder} {report.whiteStats.blunder === 1 ? 'Gafe' : 'Gafes'}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[11px] text-orange-400 font-mono">
                    {report.whiteStats.mistake} Erros
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-black text-xl shadow-lg">
                  {report.whiteAccuracy}%
                </div>
              </div>
            </div>

            {/* Black Player Accuracy */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase text-zinc-400 block mb-0.5">
                  Pretas
                </span>
                <span className="font-bold text-sm text-zinc-200">Precisão FIDE</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-red-400 font-mono font-bold">
                    {report.blackStats.blunder} {report.blackStats.blunder === 1 ? 'Gafe' : 'Gafes'}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-[11px] text-orange-400 font-mono">
                    {report.blackStats.mistake} Erros
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono font-black text-xl shadow-lg">
                  {report.blackAccuracy}%
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <h4 className="font-semibold text-zinc-300 text-xs mb-2.5 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Classificação Geral dos Lances
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              {(
                [
                  'brilliant',
                  'best',
                  'good',
                  'inaccuracy',
                  'mistake',
                  'blunder',
                ] as MoveClassification[]
              ).map((type) => {
                const conf = CLASSIFICATION_CONFIG[type];
                return (
                  <div
                    key={type}
                    className={`p-2 rounded-xl border ${conf.bg} ${conf.border} flex flex-col items-center justify-center`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {conf.icon}
                      <span className={`font-bold text-[11px] ${conf.color}`}>{conf.label}</span>
                    </div>
                    <div className="text-xs font-mono font-semibold text-zinc-300">
                      <span title="Brancas">{report.whiteStats[type]}</span>
                      <span className="text-zinc-500 mx-1">|</span>
                      <span title="Pretas">{report.blackStats[type]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Momentum / Evaluation Chart */}
          {graphPoints.length > 2 && (
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-zinc-300 text-xs">
                  Oscilação de Vantagem da Partida (Momentum)
                </h4>
                <span className="text-[10px] text-zinc-500 font-mono">
                  + Vantagem Brancas | - Vantagem Pretas
                </span>
              </div>
              <div className="w-full h-16 bg-zinc-900/80 rounded-lg border border-zinc-800/80 relative overflow-hidden flex items-center">
                {/* Center 0.0 line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-700/60 border-t border-dashed border-zinc-600" />
                <svg
                  viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylineCoords}
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Move-by-Move List Header with Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
                <span>Histórico Analisado ({filteredMoves.length} lances)</span>
              </h4>
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Todos ({report.moves.length})
                </button>
                <button
                  onClick={() => setFilter('blunders')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    filter === 'blunders'
                      ? 'bg-red-500 text-white'
                      : 'text-red-400/80 hover:text-red-300'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  Gafes & Erros ({report.whiteStats.blunder + report.blackStats.blunder + report.whiteStats.mistake + report.blackStats.mistake})
                </button>
                <button
                  onClick={() => setFilter('best')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    filter === 'best'
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'text-emerald-400/80 hover:text-emerald-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  Melhores ({report.whiteStats.best + report.blackStats.best + report.whiteStats.brilliant + report.blackStats.brilliant})
                </button>
              </div>
            </div>

            {/* Moves List Cards */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredMoves.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
                  Nenhum lance encontrado com o filtro selecionado.
                </div>
              ) : (
                filteredMoves.map((m) => {
                  const conf = CLASSIFICATION_CONFIG[m.classification];
                  const isSelected = selectedMoveIndex === m.index;

                  return (
                    <div
                      key={m.index}
                      className={`p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-zinc-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-zinc-400">
                            {m.turnNumber}.{m.color === 'b' ? '..' : ''}
                          </span>
                          <span className="font-mono font-black text-sm text-zinc-100 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                            {m.san}
                          </span>
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${conf.bg} ${conf.color} ${conf.border}`}
                          >
                            {conf.icon}
                            {conf.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs font-bold ${
                              m.delta >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {m.delta >= 0 ? `+${m.delta.toFixed(1)}` : m.delta.toFixed(1)}
                          </span>
                          <button
                            onClick={() => handleInspectMove(m.index)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 font-semibold text-[11px] transition-colors cursor-pointer"
                            title="Rever esta posição no tabuleiro 3D"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver 3D</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-zinc-300 text-xs leading-relaxed">{m.explanation}</p>

                      {/* Best alternative box if not best */}
                      {m.bestMoveSan && m.classification !== 'best' && m.classification !== 'brilliant' && (
                        <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center justify-between">
                          <span>
                            Recomendação da Stockfish: <strong className="font-mono text-emerald-200">{m.bestMoveSan}</strong>
                          </span>
                          <span className="text-[10px] text-emerald-400/80">Linha Ideal</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Dica: Clique em "Ver 3D" em qualquer lance para reproduzir a posição exata no tabuleiro.
          </span>
          <button
            onClick={() => setIsReviewModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg"
          >
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};
