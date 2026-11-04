import { BAKERY_DEAL, BAKERY_MARKUP, BAKERY_MENU } from '../config/mall';
import { ITEMS } from '../config/farm';
import type { GameState } from '../types';
import { dayKey, fail } from '../utils';
import { addItem, spendGold } from './core';

// ---------------- Tiệm Bánh & Cà Phê

/** món giảm giá hôm nay — đổi mỗi ngày, ai cũng thấy giống nhau */
export function bakeryDeal(now: number): string {
  const key = dayKey(now);
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return BAKERY_MENU[h % BAKERY_MENU.length];
}

export function bakeryPrice(id: string, now: number): number {
  const base = Math.ceil((ITEMS[id].sellPrice * BAKERY_MARKUP) / 5) * 5;
  return id === bakeryDeal(now) ? Math.ceil((base * (1 - BAKERY_DEAL)) / 5) * 5 : base;
}

export function buyBakery(g: GameState, id: string, n: number, now: number): string {
  if (!BAKERY_MENU.includes(id)) fail('Tiệm không bán món này');
  spendGold(g, bakeryPrice(id, now) * n);
  addItem(g, id, n);
  return `${ITEMS[id].emoji} Đã mua ${ITEMS[id].name} ×${n}`;
}
