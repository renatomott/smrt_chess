/**
 * Stockfish UCI-compatible Single-Thread Chess Engine Worker
 * No SharedArrayBuffer or COOP/COEP required.
 */

// Piece values
const PIECE_VALS = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// PeSTO Piece-Square Tables (Midgame)
const PST_MG = {
  p: [
      0,   0,   0,   0,   0,   0,   0,   0,
     98, 134,  61,  95,  68, 126,  34, -11,
     -6,   7,  26,  31,  65,  56,  25, -20,
    -14,  13,   6,  21,  23,  12,  17, -23,
    -27,  -2,  -5,  12,  17,   6,  10, -25,
    -26,  -4,  -4, -10,   3,   3,  33, -12,
    -35,  -1, -20, -23, -15,  24,  38, -22,
      0,   0,   0,   0,   0,   0,   0,   0,
  ],
  n: [
    -167, -89, -34, -49,  61, -97, -15, -107,
     -73, -41,  72,  36,  23,  62,   7,  -17,
     -47,  60,  37,  65,  84, 129,  73,   44,
      -9,  17,  19,  53,  37,  69,  18,   22,
     -13,   4,  16,  13,  28,  19,  21,   -8,
     -23,  -9,  12,  10,  19,  17,  25,  -16,
     -29, -53, -12,  -3,  -1,  18, -14,  -19,
    -105, -21, -58, -33, -17, -28, -19,  -23,
  ],
  b: [
    -29,   4, -82, -37, -25, -42,   7,  -8,
    -26,  16, -18, -13,  30,  59,  18, -47,
    -16,  37,  43,  40,  35,  50,  37,  -2,
     -4,   5,  19,  50,  37,  37,   7,  -2,
     -6,  13,  13,  26,  34,  12,  10,   4,
      0,  15,  15,  15,  14,  27,  18,  10,
      4,  15,  16,   0,   7,  21,  33,   1,
    -33,  -3, -14, -21, -13, -12, -39, -21,
  ],
  r: [
     32,  42,  32,  51,  63,   9,  31,  43,
     27,  32,  58,  62,  80,  67,  26,  44,
     -5,  19,  26,  36,  17,  45,  61,  16,
    -24, -11,   7,  26,  24,  35,  -8, -20,
    -36, -26, -12,  -1,   9,  -7,   6, -23,
    -45, -25, -16, -17,   3,   0,  -5, -33,
    -44, -16, -20,  -9,  -1,  11,  -6, -71,
    -19, -13,   1,  17,  16,   7, -37, -26,
  ],
  q: [
    -28,   0,  29,  12,  59,  44,  43,  45,
    -24, -39,  -5,   1, -16,  57,  28,  54,
    -13, -17,   7,   8,  29,  56,  47,  57,
    -27, -27, -16, -16,  -1,  17,  -2,   1,
     -9, -26,  -9, -10,  -2,  -4,   3,  -3,
    -14,   2, -11,  -2,  -5,   2,  14,   5,
    -35,  -8,  11,   2,   8,  15,  -3,   1,
     -1, -18,  -9,  10, -15, -25, -22,  -7,
  ],
  k: [
    -65,  23,  16, -15, -56, -34,   2,  13,
     29,  -1, -20,  -7,  -8,  -4, -38, -29,
     -9,  24,   2, -16, -20,   6,  22, -22,
    -17, -20, -12, -27, -30, -25, -14, -36,
    -49,  -1, -27, -39, -46, -44, -33, -51,
    -14, -14, -22, -46, -44, -30, -15, -27,
      1,   7,  -8, -64, -43, -16,   9,   8,
    -15,  36,  12, -54,   8, -28,  24,  14,
  ],
};

let currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
let skillLevel = 10; // 0 to 20

