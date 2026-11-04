/** Lỗi do người chơi (thiếu tiền, chưa đủ rank...) — UI hiện thành toast, không commit state. */
export class GameError extends Error {}

export function fail(message: string): never {
  throw new GameError(message);
}

export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 0h thứ Hai của tuần chứa thời điểm t */
export function weekStart(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export const weekKey = (t: number) => dayKey(weekStart(t));

export function nextMidnight(t: number): number {
  const d = new Date(t);
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

// ---------- Random ----------

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Số ngẫu nhiên cố định theo key (giá chợ theo ngày, bot BXH theo tuần) */
export const seededRand = (key: string) => mulberry32(hashStr(key))();

export const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ---------- Hiển thị ----------

export const fmt = (n: number) => Math.floor(n).toLocaleString('vi-VN');

export const pct = (v: number) => {
  const p = v * 100;
  if (p <= 0) return '0%';
  if (p < 0.001) return `${Number(p.toFixed(5))}%`;
  if (p < 0.01) return `${Number(p.toFixed(4))}%`;
  if (p < 1) return `${Number(p.toFixed(2))}%`;
  if (Math.abs(p - Math.round(p)) > 0.001) return `${Number(p.toFixed(2))}%`;
  return `${Math.round(p)}%`;
};

export function fmtTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}n ${h}g`;
  if (h > 0) return `${h}g ${pad(m)}p`;
  if (m > 0) return `${m}p ${pad(sec)}s`;
  return `${sec}s`;
}
