import { BOT_NAMES } from '../config/meta';
import {
  BOARDS, TIER_ORDER, TITLE_BY_ID, TOP_TITLE_COUNT, topTitleId, type BoardId,
} from '../config/titles';
import type { GameState } from '../types';
import { WEEK_MS, hashStr, mulberry32, weekKey, weekStart } from '../utils';
import { leaderboard } from './meta';
import { fishLeaderboard } from './fishrank';
import { remote, remoteEntries, remoteFinalRank } from './remote';

// Danh hiệu Top 1–5 cho mọi bảng xếp hạng — bản offline đấu với bot

export interface BoardEntry {
  name: string;
  score: number;
  isPlayer: boolean;
}

/** quy mô điểm bot từng bảng: bot thứ i nhắm tới base × 1.19^i trong cả tuần */
const BOT_BASE: Record<'farm' | 'hunt' | 'kite', number> = { farm: 4, hunt: 10, kite: 9 };

function weeklyBots(board: 'farm' | 'hunt' | 'kite', wk: string, frac: number) {
  const rnd = mulberry32(hashStr(`${board}bots:${wk}`));
  const f = Math.min(1, Math.max(0, frac));
  return shuffledNames(board, wk).map((name, i) => {
    const target = BOT_BASE[board] * 1.19 ** i * (0.75 + rnd() * 0.5);
    const pace = 0.7 + rnd() * 0.6;
    // ai cũng có chút điểm từ đầu tuần, bảng không trống trơn
    return { name, score: Math.floor(target * (0.05 + 0.95 * f ** pace)) };
  });
}

/** cấp độ bot tăng chậm theo số tuần, tối đa cấp 58 (khu quái 20) */
function levelBots(now: number) {
  const weeks = Math.floor(now / WEEK_MS) % 1000;
  const rnd = mulberry32(hashStr('levelbots'));
  return shuffledNames('level', 'all').map((name, i) => {
    const base = 2 + i * 1.6 + rnd() * 3;
    return { name, score: Math.min(58, Math.floor(base + ((weeks * (0.3 + rnd() * 0.4)) % 6))) };
  });
}

/** mỗi bảng xáo tên khác nhau để không phải bảng nào cũng cùng 1 người đứng đầu */
function shuffledNames(board: string, seed: string) {
  const rnd = mulberry32(hashStr(`names:${board}:${seed}`));
  const names = [...BOT_NAMES];
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  return names;
}

const myName = (g: GameState) => g.profile.name || 'Bạn';
const sortBoard = (list: BoardEntry[]) => list.sort((a, b) => b.score - a.score);

export function boardEntries(g: GameState, now: number, id: BoardId): BoardEntry[] {
  if (id === 'gold') return leaderboard(g, now);
  if (id === 'fish') return fishLeaderboard(g, now).map(({ name, score, isPlayer }) => ({ name, score, isPlayer }));
  if (id === 'level') {
    const me = { name: myName(g), score: g.player.level, isPlayer: true };
    if (remote.enabled) return remoteEntries('level', '', me) ?? [me];
    return sortBoard([...levelBots(now).map((b) => ({ ...b, isPlayer: false })), me]);
  }
  if (remote.enabled) {
    return remoteEntries(id, g.weekStats.key, { name: myName(g), score: weeklyScore(g, id) }) ?? [{ name: myName(g), score: weeklyScore(g, id), isPlayer: true }];
  }
  const frac = (now - weekStart(now)) / WEEK_MS;
  return sortBoard([
    ...weeklyBots(id, g.weekStats.key, frac).map((b) => ({ ...b, isPlayer: false })),
    { name: myName(g), score: weeklyScore(g, id), isPlayer: true },
  ]);
}

function weeklyScore(g: GameState, id: 'farm' | 'hunt' | 'kite') {
  return id === 'farm' ? g.weekStats.harvest : id === 'hunt' ? g.weekStats.kills : g.weekStats.kiteBest ?? 0;
}

