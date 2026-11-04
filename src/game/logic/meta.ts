import { rankIndex } from '../config/guild';
import {
  BOT_NAMES, CHESTS, DAILY_BY_ID, DAILY_COUNT, DAILY_POOL, LOGIN_REWARDS, QUEST_GOLD, WEEK_REWARDS,
} from '../config/meta';
import type { DailyQuestState, GameState, Reward } from '../types';
import { DAY_MS, WEEK_MS, dayKey, fail, hashStr, mulberry32, shuffle, weekKey, weekStart } from '../utils';
import { rollBounties } from './bounty';
import { fishWeekRollover } from './fishrank';
import { remote, remoteEntries, remoteFinalRank } from './remote';
import { earnGold, giveReward, rewardText } from './core';
import { offlineCapMs, passiveRate } from './farm';
import { purgeExpiredItems } from './shop';

// ---------- Nhiệm vụ hằng ngày ----------

export function rollDaily(g: GameState, today: string) {
  const taken = new Set<string>();
  const quests: DailyQuestState[] = [];
  for (const q of shuffle([...DAILY_POOL])) {
    if (quests.length >= DAILY_COUNT) break;
    if (taken.has(q.event)) continue;
    taken.add(q.event);
    quests.push({ id: q.id, progress: 0, claimed: false });
  }
  g.daily = { dayKey: today, quests, points: 0, chests: [] };
}

export function claimQuest(g: GameState, questId: string): string {
  const q = g.daily.quests.find((x) => x.id === questId);
  const def = DAILY_BY_ID[questId];
  if (!q || !def) fail('Không tìm thấy nhiệm vụ');
  if (q.claimed) fail('Đã nhận thưởng rồi');
  if (q.progress < def.target) fail('Chưa hoàn thành');
  q.claimed = true;
  g.daily.points += def.points;
  earnGold(g, QUEST_GOLD);
  return `+${def.points} ⚡ điểm hoạt động, +🪙${QUEST_GOLD}`;
}

export function chestReward(g: GameState, idx: number): Reward {
  const r = CHESTS[idx].reward;
  const mult = 1 + rankIndex(g.guildXp) * 0.5;
  return { ...r, gold: r.gold ? Math.round(r.gold * mult) : undefined };
}

export function claimChest(g: GameState, idx: number): string {
  const c = CHESTS[idx];
  if (!c) fail('Rương không tồn tại');
  if (g.daily.chests.includes(idx)) fail('Đã mở rương này');
  if (g.daily.points < c.points) fail(`Cần ${c.points} điểm hoạt động`);
  const reward = chestReward(g, idx);
  giveReward(g, reward);
  g.daily.chests.push(idx);
  return `🎁 Mở rương: ${rewardText(reward)}`;
}

// ---------- Điểm danh 7 ngày ----------

export function loginState(g: GameState, now: number) {
  const today = dayKey(now);
  const canClaim = g.login.claimedDayKey !== today;
  const continuing = g.login.claimedDayKey === dayKey(now - DAY_MS);
  const nextIndex = canClaim ? (continuing ? (g.login.index + 1) % 7 : 0) : g.login.index;
  // ô nào đã tích trong chuỗi hiện tại
  const doneUpTo = canClaim ? (continuing && g.login.index < 6 ? g.login.index : -1) : g.login.index;
  return { canClaim, nextIndex, doneUpTo };
}

export function claimLogin(g: GameState, now: number): string {
  const s = loginState(g, now);
  if (!s.canClaim) fail('Hôm nay đã điểm danh rồi');
  const reward = LOGIN_REWARDS[s.nextIndex];
  giveReward(g, reward);
  g.login = { index: s.nextIndex, claimedDayKey: dayKey(now) };
  return `📅 Điểm danh ngày ${s.nextIndex + 1}: ${rewardText(reward)}`;
}

// ---------- Bảng xếp hạng tuần (bot offline) ----------

export function botScores(wk: string, frac: number) {
  const rnd = mulberry32(hashStr(`bots:${wk}`));
  const f = Math.min(1, Math.max(0, frac));
  return BOT_NAMES.map((name, i) => {
    const target = 1200 * 1.19 ** i * (0.75 + rnd() * 0.5);
    const pace = 0.7 + rnd() * 0.6;
    return { name, score: Math.floor(target * f ** pace) };
  });
}

export function leaderboard(g: GameState, now: number) {
  const me = { name: g.profile.name || 'Bạn', score: Math.floor(g.week.gold), isPlayer: true };
  if (remote.enabled) return remoteEntries('gold', g.week.key, me) ?? [me];
  const frac = (now - weekStart(now)) / WEEK_MS;
  return [
    ...botScores(g.week.key, frac).map((b) => ({ ...b, isPlayer: false })),
    { name: g.profile.name || 'Bạn', score: Math.floor(g.week.gold), isPlayer: true },
  ].sort((a, b) => b.score - a.score);
}

export const weekRewardGems = (rank: number) => WEEK_REWARDS.find((r) => rank <= r.top)?.gems ?? 0;

function weekRollover(g: GameState, now: number) {
  const wk = weekKey(now);
  if (g.week.key === wk) return;
  // bản online chốt theo người thật — chưa tải được dữ liệu tuần cũ thì hoãn chốt
  const rank = remote.enabled ? remoteFinalRank('gold', g.week.key, g.week.gold) : 1 + botScores(g.week.key, 1).filter((b) => b.score > g.week.gold).length;
  if (rank === null) return;
  const gems = g.week.gold > 0 ? weekRewardGems(rank) : 0;
  g.gems += gems;
  g.week = { key: wk, gold: 0, lastResult: { rank, gems } };
}

// ---------- Vòng lặp thời gian ----------

/** Chạy mỗi giây và khi mở game. Trả về số vàng thụ động kiếm được trong khoảng thời gian vừa qua. */
export function tickGame(g: GameState, now: number): number {
  const today = dayKey(now);
  if (g.daily.dayKey !== today) rollDaily(g, today);
  if (g.bounties.dayKey !== today) rollBounties(g, today);
  weekRollover(g, now);
  fishWeekRollover(g, now);
  purgeExpiredItems(g, now);

  const dt = now - g.lastTick;
  let gained = 0;
  if (dt > 0) {
    gained = (passiveRate(g) * Math.min(dt, offlineCapMs(g))) / 1000;
    if (gained > 0) earnGold(g, gained);
  }
  g.lastTick = now;
  return gained;
}
