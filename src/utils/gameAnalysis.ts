import { Chess, type Square, type Color } from 'chess.js';
import type { MoveInfo } from '../game/chessTypes';
import { evaluateBoard } from './evaluation';

export type MoveClassification =
  | 'brilliant'
  | 'best'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export interface AnalyzedMove {
  index: number;
  ply: number; // 1, 2, 3...
  turnNumber: number;
  color: Color;
  san: string;
  from: Square;
  to: Square;
  evalBefore: number; // pawns (+1.2)
  evalAfter: number; // pawns
  delta: number; // player perspective (+ gained, - lost)
  classification: MoveClassification;
  explanation: string;
  bestMoveSan?: string;
  bestMoveFrom?: Square;
  bestMoveTo?: Square;
  fenBefore: string;
  fenAfter: string;
}

export interface PlayerStats {
  accuracy: number;
  brilliant: number;
  best: number;
  good: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
}

export interface GameAnalysisReport {
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteStats: PlayerStats;
  blackStats: PlayerStats;
  moves: AnalyzedMove[];
  evalGraph: number[]; // Evaluation points in pawns from White perspective
  keyMoments: AnalyzedMove[]; // All blunders, mistakes, and brilliant moves
}

// Find best legal move by evaluating 1-ply lookahead with tactical scoring
function findCandidateBestMove(chess: Chess): { from: Square; to: Square; san: string } | null {
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  const currentTurn = chess.turn();
  let bestScore = currentTurn === 'w' ? -99999 : 99999;
  let bestCandidate = legalMoves[0];

  for (const move of legalMoves) {
    chess.move(move);
    const evalRes = evaluateBoard(chess);
    chess.undo();

    if (currentTurn === 'w') {
      if (evalRes.score > bestScore) {
        bestScore = evalRes.score;
        bestCandidate = move;
      }
    } else {
      if (evalRes.score < bestScore) {
        bestScore = evalRes.score;
        bestCandidate = move;
      }
    }
  }

  return {
    from: bestCandidate.from as Square,
    to: bestCandidate.to as Square,
    san: bestCandidate.san,
  };
}

export function analyzeGameHistory(history: MoveInfo[]): GameAnalysisReport {
  const replayChess = new Chess();
  const analyzedMoves: AnalyzedMove[] = [];
  const evalGraph: number[] = [0];

  let whiteLossSum = 0;
  let whiteMoveCount = 0;
  let blackLossSum = 0;
  let blackMoveCount = 0;

  const whiteStats: PlayerStats = {
    accuracy: 100,
    brilliant: 0,
    best: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };

  const blackStats: PlayerStats = {
    accuracy: 100,
    brilliant: 0,
    best: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };

  for (let i = 0; i < history.length; i++) {
    const moveInfo = history[i];
    const fenBefore = replayChess.fen();
    const evalBefore = evaluateBoard(replayChess);

    // Compute best alternative move before playing actual move
    const engineBest = findCandidateBestMove(replayChess);

    // Make the actual played move
    const result = replayChess.move({
      from: moveInfo.from,
      to: moveInfo.to,
      promotion: 'q',
    });

    const fenAfter = replayChess.fen();
    const evalAfter = evaluateBoard(replayChess);

    evalGraph.push(evalAfter.pawns);

    const isWhite = moveInfo.color === 'w';
    // Delta from moving player's point of view (positive = player improved position)
    const delta = isWhite
      ? evalAfter.pawns - evalBefore.pawns
      : evalBefore.pawns - evalAfter.pawns;

    const loss = Math.max(0, -delta);
    if (isWhite) {
      whiteLossSum += loss;
      whiteMoveCount++;
    } else {
      blackLossSum += loss;
      blackMoveCount++;
    }

    // Classification
    let classification: MoveClassification = 'good';
    let explanation = '';

    const isMatchBest = engineBest && engineBest.san === moveInfo.san;

    if (moveInfo.isCheckmate) {
      classification = 'brilliant';
      explanation = 'Xeque-mate decisivo! Encerrou a partida com perfeição.';
    } else if (isMatchBest && (delta >= 0.2 || moveInfo.san.includes('+'))) {
      classification = 'brilliant';
      explanation = 'Lance excelente! Encontrou a continuação mais precisa da posição.';
    } else if (isMatchBest || delta >= -0.15) {
      classification = 'best';
      explanation = 'Melhor lance! Mantém a melhor linha recomendada pela engine.';
    } else if (delta >= -0.5) {
      classification = 'good';
      explanation = 'Bom lance. Mantém a solidez da posição sem grandes concessões.';
    } else if (delta >= -1.2) {
      classification = 'inaccuracy';
      explanation = `Imprecisão tática. O melhor lance recomendado era ${engineBest?.san || 'outro'}.`;
    } else if (delta >= -2.4) {
      classification = 'mistake';
      explanation = `Erro relevante que concede vantagem ao oponente. Era melhor ${engineBest?.san || 'jogar diferente'}.`;
    } else {
      classification = 'blunder';
      explanation = `Gafe crítica (Blunder)! Perda decisiva de material ou posição. Melhor opção: ${engineBest?.san || 'recuar'}.`;
    }

    // Accumulate stats
    const statsObj = isWhite ? whiteStats : blackStats;
    statsObj[classification]++;

    analyzedMoves.push({
      index: i,
      ply: i + 1,
      turnNumber: Math.floor(i / 2) + 1,
      color: moveInfo.color,
      san: moveInfo.san,
      from: moveInfo.from,
      to: moveInfo.to,
      evalBefore: evalBefore.pawns,
      evalAfter: evalAfter.pawns,
      delta,
      classification,
      explanation,
      bestMoveSan: engineBest?.san,
      bestMoveFrom: engineBest?.from,
      bestMoveTo: engineBest?.to,
      fenBefore,
      fenAfter,
    });
  }

  // Calculate CAPS accuracy formula
  const whiteAvgLoss = whiteMoveCount > 0 ? whiteLossSum / whiteMoveCount : 0;
  const blackAvgLoss = blackMoveCount > 0 ? blackLossSum / blackMoveCount : 0;

  whiteStats.accuracy = Math.round(
    Math.max(15, Math.min(99, 100 * Math.exp(-0.75 * whiteAvgLoss)))
  );
  blackStats.accuracy = Math.round(
    Math.max(15, Math.min(99, 100 * Math.exp(-0.75 * blackAvgLoss)))
  );

  // Key moments: blunders, mistakes, brilliant moves
  const keyMoments = analyzedMoves.filter(
    (m) =>
      m.classification === 'blunder' ||
      m.classification === 'mistake' ||
      m.classification === 'brilliant'
  );

  return {
    whiteAccuracy: whiteStats.accuracy,
    blackAccuracy: blackStats.accuracy,
    whiteStats,
    blackStats,
    moves: analyzedMoves,
    evalGraph,
    keyMoments,
  };
}
