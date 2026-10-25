import type { Square, PieceSymbol } from 'chess.js';

export type ComputerDifficulty = 'beginner' | 'casual' | 'intermediate' | 'advanced' | 'master';

export interface DifficultyConfig {
  id: ComputerDifficulty;
  name: string;
  elo: string;
  description: string;
  skillLevel: number;
  depth: number;
  minThinkMs: number;
  maxThinkMs: number;
}

export const DIFFICULTY_CONFIGS: Record<ComputerDifficulty, DifficultyConfig> = {
  beginner: {
    id: 'beginner',
    name: 'Iniciante',
    elo: '~700 ELO',
    description: 'Comete erros frequentes; ideal para quem está aprendendo as regras.',
    skillLevel: 0,
    depth: 2,
    minThinkMs: 600,
    maxThinkMs: 900,
  },
  casual: {
    id: 'casual',
    name: 'Casual',
    elo: '~1200 ELO',
    description: 'Jogo amigável com noções de desenvolvimento e pequenos descuidos.',
    skillLevel: 4,
    depth: 4,
    minThinkMs: 800,
    maxThinkMs: 1300,
  },
  intermediate: {
    id: 'intermediate',
    name: 'Intermediário',
    elo: '~1600 ELO',
    description: 'Bom jogo posicional, atento a táticas básicas e controle central.',
    skillLevel: 9,
    depth: 8,
    minThinkMs: 1000,
    maxThinkMs: 1600,
  },
  advanced: {
    id: 'advanced',
    name: 'Avançado',
    elo: '~2000 ELO',
    description: 'Cálculo profundo, raramente falha em táticas e pune imprecisões.',
    skillLevel: 14,
    depth: 12,
    minThinkMs: 1200,
    maxThinkMs: 2000,
  },
  master: {
    id: 'master',
    name: 'Mestre',
    elo: '~2500+ ELO',
    description: 'Nível máximo do Stockfish; jogo implacável de grande mestre.',
    skillLevel: 20,
    depth: 16,
    minThinkMs: 1500,
    maxThinkMs: 2400,
  },
};

export interface EngineMoveResult {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

export interface HintResult {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  san: string;
  advice: string;
}
