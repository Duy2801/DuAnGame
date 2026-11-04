// Cầu nối giữa Phaser (thế giới) và React (giao diện)
import type { SkillId } from '../game/config/skills';

export type PanelId =
  | 'guild' | 'market' | 'quests' | 'rank' | 'build' | 'home' | 'smith' | 'character' | 'ranch'
  | 'weapons' | 'armor' | 'potions' | 'bounty' | 'seeds' | 'fishing' | 'kites' | 'wings' | 'pets' | 'fashion' | 'hats' | 'jewelry' | 'bakery' | 'wheel' | 'map' | 'fishrank' | 'inventory' | 'mine' | 'album' | 'realty' | 'giftcode' | 'fishbag';

export interface FishingRequest {
  privatePond: boolean;
  night: boolean;
  rain: boolean;
  zoneId?: number;
}

export interface BossLootEvent {
  boss: string;
  gold: number;
  gems: number;
  xp: number;
  items: Record<string, number>;
  /** trang bị mới nhận / món trùng đã đổi ra vàng */
  gear: string[];
  dupes: string[];
  first: boolean;
  jackpot: boolean;
}

export interface BusEvents {
  panel: PanelId;
  seed: number;
  planted: number;
  house: string;
  /** vào sảnh tòa chung cư (id trong TOWERS) */
  tower: string;
  dialog: string;
  fishing: FishingRequest;
  /** mở mini-game thả diều với diều đang chọn */
  kite: string;
  kitedone: boolean;
  /** đang đứng gần nước → hiện thanh chọn cần câu */
  fishzone: boolean;
  /** React báo diễn biến câu cá để thế giới diễn hoạt cảnh phao/dây */
  fishfx: { type: 'cast' | 'nibble' | 'bite' | 'hit' | 'catch' | 'lose' | 'end'; emoji?: string };
  /** đang gõ chữ vào ô nhập — tạm tắt phím điều khiển */
  typing: boolean;
  /** dịch chuyển tới tọa độ tile */
  teleport: { map: import('./map').MapId; x: number; y: number };
  prompt: string | null;
  zone: { name: string; level: string };
  /** boss đang giao chiến (null = ẩn thanh máu) */
  boss: { name: string; hp: number; max: number; enraged: boolean; zone: number } | null;
  /** rương báu sau khi hạ boss */
  bossloot: BossLootEvent;
  pause: boolean;
}

type Handler<T> = (payload: T) => void;
const handlers: { [K in keyof BusEvents]?: Set<Handler<BusEvents[K]>> } = {};

export const bus = {
  on<K extends keyof BusEvents>(event: K, fn: Handler<BusEvents[K]>) {
    (handlers[event] ??= new Set() as never).add(fn);
    return () => {
      handlers[event]!.delete(fn);
    };
  },
  emit<K extends keyof BusEvents>(event: K, payload: BusEvents[K]) {
    handlers[event]?.forEach((fn) => fn(payload));
  },
};

/** Trạng thái nút điều khiển ảo (joystick + nút bấm) — React ghi, Phaser đọc */
export const controls = {
  joyX: 0,
  joyY: 0,
  attack: false,
  interact: false,
  eat: false,
  skill: null as SkillId | null,
};

/** Thông tin thế giới cho bản đồ thu nhỏ (Phaser ghi, React đọc) */
export const worldInfo = { minimap: '', mapW: 1, mapH: 1, px: 0, py: 0, map: 'town' };

/** Thời điểm (Date.now) mỗi kỹ năng hồi xong — Phaser ghi, React đọc để vẽ vòng hồi chiêu */
export const skillCd: Partial<Record<SkillId, number>> = {};

if (import.meta.env.DEV) (window as unknown as { __bus: typeof bus }).__bus = bus;
