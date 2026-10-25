import type { Square, PieceSymbol, Color } from 'chess.js';
import type { ClockSettings } from '../game/chessTypes';

export type NetConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'hosting_waiting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface NetPlayerInfo {
  isHost: boolean;
  color: Color;
  name?: string;
}

export type NetMessage =
  | { type: 'INIT_SYNC'; clockSettings: ClockSettings; hostColor: Color; fen: string }
  | { type: 'MOVE'; from: Square; to: Square; promotion?: PieceSymbol }
  | { type: 'SYNC_TIME'; whiteTime: number; blackTime: number }
  | { type: 'OFFER_DRAW' }
  | { type: 'ACCEPT_DRAW' }
  | { type: 'DECLINE_DRAW' }
  | { type: 'RESIGN' }
  | { type: 'OFFER_REMATCH' }
  | { type: 'ACCEPT_REMATCH' }
  | { type: 'DECLINE_REMATCH' }
  | { type: 'PING'; timestamp: number }
  | { type: 'PONG'; timestamp: number };
