import { COUNT_TITLES, SIZE_TITLES, TITLE_BY_ID } from '../config/titles';
import type { GameState } from '../types';
import { fail } from '../utils';

const grant = (g: GameState, id: string, out: string[]) => {
  if (g.titles.owned.includes(id)) return;
  g.titles.owned.push(id);
  out.push(id);
  // danh hiệu đầu tiên tự đeo luôn
  if (!g.titles.active) g.titles.active = id;
};

/** tặng danh hiệu (thành tựu...) — đã có thì thôi */
export function grantTitle(g: GameState, id: string) {
  grant(g, id, []);
}

/** Kiểm tra danh hiệu sau mỗi lần câu được cá. Trả về các danh hiệu mới mở. */
export function checkFishTitles(g: GameState, fish: { id: string; cm: number; tier: number; titleReward?: string }): string[] {
  const got: string[] = [];
  for (const t of COUNT_TITLES) if (g.stats.fish >= t.n) grant(g, t.id, got);
  for (const t of SIZE_TITLES) if (fish.cm >= t.cm) grant(g, t.id, got);
  if (fish.tier >= 2) grant(g, `big_${fish.id}`, got);
  if (fish.tier >= 3) grant(g, `giant_${fish.id}`, got);
  if (fish.titleReward) grant(g, fish.titleReward, got);
  return got;
}

export function setTitle(g: GameState, id: string | null): string {
  if (id && !g.titles.owned.includes(id)) fail('Bạn chưa có danh hiệu này');
  g.titles.active = id;
  return id ? `🏷️ Đang hiện danh hiệu: ${TITLE_BY_ID[id].name}` : 'Đã ẩn danh hiệu';
}
