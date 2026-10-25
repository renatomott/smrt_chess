import { Chess, type PieceSymbol, type Square } from 'chess.js';
import type { MoveInfo } from './chessTypes';

/** Lance em formato simples, enviável pela rede. */
export interface PlainMove {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

/** Extrai a peça de promoção de uma notação SAN (ex.: "e8=Q+" → "q"). */
export function promotionFromSan(san: string): PieceSymbol | undefined {
  const match = /=([QRBN])/.exec(san);
  return match ? (match[1].toLowerCase() as PieceSymbol) : undefined;
}

/** Converte o histórico da partida em lances simples (com promoção). */
export function historyToPlainMoves(history: MoveInfo[]): PlainMove[] {
  return history.map((m) => ({ from: m.from, to: m.to, promotion: promotionFromSan(m.san) }));
}

/**
 * Reconstrói uma partida a partir da lista de lances, a partir da posição inicial.
 * Retorna null se algum lance for ilegal (lista corrompida ou adulterada).
 */
export function replayMoves(moves: PlainMove[]): { chess: Chess; history: MoveInfo[] } | null {
  const chess = new Chess();
  const history: MoveInfo[] = [];

  for (const m of moves) {
    if (!m || typeof m.from !== 'string' || typeof m.to !== 'string') return null;
    let result;
    try {
      result = chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    } catch {
      return null;
    }
    if (!result) return null;

    history.push({
      from: result.from as Square,
      to: result.to as Square,
      piece: result.piece,
      color: result.color,
      san: result.san,
      captured: result.captured,
      isCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      fenAfter: chess.fen(),
    });
  }

  return { chess, history };
}