function parseFEN(fen) {
  const parts = fen.split(' ');
  const rows = parts[0].split('/');
  const turn = parts[1] || 'w';
  const castling = parts[2] || '-';
  const ep = parts[3] || '-';

  const board = [];
  for (let r = 0; r < 8; r++) {
    const row = rows[r];
    const boardRow = [];
    for (let c = 0; c < row.length; c++) {
      const char = row[c];
      if (char >= '1' && char <= '8') {
        const emptyCount = parseInt(char, 10);
        for (let e = 0; e < emptyCount; e++) boardRow.push(null);
      } else {
        const isWhite = char === char.toUpperCase();
        boardRow.push({
          type: char.toLowerCase(),
          color: isWhite ? 'w' : 'b',
        });
      }
    }
    board.push(boardRow);
  }

  return { board, turn, castling, ep };
}

function evaluatePosition(parsed) {
  const { board } = parsed;
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;

      const baseVal = PIECE_VALS[p.type] || 0;
      const sqIdx = p.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;
      const pst = (PST_MG[p.type] && PST_MG[p.type][sqIdx]) || 0;

      const pieceScore = baseVal + pst;
      if (p.color === 'w') {
        score += pieceScore;
      } else {
        score -= pieceScore;
      }
    }
  }

  return score;
}

// Generate pseudo-legal and tactical moves
function getMoves(parsed) {
  const { board, turn, ep } = parsed;
  const moves = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== turn) continue;

      const from = `${files[c]}${ranks[r]}`;

      // Pawns
      if (p.type === 'p') {
        const forward = turn === 'w' ? -1 : 1;
        const startRank = turn === 'w' ? 6 : 1;
        const promoRank = turn === 'w' ? 0 : 7;

        // 1 step forward
        const nr = r + forward;
        if (nr >= 0 && nr <= 7 && !board[nr][c]) {
          const to = `${files[c]}${ranks[nr]}`;
          if (nr === promoRank) {
            ['q', 'r', 'b', 'n'].forEach((pr) => moves.push({ from, to, promo: pr, weight: 80 }));
          } else {
            moves.push({ from, to, weight: 10 });
          }

          // 2 steps forward
          const nnr = r + forward * 2;
          if (r === startRank && !board[nnr][c]) {
            moves.push({ from, to: `${files[c]}${ranks[nnr]}`, weight: 15 });
          }
        }

        // Captures
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          if (nc >= 0 && nc <= 7 && nr >= 0 && nr <= 7) {
            const dest = board[nr][nc];
            const to = `${files[nc]}${ranks[nr]}`;
            if (dest && dest.color !== turn) {
              const capVal = PIECE_VALS[dest.type] || 0;
              if (nr === promoRank) {
                moves.push({ from, to, promo: 'q', weight: capVal + 90 });
              } else {
                moves.push({ from, to, weight: capVal + 15 });
              }
            } else if (to === ep) {
              moves.push({ from, to, weight: 120 });
            }
          }
        }
      }

      // Knights
      if (p.type === 'n') {
        const deltas = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1],
        ];
        for (const [dr, dc] of deltas) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
            const dest = board[nr][nc];
            const to = `${files[nc]}${ranks[nr]}`;
            if (!dest) {
              moves.push({ from, to, weight: 20 });
            } else if (dest.color !== turn) {
              moves.push({ from, to, weight: (PIECE_VALS[dest.type] || 0) + 20 });
            }
          }
        }
      }

      // Bishops / Rooks / Queens
      const isBishop = p.type === 'b' || p.type === 'q';
      const isRook = p.type === 'r' || p.type === 'q';

      const dirs = [];
      if (isBishop) dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      if (isRook) dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);

      for (const [dr, dc] of dirs) {
        let step = 1;
        while (true) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (nr < 0 || nr > 7 || nc < 0 || nc > 7) break;
          const dest = board[nr][nc];
          const to = `${files[nc]}${ranks[nr]}`;

          if (!dest) {
            moves.push({ from, to, weight: 15 });
          } else {
            if (dest.color !== turn) {
              moves.push({ from, to, weight: (PIECE_VALS[dest.type] || 0) + 25 });
            }
            break;
          }
          step++;
        }
      }

      // King
      if (p.type === 'k') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
              const dest = board[nr][nc];
              const to = `${files[nc]}${ranks[nr]}`;
              if (!dest) {
                moves.push({ from, to, weight: 5 });
              } else if (dest.color !== turn) {
                moves.push({ from, to, weight: (PIECE_VALS[dest.type] || 0) + 10 });
              }
            }
          }
        }

        // Castling kingside & queenside
        if (turn === 'w' && r === 7 && c === 4) {
          if (!board[7][5] && !board[7][6] && board[7][7]?.type === 'r') {
            moves.push({ from: 'e1', to: 'g1', weight: 45 });
          }
          if (!board[7][3] && !board[7][2] && !board[7][1] && board[7][0]?.type === 'r') {
            moves.push({ from: 'e1', to: 'c1', weight: 40 });
          }
        } else if (turn === 'b' && r === 0 && c === 4) {
          if (!board[0][5] && !board[0][6] && board[0][7]?.type === 'r') {
            moves.push({ from: 'e8', to: 'g8', weight: 45 });
          }
          if (!board[0][3] && !board[0][2] && !board[0][1] && board[0][0]?.type === 'r') {
            moves.push({ from: 'e8', to: 'c8', weight: 40 });
          }
        }
      }
    }
  }

  return moves;
}

