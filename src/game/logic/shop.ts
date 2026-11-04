import { CROP_BY_ID, ITEMS } from '../config/farm';
import { COSMETICS, COSMETIC_BY_ID, COS_BOX_BY_ID, COS_DUP_GOLD, COS_SHOP_KINDS, fitsGender, type CosmeticDef, type CosmeticKind, type Gender, type RodRarity } from '../config/shops';
import type { GameState } from '../types';
import { DAY_MS, fail, fmt, fmtTime } from '../utils';
import { addItem, earnGold, spendGems, spendGold } from './core';

// ---------------- Hệ thống Hạn Sử Dụng (1 / 3 / 7 Ngày · Vĩnh Viễn 0.0001%) cho mọi Khu Buôn Bán
// Khớp với server (docs/fishing-api.md): 1d 60% · 3d 30% · 7d ~10% · perm 0.0001% (1e-6)

export type DurationRoll = '1d' | '3d' | '7d' | 'perm';
export type DurationStatus = 'new' | 'upgraded_perm' | 'extended' | 'dup_perm';

/** Tỉ lệ ra hạn sử dụng khi mua / mở hộp: 60% 1 Ngày · 30% 3 Ngày · ~10% 7 Ngày · 0.0001% Vĩnh Viễn */
export const DURATION_ODDS: Record<DurationRoll, number> = {
  '1d': 0.6,
  '3d': 0.3,
  '7d': 0.099999,
  perm: 0.000001,
};

export const DURATION_DAYS: Record<Exclude<DurationRoll, 'perm'>, number> = { '1d': 1, '3d': 3, '7d': 7 };

/** nhãn ngắn của từng hạn (dùng chung cho kết quả mở hộp online/offline) */
export const DURATION_TEXT: Record<DurationRoll, string> = {
  '1d': '1 Ngày',
  '3d': '3 Ngày',
  '7d': '7 Ngày',
  perm: '♾️ VĨNH VIỄN (0.0001%)',
};

/** dòng mô tả tỉ lệ hạn sử dụng hiển thị ở các tiệm */
export const DURATION_ODDS_TEXT = '⏳ 1 Ngày (60%) · 3 Ngày (30%) · 7 Ngày (~10%) · ♾️ Vĩnh Viễn (0.0001%)';

const STARTER_PERM_IDS = new Set(['wood_sword', 'cloth', 'rod_bamboo']);

/** Quay ngẫu nhiên hạn sử dụng theo DURATION_ODDS */
export function rollItemDuration(): DurationRoll {
  const r = Math.random();
  if (r < DURATION_ODDS.perm) return 'perm';
  if (r < DURATION_ODDS.perm + DURATION_ODDS['7d']) return '7d';
  if (r < DURATION_ODDS.perm + DURATION_ODDS['7d'] + DURATION_ODDS['3d']) return '3d';
  return '1d';
}

export function durationLabel(dur: DurationRoll, status?: DurationStatus): string {
  if (dur === 'perm') return status === 'upgraded_perm' ? '♾️ LÊN VĨNH VIỄN (0.0001%)' : DURATION_TEXT.perm;
  const days = DURATION_DAYS[dur];
  return status === 'extended' ? `⏳ Cộng dồn +${days} Ngày` : `⏳ ${DURATION_TEXT[dur]}`;
}

/** Kiểm tra món đã sở hữu có phải Vĩnh Viễn không */
export function isPermanent(g: GameState, id: string): boolean {
  if (STARTER_PERM_IDS.has(id)) return true;
  const exp = g.itemExpiry?.[id];
  return !exp || exp <= 0;
}

/** Số ms còn lại của món có hạn sử dụng (null nếu Vĩnh Viễn) */
export function expiryLeftMs(g: GameState, id: string, now = Date.now()): number | null {
  if (STARTER_PERM_IDS.has(id)) return null;
  const exp = g.itemExpiry?.[id];
  if (!exp || exp <= 0) return null;
  return Math.max(0, exp - now);
}

/** Nhãn hiển thị thời hạn của món đang sở hữu */
export function expiryBadgeText(g: GameState, id: string, now = Date.now()): string {
  const left = expiryLeftMs(g, id, now);
  if (left === null) return '♾️ Vĩnh viễn';
  if (left <= 0) return '⌛ Hết hạn';
  return `⏳ Còn ${fmtTime(left)}`;
}

