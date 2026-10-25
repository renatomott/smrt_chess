// Web Audio API Synthesizer for high-fidelity physical chess sounds and fanfares
// Fully procedural: no external audio assets needed, 100% offline, zero latency

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function triggerHaptic(duration = 20): void {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(duration);
    } catch {
      // Haptics not available
    }
  }
}

/**
 * Standard move sound: subtle wooden piece slide and solid board tap
 */
export function playMoveSound(): void {
  triggerHaptic(15);
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Impact thump
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);

  // High-frequency wood click
  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();

  clickOsc.type = 'sine';
  clickOsc.frequency.setValueAtTime(800, now);
  clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

  clickGain.gain.setValueAtTime(0.18, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);

  clickOsc.start(now);
  clickOsc.stop(now + 0.04);
}

/**
 * Capture sound: heavier impact with resonant clash and wood knock
 */
export function playCaptureSound(): void {
  triggerHaptic(30);
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Heavy sub-bass thud
  const bassOsc = ctx.createOscillator();
  const bassGain = ctx.createGain();

  bassOsc.type = 'sine';
  bassOsc.frequency.setValueAtTime(180, now);
  bassOsc.frequency.exponentialRampToValueAtTime(30, now + 0.16);

  bassGain.gain.setValueAtTime(0.5, now);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  bassOsc.connect(bassGain);
  bassGain.connect(ctx.destination);

  bassOsc.start(now);
  bassOsc.stop(now + 0.16);

  // Sharp snap / impact
  const snapOsc = ctx.createOscillator();
  const snapGain = ctx.createGain();

  snapOsc.type = 'triangle';
  snapOsc.frequency.setValueAtTime(950, now);
  snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.1);

  snapGain.gain.setValueAtTime(0.35, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  snapOsc.connect(snapGain);
  snapGain.connect(ctx.destination);

  snapOsc.start(now);
  snapOsc.stop(now + 0.1);

  // Noise burst for piece collision crunch
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.2, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
}

/**
 * Castling sound: quick double slide and tap
 */
export function playCastlingSound(): void {
  playMoveSound();
  setTimeout(() => {
    playMoveSound();
  }, 110);
}

/**
 * Check sound: alert resonance chord
 */
export function playCheckSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [330, 440, 660];

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.04);

    gain.gain.setValueAtTime(0.18, now + idx * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.04);
    osc.stop(now + 0.35);
  });
}

/**
 * Checkmate & Victory celebration: triumphant fanfare chords + stadium referee whistle
 */
export function playCheckmateSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // C major triumphant progression: C4, E4, G4, C5
  const notes = [
    { freq: 261.63, time: 0, dur: 0.18 },
    { freq: 329.63, time: 0.15, dur: 0.18 },
    { freq: 392.0, time: 0.3, dur: 0.2 },
    { freq: 523.25, time: 0.48, dur: 0.65 },
  ];

  notes.forEach((n) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(n.freq, now + n.time);

    gain.gain.setValueAtTime(0.25, now + n.time);
    gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + n.time);
    osc.stop(now + n.time + n.dur);
  });

  // Referee double whistle at end of match
  setTimeout(() => {
    playWhistleSound();
  }, 400);
}

/**
 * Referee whistle blast
 */
export function playWhistleSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const whistleFreqs = [2400, 2600];

  whistleFreqs.forEach((f) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.linearRampToValueAtTime(f + 100, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  });
}

/**
 * Pawn promotion: shimmering ascending glissando
 */
export function playPromoteSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [350, 440, 523, 659, 784, 1046];

  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now + i * 0.05);

    gain.gain.setValueAtTime(0.15, now + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.05);
    osc.stop(now + i * 0.05 + 0.3);
  });
}

/**
 * Draw sound: gentle neutral cadence
 */
export function playDrawSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs = [392, 330, 261];

  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now + i * 0.1);

    gain.gain.setValueAtTime(0.2, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.3);
  });
}
