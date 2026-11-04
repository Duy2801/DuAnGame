import { seededRand } from './utils';

/** 1 ngày trong game = 12 phút ngoài đời */
export const DAY_CYCLE_MS = 12 * 60_000;
const RAIN_SLOT_MS = 3 * 60_000;

export const gameHour = (now: number) => ((now % DAY_CYCLE_MS) / DAY_CYCLE_MS) * 24;

/** 0 = trưa sáng rõ, 0.62 = nửa đêm */
export function darkness(now: number): number {
  const h = gameHour(now);
  const MAX = 0.62;
  if (h >= 6 && h < 18) return 0;
  if (h >= 18 && h < 20) return ((h - 18) / 2) * MAX;
  if (h >= 20 || h < 4) return MAX;
  return ((6 - h) / 2) * MAX;
}

export const isNight = (now: number) => darkness(now) > 0.3;

/** Mưa theo từng khung 3 phút, cố định theo thời gian thực */
export const isRaining = (now: number) => seededRand(`rain:${Math.floor(now / RAIN_SLOT_MS)}`) < 0.22;

export function clockText(now: number): string {
  const h = gameHour(now);
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