/**
 * Áp dụng hạn sử dụng vừa quay được cho một vật phẩm/trang bị:
 * - Nếu đã sở hữu Vĩnh Viễn (`wasOwned && isPermanent`) → trả về `'dup_perm'` để quy đổi vàng.
 * - Nếu quay trúng `'perm'` (0.0001%) → xóa hạn sử dụng, trở thành Vĩnh Viễn trọn đời!
 * - Nếu quay ra `'1d'`, `'3d'` hoặc `'7d'` → gán hạn mới hoặc cộng dồn thêm ngày nếu đang còn hạn.
 */
export function applyItemDuration(
  g: GameState,
  id: string,
  dur: DurationRoll,
  wasOwned: boolean,
  now = Date.now(),
): DurationStatus {
  if (!g.itemExpiry) g.itemExpiry = {};
  if (STARTER_PERM_IDS.has(id)) {
    delete g.itemExpiry[id];
    return wasOwned ? 'dup_perm' : 'new';
  }
  if (wasOwned && isPermanent(g, id)) {
    return 'dup_perm';
  }
  if (dur === 'perm') {
    delete g.itemExpiry[id];
    return wasOwned ? 'upgraded_perm' : 'new';
  }
  const addMs = DURATION_DAYS[dur] * DAY_MS;
  if (wasOwned && g.itemExpiry[id] && g.itemExpiry[id] > now) {
    g.itemExpiry[id] += addMs;
    return 'extended';
  }
  g.itemExpiry[id] = now + addMs;
  return 'new';
}

/** Thu hồi các món đã hết hạn sử dụng (chạy định kỳ trong tickGame) */
export function purgeExpiredItems(g: GameState, now: number) {
  if (!g.itemExpiry) return;
  for (const [id, exp] of Object.entries(g.itemExpiry)) {
    if (!exp || now < exp) continue;
    delete g.itemExpiry[id];
    if (STARTER_PERM_IDS.has(id)) continue;

    // 1. Trang bị (Vũ khí / Giáp / Phụ kiện)
    if (g.player.owned.includes(id)) {
      g.player.owned = g.player.owned.filter((x) => x !== id);
      if (g.player.equip.weapon === id) g.player.equip.weapon = 'wood_sword';
      if (g.player.equip.armor === id) g.player.equip.armor = 'cloth';
      if (g.player.equip.accessory === id) g.player.equip.accessory = null;
    }
    // 2. Cần câu
    if (g.fishingGear.rods.includes(id)) {
      g.fishingGear.rods = g.fishingGear.rods.filter((x) => x !== id);
      if (g.fishingGear.rod === id) g.fishingGear.rod = 'rod_bamboo';
    }
    // 3. Diều
    if (g.kites.owned.includes(id)) {
      g.kites.owned = g.kites.owned.filter((x) => x !== id);
      if (g.kites.equipped === id) g.kites.equipped = g.kites.owned[0] ?? null;
    }
    // 4. Thời trang / Cánh / Thú cưng / Mũ / Trang sức
    if (g.cosmetics.owned.includes(id)) {
      g.cosmetics.owned = g.cosmetics.owned.filter((x) => x !== id);
      for (const s of WORN_SLOTS) {
        if (g.cosmetics[s] === id) g.cosmetics[s] = null;
      }
    }
    // 5. Thanh nhanh 10 ô
    g.hotbar.slots = g.hotbar.slots.map((s, idx) => (s === id ? (idx === 0 ? 'wood_sword' : null) : s));
  }
}

// ---------------- Khu Mua Sắm: cánh, thú cưng, thời trang — mở hộp quà ngẫu nhiên kèm Hạn Sử Dụng

type WornSlot = Exclude<keyof GameState['cosmetics'], 'owned'>;
const SLOT: Record<CosmeticKind, WornSlot> = { wings: 'wings', hat: 'hat', pet: 'pet', top: 'top', bottom: 'bottom', shoes: 'shoes', neck: 'neck', ear: 'ear', face: 'face' };
export const WORN_SLOTS = Object.values(SLOT);

const RARITY_ORDER: RodRarity[] = ['N', 'R', 'SR', 'SSR', 'UR'];
export const rarityRank = (r: RodRarity) => RARITY_ORDER.indexOf(r);

export interface CosBoxResult {
  item: CosmeticDef;
  dup: boolean;
  gold: number;
  duration: DurationRoll;
  status: DurationStatus;
}

