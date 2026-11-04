import { MONSTERS } from '../config/combat';
import { ZONE_DEFS } from '../config/zones';
import type { GameState } from '../types';
import { fail, fmt, shuffle } from '../utils';
import { earnGold } from './core';
import { gainXp } from './player';

// Nhiệm vụ săn quái ở Quầy Nhiệm Vụ: 3 loài mỗi ngày, chọn trong các vùng đã mở

export const BOUNTY_COUNT = 3;

export function rollBounties(g: GameState, today: string) {
  // tối thiểu 3 vùng đầu để 3 nhiệm vụ không trùng loài
  const reach = Math.max(BOUNTY_COUNT, g.maxZone);
  // ưu tiên vùng gần vùng xa nhất để thưởng hợp cấp
  const pool = ZONE_DEFS.filter((z) => z.id <= reach && z.id >= reach - 4);
  const picks = shuffle([...pool]).slice(0, BOUNTY_COUNT);
  while (picks.length < BOUNTY_COUNT) picks.push(ZONE_DEFS[0]);
  g.bounties = {
    dayKey: today,
    list: picks.map((z) => ({ zone: z.id, monster: z.monster, n: 8 + Math.floor(Math.random() * 8), progress: 0, claimed: false })),
  };
}

export function bountyReward(monsterId: string, n: number) {
  const m = MONSTERS[monsterId];
  return { gold: Math.round(((m.gold[0] + m.gold[1]) / 2) * n * 2.2), xp: Math.round(m.xp * n * 0.6) };
}

export function bountyTrack(g: GameState, monsterId: string) {
  for (const b of g.bounties.list) if (!b.claimed && b.monster === monsterId) b.progress = Math.min(b.n, b.progress + 1);
}

export function claimBounty(g: GameState, idx: number): string {
  const b = g.bounties.list[idx];
  if (!b) fail('Không có nhiệm vụ này');
  if (b.claimed) fail('Đã nhận thưởng rồi');
  if (b.progress < b.n) fail('Chưa hạ đủ quái');
  const r = bountyReward(b.monster, b.n);
  b.claimed = true;
  earnGold(g, r.gold);
  const ups = gainXp(g, r.xp);
  return `📋 Hoàn thành săn ${MONSTERS[b.monster].name}: +🪙${fmt(r.gold)} +${fmt(r.xp)} XP${ups ? ` · ⭐ Lên Lv ${g.player.level}!` : ''}`;
}
