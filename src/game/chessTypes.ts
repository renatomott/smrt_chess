import type { Square, PieceSymbol, Color } from 'chess.js';

export type GameMode = 'pvp_local' | 'vs_computer' | 'pvp_online';

export type CameraPreset = 'default' | 'top' | 'white' | 'black' | 'cinematic';

export type ClockPreset = 'none' | '1+0' | '3+2' | '5+0' | '10+0' | '15+10' | 'custom';

export interface ClockSettings {
  preset: ClockPreset;
  initialSeconds: number;
  incrementSeconds: number;
}

export interface MoveInfo {
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
  san: string;
  captured?: PieceSymbol;
  isCheck?: boolean;
  isCheckmate?: boolean;
  fenAfter: string;
}

export interface CapturedPieces {
  w: PieceSymbol[]; // captured by black
  b: PieceSymbol[]; // captured by white
}

export interface MaterialAdvantage {
  white: number;
  black: number;
}

export interface GameStatus {
  isOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isTimeout: boolean;
  drawReason?: 'stalemate' | 'threefold' | 'fifty-moves' | 'insufficient-material' | null;
  winner?: Color | 'draw' | null;
}

