import { ITEMS } from '../config/farm';
import type { GameState } from '../types';
import { dayKey, fail, fmt, seededRand } from '../utils';
import { earnGold, itemCount, removeItem, track } from './core';

/** Mặt hàng hot hôm nay: giá ×HOT_MULT, đổi mỗi ngày */
export const HOT_MULT = 2;
const HOT_KINDS = new Set(['crop', 'fish', 'animal', 'food']);
const HOT_POOL = Object.values(ITEMS).filter((i) => HOT_KINDS.has(i.kind) && i.id !== 'mushroom' && i.id !== 'fairyberry').map((i) => i.id);
export const hotItem = (day: string) => HOT_POOL[Math.floor(seededRand(`hot:${day}`) * HOT_POOL.length)];

/** Hệ số giá theo ngày: 0.7x – 1.5x, cố định trong một ngày; mặt hàng hot ×2 */
export const priceMult = (itemId: string, day: string) =>
  itemId === hotItem(day) ? HOT_MULT : 0.7 + seededRand(`${day}:${itemId}`) * 0.8;

export const sellPrice = (itemId: string, day: string) =>
  Math.max(1, Math.round(ITEMS[itemId].sellPrice * priceMult(itemId, day)));

export function sell(g: GameState, itemId: string, qty: number, now: number): string {
  if (qty <= 0) fail('Không có gì để bán');
  removeItem(g, itemId, qty);
  const total = sellPrice(itemId, dayKey(now)) * qty;
  earnGold(g, total);
  track(g, 'sell', total);
  return `Bán ${ITEMS[itemId].emoji}×${qty} được 🪙${fmt(total)}`;
}

/** số lượng các đơn hàng đang chờ cần tới — bán hết cá thì giữ lại phần này */
export const orderNeed = (g: GameState, itemId: string) => g.orders.reduce((s, o) => s + (o.order?.items[itemId] ?? 0), 0);

/** Quầy bán cá ở Tiệm Câu Cá: bán hết cá theo giá chợ hôm nay, chừa lại cá đơn hàng cần */
export function sellAllFish(g: GameState, now: number): string {
  const day = dayKey(now);
  let total = 0;
  let n = 0;
  for (const id of Object.keys(g.inventory)) {
    if (ITEMS[id]?.kind !== 'fish') continue;
    const qty = itemCount(g, id) - orderNeed(g, id);
    if (qty <= 0) continue;
    total += sellPrice(id, day) * qty;
    n += qty;
    removeItem(g, id, qty);
  }
  if (!total) fail('Không có cá để bán');
  earnGold(g, total);
  track(g, 'sell', total);
  return `🐟 Bán ${n} con cá được 🪙${fmt(total)}`;
}

export function sellAllCrops(g: GameState, now: number): string {
  const day = dayKey(now);
  let total = 0;
  for (const id of Object.keys(g.inventory)) {
    if (ITEMS[id]?.kind !== 'crop') continue;
    const n = itemCount(g, id);
    total += sellPrice(id, day) * n;
    removeItem(g, id, n);
  }
  if (!total) fail('Không có nông sản để bán');
  earnGold(g, total);
  track(g, 'sell', total);
  return `Bán hết nông sản được 🪙${fmt(total)}`;
}
