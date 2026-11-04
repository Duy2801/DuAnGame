import { create } from 'zustand';
import { tickGame } from './game/logic/meta';
import { syncTopTitles, weekStatsRollover } from './game/logic/ranks';
import { refillOrders } from './game/logic/orders';
import { trackOnline } from './game/logic/rewards';
import { BOARD_BY_ID, TITLE_BY_ID } from './game/config/titles';
import { SAVE_VERSION, createInitialState } from './game/state';
import type { GameState } from './game/types';
import { GameError } from './game/utils';
import { freezeGameConfigs, initConsoleSecurityWarning, sanitizeGameState, verifySaveIntegrity } from './services/security';

freezeGameConfigs();
initConsoleSecurityWarning();

// Bản offline: lưu tạm trên máy (localStorage). Bản online sẽ thay bằng API server.
const SAVE_KEY = 'nong-trai-mao-hiem:save';

export interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'err';
}

export interface Welcome {
  away: number;
  gold: number;
  crops: number;
  missions: number;
}

type Action = (g: GameState, now: number) => string | void;

interface Store {
  game: GameState;
  now: number;
  welcome: Welcome | null;
  toasts: Toast[];
  /** Chạy một hành động trên bản sao state; lỗi GameError → toast và không lưu */
  act: (fn: Action) => boolean;
  /** Như act nhưng trả về kết quả của fn và không tự hiện toast thành công */
  apply: <T>(fn: (g: GameState, now: number) => T) => T | undefined;
  /** Cập nhật nhanh HP / vị trí nhân vật (gọi thường xuyên từ game loop) */
  setPlayer: (patch: Partial<GameState['player']>) => void;
  tick: () => void;
  toast: (text: string, kind?: Toast['kind']) => void;
  dismissWelcome: () => void;
  resetGame: () => void;
  /** mã dự phòng của save hiện tại (để chép sang máy khác) */
  exportSave: () => string;
  /** nạp save từ mã — đúng thì tải lại trang, sai trả về false */
  importSave: (code: string) => boolean;
  /** thay tiến trình đang chơi bằng save tải từ máy chủ (bản online); sai định dạng trả về false */
  loadGame: (data: unknown) => boolean;
  /** lưu ngay lập tức vào bộ nhớ cục bộ */
  saveNow: () => void;
}

function readSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? normalizeSave(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** kiểm tra + nâng cấp 1 bản save (từ máy hoặc từ máy chủ); không hợp lệ → null */
function normalizeSave(data: any): GameState | null {
  try {
    // save cũ (v2, v3) nâng cấp được: chỉ thêm trường mới; vị trí cũ không còn hợp lệ vì bản đồ đổi
    if (typeof data?.version !== 'number' || data.version < 2 || data.version > SAVE_VERSION) return null;
    const init = createInitialState(Date.now());
    const moved = data.version < SAVE_VERSION;
    // danh hiệu: bỏ mọi id không còn trong danh mục (danh hiệu Giftcode đã xoá, id giả mạo…)
    const owned: string[] = Array.isArray(data.titles?.owned)
      ? [...new Set<string>(data.titles.owned.filter((id: unknown) => typeof id === 'string' && TITLE_BY_ID[id]))]
      : [];
    const active: string | null = owned.includes(data.titles?.active) ? data.titles.active : null;
    // kiểm tra tính toàn vẹn chữ ký chống hack save
    if (!verifySaveIntegrity(data)) {
      console.warn('[Security] Phát hiện save bị can thiệp bộ nhớ! Kích hoạt chế độ khử trùng dữ liệu...');
    }
    const state: GameState = {
      ...init,
      ...data,
      version: SAVE_VERSION,
      // save trước khi tách bản đồ (chưa có player.map): toạ độ cũ không còn đúng → về quảng trường
      player: { ...init.player, ...data.player, ...(moved || !data.player?.map ? { map: 'town', x: -1, y: -1 } : {}) },
      stats: { ...init.stats, ...data.stats },
      profile: { ...init.profile, ...data.profile },
      cosmetics: { ...init.cosmetics, ...data.cosmetics },
      titles: { owned, active },
      // chỉ giữ id mã quà của DB (gift_*); mã offline cũ đã bị xoá
      redeemed: Array.isArray(data.redeemed) ? data.redeemed.filter((c: unknown) => typeof c === 'string' && c.startsWith('gift_')) : [],
      inventory: moved ? { ...init.inventory, ...data.inventory } : data.inventory,
      // bản đồ mới có 24 ô ruộng, story đổi chương
      story: moved ? init.story : data.story,
      hotbar: data.hotbar ?? {
        slots: [data.player?.equip?.weapon ?? 'wood_sword', data.fishingGear?.rod ?? 'rod_bamboo', ...new Array(8).fill(null)],
        sel: 0,
      },
    };
    if (state.player?.equip?.armor === 'cloth') {
      state.player.equip.armor = null;
    }
    if (Array.isArray(state.player?.owned)) {
      state.player.owned = state.player.owned.filter((id: unknown) => id !== 'cloth');
    }
    return sanitizeGameState(state);
  } catch {
    return null;
  }
}

/** bật khi đang nạp save khác, để lần lưu lúc đóng trang không ghi đè lên */
let saveBlocked = false;

function writeSave(g: GameState) {
  if (saveBlocked) return;
  try {
    const clean = sanitizeGameState(g);
    localStorage.setItem(SAVE_KEY, JSON.stringify(clean));
    const owner = localStorage.getItem('nong-trai-mao-hiem:owner');
    if (owner) {
      localStorage.setItem(`nong-trai-mao-hiem:save:${owner}`, JSON.stringify(clean));
    }
  } catch {
    // webview chặn storage thì vẫn chơi được, chỉ không giữ tiến trình
  }
}

function boot(now: number, saved = readSave()) {
  const game = saved ?? createInitialState(now);
  const away = now - game.lastTick;
  const gold = tickGame(game, now);
  const welcome: Welcome | null =
    saved && away > 60_000
      ? {
          away,
          gold,
          crops: game.plots.filter((p) => p.cropId && p.readyAt <= now).length,
          missions: game.missions.filter((m) => m.endAt <= now).length,
        }
      : null;
  return { game, welcome };
}

let toastSeq = 0;
const startedAt = Date.now();
const booted = boot(startedAt);

export const useGame = create<Store>()((set, get) => ({
  game: booted.game,
  now: startedAt,
  welcome: booted.welcome,
  toasts: [],

  act: (fn) => {
    const out: { msg: string | void } = { msg: undefined };
    const ok = get().apply((g, now) => {
      out.msg = fn(g, now);
      return true;
    });
    if (out.msg) get().toast(out.msg);
    return ok === true;
  },

  apply: (fn) => {
    const draft = structuredClone(get().game);
    const now = Date.now();
    try {
      const result = fn(draft, now);
      draft.lastTick = Math.max(draft.lastTick || 0, now);
      set({ game: draft, now });
      return result;
    } catch (e) {
      if (e instanceof GameError) {
        get().toast(e.message, 'err');
        return undefined;
      }
      throw e;
    }
  },

  setPlayer: (patch) => set((s) => ({ game: { ...s.game, player: { ...s.game.player, ...patch } } })),

  tick: () => {
    const draft = structuredClone(get().game);
    const now = Date.now();
    const dt = now - get().now;
    tickGame(draft, now);
    weekStatsRollover(draft, now);
    refillOrders(draft, now);
    if (document.visibilityState === 'visible') trackOnline(draft, now, dt);
    const gained = syncTopTitles(draft, now);
    set({ game: draft, now });
    for (const id of gained) {
      const t = TITLE_BY_ID[id];
      get().toast(`${t.rank === 1 ? '👑' : '🏅'} Top ${t.rank} ${BOARD_BY_ID[t.board!].name}: danh hiệu « ${t.name} »!`);
    }
  },

  toast: (text, kind = 'ok') => {
    const id = ++toastSeq;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2800);
  },

  dismissWelcome: () => set({ welcome: null }),

  exportSave: () => btoa(unescape(encodeURIComponent(JSON.stringify(get().game)))),

  importSave: (code) => {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
      if (typeof data?.version !== 'number' || data.version > SAVE_VERSION || !data.player || !data.profile) return false;
      const backup = localStorage.getItem(SAVE_KEY);
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      if (!readSave()) {
        if (backup) localStorage.setItem(SAVE_KEY, backup);
        return false;
      }
      saveBlocked = true;
      location.reload();
      return true;
    } catch {
      return false;
    }
  },

  loadGame: (data) => {
    const saved = normalizeSave(data);
    if (!saved) return false;
    const now = Date.now();
    const { game, welcome } = boot(now, saved);
    writeSave(game);
    set({ game, now, welcome });
    return true;
  },

  resetGame: () => {
    const now = Date.now();
    const game = createInitialState(now);
    tickGame(game, now);
    writeSave(game);
    set({ game, now, welcome: null });
  },

  saveNow: () => {
    const now = Date.now();
    const g = get().game;
    g.lastTick = Math.max(g.lastTick || 0, now);
    writeSave(g);
  },
}));

// Chặn phơi bày store nội bộ ra global window chống can thiệp Console
if (typeof window !== 'undefined') {
  delete (window as any).__store;
}

// Lưu tối đa mỗi 2 giây, và ngay khi ẩn app / đóng tab
let saveTimer: number | undefined;
useGame.subscribe((s, prev) => {
  if (s.game === prev.game || saveTimer !== undefined) return;
  saveTimer = window.setTimeout(() => {
    saveTimer = undefined;
    writeSave(useGame.getState().game);
  }, 2000);
});
const flush = () => writeSave(useGame.getState().game);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
});
window.addEventListener('pagehide', flush);
