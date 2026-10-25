import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { THEMES, type TeamTheme } from '../themes/themes';
import {
  X,
  Sparkles,
  Shield,
  Shuffle,
  Check,
  Flame,
  Shirt,
  Swords,
  Crown,
} from 'lucide-react';

interface RivalryPreset {
  name: string;
  white: string;
  black: string;
  description: string;
}

const RIVALRY_PRESETS: RivalryPreset[] = [
  { name: 'Dérbi Paulista', white: 'palmeiras', black: 'corinthians', description: 'Palmeiras x Corinthians' },
  { name: 'Fla-Flu', white: 'flamengo', black: 'fluminense', description: 'Flamengo x Fluminense' },
  { name: 'Choque-Rei', white: 'saopaulo', black: 'palmeiras', description: 'São Paulo x Palmeiras' },
  { name: 'Gre-Nal', white: 'gremio', black: 'internacional', description: 'Grêmio x Internacional' },
  { name: 'Clássico Mineiro', white: 'cruzeiro', black: 'atleticomg', description: 'Cruzeiro x Atlético-MG' },
  { name: 'Clássico dos Milhões', white: 'flamengo', black: 'vasco', description: 'Flamengo x Vasco' },
  { name: 'Majestoso', white: 'corinthians', black: 'saopaulo', description: 'Corinthians x São Paulo' },
  { name: 'Clássico Alvinegro', white: 'santos', black: 'corinthians', description: 'Santos x Corinthians' },
  { name: 'Duelo do Nordeste', white: 'bahia', black: 'fortaleza', description: 'Bahia x Fortaleza' },
  { name: 'Clássico da Amizade', white: 'botafogo', black: 'vasco', description: 'Botafogo x Vasco' },
  { name: 'Tradicional Real', white: 'classic', black: 'classic', description: 'Mármore & Ébano Nobre' },
];

