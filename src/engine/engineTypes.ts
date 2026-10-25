import type { Square, PieceSymbol } from 'chess.js';

export type ComputerDifficulty = 'beginner' | 'casual' | 'intermediate' | 'advanced' | 'master';

export interface DifficultyConfig {
  id: ComputerDifficulty;
  name: string;
  elo: string;
  description: string;
  /** Skill Level do Stockfish (0–20). */
  skillLevel: number;
  /** Chance de jogar um lance legal qualquer em vez do escolhido pela engine (erro "humano"). */
  blunderChance: number;
  depth: number;
  minThinkMs: number;
  maxThinkMs: number;
}

export const DIFFICULTY_CONFIGS: Record<ComputerDifficulty, DifficultyConfig> = {
  beginner: {
    id: 'beginner',
    name: 'Iniciante',
    elo: 'Nível 0/20',
    description: 'Comete erros frequentes; ideal para quem está aprendendo as regras.',
    skillLevel: 0,
    blunderChance: 0.3,
    depth: 2,
    minThinkMs: 600,
    maxThinkMs: 900,
  },
  casual: {
    id: 'casual',
    name: 'Casual',
    elo: 'Nível 4/20',
    description: 'Jogo amigável com noções de desenvolvimento e pequenos descuidos.',
    skillLevel: 4,
    blunderChance: 0.1,
    depth: 4,
    minThinkMs: 800,
    maxThinkMs: 1300,
  },
  intermediate: {
    id: 'intermediate',
    name: 'Intermediário',
    elo: 'Nível 9/20',
    description: 'Bom jogo posicional, atento a táticas básicas e controle central.',
    skillLevel: 9,
    blunderChance: 0,
    depth: 8,
    minThinkMs: 1000,
    maxThinkMs: 1600,
  },
  advanced: {
    id: 'advanced',
    name: 'Avançado',
    elo: 'Nível 14/20',
    description: 'Cálculo profundo, raramente falha em táticas e pune imprecisões.',
    skillLevel: 14,
    blunderChance: 0,
    depth: 12,
    minThinkMs: 1200,
    maxThinkMs: 2000,
  },
  master: {
    id: 'master',
    name: 'Mestre',
    elo: 'Força total',
    description: 'Nível máximo do Stockfish; jogo implacável de grande mestre.',
    skillLevel: 20,
    blunderChance: 0,
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
