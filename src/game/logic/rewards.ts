import { ACH_BY_ID, ACH_TIERS, ACHIEVEMENTS } from '../config/achievements';
import { ONLINE_GIFTS, WHEEL, WHEEL_COST_GEMS, WHEEL_MAX_SPINS } from '../config/meta';
import type { GameState, Reward } from '../types';
import { dayKey, fail } from '../utils';
import { giveReward, rewardText, spendGems } from './core';
import { grantTitle } from './titles';

// ---------- Thành tựu ----------

/** bậc tiếp theo có thể nhận (0..3), -1 nếu đã nhận hết */
export const achNextTier = (g: GameState, id: string) => {
  const done = g.achievements[id] ?? 0;
  return done >= ACH_TIERS.length ? -1 : done;
};

export const achClaimable = (g: GameState, id: string) => {
  const t = achNextTier(g, id);
  return t >= 0 && ACH_BY_ID[id].stat(g) >= ACH_BY_ID[id].goals[t];
};

export const achClaimableCount = (g: GameState) => ACHIEVEMENTS.filter((a) => achClaimable(g, a.id)).length;

export function claimAchievement(g: GameState, id: string): string {
  const a = ACH_BY_ID[id];
  if (!a) fail('Không có thành tựu này');
  if (!achClaimable(g, id)) fail('Chưa đạt mốc');
  const t = achNextTier(g, id);
  g.achievements[id] = t + 1;
  g.gems += ACH_TIERS[t].gems;
  let extra = '';
  if (t === ACH_TIERS.length - 1) {
    grantTitle(g, `ach_${id}`);
    extra = ` · danh hiệu « ${a.title} »`;
  }
  return `${ACH_TIERS[t].emoji} ${a.name} bậc ${ACH_TIERS[t].name}: +💎${ACH_TIERS[t].gems}${extra}`;
}

// ---------- Quà online ----------

/** cộng thời gian chơi (chỉ khi đang mở game), sang ngày mới thì đếm lại */
export function trackOnline(g: GameState, now: number, dt: number) {
  const today = dayKey(now);
  if (g.online.dayKey !== today) g.online = { dayKey: today, ms: 0, claimed: [] };
  g.online.ms += Math.max(0, Math.min(dt, 5000));
}

export function onlineGiftReward(g: GameState, i: number): Reward {
  const r = ONLINE_GIFTS[i].reward;
  return { ...r, gold: r.gold ? Math.round(r.gold * (1 + 0.1 * g.player.level)) : undefined };
}

export const onlineGiftReady = (g: GameState, i: number) => !g.online.claimed.includes(i) && g.online.ms >= ONLINE_GIFTS[i].min * 60_000;
export const onlineGiftReadyCount = (g: GameState) => ONLINE_GIFTS.filter((_, i) => onlineGiftReady(g, i)).length;

export function claimOnlineGift(g: GameState, i: number): string {
  if (!ONLINE_GIFTS[i]) fail('Không có quà này');
  if (g.online.claimed.includes(i)) fail('Đã nhận rồi');
  if (!onlineGiftReady(g, i)) fail(`Chơi đủ ${ONLINE_GIFTS[i].min} phút hôm nay để nhận`);
  const r = onlineGiftReward(g, i);
  giveReward(g, r);
  g.online.claimed.push(i);
  g.stats.onlineGifts++;
  return `🎁 Quà online ${ONLINE_GIFTS[i].min} phút: ${rewardText(r)}`;
}

// ---------- Vòng quay may mắn ----------

export const wheelSpinsToday = (g: GameState, now: number) => (g.wheel.dayKey === dayKey(now) ? g.wheel.spins : 0);
export const wheelFree = (g: GameState, now: number) => wheelSpinsToday(g, now) === 0;

export function wheelReward(g: GameState, i: number): Reward {
  const s = WHEEL[i];
  return s.goldX ? { gold: Math.round(s.goldX * (100 + 30 * g.player.level)) } : s.reward!;
}

/** quay 1 lượt — trả về ô trúng để UI quay tới đúng ô */
export function spinWheel(g: GameState, now: number): { index: number; text: string } {
  const used = wheelSpinsToday(g, now);
  if (used >= WHEEL_MAX_SPINS) fail('Hôm nay hết lượt quay — mai quay tiếp nhé!');
  if (used > 0) spendGems(g, WHEEL_COST_GEMS);
  g.wheel = { dayKey: dayKey(now), spins: used + 1 };
  let roll = Math.random() * WHEEL.reduce((s, w) => s + w.weight, 0);
  let index = 0;
  while (roll >= WHEEL[index].weight) roll -= WHEEL[index++].weight;
  const r = wheelReward(g, index);
  giveReward(g, r);
  return { index, text: `🎡 Vòng quay: ${rewardText(r)}` };
}
