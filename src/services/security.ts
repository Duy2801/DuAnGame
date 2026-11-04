import type { GameState } from '../game/types';
import { ITEMS } from '../game/config/farm';
import { RODS, KITES } from '../game/config/shops';
import { BUFF_INFO } from '../game/config/buffs';
import { MONSTERS } from '../game/config/combat';
import { ALL_FISH_SPECIES } from '../game/config/fishingZones';

const SECRET_SALT = 'ntmh_secure_shield_v2_2026_@9k!';

/**
 * Thuật toán băm FNV-1a 64-bit tối ưu để tạo checksum toàn vẹn cho save
 */
function fnv1a64(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5 ^ 0x5b79;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 16777619);
    h2 = Math.imul(h2 ^ (code + i), 16777619);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

/**
 * Tạo chữ ký xác thực toàn vẹn cho GameState dựa trên các chỉ số cốt lõi:
 * Vàng, Kim Cương, Cấp độ, XP, Thời điểm tick, Profile, Kho đồ
 */
export function generateSaveSignature(g: Partial<GameState>): string {
  if (!g) return '';
  const gold = Math.floor(g.gold || 0);
  const gems = Math.floor(g.gems || 0);
  const lvl = Math.floor(g.player?.level || 1);
  const xp = Math.floor(g.player?.xp || 0);
  const tick = Math.floor(g.lastTick || 0);
  const name = g.profile?.name || '';
  const weapon = g.player?.equip?.weapon || '';
  const armor = g.player?.equip?.armor || '';
  const invLen = Object.keys(g.inventory || {}).length;

  const payload = `${gold}:${gems}:${lvl}:${xp}:${tick}:${name}:${weapon}:${armor}:${invLen}:${SECRET_SALT}`;
  return fnv1a64(payload);
}

/**
 * Kiểm tra tính toàn vẹn của save. Trả về true nếu hợp lệ, false nếu bị can thiệp bộ nhớ hoặc sửa file
 */
export function verifySaveIntegrity(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  const sig = data._sig;
  if (!sig || typeof sig !== 'string') return true; // Save cũ chưa có signature (cho phép nâng cấp lần đầu)
  const expected = generateSaveSignature(data);
  return sig === expected;
}

/**
 * Đóng băng (Object.freeze) toàn bộ catalog cấu hình game trong bộ nhớ
 * Chặn người dùng mở Console F12 sửa giá vật phẩm, dame vũ khí, tỉ lệ rớt
 */
let frozen = false;
export function freezeGameConfigs() {
  if (frozen) return;
  frozen = true;
  try {
    if (typeof Object.freeze === 'function') {
      Object.freeze(ITEMS);
      Object.freeze(RODS);
      Object.freeze(KITES);
      Object.freeze(BUFF_INFO);
      Object.freeze(MONSTERS);
      Object.freeze(ALL_FISH_SPECIES);
    }
  } catch {
    // bỏ qua nếu môi trường strict không cho phép
  }
}

/**
 * Lọc và chuẩn hóa nghiêm ngặt GameState chống tràn số và hack giá trị âm
 */
export function sanitizeGameState(g: GameState): GameState {
  if (!g) return g;

  // Giới hạn vàng và kim cương
  g.gold = Math.min(Math.max(0, Math.floor(Number(g.gold) || 0)), 1_000_000_000_000);
  g.gems = Math.min(Math.max(0, Math.floor(Number(g.gems) || 0)), 10_000_000);

  // Giới hạn cấp và XP
  if (g.player) {
    g.player.level = Math.min(Math.max(1, Math.floor(Number(g.player.level) || 1)), 100);
    g.player.xp = Math.min(Math.max(0, Math.floor(Number(g.player.xp) || 0)), 500_000);
    g.player.hp = Math.min(Math.max(0, Math.floor(Number(g.player.hp) || 60)), 50_000);
  }

  // Chuẩn hóa kho đồ
  if (g.inventory && typeof g.inventory === 'object') {
    for (const [id, count] of Object.entries(g.inventory)) {
      if (typeof count !== 'number' || isNaN(count) || count <= 0) {
        delete g.inventory[id];
      } else {
        g.inventory[id] = Math.min(Math.floor(count), 99999);
      }
    }
  }

  // Gắn chữ ký bảo mật mới nhất
  (g as any)._sig = generateSaveSignature(g);

  return g;
}

/**
 * In cảnh báo an ninh lên Browser Console để răn đe
 */
export function initConsoleSecurityWarning() {
  if (typeof window === 'undefined' || !window.console) return;

  const titleStyle = 'color: #ef4444; font-size: 20px; font-weight: bold; text-shadow: 1px 1px #000;';
  const textStyle = 'color: #fbbf24; font-size: 13px; line-height: 1.5;';

  console.log('%c🛑 CẢNH BÁO AN NINH HỆ THỐNG', titleStyle);
  console.log(
    '%cĐây là giao diện lập trình trình duyệt. Mọi hành vi tiêm mã, can thiệp RAM, sửa save hoặc gọi RPC giả mạo sẽ bị máy chủ ghi nhận vi phạm và tự động khóa tài khoản theo chính sách Row-Level Security!',
    textStyle
  );
}
