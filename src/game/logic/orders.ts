import { rankIndex } from '../config/guild';
import { CROPS, ITEMS, RECIPES } from '../config/farm';
import { FISH, ANIMALS } from '../config/life';
import { MONSTERS } from '../config/combat';
import { ROCKS } from '../config/mine';
import {
  ORDER_GEMS, ORDER_GEM_CHANCE, ORDER_GOLD_MULT, ORDER_MAX_QTY, ORDER_NPCS, ORDER_NPC_BY_ID, ORDER_REFILL_MS, ORDER_SKIP_MS,
  ORDER_SLOTS, ORDER_VALUE, ORDER_XP_SHARE,
} from '../config/orders';
import type { GameState, Order } from '../types';
import { fail, fmt, pick, randInt, shuffle } from '../utils';
import { earnGold, itemCount, removeItem, rewardText } from './core';
import { gainXp, xpToNext } from './player';

/** những món người chơi hiện kiếm được — đơn hàng chỉ đặt những thứ này */
export function orderPool(g: GameState): string[] {
  const rank = rankIndex(g.guildXp);
  const ids = new Set<string>(CROPS.filter((c) => c.seedCost !== null && c.rankReq <= rank).map((c) => c.id));
  for (const a of g.animals) ids.add(ANIMALS[a.kind].product);
  // cá: 3 loài dễ nhất + loài đã từng câu được
  for (const f of FISH.slice(0, 3)) ids.add(f.id);
  for (const id of Object.keys(g.fishing.best)) ids.add(id);
  // đồ ăn nấu được từ nguyên liệu đang có nguồn
  for (const r of RECIPES) {
    if (r.kitchenLevel <= g.buildings.kitchen && Object.keys(r.inputs).every((i) => ids.has(i))) ids.add(r.id);
  }
  // quặng từ những tầng mỏ đã xuống tới
  for (const r of ROCKS) if (r.loot && r.from <= g.mine.deepest && ITEMS[r.loot.item]?.kind === 'ore') ids.add(r.loot.item);
  // chiến lợi phẩm từ các vùng đã tới
  for (const m of Object.values(MONSTERS)) {
    if (m.zone > g.maxZone || m.boss) continue;
    for (const d of m.drops) if (ITEMS[d.item]?.kind === 'material') ids.add(d.item);
  }
  return [...ids].filter((id) => ITEMS[id]);
}

export function makeOrder(g: GameState): Order {
  const pool = orderPool(g);
  // chỉ những người có món mình thích trong số hàng người chơi kiếm được mới đặt đơn
  const likedBy = (n: (typeof ORDER_NPCS)[number]) => pool.filter((id) => n.likes.includes(ITEMS[id].kind));
  const npc = pick(ORDER_NPCS.filter((n) => likedBy(n).length > 0));
  const liked = likedBy(npc);
  const kinds = g.player.level < 3 ? 1 : g.player.level < 8 ? randInt(1, 2) : randInt(1, 3);
  const chosen = shuffle(liked.length >= kinds ? [...liked] : [...pool]).slice(0, kinds);
  const value = ORDER_VALUE.base + ORDER_VALUE.perLevel * g.player.level;
  const items: Record<string, number> = {};
  let raw = 0;
  for (const id of chosen) {
    const it = ITEMS[id];
    const qty = Math.max(1, Math.min(ORDER_MAX_QTY[it.kind] ?? 10, Math.round(value / chosen.length / it.sellPrice)));
    items[id] = qty;
    raw += qty * it.sellPrice;
  }
  const [lo, hi] = ORDER_GOLD_MULT;
  return {
    npc: npc.id,
    line: pick(npc.lines),
    items,
    gold: Math.round(raw * (lo + Math.random() * (hi - lo))),
    xp: Math.max(5, Math.round(xpToNext(g.player.level) * ORDER_XP_SHARE)),
    gems: Math.random() < ORDER_GEM_CHANCE ? randInt(ORDER_GEMS[0], ORDER_GEMS[1]) : 0,
  };
}

/** gọi mỗi tick: đủ số ô, ô nào hết giờ chờ thì có đơn mới */
export function refillOrders(g: GameState, now: number) {
  while (g.orders.length < ORDER_SLOTS) g.orders.push({ order: null, readyAt: 0 });
  for (const s of g.orders) if (!s.order && now >= s.readyAt) s.order = makeOrder(g);
}

export const canDeliver = (g: GameState, o: Order) => Object.entries(o.items).every(([id, n]) => itemCount(g, id) >= n);

export function deliverOrder(g: GameState, slot: number, now: number): string {
  const s = g.orders[slot];
  if (!s?.order) fail('Đơn hàng không còn');
  const o = s.order;
  for (const [id, n] of Object.entries(o.items)) if (itemCount(g, id) < n) fail(`Thiếu ${ITEMS[id].emoji} ${ITEMS[id].name} (cần ${n})`);
  for (const [id, n] of Object.entries(o.items)) removeItem(g, id, n);
  earnGold(g, o.gold);
  g.gems += o.gems;
  const ups = gainXp(g, o.xp);
  g.stats.orders++;
  s.order = null;
  s.readyAt = now + ORDER_REFILL_MS;
  const who = ORDER_NPC_BY_ID[o.npc];
  return `${who.emoji} ${who.name}: Cảm ơn nhiều! ${rewardText({ gold: o.gold, gems: o.gems })} +${fmt(o.xp)} XP${ups ? ' · LÊN CẤP!' : ''}`;
}

export function skipOrder(g: GameState, slot: number, now: number): string {
  const s = g.orders[slot];
  if (!s?.order) fail('Đơn hàng không còn');
  s.order = null;
  s.readyAt = now + ORDER_SKIP_MS;
  return 'Đã bỏ đơn — đơn mới sẽ tới sau ít phút';
}

export const readyOrderCount = (g: GameState) => g.orders.filter((s) => s.order && canDeliver(g, s.order)).length;
