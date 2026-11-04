import { HEAL_ITEMS } from '../config/combat';
import { EQUIP_BY_ID } from '../config/equipment';
import { ITEMS } from '../config/farm';
import { COSMETIC_BY_ID, ROD_BY_ID } from '../config/shops';
import type { GameState } from '../types';
import { fail, fmt } from '../utils';
import { addItem, earnGold, itemCount, removeItem, track } from './core';
import { WORN_SLOTS } from './shop';

// Thanh 10 ô: mỗi ô chứa 1 vũ khí, 1 cần câu hoặc 1 loại đồ ăn/bình máu.
// Ô đang chọn = thứ nhân vật cầm trên tay. Ô đồ ăn không cầm được: bấm phím số là ăn/uống luôn.

export const HOTBAR_SIZE = 10;

export type SlotKind = 'weapon' | 'rod' | 'use' | null;
export type HeldKind = 'weapon' | 'rod' | null;

export const kindOf = (id: string | null): SlotKind =>
  !id ? null : EQUIP_BY_ID[id]?.slot === 'weapon' ? 'weapon' : ROD_BY_ID[id] ? 'rod' : HEAL_ITEMS[id] && ITEMS[id] ? 'use' : null;

export const heldItem = (g: GameState) => g.hotbar.slots[g.hotbar.sel] ?? null;
/** ô đồ ăn đang được chọn thì tính là tay không */
export const heldKind = (g: GameState): HeldKind => {
  const k = kindOf(heldItem(g));
  return k === 'use' ? null : k;
};

const owns = (g: GameState, id: string) => {
  const k = kindOf(id);
  if (k === 'weapon') return g.player.owned.includes(id);
  if (k === 'rod') return g.fishingGear.rods.includes(id);
  return k === 'use' && itemCount(g, id) > 0;
};

/** đồng bộ chỉ số theo món đang cầm: vũ khí → tấn công, cần câu → câu cá */
export function applyHeld(g: GameState) {
  const id = heldItem(g);
  const k = kindOf(id);
  g.player.equip.weapon = k === 'weapon' ? id : null;
  if (k === 'rod' && id) g.fishingGear.rod = id;
}

export function selectSlot(g: GameState, i: number) {
  if (i < 0 || i >= HOTBAR_SIZE) fail('Ô không hợp lệ');
  g.hotbar.sel = i;
  applyHeld(g);
}

/** đặt món vào ô (mỗi món chỉ nằm ở 1 ô) — id null để bỏ trống */
export function setSlot(g: GameState, i: number, id: string | null): string {
  if (i < 0 || i >= HOTBAR_SIZE) fail('Ô không hợp lệ');
  if (id && !kindOf(id)) fail('Món này không đặt vào thanh nhanh được');
  if (id && !owns(g, id)) fail('Bạn chưa có món này');
  if (id) g.hotbar.slots = g.hotbar.slots.map((s) => (s === id ? null : s));
  g.hotbar.slots[i] = id;
  applyHeld(g);
  return id ? `Đã đặt vào ô ${(i + 1) % 10}` : `Đã bỏ trống ô ${(i + 1) % 10}`;
}

/** đổi chỗ 2 ô (kéo ô này thả sang ô kia) */
export function swapSlots(g: GameState, a: number, b: number) {
  if (a < 0 || a >= HOTBAR_SIZE || b < 0 || b >= HOTBAR_SIZE) fail('Ô không hợp lệ');
  const s = g.hotbar.slots;
  [s[a], s[b]] = [s[b], s[a]];
  if (g.hotbar.sel === a) g.hotbar.sel = b;
  else if (g.hotbar.sel === b) g.hotbar.sel = a;
  applyHeld(g);
}

/** món mới mua/mở được: tự vào ô trống đầu tiên. select = cầm luôn */
export function addToHotbar(g: GameState, id: string, select: boolean) {
  let idx = g.hotbar.slots.indexOf(id);
  if (idx < 0) {
    idx = g.hotbar.slots.indexOf(null);
    if (idx < 0) {
      if (!select) return;
      idx = g.hotbar.sel;
    }
    g.hotbar.slots[idx] = id;
  }
  if (select) g.hotbar.sel = idx;
  applyHeld(g);
}