export const ThemeSelectorModal: React.FC = () => {
  const isThemeModalOpen = useGameStore((state) => state.isThemeModalOpen);
  const setIsThemeModalOpen = useGameStore((state) => state.setIsThemeModalOpen);
  const whiteThemeId = useGameStore((state) => state.whiteThemeId);
  const blackThemeId = useGameStore((state) => state.blackThemeId);
  const setWhiteTheme = useGameStore((state) => state.setWhiteTheme);
  const setBlackTheme = useGameStore((state) => state.setBlackTheme);
  const setMatchThemes = useGameStore((state) => state.setMatchThemes);

  const [activeSide, setActiveSide] = useState<'w' | 'b'>('w');

  if (!isThemeModalOpen) return null;

  const themesList = Object.values(THEMES);
  const whiteTheme: TeamTheme = THEMES[whiteThemeId] || THEMES.classic;
  const blackTheme: TeamTheme = THEMES[blackThemeId] || THEMES.classic;
  const isSameTeam = whiteThemeId === blackThemeId;

  const currentTheme = activeSide === 'w' ? whiteTheme : blackTheme;
  const isAway = activeSide === 'b' && isSameTeam;
  const currentPalette = isAway ? currentTheme.awayKit : currentTheme.homeKit;

  const handleRandomize = () => {
    const keys = Object.keys(THEMES);
    const randW = keys[Math.floor(Math.random() * keys.length)];
    let randB = keys[Math.floor(Math.random() * keys.length)];
    if (randW === randB && Math.random() > 0.4) {
      randB = keys[Math.floor(Math.random() * keys.length)];
    }
    setMatchThemes(randW, randB);
  };

  const getPatternLabel = (pattern: string) => {
    switch (pattern) {
      case 'stripes_h':
        return 'Faixas Horizontais';
      case 'stripes_v':
        return 'Listras Verticais';
      case 'diagonal':
        return 'Faixa Transversal';
      case 'tricolor':
        return 'Tricolor Clássico';
      default:
        return 'Sólido Nobre';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-900/95 border border-amber-500/30 rounded-2xl shadow-2xl shadow-black overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-zinc-100 flex items-center gap-2">
                Temas & Times Brasileiros
                <span className="text-[10px] uppercase font-sans font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  14 Clubes + Clássico
                </span>
              </h2>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Personalize as peças e o tabuleiro temático de mandante e visitante
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rivalry Presets & Match Banner */}
        <div className="px-4 sm:px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/40 flex flex-col gap-2.5">
          {/* Active Clash Matchup Indicator */}
          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 sm:p-3">
            {/* White side */}
            <button
              onClick={() => setActiveSide('w')}
              className={`flex-1 flex items-center gap-2 sm:gap-3 p-2 rounded-lg transition-all cursor-pointer text-left ${
                activeSide === 'w'
                  ? 'bg-amber-500/15 border border-amber-500/50 shadow-md'
                  : 'hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-inner"
                style={{
                  backgroundColor: whiteTheme.homeKit.primaryColor,
                  color: whiteTheme.homeKit.secondaryColor,
                  border: `2px solid ${whiteTheme.homeKit.accentColor}`,
                }}
              >
                ♔
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Brancas (Mandante)
                </span>
                <span className="font-semibold text-xs sm:text-sm text-zinc-100 truncate block">
                  {whiteTheme.name}
                </span>
                <span className="text-[10px] text-zinc-400 truncate block">
                  {whiteTheme.mascot}
                </span>
              </div>
            </button>

            {/* VS Divider */}
            <div className="px-2 sm:px-4 flex flex-col items-center justify-center">
              <span className="text-xs font-black text-amber-400/80 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
                VS
              </span>
              {isSameTeam && (
                <span className="text-[9px] text-emerald-400 font-medium mt-1 whitespace-nowrap">
                  Kit Reserva Ativo
                </span>
              )}
            </div>

            {/* Black side */}
            <button
              onClick={() => setActiveSide('b')}
              className={`flex-1 flex items-center justify-end gap-2 sm:gap-3 p-2 rounded-lg transition-all cursor-pointer text-right ${
                activeSide === 'b'
                  ? 'bg-amber-500/15 border border-amber-500/50 shadow-md'
                  : 'hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Pretas (Visitante)
                </span>
                <span className="font-semibold text-xs sm:text-sm text-zinc-100 truncate block">
                  {blackTheme.name}
                </span>
                <span className="text-[10px] text-zinc-400 truncate block">
                  {blackTheme.mascot}
                </span>
              </div>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-inner"
                style={{
                  backgroundColor: isSameTeam ? blackTheme.awayKit.primaryColor : blackTheme.homeKit.primaryColor,
                  color: isSameTeam ? blackTheme.awayKit.secondaryColor : blackTheme.homeKit.secondaryColor,
                  border: `2px solid ${isSameTeam ? blackTheme.awayKit.accentColor : blackTheme.homeKit.accentColor}`,
                }}
              >
                ♚
              </div>
            </button>
          </div>

          {/* Quick Clássicos presets slider */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                Grandes Clássicos do Futebol Brasileiro
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {RIVALRY_PRESETS.map((preset) => {
                const isActive = whiteThemeId === preset.white && blackThemeId === preset.black;
                return (
                  <button
                    key={preset.name}
                    onClick={() => setMatchThemes(preset.white, preset.black)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span>{preset.name}</span>
                    <span className="text-[9px] opacity-75">({preset.description})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area: Side Selector Tabs + Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Side tabs */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSide('w')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSide === 'w'
                    ? 'bg-zinc-100 text-zinc-950 shadow-md'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Peças Brancas</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </button>
              <button
                onClick={() => setActiveSide('b')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSide === 'b'
                    ? 'bg-zinc-100 text-zinc-950 shadow-md'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Peças Pretas</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </button>
            </div>

            <button
              onClick={handleRandomize}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-amber-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Duelo Aleatório</span>
            </button>
          </div>

          {/* Grid of 15 Clubs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {themesList.map((theme) => {
              const isSelected = (activeSide === 'w' ? whiteThemeId : blackThemeId) === theme.id;
              const isOpponentSelected = (activeSide === 'w' ? blackThemeId : whiteThemeId) === theme.id;
              const willBeAway = activeSide === 'b' && isOpponentSelected && isSelected;
              const kit = willBeAway ? theme.awayKit : theme.homeKit;

              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    if (activeSide === 'w') {
                      setWhiteTheme(theme.id);
                    } else {
                      setBlackTheme(theme.id);
                    }
                  }}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 overflow-hidden group ${
                    isSelected
                      ? 'bg-zinc-800/90 border-amber-500/80 ring-2 ring-amber-500/30 shadow-lg'
                      : 'bg-zinc-900/70 hover:bg-zinc-800/50 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Subtle jersey gradient background */}
                  <div
                    className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none"
                    style={{ backgroundColor: kit.primaryColor }}
                  />

                  {/* Top: Name & Pattern Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-zinc-100 truncate">
                          {theme.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 block truncate">
                        {theme.nickname}
                      </span>
                    </div>

                    <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 whitespace-nowrap">
                      {getPatternLabel(kit.pattern)}
                    </span>
                  </div>

                  {/* Middle: Mascot Title */}
                  <div className="flex items-center gap-2 py-1 px-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                    <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-amber-300 truncate block">
                        Mascote: {theme.mascot}
                      </span>
                      <span className="text-[9px] text-zinc-400 truncate block">
                        {theme.mascotTitle}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Kit Colors & Pattern preview strip */}
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                    {/* Color swatches */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: kit.primaryColor }}
                        title="Cor Principal"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: kit.secondaryColor }}
                        title="Cor Secundária"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                        style={{ backgroundColor: kit.accentColor }}
                        title="Cor de Destaque"
                      />
                    </div>

                    {/* Away badge or stadium color indicator */}
                    <div className="flex items-center gap-1.5">
                      {isOpponentSelected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                          {activeSide === 'w' ? 'Adversário escolheu' : 'Mesmo time (Reserva)'}
                        </span>
                      )}
                      <div
                        className="w-5 h-2.5 rounded border border-zinc-700"
                        style={{ backgroundColor: kit.boardDark }}
                        title="Cor do Tabuleiro Temático"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Preview Card of Current Selected Team */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-serif text-lg font-bold shadow-lg"
                style={{
                  backgroundColor: currentPalette.primaryColor,
                  color: currentPalette.secondaryColor,
                  border: `2px solid ${currentPalette.accentColor}`,
                }}
              >
                {activeSide === 'w' ? '♔' : '♚'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-sm text-zinc-100">
                    {currentTheme.name}
                  </h3>
                  <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {isAway ? 'Uniforme Reserva (Away)' : 'Uniforme Principal (Home)'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  {currentTheme.mascot} • {currentTheme.mascotTitle}
                </p>
              </div>
            </div>

            {/* Silhouettes / characters representation */}
            <div className="flex items-center gap-2 text-zinc-200 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs">
              <span title="Rei (Lenda)">♔ Rei</span>
              <span className="text-zinc-600">•</span>
              <span title="Rainha (Heroína)">♕ Rainha</span>
              <span className="text-zinc-600">•</span>
              <span title="Bispo (Mago)">♗ Bispo</span>
              <span className="text-zinc-600">•</span>
              <span title="Cavalo (Mascote)">♘ Cavalo</span>
              <span className="text-zinc-600">•</span>
              <span title="Torre (Fortaleza)">♖ Torre</span>
              <span className="text-zinc-600">•</span>
              <span title="Peão (Guerreiro)">♙ Peão</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/80">
          <div className="text-xs text-zinc-400 hidden sm:block">
            Partida selecionada:{' '}
            <span className="text-zinc-200 font-semibold">{whiteTheme.name}</span> (Brancas) x{' '}
            <span className="text-zinc-200 font-semibold">{blackTheme.name}</span> (Pretas)
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsThemeModalOpen(false)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer w-full sm:w-auto text-center"
            >
              Confirmar e Jogar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
