import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';

const PIECE_WEIGHTS: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Center control squares
const CENTER_SQUARES: Square[] = ['d4', 'e4', 'd5', 'e5'];
const EXTENDED_CENTER: Square[] = ['c3', 'd3', 'e3', 'f3', 'c4', 'f4', 'c5', 'f5', 'c6', 'd6', 'e6', 'f6'];

export interface EvalResult {
  score: number; // positive = White advantage, negative = Black advantage (in centipawns)
  pawns: number; // score / 100
  whitePercentage: number; // 0 to 100% for the visual bar (50% is even)
  formatted: string; // e.g. "+1.4", "-0.8", "0.0", "M1"
  isMate: boolean;
  mateIn?: number;
}

export function evaluateBoard(chess: Chess): EvalResult {
  if (chess.isCheckmate()) {
    const winner: Color = chess.turn() === 'w' ? 'b' : 'w';
    return {
      score: winner === 'w' ? 10000 : -10000,
      pawns: winner === 'w' ? 100 : -100,
      whitePercentage: winner === 'w' ? 100 : 0,
      formatted: winner === 'w' ? 'M1' : '-M1',
      isMate: true,
      mateIn: 1,
    };
  }

  if (chess.isDraw()) {
    return {
      score: 0,
      pawns: 0,
      whitePercentage: 50,
      formatted: '0.0',
      isMate: false,
    };
  }

  let materialScore = 0;
  let positionalScore = 0;

  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const val = PIECE_WEIGHTS[piece.type] || 0;
      const mult = piece.color === 'w' ? 1 : -1;

      materialScore += val * mult;

      // Center bonus
      const file = String.fromCharCode(97 + c);
      const rank = (8 - r).toString();
      const sq = `${file}${rank}` as Square;

      if (CENTER_SQUARES.includes(sq)) {
        positionalScore += 25 * mult;
      } else if (EXTENDED_CENTER.includes(sq)) {
        positionalScore += 10 * mult;
      }

      // Pawn advancement bonus
      if (piece.type === 'p') {
        const advancement = piece.color === 'w' ? (7 - r) : r;
        positionalScore += (advancement * 6) * mult;
      }

      // Knights in rim penalty
      if (piece.type === 'n' && (c === 0 || c === 7 || r === 0 || r === 7)) {
        positionalScore -= 15 * mult;
      }
    }
  }

  // Check bonus
  if (chess.inCheck()) {
    const inCheckColor = chess.turn();
    const checkPenalty = inCheckColor === 'w' ? -35 : 35;
    positionalScore += checkPenalty;
  }

  // Total centipawns
  const totalCp = materialScore + positionalScore;
  const pawns = totalCp / 100;

  // Logistic transformation into percentage for the visual bar
  // sigmoid: 1 / (1 + 10^(-cp / 400)) gives standard chess engine win percentage
  const winRate = 1 / (1 + Math.pow(10, -totalCp / 400));
  const whitePercentage = Math.min(96, Math.max(4, Math.round(winRate * 100)));

  let formatted = '0.0';
  if (Math.abs(pawns) < 0.05) {
    formatted = '0.0';
  } else if (pawns > 0) {
    formatted = `+${pawns.toFixed(1)}`;
  } else {
    formatted = pawns.toFixed(1);
  }

  return {
    score: totalCp,
    pawns,
    whitePercentage,
    formatted,
    isMate: false,
  };
}
