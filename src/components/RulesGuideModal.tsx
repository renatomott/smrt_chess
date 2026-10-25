import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Shield,
  Zap,
  RotateCcw,
  Crown,
  Scale,
  Award,
  ChevronRight,
} from 'lucide-react';

interface RulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'pieces' | 'special' | 'draws' | 'faq';

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('special');

  if (!isOpen) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-zinc-100">
                Guia & Regras Oficiais FIDE
              </h2>
              <p className="text-xs text-zinc-400">
                Regulamento internacional de xadrez e lances especiais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-3 pt-2 gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('special')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'special'
                ? 'bg-zinc-800 text-amber-400 border-t-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Lances Especiais
          </button>
          <button
            onClick={() => setActiveTab('pieces')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pieces'
                ? 'bg-zinc-800 text-amber-400 border-t-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            Peças & Movimentos
          </button>
          <button
            onClick={() => setActiveTab('draws')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'draws'
                ? 'bg-zinc-800 text-amber-400 border-t-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Tipos de Empate
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'faq'
                ? 'bg-zinc-800 text-amber-400 border-t-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Dúvidas Frequentes
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-zinc-300">
          {activeTab === 'special' && (
            <div className="space-y-4">
              {/* En Passant */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">1</span>
                    Captura "En Passant" (Ao Passar)
                  </h3>
                  <span className="text-[11px] text-zinc-500">Regra Oficial FIDE 3.7.d</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                  Quando um peão faz seu primeiro movimento avançando <strong>duas casas</strong> e para exatamente ao lado (mesma fila) de um peão adversário, este pode capturá-lo na diagonal como se ele tivesse avançado apenas uma casa.
                </p>
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2">
                  <span className="font-bold">⚠️ Atenção:</span>
                  <span>A captura *en passant* só pode ser realizada <strong>imediatamente no lance seguinte</strong>. Se você fizer qualquer outro movimento, o direito se perde para sempre.</span>
                </div>
              </div>

              {/* Roque */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">2</span>
                    Roque Maior (0-0-0) e Roque Menor (0-0)
                  </h3>
                  <span className="text-[11px] text-zinc-500">Regra Oficial FIDE 3.8</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                  O único movimento do xadrez onde <strong>duas peças se movem simultaneamente</strong>: o Rei se desloca duas casas em direção à Torre, e a Torre salta para a casa imediatamente ao lado oposto do Rei.
                </p>
                <div className="space-y-1.5 text-xs text-zinc-400 bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                  <p className="font-semibold text-zinc-200">Requisitos obrigatórios:</p>
                  <p>• O Rei e a respectiva Torre <strong>nunca</strong> podem ter sido movidos anteriormente.</p>
                  <p>• Todas as casas entre eles devem estar totalmente vazias.</p>
                  <p>• O Rei <strong>não pode estar em xeque</strong>, nem passar ou aterrissar em nenhuma casa atacada pelo adversário.</p>
                </div>
              </div>

              {/* Promoção */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">3</span>
                    Promoção do Peão
                  </h3>
                  <span className="text-[11px] text-zinc-500">Regra Oficial FIDE 3.7.e</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Quando um peão alcança a última fileira do tabuleiro (a 8ª para as brancas ou a 1ª para as pretas), ele é <strong>imediatamente transformado</strong> em uma Dama, Torre, Bispo ou Cavalo da mesma cor, à sua escolha, sem importar se essas peças já foram capturadas ou não (é possível ter múltiplas damas).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'pieces' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">♙ Peão (1 Ponto)</h4>
                <p className="text-xs text-zinc-300">Avança 1 casa à frente (ou 2 no seu primeiro lance). Captura apenas 1 casa na diagonal à frente. Nunca pode retroceder.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">♘ Cavalo (3 Pontos)</h4>
                <p className="text-xs text-zinc-300">Move-se em forma de "L" (2 casas em linha reta e 1 perpendicular). É a <strong>única peça</strong> com permissão para saltar sobre outras peças.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">♗ Bispo (3 Pontos)</h4>
                <p className="text-xs text-zinc-300">Move-se em diagonais quantas casas quiser, desde que desobstruídas. Permanece para sempre na cor de casa em que iniciou.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">♖ Torre (5 Pontos)</h4>
                <p className="text-xs text-zinc-300">Move-se em linhas retas (colunas e fileiras) sem limite de distância. Participa do roque junto com o Rei.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">♕ Dama / Rainha (9 Pontos)</h4>
                <p className="text-xs text-zinc-300">A peça mais poderosa do jogo: combina os movimentos da Torre e do Bispo, movendo-se em qualquer direção reta ou diagonal.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">♔ Rei (Inestimável)</h4>
                <p className="text-xs text-zinc-300">Move-se 1 casa em qualquer direção. O Rei nunca pode se colocar em perigo direto (casa atacada). Sua captura encerra a partida.</p>
              </div>
            </div>
          )}

          {activeTab === 'draws' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">1. Afogamento (Stalemate)</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Ocorre quando o jogador que tem a vez de jogar <strong>não possui nenhum lance legal disponível</strong> e seu Rei <strong>não está em xeque</strong>. O resultado oficial é sempre EMPATE imediato.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">2. Insuficiência de Material</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Quando nenhum dos dois jogadores tem peças suficientes para forçar um xeque-mate legal (ex: Rei contra Rei; Rei e Bispo contra Rei; Rei e Cavalo contra Rei).
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">3. Regra dos 50 Lances</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Se durante 50 lances consecutivos de cada lado nenhum peão for movido e nenhuma peça for capturada, o jogo pode ser declarado empatado.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-1">4. Repetição Tripla</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Acontece quando a exata mesma posição do tabuleiro ocorre pela 3ª vez durante a partida, com os mesmos lances e direitos de roque possíveis.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-zinc-200 text-xs mb-1">Posso colocar meu próprio Rei em Xeque?</h4>
                <p className="text-xs text-zinc-400">Não. Qualquer movimento que deixe o próprio Rei sob ataque direto de uma peça adversária é considerado lance ilegal pelas regras da FIDE.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-zinc-200 text-xs mb-1">Posso ter mais de uma Dama no tabuleiro?</h4>
                <p className="text-xs text-zinc-400">Sim! Não há limite. Toda vez que um peão seu atravessar o tabuleiro até a 8ª fila, você pode promovê-lo a uma nova Dama.</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <h4 className="font-bold text-zinc-200 text-xs mb-1">Como funciona o tempo no relógio?</h4>
                <p className="text-xs text-zinc-400">No xadrez com relógio (Blitz ou Rápida), o tempo só corre quando é a sua vez. Se o seu relógio zerar, você perde por tempo (a menos que o oponente não tenha material mínimo para dar mate).</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer shadow-lg"
          >
            Entendido, Voltar ao Jogo
          </button>
        </div>
      </div>
    </div>
  );
};