/** bốc 1 món theo tỉ lệ của hộp (chỉ món hợp giới tính); bậc nào không có món thì lùi xuống bậc thấp hơn */
function rollCos(boxId: string, gender: Gender, minRank = 0): CosmeticDef {
  const box = COS_BOX_BY_ID[boxId];
  const shopKinds = COS_SHOP_KINDS[box.shop];
  const fits = (c: CosmeticDef) => shopKinds.includes(c.kind) && fitsGender(c.id, gender);
  const kinds = shopKinds;
  const odds = (Object.entries(box.odds) as [RodRarity, number][]).filter(([r]) => rarityRank(r) >= minRank);
  const total = odds.reduce((s, [, p]) => s + p, 0);
  let roll = Math.random() * total;
  let rarity = odds[odds.length - 1][0];
  for (const [r, p] of odds) {
    roll -= p;
    if (roll <= 0) {
      rarity = r;
      break;
    }
  }
  for (let k = rarityRank(rarity); k >= 0; k--) {
    const pool = COSMETICS.filter((c) => fits(c) && c.rarity === RARITY_ORDER[k]);
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return COSMETICS.find(fits) ?? COSMETICS.find((c) => kinds.includes(c.kind))!;
}

function grantCos(g: GameState, item: CosmeticDef): CosBoxResult {
  const wasOwned = g.cosmetics.owned.includes(item.id);
  const duration = rollItemDuration();
  const status = applyItemDuration(g, item.id, duration, wasOwned);
  if (status === 'dup_perm') {
    const gold = COS_DUP_GOLD[item.rarity];
    earnGold(g, gold);
    return { item, dup: true, gold, duration, status };
  }
  if (!wasOwned) {
    g.cosmetics.owned.push(item.id);
  }
  // ô đang trống thì mặc/đeo luôn
  const slot = SLOT[item.kind];
  if (!g.cosmetics[slot] && fitsGender(item.id, g.profile.gender)) g.cosmetics[slot] = item.id;
  return { item, dup: false, gold: 0, duration, status };
}

/** Mở n hộp (1 hoặc 10). Mở ×10 bảo đảm có ít nhất 1 món SR trở lên. */
export function openCosBox(g: GameState, boxId: string, n: number): CosBoxResult[] {
  const box = COS_BOX_BY_ID[boxId];
  if (!box) fail('Không có hộp này');
  if (box.gems) spendGems(g, box.gems * n);
  else spendGold(g, box.price * n);
  const gender = g.profile.gender;
  const items = Array.from({ length: n }, () => rollCos(boxId, gender));
  const sr = rarityRank('SR');
  if (n >= 10 && !items.some((c) => rarityRank(c.rarity) >= sr)) items[n - 1] = rollCos(boxId, gender, sr);
  return items.map((it) => grantCos(g, it));
}

/** Bấm lần nữa vào món đang đeo để tháo ra */
export function toggleCosmetic(g: GameState, id: string): string {
  const c = COSMETIC_BY_ID[id];
  if (!c || !g.cosmetics.owned.includes(id)) fail('Bạn chưa có món này');
  const slot = SLOT[c.kind];
  if (g.cosmetics[slot] === id) {
    g.cosmetics[slot] = null;
    return `Đã tháo ${c.name}`;
  }
  if (!fitsGender(id, g.profile.gender)) fail(c.gender === 'f' ? 'Món này chỉ dành cho nhân vật nữ' : 'Món này chỉ dành cho nhân vật nam');
  g.cosmetics[slot] = id;
  return `Đang dùng ${c.emoji} ${c.name}`;
}

export function cosmeticBonus(g: GameState) {
  // món không hợp giới tính (save cũ / đổi giới tính) không tính chỉ số
  const ids = WORN_SLOTS.map((k) => g.cosmetics[k]).filter((x): x is string => !!x && fitsGender(x, g.profile.gender));
  const list = ids.map((id) => COSMETIC_BY_ID[id]).filter(Boolean);
  const sum = (k: 'speed' | 'def' | 'goldBonus' | 'xpBonus') => list.reduce((s, c) => s + (c[k] ?? 0), 0);
  return { speed: sum('speed'), def: sum('def'), gold: sum('goldBonus'), xp: sum('xpBonus') };
}

// ---------------- Tiệm hạt giống

export const seedPrice = (cropId: string, qty: number) => {
  const c = CROP_BY_ID[cropId];
  return Math.round((c.seedCost ?? 0) * qty * (qty >= 10 ? 0.85 : 1));
};

export function buySeeds(g: GameState, cropId: string, qty: number): string {
  const c = CROP_BY_ID[cropId];
  if (!c || c.seedCost === null) fail('Tiệm không bán hạt này');
  spendGold(g, seedPrice(cropId, qty));
  addItem(g, `seed_${cropId}`, qty);
  return `🌱 Đã mua ${ITEMS[`seed_${cropId}`].name} ×${qty} (🪙${fmt(seedPrice(cropId, qty))})`;
}