/** cầm vũ khí / cần câu lên tay ngay (từ hành trang) */
export function holdItem(g: GameState, id: string): string {
  const k = kindOf(id);
  if (k !== 'weapon' && k !== 'rod') fail('Món này không cầm được');
  if (!owns(g, id)) fail('Bạn chưa có món này');
  addToHotbar(g, id, true);
  return `✋ Đang cầm ${k === 'weapon' ? EQUIP_BY_ID[id].name : ROD_BY_ID[id].name}`;
}

// ---------------- Bỏ đồ (Vứt bỏ / Bán nhanh) & Rương Cất Đồ Cá Nhân (g.chest)

export const STARTER_GEAR_IDS = new Set(['wood_sword', 'cloth', 'rod_bamboo']);

function ensureChest(g: GameState) {
  if (!g.chest) g.chest = { items: {}, gear: [] };
  if (!g.chest.items) g.chest.items = {};
  if (!g.chest.gear) g.chest.gear = [];
  return g.chest;
}

function detachGearFromPlayer(g: GameState, id: string) {
  g.hotbar.slots = g.hotbar.slots.map((s) => (s === id ? null : s));
  const eq = EQUIP_BY_ID[id];
  if (eq) {
    g.player.owned = g.player.owned.filter((x) => x !== id);
    if (eq.slot === 'armor' && g.player.equip.armor === id) g.player.equip.armor = 'cloth';
    if (eq.slot === 'accessory' && g.player.equip.accessory === id) g.player.equip.accessory = null;
    if (eq.slot === 'weapon' && g.player.equip.weapon === id) g.player.equip.weapon = null;
  }
  if (ROD_BY_ID[id]) {
    g.fishingGear.rods = g.fishingGear.rods.filter((x) => x !== id);
    if (g.fishingGear.rod === id) g.fishingGear.rod = 'rod_bamboo';
  }
  if (COSMETIC_BY_ID[id]) {
    g.cosmetics.owned = g.cosmetics.owned.filter((x) => x !== id);
    for (const s of WORN_SLOTS) {
      if (g.cosmetics[s] === id) g.cosmetics[s] = null;
    }
  }
  applyHeld(g);
}

const entryLabel = (id: string) =>
  EQUIP_BY_ID[id]?.name ?? ROD_BY_ID[id]?.name ?? COSMETIC_BY_ID[id]?.name ?? ITEMS[id]?.name ?? id;

/** 🗑️ Bỏ đồ (vứt bỏ vật phẩm hoặc trang bị khỏi túi đồ) */
export function discardFromBag(g: GameState, id: string, qty = 1): string {
  if (ITEMS[id]) {
    const have = itemCount(g, id);
    if (have < 1) fail('Bạn không còn món này trong túi');
    const n = Math.min(have, Math.max(1, qty));
    removeItem(g, id, n);
    if (itemCount(g, id) <= 0) {
      g.hotbar.slots = g.hotbar.slots.map((s) => (s === id ? null : s));
      applyHeld(g);
    }
    return `🗑️ Đã bỏ ${ITEMS[id].emoji} ${ITEMS[id].name} ×${n} khỏi rương đồ`;
  }
  if (STARTER_GEAR_IDS.has(id)) fail('Không thể vứt bỏ trang bị cơ bản mặc định');
  if (!EQUIP_BY_ID[id] && !ROD_BY_ID[id] && !COSMETIC_BY_ID[id]) fail('Món đồ không hợp lệ');
  detachGearFromPlayer(g, id);
  return `🗑️ Đã bỏ ${entryLabel(id)} khỏi rương đồ`;
}

