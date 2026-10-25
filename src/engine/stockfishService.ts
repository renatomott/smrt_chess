import type { Square, PieceSymbol } from 'chess.js';
import { Chess } from 'chess.js';
import {
  type ComputerDifficulty,
  type EngineMoveResult,
  type HintResult,
  DIFFICULTY_CONFIGS,
} from './engineTypes';

class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private currentResolve: ((move: EngineMoveResult | null) => void) | null = null;
  private fallbackChess = new Chess();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    try {
      this.worker = new Worker('/stockfish-engine.js');
      this.worker.onmessage = (e) => {
        const line = typeof e.data === 'string' ? e.data.trim() : '';

        if (line === 'readyok' || line === 'uciok') {
          this.isReady = true;
        } else if (line.startsWith('bestmove')) {
          const parts = line.split(' ');
          const moveStr = parts[1];
          if (moveStr && moveStr !== '0000' && moveStr.length >= 4) {
            const from = moveStr.slice(0, 2) as Square;
            const to = moveStr.slice(2, 4) as Square;
            const promotion = moveStr.length > 4 ? (moveStr[4].toLowerCase() as PieceSymbol) : undefined;
            if (this.currentResolve) {
              const res = this.currentResolve;
              this.currentResolve = null;
              res({ from, to, promotion });
            }
          } else {
            if (this.currentResolve) {
              const res = this.currentResolve;
              this.currentResolve = null;
              res(null);
            }
          }
        }
      };

      this.worker.postMessage('uci');
      this.worker.postMessage('isready');
    } catch {
      // In-browser fallback if worker is blocked
      this.worker = null;
    }
  }

  // Pure fallback move generation if worker is inactive
  private computeFallbackMove(fen: string, difficulty: ComputerDifficulty): EngineMoveResult | null {
    try {
      this.fallbackChess.load(fen);
      const moves = this.fallbackChess.moves({ verbose: true });
      if (moves.length === 0) return null;

      const config = DIFFICULTY_CONFIGS[difficulty];

      // Sort moves by captures and promotions
      moves.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (a.captured) scoreA += 10;
        if (a.promotion) scoreA += 15;
        if (b.captured) scoreB += 10;
        if (b.promotion) scoreB += 15;
        return scoreB - scoreA;
      });

      let chosen = moves[0];
      if (config.skillLevel <= 2) {
        // Beginner: pick randomly among available legal moves
        chosen = moves[Math.floor(Math.random() * moves.length)];
      } else if (config.skillLevel <= 6) {
        // Casual: pick among top 3
        const slice = moves.slice(0, Math.min(3, moves.length));
        chosen = slice[Math.floor(Math.random() * slice.length)];
      }

      return {
        from: chosen.from as Square,
        to: chosen.to as Square,
        promotion: chosen.promotion as PieceSymbol | undefined,
      };
    } catch {
      return null;
    }
  }

  public async getBestMove(fen: string, difficulty: ComputerDifficulty): Promise<EngineMoveResult | null> {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const thinkTime =
      Math.floor(Math.random() * (config.maxThinkMs - config.minThinkMs)) + config.minThinkMs;

    const startTimestamp = Date.now();

    let move: EngineMoveResult | null = null;

    if (this.worker) {
      move = await new Promise<EngineMoveResult | null>((resolve) => {
        this.currentResolve = resolve;
        this.worker!.postMessage(`setoption name Skill Level value ${config.skillLevel}`);
        this.worker!.postMessage(`position fen ${fen}`);
        this.worker!.postMessage(`go depth ${config.depth}`);

        // Timeout safety
        setTimeout(() => {
          if (this.currentResolve === resolve) {
            this.currentResolve = null;
            resolve(this.computeFallbackMove(fen, difficulty));
          }
        }, 5000);
      });
    } else {
      move = this.computeFallbackMove(fen, difficulty);
    }

    // Humanize thinking delay
    const elapsed = Date.now() - startTimestamp;
    const remainingDelay = Math.max(0, thinkTime - elapsed);
    if (remainingDelay > 0) {
      await new Promise((r) => setTimeout(r, remainingDelay));
    }

    return move;
  }

  public async getHint(fen: string): Promise<HintResult | null> {
    const move = await this.getBestMove(fen, 'master');
    if (!move) return null;

    try {
      this.fallbackChess.load(fen);
      const moveResult = this.fallbackChess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || 'q',
      });

      if (!moveResult) return null;

      let advice = 'Lance tático recomendado pela engine para manter o controle da posição.';
      if (moveResult.captured) {
        advice = `Captura vantajosa da peça adversária em ${move.to.toUpperCase()}.`;
      } else if (moveResult.piece === 'p' && (move.to[1] === '4' || move.to[1] === '5')) {
        advice = 'Avanço de peão chave para conquistar espaço central.';
      } else if (moveResult.san.includes('O-O')) {
        advice = 'Roque estratégico para colocar o rei em segurança e ativar a torre.';
      } else if (moveResult.piece === 'n' || moveResult.piece === 'b') {
        advice = `Desenvolvimento da peça menor (${moveResult.piece === 'n' ? 'Cavalo' : 'Bispo'}) ativando o ataque.`;
      }

      return {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        san: moveResult.san,
        advice,
      };
    } catch {
      return null;
    }
  }

  public stopThinking() {
    if (this.currentResolve) {
      this.currentResolve = null;
    }
    if (this.worker) {
      this.worker.postMessage('stop');
    }
  }
}

export const stockfishService = new StockfishService();
