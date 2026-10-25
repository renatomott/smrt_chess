import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA on desktop or mobile home screen, hide button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop Chrome / Edge flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
        title="Instalar SMRT Chess no seu dispositivo como aplicativo nativo"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 text-amber-300 font-semibold text-xs transition-all cursor-pointer"
          title="Instalar no iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Instalar no iOS</span>
          <span className="sm:hidden">Instalar</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 p-6 shadow-2xl relative text-zinc-100">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-zinc-100">
                    Instalar no iPhone / iPad
                  </h3>
                  <p className="text-xs text-zinc-400">Siga 2 passos rápidos no Safari:</p>
                </div>
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300 mb-5">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p className="pt-0.5">
                    Toque no botão <strong>Compartilhar</strong> (ícone do quadrado com a seta para cima <Share className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" />) na barra inferior do Safari.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p className="pt-0.5">
                    Role a lista para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-400 mx-0.5" />).
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs tracking-wide transition-colors cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback: Show standard install button that provides manual instruction or prompts
  return (
    <>
      <button
        onClick={() => setShowIOSGuide(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-amber-300 font-medium text-xs transition-all cursor-pointer"
        title="Instalar SMRT Chess como aplicativo"
      >
        <Download className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 p-6 shadow-2xl relative text-zinc-100 text-center">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto mb-3">
              <Download className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold font-serif text-zinc-100 mb-1">
              Instalar SMRT Chess
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Jogue em tela cheia com ícone exclusivo na sua área de trabalho ou celular.
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300 text-left space-y-2 mb-5">
              <p>• <strong>No Chrome / Edge (Computador)</strong>: Clique no ícone de instalação <Download className="w-3.5 h-3.5 inline mx-0.5 text-amber-400" /> na barra de endereços do navegador.</p>
              <p>• <strong>No Celular (Android)</strong>: Toque no menu do navegador (três pontinhos) e escolha <strong>"Instalar aplicativo"</strong>.</p>
              <p>• <strong>No iPhone / iPad</strong>: Toque em Compartilhar e escolha <strong>"Adicionar à Tela de Início"</strong>.</p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs tracking-wide transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