/** hạng hiện tại của người chơi; 0 nếu chưa có điểm (chưa được xếp hạng) */
export function playerRank(g: GameState, now: number, id: BoardId): number {
  const list = boardEntries(g, now, id);
  const i = list.findIndex((e) => e.isPlayer);
  return list[i].score > 0 ? i + 1 : 0;
}

/** hạng chốt tuần trước (để giữ danh hiệu thêm 1 tuần) */
export function lastWeekRank(g: GameState, id: BoardId): number {
  if (id === 'gold') return g.week.lastResult?.rank ?? 0;
  if (id === 'fish') return g.fishing.week.lastResult?.rank ?? 0;
  if (id === 'level') return 0;
  return g.weekStats.last[id] ?? 0;
}

/** hết tuần: chốt hạng 3 bảng Nông dân / Thợ săn / Thả diều rồi đếm lại từ 0 */
export function weekStatsRollover(g: GameState, now: number) {
  const wk = weekKey(now);
  if (g.weekStats.key === wk) return;
  const last: GameState['weekStats']['last'] = {};
  for (const id of ['farm', 'hunt', 'kite'] as const) {
    const score = weeklyScore(g, id);
    if (score <= 0) continue;
    if (remote.enabled) {
      // bản online: chốt theo điểm người thật — chưa tải được dữ liệu tuần cũ thì hoãn chốt
      const rank = remoteFinalRank(id, g.weekStats.key, score);
      if (rank === null) return;
      last[id] = rank;
    } else last[id] = 1 + weeklyBots(id, g.weekStats.key, 1).filter((b) => b.score > score).length;
  }
  g.weekStats = { key: wk, harvest: 0, kills: 0, kites: 0, kiteBest: 0, mineBest: 0, last };
}

/** những danh hiệu Top mà người chơi đang được giữ (luân chuyển theo thời gian thực) */
export function heldTopTitles(g: GameState, now: number): Set<string> {
  const held = new Set<string>();
  for (const b of BOARDS) {
    const curRank = playerRank(g, now, b.id);
    if (curRank >= 1 && curRank <= TOP_TITLE_COUNT) {
      held.add(topTitleId(b.id, curRank));
    }
  }
  return held;
}

const tierRank = (id: string) => TIER_ORDER.indexOf(TITLE_BY_ID[id]?.tier ?? 'common');

/**
 * Đồng bộ danh hiệu Top theo bảng xếp hạng: thêm danh hiệu vừa đạt, gỡ danh hiệu đã rớt hạng.
 * Đang đeo danh hiệu của 1 bảng mà lên hạng thì tự đổi sang danh hiệu mới. Trả về các danh hiệu mới.
 */
export function syncTopTitles(g: GameState, now: number): string[] {
  const held = heldTopTitles(g, now);
  const owned = g.titles.owned;
  const gained = [...held].filter((id) => !owned.includes(id));
  const lost = owned.filter((id) => TITLE_BY_ID[id]?.board && !held.has(id));
  if (!gained.length && !lost.length) return [];
  g.titles.owned = [...owned.filter((id) => !lost.includes(id)), ...gained];

  const sameBoard = (board: BoardId) => [...held].filter((id) => TITLE_BY_ID[id].board === board).sort((a, b) => tierRank(b) - tierRank(a))[0];
  if (g.titles.active && lost.includes(g.titles.active)) {
    // Nếu danh hiệu đang đeo bị tước do rớt hạng: đổi sang danh hiệu mới của cùng bảng hoặc danh hiệu cao nhất còn giữ
    const activeDef = TITLE_BY_ID[g.titles.active];
    const sameBoardTitle = activeDef?.board ? sameBoard(activeDef.board) : null;
    if (sameBoardTitle) {
      g.titles.active = sameBoardTitle;
    } else {
      g.titles.active = [...g.titles.owned].sort((a, b) => tierRank(b) - tierRank(a))[0] ?? null;
    }
  } else if (!g.titles.active && gained.length) {
    g.titles.active = gained.sort((a, b) => tierRank(b) - tierRank(a))[0];
  }
  return gained;
}
