import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { THEMES } from '../themes/themes';
import {
  Trophy,
  RotateCcw,
  Scale,
  Eye,
  Shirt,
  Swords,
  Timer,
  Hash,
  ChevronDown,
  ChevronUp,
  Shield,
  BarChart3,
} from 'lucide-react';

export const GameOverModal: React.FC = () => {
  const status = useGameStore((state) => state.status);
  const resetGame = useGameStore((state) => state.resetGame);
  const gameMode = useGameStore((state) => state.gameMode);
  const offerRematch = useGameStore((state) => state.offerRematch);
  const rematchOfferSent = useGameStore((state) => state.rematchOfferSent);
  const leaveOnlineRoom = useGameStore((state) => state.leaveOnlineRoom);
  const assignedPlayerColor = useGameStore((state) => state.assignedPlayerColor);
  const moveHistory = useGameStore((state) => state.moveHistory);
  const setIsReviewModalOpen = useGameStore((state) => state.setIsReviewModalOpen);

  const whiteThemeId = useGameStore((state) => state.whiteThemeId);
  const blackThemeId = useGameStore((state) => state.blackThemeId);

  const [isMinimized, setIsMinimized] = useState(false);

  if (!status.isOver) return null;

  const whiteTheme = THEMES[whiteThemeId] || THEMES.classic;
  const blackTheme = THEMES[blackThemeId] || THEMES.classic;

  const winningTheme =
    status.winner === 'w' ? whiteTheme : status.winner === 'b' ? blackTheme : null;

  let title = 'Fim de Jogo';
  let subtitle = '';
  let icon = <Trophy className="w-10 h-10 text-amber-400" />;

  if (status.isCheckmate) {
    if (status.winner === 'w') {
      title = `${whiteTheme.name} Vence!`;
      subtitle = `Xeque-mate espetacular do ${whiteTheme.nickname} contra o ${blackTheme.nickname}.`;
    } else {
      title = `${blackTheme.name} Vence!`;
      subtitle = `Xeque-mate espetacular do ${blackTheme.nickname} contra o ${whiteTheme.nickname}.`;
    }
  } else if (status.isTimeout) {
    if (status.winner === 'w') {
      title = `Vitória do ${whiteTheme.nickname}!`;
      subtitle = `O tempo do jogador adversário (${blackTheme.nickname}) esgotou.`;
    } else {
      title = `Vitória do ${blackTheme.nickname}!`;
      subtitle = `O tempo do jogador adversário (${whiteTheme.nickname}) esgotou.`;
    }
  } else if (status.isStalemate) {
    title = 'Empate por Afogamento';
    subtitle = 'O rei adversário não possui lances legais e não está em xeque.';
    icon = <Scale className="w-10 h-10 text-sky-400" />;
  } else if (status.drawReason === 'threefold') {
    title = 'Empate por Repetição';
    subtitle = 'A mesma posição no tabuleiro se repetiu por 3 vezes.';
    icon = <Scale className="w-10 h-10 text-sky-400" />;
  } else if (status.drawReason === 'fifty-moves') {
    title = 'Empate: Regra dos 50 Lances';
    subtitle = 'Cinquenta lances consecutivos sem movimento de peão ou captura.';
    icon = <Scale className="w-10 h-10 text-sky-400" />;
  } else if (status.drawReason === 'insufficient-material') {
    title = 'Empate: Material Insuficiente';
    subtitle = 'Nenhum dos lados possui peças suficientes para aplicar xeque-mate.';
    icon = <Scale className="w-10 h-10 text-sky-400" />;
  } else if (status.isDraw) {
    title = 'Partida Empatada';
    subtitle = 'Grande duelo! Empate acordado ou declarado pelas regras da FIDE.';
    icon = <Scale className="w-10 h-10 text-sky-400" />;
  } else if (status.winner) {
    // Resignation
    const won = status.winner === assignedPlayerColor;
    title = won ? `Vitória do ${winningTheme?.nickname || 'Vencedor'}!` : 'Derrota por Desistência';
    subtitle = won
      ? 'O adversário desistiu da partida.'
      : 'Você desistiu da partida.';
  }

  // Minimized Floating Pill on the bottom right of the screen
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom duration-200">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border border-amber-500/50 shadow-2xl text-amber-300 hover:text-amber-200 hover:bg-zinc-800 transition-all cursor-pointer backdrop-blur-md group"
        >
          <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-xs tracking-wide">{title}</span>
          <ChevronUp className="w-3.5 h-3.5 ml-1 text-zinc-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-500/20 text-center relative overflow-hidden">
        {/* Glowing Top accent banner in winner's primary color or gold */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{
            background: winningTheme
              ? `linear-gradient(90deg, ${winningTheme.homeKit.primaryColor}, ${winningTheme.homeKit.accentColor})`
              : 'linear-gradient(90deg, #f59e0b, #eab308)',
          }}
        />

        {/* Mascot / Trophy Presentation */}
        <div className="relative mx-auto mb-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner shadow-amber-500/20">
            {icon}
          </div>
          {winningTheme && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider border border-amber-500/30 bg-zinc-900/80 text-amber-300">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>{winningTheme.mascot} ({winningTheme.nickname})</span>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold font-serif text-zinc-100 tracking-wide mb-1.5">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mb-5 leading-relaxed">
          {subtitle}
        </p>

        {/* Match Stats Summary */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 mb-5 text-left text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Hash className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase font-mono">Total de Lances</span>
              <span className="font-semibold text-zinc-200">{moveHistory.length} lances ({Math.ceil(moveHistory.length / 2)} jogadas)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            <Swords className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase font-mono">Confronto</span>
              <span className="font-semibold text-zinc-200 truncate block">
                {whiteTheme.nickname} vs {blackTheme.nickname}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          {gameMode === 'pvp_online' ? (
            <>
              <button
                onClick={offerRematch}
                disabled={rematchOfferSent}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer ${
                  rematchOfferSent
                    ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/25'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>{rematchOfferSent ? 'Revanche Solicitada... Aguardando' : 'Pedir Revanche (Inverter Lados)'}</span>
              </button>

              <button
                onClick={leaveOnlineRoom}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Sair da Sala Online
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setIsMinimized(false);
                resetGame();
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Nova Partida</span>
            </button>
          )}

          {/* Stockfish Post-Game Report Button */}
          {moveHistory.length > 0 && (
            <button
              onClick={() => {
                setIsMinimized(true);
                setIsReviewModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs tracking-wide transition-all cursor-pointer shadow-md"
            >
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Relatório de Erros & Melhores Lances (Stockfish)</span>
            </button>
          )}

          {/* Inspect / Review Board button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>Ver Tabuleiro Final</span>
          </button>
        </div>
      </div>
    </div>
  );
};
