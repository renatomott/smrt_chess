import type { Square, PieceSymbol } from 'chess.js';
import { Chess } from 'chess.js';
import {
  type ComputerDifficulty,
  type EngineMoveResult,
  type HintResult,
  DIFFICULTY_CONFIGS,
} from './engineTypes';

// Stockfish 19 (lite, single-thread WASM). Não precisa de COOP/COEP.
// Os arquivos ficam em /public/stockfish (licença GPLv3 em Copying.txt).
export const STOCKFISH_WORKER_URL = '/stockfish/stockfish-19-lite-single.js';

// Tempo máximo esperando o Stockfish antes de cair no lance legal de reserva.
const ENGINE_TIMEOUT_MS = 10000;

interface PendingSearch {
  id: number;
  resolve: (move: EngineMoveResult | null) => void;
}

interface GetBestMoveOptions {
  /** Pula a espera "humana" (usado pela dica). */
  instant?: boolean;
}

class StockfishService {
  private worker: Worker | null = null;
  private pending: PendingSearch | null = null;
  private searchCounter = 0;
  // Quantos "bestmove" de buscas canceladas ainda vão chegar do worker e devem ser ignorados.
  private ignoredBestMoves = 0;
  private legalityChess = new Chess();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      const worker = new Worker(STOCKFISH_WORKER_URL);
      worker.onmessage = (e: MessageEvent) => {
        const line = typeof e.data === 'string' ? e.data.trim() : '';
        if (line.startsWith('bestmove')) {
          this.handleBestMove(line);
        }
      };
      worker.onerror = () => {
        // Falha ao carregar/rodar o worker: passa a usar só o lance de reserva.
        this.worker = null;
        this.ignoredBestMoves = 0;
        this.settle(null);
      };
      worker.postMessage('uci');
      worker.postMessage('isready');
      this.worker = worker;
    } catch {
      this.worker = null;
    }
  }

  /** Cancela a busca em andamento; o "bestmove" que ela ainda emitir será descartado. */
  private cancelPending() {
    if (!this.pending) return;
    this.settle(null);
    this.ignoredBestMoves++;
    this.worker?.postMessage('stop');
  }

  private settle(move: EngineMoveResult | null) {
    const current = this.pending;
    this.pending = null;
    if (current) current.resolve(move);
  }

  private handleBestMove(line: string) {
    if (this.ignoredBestMoves > 0) {
      this.ignoredBestMoves--;
      return;
    }
    // "bestmove e2e4 ponder e7e5" | "bestmove (none)" | "bestmove 0000"
    const moveStr = line.split(/\s+/)[1];
    if (!moveStr || moveStr === '(none)' || moveStr === '0000' || moveStr.length < 4) {
      this.settle(null);
      return;
    }
    this.settle({
      from: moveStr.slice(0, 2) as Square,
      to: moveStr.slice(2, 4) as Square,
      promotion: moveStr.length > 4 ? (moveStr[4].toLowerCase() as PieceSymbol) : undefined,
    });
  }

  /** O lance é legal na posição? O Stockfish não deveria errar, mas validamos sempre. */
  private isLegal(fen: string, move: EngineMoveResult): boolean {
    try {
      this.legalityChess.load(fen);
      return this.legalityChess
        .moves({ verbose: true })
        .some(
          (m) =>
            m.from === move.from &&
            m.to === move.to &&
            (m.promotion || undefined) === (move.promotion || undefined)
        );
    } catch {
      return false;
    }
  }

  private randomLegalMove(fen: string): EngineMoveResult | null {
    try {
      this.legalityChess.load(fen);
      const moves = this.legalityChess.moves({ verbose: true });
      if (moves.length === 0) return null;
      const chosen = moves[Math.floor(Math.random() * moves.length)];
      return {
        from: chosen.from as Square,
        to: chosen.to as Square,
        promotion: chosen.promotion as PieceSymbol | undefined,
      };
    } catch {
      return null;
    }
  }

  // Lance de reserva (sem worker, timeout ou lance ilegal): sempre legal.
  // Prefere capturas e promoções; nos níveis baixos sorteia entre as melhores.
  private computeFallbackMove(fen: string, difficulty: ComputerDifficulty): EngineMoveResult | null {
    try {
      this.legalityChess.load(fen);
      const moves = this.legalityChess.moves({ verbose: true });
      if (moves.length === 0) return null;

      const config = DIFFICULTY_CONFIGS[difficulty];
      const score = (m: (typeof moves)[number]) =>
        (m.captured ? 10 : 0) + (m.promotion ? 15 : 0) + (m.san.includes('+') ? 3 : 0);
      moves.sort((a, b) => score(b) - score(a));

      let chosen = moves[0];
      if (config.skillLevel <= 2) {
        chosen = moves[Math.floor(Math.random() * moves.length)];
      } else if (config.skillLevel <= 6) {
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

  private searchWithEngine(fen: string, difficulty: ComputerDifficulty): Promise<EngineMoveResult | null> {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const worker = this.worker;
    if (!worker) return Promise.resolve(null);

    // Só uma busca por vez: cancela a anterior (ela resolve como null).
    this.cancelPending();

    return new Promise<EngineMoveResult | null>((resolve) => {
      const id = ++this.searchCounter;
      this.pending = { id, resolve };

      worker.postMessage(`setoption name Skill Level value ${config.skillLevel}`);
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${config.depth} movetime ${Math.max(300, config.maxThinkMs)}`);

      setTimeout(() => {
        if (this.pending && this.pending.id === id) {
          this.cancelPending();
        }
      }, ENGINE_TIMEOUT_MS);
    });
  }

  public async getBestMove(
    fen: string,
    difficulty: ComputerDifficulty,
    options: GetBestMoveOptions = {}
  ): Promise<EngineMoveResult | null> {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const startTimestamp = Date.now();

    let move: EngineMoveResult | null = null;

    // Níveis iniciais cometem "erros humanos": às vezes jogam um lance legal qualquer.
    if (!options.instant && config.blunderChance > 0 && Math.random() < config.blunderChance) {
      move = this.randomLegalMove(fen);
    }

    if (!move) {
      move = await this.searchWithEngine(fen, difficulty);
      if (!move || !this.isLegal(fen, move)) {
        move = this.computeFallbackMove(fen, difficulty);
      }
    }

    if (!options.instant) {
      // Pequena espera para o computador não parecer instantâneo demais.
      const thinkTime =
        Math.floor(Math.random() * (config.maxThinkMs - config.minThinkMs)) + config.minThinkMs;
      const remainingDelay = Math.max(0, thinkTime - (Date.now() - startTimestamp));
      if (remainingDelay > 0) {
        await new Promise((r) => setTimeout(r, remainingDelay));
      }
    }

    return move;
  }

  public async getHint(fen: string): Promise<HintResult | null> {
    const move = await this.getBestMove(fen, 'master', { instant: true });
    if (!move) return null;

    try {
      this.legalityChess.load(fen);
      const moveResult = this.legalityChess.move({
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
    this.cancelPending();
  }
}

export const stockfishService = new StockfishService();
