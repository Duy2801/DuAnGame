import type { GameState } from '../types';
import { WEEK_MS, hashStr, mulberry32, weekKey, weekStart } from '../utils';
import { remote, remoteEntries, remoteFinalRank } from './remote';

// Bảng Top Câu Cá theo tuần — bản offline đấu với bot, bản online thay bằng người thật

export const FISH_BOT_NAMES = [
  'ÔngGiàVàBiển', 'CầnThủLãoLuyện', 'CáMậpBéBỏng', 'NgưDânSôngHồng', 'ThánhCâuRô', 'MồiGiunThầnThánh', 'KoiHoàngKim88',
  'ChúTưHồTây', 'CâuĐêmKhôngNgủ', 'ThuyềnTrưởngMèo', 'DâyCướcBạc', 'CáTrêHuyềnThoại', 'NgườiCâuMưa', 'LưỡiCâuVàng',
  'TayCầnMiềnTây', 'CáRồngĐỏ', 'BậcThầyPhaoCâu', 'CôGáiBênHồ', 'LãoNgưÔngCả', 'ThợCâuDạo', 'GióSôngĐà', 'CáHồiNauy',
  'CầnCâuNgọcBích', 'VuaCáChép', 'MặtHồPhẳngLặng', 'TiểuNgưPhủ', 'CâuLàPhảiDính', 'ĐạiDươngXanh', 'ThầnBiểnPoseidon',
];

export const FISH_WEEK_REWARDS = [
  { top: 1, gems: 60 },
  { top: 3, gems: 30 },
  { top: 10, gems: 12 },
  { top: 30, gems: 3 },
];

export const fishRewardGems = (rank: number) => FISH_WEEK_REWARDS.find((r) => rank <= r.top)?.gems ?? 0;

export function fishBotScores(wk: string, frac: number) {
  const rnd = mulberry32(hashStr(`fishbots:${wk}`));
  const f = Math.min(1, Math.max(0, frac));
  return FISH_BOT_NAMES.map((name, i) => {
    const target = 300 * 1.2 ** i * (0.75 + rnd() * 0.5);
    const pace = 0.7 + rnd() * 0.6;
    const biggest = Math.round(30 + i * 7 + rnd() * 30);
    return { name, score: Math.floor(target * f ** pace), biggest };
  });
}

export function fishLeaderboard(g: GameState, now: number) {
  if (remote.enabled) {
    const me = { name: g.profile.name || 'Bạn', score: g.fishing.week.points };
    const real = remoteEntries('fish', g.fishing.week.key, me) ?? [{ ...me, isPlayer: true }];
    return real.map((e) => ({ name: e.name, score: e.score, isPlayer: e.isPlayer, biggest: e.isPlayer ? g.fishing.biggest?.cm ?? 0 : e.row?.scores.fish_big ?? 0 }));
  }
  const frac = (now - weekStart(now)) / WEEK_MS;
  return [
    ...fishBotScores(g.fishing.week.key, frac).map((b) => ({ ...b, isPlayer: false })),
    { name: g.profile.name || 'Bạn', score: g.fishing.week.points, biggest: g.fishing.biggest?.cm ?? 0, isPlayer: true },
  ].sort((a, b) => b.score - a.score);
}

/** gọi mỗi tick: hết tuần thì chốt hạng và phát thưởng */
export function fishWeekRollover(g: GameState, now: number) {
  const wk = weekKey(now);
  if (!g.fishing.week.key) {
    g.fishing.week.key = wk;
    return;
  }
  if (g.fishing.week.key === wk) return;
  const pts = g.fishing.week.points;
  // bản online chốt theo người thật — chưa tải được dữ liệu tuần cũ thì hoãn chốt
  const rank = remote.enabled ? remoteFinalRank('fish', g.fishing.week.key, pts) : 1 + fishBotScores(g.fishing.week.key, 1).filter((b) => b.score > pts).length;
  if (rank === null) return;
  const gems = pts > 0 ? fishRewardGems(rank) : 0;
  g.gems += gems;
  g.fishing.week = { key: wk, points: 0, lastResult: pts > 0 ? { rank, gems } : null };
}
