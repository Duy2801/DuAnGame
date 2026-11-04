import { RECIPE_BY_ID } from '../config/farm';
import {
  CLASSES, CLASS_IDS, HERO_MAX_LEVEL, HERO_NAMES, MAX_TEAM, MISSION_BY_ID, RANKS, RARITY, RECRUIT, rankIndex,
} from '../config/guild';
import type { GameState, Hero, HeroClass, MissionDef, Rarity, Reward } from '../types';
import { clamp, fail, pick, randInt } from '../utils';
import { earnGold, giveReward, removeItem, rewardText, spendGems, spendGold, track } from './core';

export function heroPower(h: Hero): number {
  const p = RARITY[h.rarity].power * (1 + 0.2 * (h.level - 1));
  return h.cls === 'warrior' ? p * 1.15 : p;
}

export const levelUpCost = (h: Hero) => Math.round(40 * 1.45 ** (h.level - 1) * RARITY[h.rarity].costMult);

export const heroCap = (g: GameState) => 4 + g.buildings.tavern * 2;

export function busyHeroIds(g: GameState): Set<number> {
  return new Set(g.missions.flatMap((m) => m.heroIds));
}

export function missionPreview(g: GameState, m: MissionDef, heroIds: number[], foodId: string | null) {
  const team = g.heroes.filter((h) => heroIds.includes(h.id));
  const count = (c: HeroClass) => team.filter((h) => h.cls === c).length;
  const food = foodId ? RECIPE_BY_ID[foodId] : null;
  const power = team.reduce((s, h) => s + heroPower(h), 0);
  const base = clamp(0.2 + (0.6 * power) / m.reqPower, 0.05, 0.95);
  const chance = Math.min(0.99, base + count('healer') * 0.06 + (food?.successBonus ?? 0));
  const timeMult = Math.max(0.4, 1 - count('archer') * 0.1 - (food?.timeCut ?? 0));
  return {
    power,
    chance,
    durationMs: m.durationSec * 1000 * timeMult,
    goldMult: 1 + count('mage') * 0.1,
    dropMult: 1 + count('farmer') * 0.3,
  };
}

function rollRarity(odds: Record<Rarity, number>): Rarity {
  const r = Math.random();
  let acc = 0;
  for (const k of ['N', 'R', 'SR', 'SSR'] as Rarity[]) {
    acc += odds[k];
    if (r < acc) return k;
  }
  return 'N';
}

export function recruit(g: GameState, mode: keyof typeof RECRUIT): string {
  if (g.heroes.length >= heroCap(g)) fail('Quán rượu đã đầy — nâng cấp Quán rượu hoặc cho bớt người nghỉ');
  const cfg = RECRUIT[mode];
  if (mode === 'gold') spendGold(g, cfg.cost);
  else spendGems(g, cfg.cost);
  const hero: Hero = { id: ++g.seq, name: pick(HERO_NAMES), cls: pick(CLASS_IDS), rarity: rollRarity(cfg.odds), level: 1 };
  g.heroes.push(hero);
  track(g, 'recruit');
  return `${hero.rarity === 'SSR' ? '🌟 ' : ''}Tuyển được [${hero.rarity}] ${CLASSES[hero.cls].name} ${hero.name}!`;
}

export function levelUp(g: GameState, heroId: number): string {
  const h = g.heroes.find((x) => x.id === heroId);
  if (!h) fail('Không tìm thấy mạo hiểm giả');
  if (h.level >= HERO_MAX_LEVEL) fail('Đã đạt cấp tối đa');
  spendGold(g, levelUpCost(h));
  h.level++;
  track(g, 'upgrade');
  return `${h.name} lên Lv ${h.level}`;
}

export function dismissHero(g: GameState, heroId: number): string {
  if (busyHeroIds(g).has(heroId)) fail('Người này đang đi nhiệm vụ');
  if (g.heroes.length <= 1) fail('Hội phải còn ít nhất 1 người');
  const h = g.heroes.find((x) => x.id === heroId);
  if (!h) fail('Không tìm thấy mạo hiểm giả');
  g.heroes = g.heroes.filter((x) => x.id !== heroId);
  const refund = 20 * h.level;
  earnGold(g, refund);
  return `${h.name} đã rời Hội (+🪙${refund})`;
}

export function sendMission(g: GameState, missionId: string, heroIds: number[], foodId: string | null, now: number): string {
  const m = MISSION_BY_ID[missionId];
  if (!m) fail('Nhiệm vụ không tồn tại');
  if (rankIndex(g.guildXp) < m.rankReq) fail(`Cần Hội rank ${RANKS[m.rankReq].name}`);
  if (heroIds.length < 1 || heroIds.length > MAX_TEAM) fail(`Chọn 1–${MAX_TEAM} mạo hiểm giả`);
  const busy = busyHeroIds(g);
  for (const id of heroIds) {
    if (!g.heroes.some((h) => h.id === id)) fail('Mạo hiểm giả không tồn tại');
    if (busy.has(id)) fail('Có người đang bận đi nhiệm vụ khác');
  }
  if (foodId) removeItem(g, foodId, 1);
  const p = missionPreview(g, m, heroIds, foodId);
  g.missions.push({
    uid: ++g.seq,
    missionId,
    heroIds: [...heroIds],
    startAt: now,
    endAt: now + p.durationMs,
    chance: p.chance,
    goldMult: p.goldMult,
    dropMult: p.dropMult,
  });
  return `${m.emoji} Đội đã lên đường: ${m.name}`;
}

export function claimMission(g: GameState, uid: number, now: number): string {
  const idx = g.missions.findIndex((x) => x.uid === uid);
  if (idx < 0) fail('Không tìm thấy đội');
  const am = g.missions[idx];
  if (now < am.endAt) fail('Đội chưa trở về');
  const m = MISSION_BY_ID[am.missionId];
  g.missions.splice(idx, 1);

  const rankBefore = rankIndex(g.guildXp);
  const success = Math.random() < am.chance;
  const reward: Reward = { items: {} };
  let xp: number;
  if (success) {
    reward.gold = Math.round(randInt(m.gold[0], m.gold[1]) * am.goldMult);
    for (const d of m.drops) {
      if (Math.random() < Math.min(1, d.chance * am.dropMult)) reward.items![d.item] = (reward.items![d.item] ?? 0) + d.qty;
    }
    if (m.gems && Math.random() < m.gems.chance) reward.gems = m.gems.qty;
    xp = m.xp;
  } else {
    reward.gold = Math.round(m.gold[0] * 0.25);
    xp = Math.round(m.xp * 0.3);
  }
  giveReward(g, reward);
  g.guildXp += xp;
  g.stats.missionsDone++;
  track(g, 'mission');

  let msg = success
    ? `✅ ${m.name} thành công! ${rewardText(reward)} +${xp} XP`
    : `❌ ${m.name} thất bại… ${rewardText(reward)} +${xp} XP`;
  const rankAfter = rankIndex(g.guildXp);
  if (rankAfter > rankBefore) msg += ` · 🎉 Hội lên rank ${RANKS[rankAfter].name}!`;
  return msg;
}
