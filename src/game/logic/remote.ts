import { ONLINE } from '../../services/config';
import type { GameState } from '../types';

// Bảng xếp hạng người chơi thật (bản online). services/online.ts tải điểm của mọi người về đây định kỳ,
// logic BXH đọc từ đây thay cho bot. Điểm của chính mình luôn lấy số đang có trong máy (mới nhất).

export interface RemoteRow {
  id: string;
  name: string;
  /** điểm theo id bảng: gold, farm, hunt, kite, fish, fish_big, level… */
  scores: Record<string, number>;
}

export interface RemoteEntry {
  name: string;
  score: number;
  isPlayer: boolean;
  row?: RemoteRow;
}

export const remote = {
  enabled: ONLINE,
  /** id tài khoản đang chơi ('' = chưa đăng nhập) */
  me: '',
  /** điểm tuần của mọi người, theo khóa tuần */
  weeks: {} as Record<string, RemoteRow[]>,
  /** cấp độ mọi người (bảng toàn thời gian) */
  levels: null as RemoteRow[] | null,
};

/** điểm tuần của người chơi theo từng bảng, gom theo khóa tuần (mỗi nhóm điểm có khóa tuần riêng) */
export function myWeeklyScores(g: GameState): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  const put = (wk: string, scores: Record<string, number>) => Object.assign((out[wk] ??= {}), scores);
  put(g.week.key, { gold: Math.floor(g.week.gold) });
  const ws = g.weekStats as GameState['weekStats'] & { mineBest?: number };
  put(ws.key, { farm: ws.harvest, hunt: ws.kills, kite: ws.kiteBest ?? 0, ...(ws.mineBest !== undefined ? { mine: ws.mineBest } : {}) });
  const remoteFish = remote.weeks[g.fishing.week.key]?.find((r) => r.id === remote.me)?.scores?.fish ?? 0;
  const pts = Math.max(g.fishing.week.points || 0, remoteFish);
  g.fishing.week.points = pts;
  put(g.fishing.week.key, { fish: pts, fish_big: g.fishing.biggest?.cm ?? 0 });
  return out;
}

/** bảng 1 tuần (hoặc bảng cấp độ) gồm người khác trên server + bản thân; null nếu chưa tải được */
export function remoteEntries(board: string, wk: string, mine: { name: string; score: number }): RemoteEntry[] | null {
  if (!remote.me) return null;
  const rows = board === 'level' ? remote.levels : remote.weeks[wk];
  if (!rows) return null;
  const list: RemoteEntry[] = rows
    .filter((r) => r.id !== remote.me)
    .map((r) => ({ name: r.name || 'Ẩn danh', score: r.scores[board] ?? 0, isPlayer: false, row: r }));
  const myRemote = rows.find((r) => r.id === remote.me);
  const myScore = Math.max(mine.score || 0, myRemote?.scores[board] ?? 0);
  list.push({ ...mine, score: myScore, isPlayer: true, row: myRemote });
  return list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const bigB = b.row?.scores.fish_big ?? 0;
    const bigA = a.row?.scores.fish_big ?? 0;
    if (bigB !== bigA) return bigB - bigA;
    return Number(b.isPlayer) - Number(a.isPlayer);
  });
}

/** hạng chốt của 1 tuần đã qua — null nếu chưa tải được dữ liệu tuần đó (khi đó hoãn chốt tuần) */
export function remoteFinalRank(board: string, wk: string, myScore: number): number | null {
  const rows = remote.me ? remote.weeks[wk] : undefined;
  if (!rows) return null;
  return 1 + rows.filter((r) => r.id !== remote.me && (r.scores[board] ?? 0) > myScore).length;
}