/** 🪙 Bán thanh lý nhanh vật phẩm ngay trong Hành trang */
export function quickSellFromBag(g: GameState, id: string, qty = 1): string {
  const it = ITEMS[id];
  if (!it || it.sellPrice <= 0) fail('Món này không thể bán nhanh');
  const have = itemCount(g, id);
  if (have < 1) fail('Không còn vật phẩm này');
  const n = Math.min(have, Math.max(1, qty));
  removeItem(g, id, n);
  if (itemCount(g, id) <= 0) {
    g.hotbar.slots = g.hotbar.slots.map((s) => (s === id ? null : s));
    applyHeld(g);
  }
  const gold = it.sellPrice * n;
  earnGold(g, gold);
  track(g, 'sell', n);
  return `🪙 Đã bán nhanh ${it.emoji} ${it.name} ×${n} (+🪙${fmt(gold)})`;
}

/** 🗄️ Bỏ đồ từ Túi vào Rương cất trữ (g.chest) */
export function storeInChest(g: GameState, id: string, qty = 1): string {
  const chest = ensureChest(g);
  if (ITEMS[id]) {
    const have = itemCount(g, id);
    if (have < 1) fail('Không có món này trong túi');
    const n = Math.min(have, Math.max(1, qty));
    removeItem(g, id, n);
    chest.items[id] = (chest.items[id] ?? 0) + n;
    if (itemCount(g, id) <= 0) {
      g.hotbar.slots = g.hotbar.slots.map((s) => (s === id ? null : s));
      applyHeld(g);
    }
    return `📥 Đã bỏ ${ITEMS[id].emoji} ${ITEMS[id].name} ×${n} vào Rương cất đồ`;
  }
  if (STARTER_GEAR_IDS.has(id)) fail('Trang bị mặc định luôn giữ bên người');
  if (!EQUIP_BY_ID[id] && !ROD_BY_ID[id] && !COSMETIC_BY_ID[id]) fail('Món đồ không hợp lệ');
  detachGearFromPlayer(g, id);
  if (!chest.gear.includes(id)) chest.gear.push(id);
  return `📥 Đã cất ${entryLabel(id)} vào Rương đồ`;
}

/** 📤 Lấy đồ từ Rương cất trữ (g.chest) ra Túi đồ */
export function takeFromChest(g: GameState, id: string, qty = 1): string {
  const chest = ensureChest(g);
  if (ITEMS[id]) {
    const have = chest.items[id] ?? 0;
    if (have < 1) fail('Trong rương không có món này');
    const n = Math.min(have, Math.max(1, qty));
    chest.items[id] -= n;
    if (chest.items[id] <= 0) delete chest.items[id];
    addItem(g, id, n);
    return `📤 Đã lấy ${ITEMS[id].emoji} ${ITEMS[id].name} ×${n} từ Rương về Túi`;
  }
  if (!chest.gear.includes(id)) fail('Món này không có trong rương');
  chest.gear = chest.gear.filter((x) => x !== id);
  if (EQUIP_BY_ID[id] && !g.player.owned.includes(id)) g.player.owned.push(id);
  else if (ROD_BY_ID[id] && !g.fishingGear.rods.includes(id)) g.fishingGear.rods.push(id);
  else if (COSMETIC_BY_ID[id] && !g.cosmetics.owned.includes(id)) g.cosmetics.owned.push(id);
  return `📤 Đã lấy ${entryLabel(id)} từ Rương về Túi đồ`;
}

/** 🗑️ Bỏ hẳn đồ đang nằm trong Rương cất trữ */
export function discardFromChest(g: GameState, id: string, qty = 1): string {
  const chest = ensureChest(g);
  if (ITEMS[id]) {
    const have = chest.items[id] ?? 0;
    if (have < 1) fail('Trong rương không có món này');
    const n = Math.min(have, Math.max(1, qty));
    chest.items[id] -= n;
    if (chest.items[id] <= 0) delete chest.items[id];
    return `🗑️ Đã vứt bỏ ${ITEMS[id].emoji} ${ITEMS[id].name} ×${n} khỏi Rương`;
  }
  if (!chest.gear.includes(id)) fail('Món này không có trong rương');
  chest.gear = chest.gear.filter((x) => x !== id);
  return `🗑️ Đã vứt bỏ ${entryLabel(id)} khỏi Rương`;
}
