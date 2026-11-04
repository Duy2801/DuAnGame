import { BUFF_INFO, type BuffId } from '../config/buffs';
import { POTION_BY_ID } from '../config/equipment';
import { RECIPE_BY_ID } from '../config/farm';
import type { GameState } from '../types';

/** giá trị buff đang còn hiệu lực (0 nếu hết) */
export function buffValue(g: GameState, id: BuffId, now = Date.now()): number {
  const b = g.buffs?.[id];
  return b && b.until > now ? b.value : 0;
}

export const activeBuffs = (g: GameState, now: number) =>
  (Object.entries(g.buffs ?? {}) as [BuffId, { value: number; until: number }][]).filter(([, b]) => b.until > now);

export function itemBuffs(itemId: string): { id: BuffId; value: number; min: number }[] {
  const rec = RECIPE_BY_ID[itemId]?.buff;
  if (rec) return [rec];
  return POTION_BY_ID[itemId]?.buffs ?? [];
}

/** ăn món / uống linh dược có buff: cùng loại thì lấy giá trị cao hơn và cộng dồn thời gian (tối đa 30 phút) */
export function applyFoodBuff(g: GameState, foodId: string, now: number): string | null {
  const list = itemBuffs(foodId);
  if (!list.length) return null;
  const parts: string[] = [];
  for (const buff of list) {
    const cur = g.buffs[buff.id];
    const left = cur && cur.until > now ? cur.until - now : 0;
    g.buffs[buff.id] = {
      value: Math.max(buff.value, cur && left ? cur.value : 0),
      until: now + Math.min(30 * 60_000, left + buff.min * 60_000),
    };
    parts.push(`${BUFF_INFO[buff.id].emoji} ${BUFF_INFO[buff.id].name} ${BUFF_INFO[buff.id].desc(buff.value)} (${buff.min}p)`);
  }
  return parts.join(' · ');
}
