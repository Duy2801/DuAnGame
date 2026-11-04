import type { GameState } from '../types';
import { fail } from '../utils';

/** chữ thường, bỏ dấu tiếng Việt, khoảng trắng, gạch nối, gạch dưới */
export const normalizeCode = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[\s\-_]/g, '')
    .toLowerCase();

// ---------------- Khóa chống dò mã giftcode (Rate Limiting trên client) ----------------
const GIFTCODE_FAIL_KEY = 'nong-trai-mao-hiem:giftcode-fails';

export interface GiftcodeFailRecord {
  count: number;
  until: number;
  lastAttempt: number;
}

export function getGiftcodeLockStatus(): { locked: boolean; remainingSec: number } {
  try {
    const raw = localStorage.getItem(GIFTCODE_FAIL_KEY);
    if (!raw) return { locked: false, remainingSec: 0 };
    const rec = JSON.parse(raw) as Partial<GiftcodeFailRecord>;
    const until = typeof rec.until === 'number' ? rec.until : 0;
    const now = Date.now();
    if (until > now) {
      return { locked: true, remainingSec: Math.ceil((until - now) / 1000) };
    }
    return { locked: false, remainingSec: 0 };
  } catch {
    return { locked: false, remainingSec: 0 };
  }
}

export function recordGiftcodeFail(): number {
  try {
    const raw = localStorage.getItem(GIFTCODE_FAIL_KEY);
    const cur: GiftcodeFailRecord = raw ? JSON.parse(raw) : { count: 0, until: 0, lastAttempt: 0 };
    const count = (cur.count || 0) + 1;
    let lockMs = 0;
    if (count === 3) lockMs = 30_000;
    else if (count === 4) lockMs = 60_000;
    else if (count >= 5) lockMs = 300_000;

    const until = lockMs > 0 ? Date.now() + lockMs : 0;
    const rec: GiftcodeFailRecord = { count, until, lastAttempt: Date.now() };
    localStorage.setItem(GIFTCODE_FAIL_KEY, JSON.stringify(rec));
    return until;
  } catch {
    return 0;
  }
}

export function clearGiftcodeFail() {
  try {
    localStorage.removeItem(GIFTCODE_FAIL_KEY);
  } catch {}
}

/**
 * 100% mã giftcode đã được chuyển về lưu trữ và xác thực an toàn trực tiếp trên Database PostgreSQL (Supabase)
 * để chống hack, chống lộ mã và chống spam brute-force.
 */
export function redeemCode(_g: GameState, _input: string): string {
  fail('Mã giftcode được quản lý trực tiếp trên Database máy chủ. Vui lòng đăng nhập tài khoản để nhận quà.');
}
