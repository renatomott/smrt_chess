import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Timer, Settings2 } from 'lucide-react';
import type { Color } from 'chess.js';

export function formatSeconds(totalSecs: number): string {
  const rounded = Math.max(0, Math.ceil(totalSecs));
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const ChessClock: React.FC<{ color: Color; label: string }> = ({ color, label }) => {
  const turn = useGameStore((state) => state.turn);
  const whiteTime = useGameStore((state) => state.whiteTime);
  const blackTime = useGameStore((state) => state.blackTime);
  const clockSettings = useGameStore((state) => state.clockSettings);
  const isClockRunning = useGameStore((state) => state.isClockRunning);
  const tickClock = useGameStore((state) => state.tickClock);
  const setIsClockModalOpen = useGameStore((state) => state.setIsClockModalOpen);
  const status = useGameStore((state) => state.status);

  const isActive = turn === color && isClockRunning && !status.isOver;
  const timeRemaining = color === 'w' ? whiteTime : blackTime;

  // Master timer ticker hook (mounted by white clock only to avoid dual ticks)
  const lastTickRef = useRef<number>(performance.now());
  useEffect(() => {
    if (color !== 'w') return;

    let animId: number;
    lastTickRef.current = performance.now();

    const loop = () => {
      const now = performance.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      if (delta > 0 && delta < 1) {
        tickClock(delta);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [color, tickClock]);

  if (clockSettings.preset === 'none') {
    return null;
  }

  const isLowTime = timeRemaining <= 30 && timeRemaining > 10;
  const isCriticalTime = timeRemaining <= 10;

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200 ${
        isActive
          ? isCriticalTime
            ? 'bg-red-950/80 border-red-500 shadow-lg shadow-red-500/20'
            : isLowTime
            ? 'bg-amber-950/70 border-amber-500/80 shadow-md shadow-amber-500/10'
            : 'bg-zinc-900 border-amber-500/60 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
          : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 opacity-80'
      }`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <Timer
            className={`w-3.5 h-3.5 ${
              isActive
                ? isCriticalTime
                  ? 'text-red-400'
                  : 'text-amber-400'
                : 'text-zinc-500'
            }`}
          />
          <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400">
            {label}
          </span>
        </div>

        <span
          className={`font-mono text-base sm:text-lg font-bold tracking-wider leading-none mt-0.5 ${
            isActive
              ? isCriticalTime
                ? 'text-red-400 font-extrabold'
                : isLowTime
                ? 'text-amber-300 font-extrabold'
                : 'text-zinc-100'
              : 'text-zinc-400'
          }`}
        >
          {formatSeconds(timeRemaining)}
        </span>
      </div>

      {clockSettings.incrementSeconds > 0 && (
        <span className="text-[9px] font-mono text-zinc-400 self-end mb-0.5">
          +{clockSettings.incrementSeconds}s
        </span>
      )}
    </div>
  );
};
