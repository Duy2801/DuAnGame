import { ITEMS } from '../config/farm';
import { DAILY_BY_ID } from '../config/meta';
import { TITLE_BY_ID } from '../config/titles';
import type { GameState, QuestEvent, Reward } from '../types';
import { fail, fmt } from '../utils';

export function earnGold(g: GameState, amount: number) {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return;
  const safeAmount = Math.min(Math.floor(amount), 10_000_000);
  g.gold = Math.min((g.gold || 0) + safeAmount, 1_000_000_000_000);
  g.stats.goldEarned = (g.stats.goldEarned || 0) + safeAmount;
  g.week.gold = (g.week.gold || 0) + safeAmount;
}

export function spendGold(g: GameState, amount: number) {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return;
  const safeAmount = Math.floor(amount);
  if (g.gold < safeAmount) fail(`Không đủ vàng (cần 🪙 ${fmt(safeAmount)})`);
  g.gold -= safeAmount;
}

export function spendGems(g: GameState, amount: number) {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return;
  const safeAmount = Math.floor(amount);
  if (g.gems < safeAmount) fail(`Không đủ kim cương (cần 💎 ${safeAmount})`);
  g.gems -= safeAmount;
}

export const itemCount = (g: GameState, id: string) => {
  const invCount = g.inventory[id] ?? 0;
  if (id.startsWith('fish_') && g.fishing?.fishBag) {
    const bagCount = g.fishing.fishBag.filter((f) => f.id === id && !f.locked).length;
    return invCount + bagCount;
  }
  return invCount;
};

export function addItem(g: GameState, id: string, qty: number) {
  if (!id || typeof qty !== 'number' || isNaN(qty) || qty <= 0) return;
  const safeQty = Math.min(Math.floor(qty), 9999);
  const current = g.inventory[id] ?? 0;
  g.inventory[id] = Math.min(current + safeQty, 99999);
}

export function removeItem(g: GameState, id: string, qty: number) {
  if (itemCount(g, id) < qty) fail(`Không đủ ${ITEMS[id]?.name ?? id}`);
  let rem = qty;
  const inInv = g.inventory[id] ?? 0;
  if (inInv > 0) {
    const take = Math.min(inInv, rem);
    g.inventory[id] -= take;
    if (g.inventory[id] <= 0) delete g.inventory[id];
    rem -= take;
  }
  if (rem > 0 && id.startsWith('fish_') && g.fishing?.fishBag) {
    for (let i = g.fishing.fishBag.length - 1; i >= 0 && rem > 0; i--) {
      const f = g.fishing.fishBag[i];
      if (f.id === id && !f.locked) {
        g.fishing.fishBag.splice(i, 1);
        rem--;
      }
    }
  }
}

export function giveReward(g: GameState, r: Reward) {
  if (r.gold) earnGold(g, r.gold);
  if (r.gems) g.gems += r.gems;
  for (const [id, n] of Object.entries(r.items ?? {})) addItem(g, id, n);
  if (r.level && g.player.level < r.level) {
    g.player.level = r.level;
    g.player.hp = Math.max(g.player.hp, 80 + r.level * 22);
  }
  if (r.titles?.length) {
    for (const id of r.titles) {
      if (!g.titles.owned.includes(id)) g.titles.owned.push(id);
    }
    g.titles.active = r.titles[0];
  }
}

export function rewardText(r: Reward): string {
  const parts: string[] = [];
  if (r.gold) parts.push(`🪙${fmt(r.gold)}`);
  if (r.gems) parts.push(`💎${fmt(r.gems)}`);
  if (r.level) parts.push(`⬆️Lv ${r.level}`);
  if (r.titles?.length) {
    if (r.titles.length <= 2) {
      for (const id of r.titles) parts.push(`🏷️« ${TITLE_BY_ID[id]?.name ?? id} »`);
    } else {
      parts.push(`🏷️+${r.titles.length} danh hiệu (đeo « ${TITLE_BY_ID[r.titles[0]]?.name ?? r.titles[0]} »)`);
    }
  }
  for (const [id, n] of Object.entries(r.items ?? {})) parts.push(`${ITEMS[id]?.emoji ?? id}×${n}`);
  return parts.join(' ') || 'không có gì';
}

/** Ghi nhận tiến độ nhiệm vụ hằng ngày */
export function track(g: GameState, event: QuestEvent, amount = 1) {
  for (const q of g.daily.quests) {
    const def = DAILY_BY_ID[q.id];
    if (def && def.event === event && !q.claimed) q.progress = Math.min(def.target, q.progress + amount);
  }
}
