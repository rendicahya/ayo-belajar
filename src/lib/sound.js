import { settings } from './settings.svelte.js';

let ctx;

function tone(freq, start, dur, type = 'sine', vol = 0.12) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export function play(kind) {
  if (settings.muted) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    return;
  }
  const t = ctx.currentTime;
  switch (kind) {
    case 'tap':
      tone(660, t, 0.06, 'triangle', 0.08);
      break;
    case 'pop':
      tone(880, t, 0.08, 'sine', 0.1);
      tone(1320, t + 0.04, 0.07, 'sine', 0.06);
      break;
    case 'correct':
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.09, 0.2, 'triangle', 0.12));
      break;
    case 'wrong':
      tone(240, t, 0.14, 'square', 0.05);
      tone(180, t + 0.14, 0.22, 'square', 0.05);
      break;
    case 'win':
      [523.25, 659.25, 783.99, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(f, t + i * 0.12, 0.25, 'triangle', 0.12),
      );
      break;
  }
}
