// Âm thanh tổng hợp bằng WebAudio — không cần file âm thanh

let ctx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem('nong-trai-mao-hiem:muted') === '1';
} catch {
  // bỏ qua
}

export const isMuted = () => muted;

export function setMuted(v: boolean) {
  muted = v;
  try {
    localStorage.setItem('nong-trai-mao-hiem:muted', v ? '1' : '0');
  } catch {
    // bỏ qua
  }
}

/** Trình duyệt chỉ cho phát âm thanh sau thao tác đầu tiên của người chơi */
export function unlockAudio() {
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0) {
  if (muted || !ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export const sfx = {
  swing: () => tone(520, 0.08, 'triangle', 0.05, 220),
  hit: () => tone(180, 0.1, 'square', 0.07, 70),
  crit: () => {
    tone(260, 0.12, 'square', 0.08, 90);
    tone(900, 0.08, 'triangle', 0.05, 1400);
  },
  hurt: () => tone(140, 0.2, 'sawtooth', 0.07, 60),
  coin: () => {
    tone(988, 0.06, 'square', 0.04);
    tone(1319, 0.12, 'square', 0.04, undefined, 0.06);
  },
  harvest: () => tone(660, 0.1, 'triangle', 0.06, 990),
  plant: () => tone(330, 0.08, 'triangle', 0.05, 440),
  levelUp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.05, undefined, i * 0.09)),
  die: () => tone(300, 0.7, 'sawtooth', 0.07, 50),
  slam: () => tone(90, 0.35, 'sawtooth', 0.09, 40),
  open: () => tone(440, 0.06, 'triangle', 0.04, 660),
  click: () => tone(500, 0.04, 'triangle', 0.03),
  buy: () => {
    tone(784, 0.06, 'square', 0.04);
    tone(1046, 0.1, 'square', 0.04, undefined, 0.05);
  },
};
