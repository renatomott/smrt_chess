import { Peer, type DataConnection } from 'peerjs';
import type { NetConnectionStatus, NetMessage } from './netTypes';

const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const PEER_PREFIX = 'x3d-br-';

// High-availability global STUN servers for cross-network NAT traversal
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
};

// Token de sessão do convidado: permite reconectar na mesma sala sem que um terceiro assuma o lugar.
function generateSessionToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateRoomCode(): string {
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export class PeerService {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private roomCode: string | null = null;
  private isHost = false;
  private pingInterval: any = null;

  // Convidado: token enviado ao conectar. Anfitrião: token do único convidado aceito na sala.
  private sessionToken: string | null = null;
  private sessionCode: string | null = null;
  private acceptedToken: string | null = null;

  public status: NetConnectionStatus = 'disconnected';
  public latency = 0;

  public onStatusChange?: (status: NetConnectionStatus) => void;
  public onMessage?: (msg: NetMessage) => void;
  public onLatencyChange?: (ms: number) => void;

  private setStatus(s: NetConnectionStatus) {
    this.status = s;
    if (this.onStatusChange) {
      this.onStatusChange(s);
    }
  }

  public getRoomCode(): string | null {
    return this.roomCode;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  // Create room as Host
  public createRoom(code?: string): Promise<string> {
    this.disconnect();
    const finalCode = (code || generateRoomCode()).toUpperCase();
    this.roomCode = finalCode;
    this.isHost = true;
    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      const peerId = `${PEER_PREFIX}${finalCode}`;
      this.peer = new Peer(peerId, {
        debug: 1,
        config: ICE_CONFIG,
      });

      this.peer.on('open', () => {
        this.setStatus('hosting_waiting');
        resolve(finalCode);
      });

      this.peer.on('connection', (connection) => {
        const token = (connection.metadata as { token?: string } | undefined)?.token;

        // Sala de 2 jogadores: recusa quem não tem credencial ou não é o convidado já aceito.
        if (!token || (this.acceptedToken && token !== this.acceptedToken)) {
          try {
            connection.close();
          } catch {}
          return;
        }

        this.acceptedToken = token;
        // Mesmo convidado reconectando: a conexão antiga é substituída.
        const previous = this.conn;
        this.conn = connection;
        if (previous && previous !== connection) {
          try {
            previous.close();
          } catch {}
        }
        this.setupConnectionHandlers(connection);
      });

      this.peer.on('error', (err: any) => {
        if (err.type === 'unavailable-id') {
          // Retry with new code if collision
          this.peer?.destroy();
          this.createRoom().then(resolve).catch(reject);
          return;
        }
        this.setStatus('error');
        reject(err);
      });
    });
  }

  // Join existing room as Guest
  public joinRoom(roomCode: string): Promise<void> {
    this.teardown();
    const cleanCode = roomCode.trim().toUpperCase();
    if (!this.sessionToken || this.sessionCode !== cleanCode) {
      this.sessionToken = generateSessionToken();
      this.sessionCode = cleanCode;
    }
    this.roomCode = cleanCode;
    this.isHost = false;
    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      this.peer = new Peer({
        debug: 1,
        config: ICE_CONFIG,
      });

      this.peer.on('open', () => {
        const hostPeerId = `${PEER_PREFIX}${cleanCode}`;
        const connection = this.peer!.connect(hostPeerId, {
          reliable: true,
          metadata: { token: this.sessionToken },
        });

        this.conn = connection;
        this.setupConnectionHandlers(connection);

        connection.on('open', () => {
          resolve();
        });

        // Connection timeout
        setTimeout(() => {
          if (this.status !== 'connected') {
            this.setStatus('error');
            reject(new Error('Tempo esgotado ao conectar na sala.'));
          }
        }, 12000);
      });

      this.peer.on('error', (err) => {
        this.setStatus('error');
        reject(err);
      });
    });
  }

  private setupConnectionHandlers(connection: DataConnection) {
    connection.on('open', () => {
      this.setStatus('connected');
      this.startPing();
    });

    connection.on('data', (data) => {
      if (this.conn !== connection) return;
      const msg = data as NetMessage;
      if (!msg || !msg.type) return;

      if (msg.type === 'PING') {
        connection.send({ type: 'PONG', timestamp: msg.timestamp });
        return;
      }

      if (msg.type === 'PONG') {
        const roundTrip = Date.now() - msg.timestamp;
        this.latency = Math.max(1, Math.round(roundTrip / 2));
        if (this.onLatencyChange) {
          this.onLatencyChange(this.latency);
        }
        return;
      }

      if (this.onMessage) {
        this.onMessage(msg);
      }
    });

    connection.on('close', () => {
      // Conexão antiga já substituída por uma reconexão: não mexe no estado atual.
      if (this.conn !== connection) return;
      this.stopPing();
      this.setStatus('reconnecting');
      // Attempt reconnection if guest
      if (!this.isHost && this.roomCode) {
        setTimeout(() => {
          if (this.status === 'reconnecting') {
            this.joinRoom(this.roomCode!).catch(() => {
              this.setStatus('disconnected');
            });
          }
        }, 2000);
      } else {
        this.setStatus('hosting_waiting');
      }
    });

    connection.on('error', () => {
      this.setStatus('error');
    });
  }

  public sendMessage(msg: NetMessage): boolean {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(msg);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.conn && this.conn.open) {
        this.conn.send({ type: 'PING', timestamp: Date.now() });
      }
    }, 3500);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /** Encerra tudo, inclusive a identidade da sessão (sair da sala). */
  public disconnect() {
    this.teardown();
    this.sessionToken = null;
    this.sessionCode = null;
    this.acceptedToken = null;
  }

  /** Fecha a conexão atual mantendo a identidade da sessão (usado ao reconectar). */
  private teardown() {
    this.stopPing();
    if (this.conn) {
      try {
        this.conn.close();
      } catch {}
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
    this.roomCode = null;
    this.latency = 0;
    this.setStatus('disconnected');
  }
}

export const peerService = new PeerService();
