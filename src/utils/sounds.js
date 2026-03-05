// Web Audio API-based sound effects system
// All sounds are synthesized - no external audio files needed

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Master volume (0-1)
let masterVolume = 0.5;
let soundEnabled = true;

export function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  try {
    localStorage.setItem('quizblitz_sound', enabled ? '1' : '0');
  } catch {}
}

export function isSoundEnabled() {
  try {
    const stored = localStorage.getItem('quizblitz_sound');
    if (stored !== null) soundEnabled = stored === '1';
  } catch {}
  return soundEnabled;
}

export function setVolume(vol) {
  masterVolume = Math.max(0, Math.min(1, vol));
}

function playTone(freq, duration, type = 'sine', volume = 0.3) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume * masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

function playNoise(duration, volume = 0.1) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * masterVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {}
}

// Correct answer - ascending cheerful notes
export function playCorrect() {
  playTone(523, 0.15, 'sine', 0.3);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 100);
  setTimeout(() => playTone(784, 0.25, 'sine', 0.35), 200);
}

// Wrong answer - descending buzz
export function playWrong() {
  playTone(300, 0.15, 'square', 0.15);
  setTimeout(() => playTone(250, 0.2, 'square', 0.12), 120);
  setTimeout(() => playTone(200, 0.3, 'square', 0.1), 240);
}

// Button click - short tick
export function playClick() {
  playTone(800, 0.05, 'sine', 0.15);
}

// Countdown tick (3, 2, 1)
export function playCountdownTick() {
  playTone(600, 0.1, 'sine', 0.25);
}

// Countdown GO!
export function playGo() {
  playTone(523, 0.1, 'sine', 0.3);
  setTimeout(() => playTone(784, 0.1, 'sine', 0.35), 80);
  setTimeout(() => playTone(1047, 0.3, 'sine', 0.4), 160);
}

// Timer warning beep (last 5 seconds)
export function playTimerWarning() {
  playTone(880, 0.08, 'sine', 0.2);
}

// Timer expired - alarm
export function playTimeUp() {
  playTone(440, 0.15, 'square', 0.2);
  setTimeout(() => playTone(440, 0.15, 'square', 0.2), 200);
}

// Streak milestone (3+)
export function playStreak() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.12, 'sine', 0.25), i * 80);
  });
}

// Victory fanfare (podium)
export function playVictory() {
  const melody = [523, 659, 784, 1047, 784, 1047];
  melody.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.3), i * 150);
  });
}

// Player joined lobby
export function playPlayerJoin() {
  playTone(700, 0.08, 'sine', 0.15);
  setTimeout(() => playTone(900, 0.1, 'sine', 0.15), 60);
}

// Game starting
export function playGameStart() {
  const notes = [392, 494, 587, 784];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.3), i * 120);
  });
}

// Points earned - quick rising tone
export function playPointsEarned() {
  playTone(600, 0.06, 'sine', 0.2);
  setTimeout(() => playTone(900, 0.06, 'sine', 0.2), 40);
  setTimeout(() => playTone(1200, 0.1, 'sine', 0.25), 80);
}

// Initialize audio on first user interaction
export function initAudio() {
  try {
    getAudioContext();
  } catch {}
}