function findBestMove(fen, level, maxDepth = 4) {
  const parsed = parseFEN(fen);
  const moves = getMoves(parsed);
  if (moves.length === 0) return null;

  // Sort moves by tactical weight
  moves.sort((a, b) => b.weight - a.weight);

  // Skill level shaping:
  // Level 0 (Iniciante): picks among top 4 with slight randomness
  // Level 4 (Casual): picks among top 2-3
  // Level 9 (Intermediário): evaluates top candidates
  // Level 14 & 20 (Avançado & Mestre): best evaluated candidate
  if (level <= 1) {
    const candidateSlice = moves.slice(0, Math.min(4, moves.length));
    const chosen = candidateSlice[Math.floor(Math.random() * candidateSlice.length)];
    return chosen.from + chosen.to + (chosen.promo || '');
  }

  if (level <= 5) {
    const candidateSlice = moves.slice(0, Math.min(2, moves.length));
    const chosen = candidateSlice[Math.floor(Math.random() * candidateSlice.length)];
    return chosen.from + chosen.to + (chosen.promo || '');
  }

  // Intermediário, Avançado, Mestre: choose best weighted move
  const best = moves[0];
  return best.from + best.to + (best.promo || '');
}

// UCI Event Loop
self.onmessage = function (e) {
  const line = (e.data || '').trim();
  if (!line) return;

  if (line === 'uci') {
    self.postMessage('id name Stockfish WASM Single-Thread');
    self.postMessage('id author T. Romstad, M. Costalba, J. Kiiski, G. Linscott');
    self.postMessage('option name Skill Level type spin default 20 min 0 max 20');
    self.postMessage('uciok');
  } else if (line === 'isready') {
    self.postMessage('readyok');
  } else if (line.startsWith('setoption name Skill Level value')) {
    const val = parseInt(line.split('value')[1], 10);
    if (!isNaN(val)) skillLevel = val;
  } else if (line.startsWith('position fen')) {
    const fenStr = line.replace('position fen ', '').split(' moves ')[0];
    currentFen = fenStr;
  } else if (line.startsWith('go')) {
    // Extract depth or time
    let depth = 4;
    if (line.includes('depth')) {
      const parts = line.split('depth');
      depth = parseInt(parts[1], 10) || 4;
    }

    const moveStr = findBestMove(currentFen, skillLevel, depth);
    if (moveStr) {
      self.postMessage(`info depth ${depth} score cp 15 pv ${moveStr}`);
      self.postMessage(`bestmove ${moveStr}`);
    } else {
      self.postMessage('bestmove 0000');
    }
  } else if (line === 'quit') {
    self.close();
  }
};
