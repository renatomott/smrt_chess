import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Globe2, Copy, Check, X, Users, ArrowRight, Loader2, Link as LinkIcon, Radio, Share2 } from 'lucide-react';

export const OnlineRoomModal: React.FC = () => {
  const isOnlineModalOpen = useGameStore((state) => state.isOnlineModalOpen);
  const setIsOnlineModalOpen = useGameStore((state) => state.setIsOnlineModalOpen);
  const netStatus = useGameStore((state) => state.netStatus);
  const netRoomCode = useGameStore((state) => state.netRoomCode);
  const netIsHost = useGameStore((state) => state.netIsHost);
  const createOnlineRoom = useGameStore((state) => state.createOnlineRoom);
  const joinOnlineRoom = useGameStore((state) => state.joinOnlineRoom);
  const leaveOnlineRoom = useGameStore((state) => state.leaveOnlineRoom);

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check URL query param ?sala= or ?room= on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('sala') || urlParams.get('room');
    if (roomParam && roomParam.length >= 4) {
      setJoinCodeInput(roomParam.toUpperCase());
      setActiveTab('join');
      setIsOnlineModalOpen(true);
    }
  }, [setIsOnlineModalOpen]);

  if (!isOnlineModalOpen) return null;

  const handleCreate = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await createOnlineRoom();
    } catch {
      setErrorMsg('Falha ao registrar sala no servidor PeerJS. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (joinCodeInput.trim().length < 4) {
      setErrorMsg('Digite um código de sala válido (5 caracteres).');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await joinOnlineRoom(joinCodeInput.trim().toUpperCase());
      setIsOnlineModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Não foi possível conectar à sala. Verifique o código e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const shareableUrl =
    typeof window !== 'undefined' && netRoomCode
      ? `${window.location.origin}${window.location.pathname}?sala=${netRoomCode}`
      : '';

  const handleCopyCode = () => {
    if (!netRoomCode) return;
    navigator.clipboard.writeText(netRoomCode);
    setCopyCodeSuccess(true);
    setTimeout(() => setCopyCodeSuccess(false), 2000);
  };

  const handleCopyLink = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopyLinkSuccess(true);
    setTimeout(() => setCopyLinkSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl relative text-zinc-100 flex flex-col">
        <button
          onClick={() => setIsOnlineModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-zinc-100">
              PVP Online P2P
            </h2>
            <p className="text-xs text-zinc-400">
              Multiplayer direto entre navegadores via WebRTC PeerJS
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        {netStatus !== 'connected' && netStatus !== 'hosting_waiting' && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 mb-5">
            <button
              onClick={() => {
                setActiveTab('create');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Criar Nova Sala
            </button>
            <button
              onClick={() => {
                setActiveTab('join');
                setErrorMsg(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'join'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Entrar com Código
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-600/50 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Content: Host Waiting for Guest */}
        {netStatus === 'hosting_waiting' && netRoomCode ? (
          <div className="flex flex-col items-center text-center py-3 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Radio className="w-8 h-8 animate-pulse text-amber-400" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                Código da sua sala
              </span>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="font-mono text-3xl font-black text-amber-400 tracking-widest bg-zinc-950 px-4 py-2 rounded-xl border border-amber-500/40">
                  {netRoomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer border border-zinc-700"
                  title="Copiar código"
                >
                  {copyCodeSuccess ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-300 max-w-xs">
              Envie este código ou o link abaixo para seu adversário conectar direto pelo navegador:
            </p>

            <div className="w-full flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-all cursor-pointer"
              >
                <LinkIcon className="w-4 h-4 text-amber-400" />
                <span>{copyLinkSuccess ? 'Link copiado!' : 'Copiar Link'}</span>
              </button>

              {shareableUrl && (
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Te desafio para uma partida de SMRT Chess online agora! Clique no link para entrar na minha sala: ${shareableUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 border border-emerald-500/50 text-xs font-bold text-white transition-all shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-300/80 pt-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Aguardando oponente entrar na sala...</span>
            </div>

            <button
              onClick={leaveOnlineRoom}
              className="text-xs text-zinc-500 hover:text-zinc-300 pt-2 cursor-pointer"
            >
              Cancelar e fechar sala
            </button>
          </div>
        ) : netStatus === 'connected' ? (
          /* Connected State */
          <div className="flex flex-col items-center text-center py-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-lg text-zinc-100">
              Conectado ao Oponente!
            </h3>
            <p className="text-xs text-zinc-400">
              Partida sincronizada em tempo real via WebRTC.
            </p>
            <button
              onClick={() => setIsOnlineModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs tracking-wide transition-all cursor-pointer mt-3"
            >
              Ir para o Tabuleiro
            </button>
          </div>
        ) : activeTab === 'create' ? (
          /* Create Tab Initial */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-2">
              <p>
                Crie uma sala instantânea sem necessidade de cadastro ou servidor intermediário.
              </p>
              <p className="text-zinc-400 text-[11px]">
                Você jogará de <strong>Brancas</strong> e seu oponente jogará de <strong>Pretas</strong>. O relógio e posições serão sincronizados automaticamente.
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando Sala...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Criar Sala e Gerar Código</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Join Tab */
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Código de 5 Letras da Sala
              </label>
              <input
                type="text"
                maxLength={5}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="Ex: X7K9P"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest text-zinc-100 uppercase focus:outline-none placeholder:text-zinc-600"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={isLoading || joinCodeInput.trim().length < 4}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <span>Entrar na Partida</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
