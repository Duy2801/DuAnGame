import { TILE } from './textures';

// Hình ảnh & không khí riêng cho từng vùng quái (cách dựng: world/zoneGen.ts)

export type ZoneFx = 'snow' | 'ember' | 'spore' | 'fog' | 'sparkle' | 'ash' | 'leaf' | 'petal';

export interface ZoneTheme {
  tiles: [number, number];
  /** nền điểm xuyết thành từng mảng (hoa, rêu...) */
  accent?: number;
  /** đường mòn uốn lượn từ cửa tây sang cửa đông */
  road: number;
  /** [texture, mật độ] — vật chắn, mọc dày thành cụm rừng/bãi đá theo nhiễu */
  props: [string, number][];
  /** [texture, mật độ] — đồ trang trí đi xuyên qua được (cỏ, hoa, lau...) */
  deco: [string, number][];
  /** tường bao (chọn ngẫu nhiên trong danh sách) */
  wall: string[];
  overlay?: { color: number; alpha: number };
  fx?: ZoneFx;
  pool?: 'water' | 'lava';
  /** nền bờ hồ */
  shore?: number;
  /** đuốc quanh đấu trường boss */
  torch: 'torch' | 'torch_blue' | 'torch_purple';
}

export const ZONE_THEMES: Record<number, ZoneTheme> = {
  1: {
    tiles: [TILE.GRASS, TILE.GRASS2], accent: TILE.PETALS, road: TILE.PATH, wall: ['sakura', 'tree', 'sakura'], fx: 'petal', pool: 'water', shore: TILE.SAND, torch: 'torch',
    props: [['sakura', 0.035], ['tree', 0.02], ['bush', 0.025], ['rock', 0.008]], deco: [['flower_patch', 0.05], ['tuft', 0.05]],
  },
  2: {
    tiles: [TILE.MOSS, TILE.MOSS2], accent: TILE.GRASS2, road: TILE.DIRT, wall: ['mushroom_big', 'tree'], fx: 'spore', torch: 'torch_purple',
    overlay: { color: 0x1a3a10, alpha: 0.12 }, props: [['mushroom_big', 0.045], ['tree', 0.03], ['bush', 0.02]], deco: [['tuft', 0.06], ['glow_shroom', 0.035]],
  },
  3: {
    tiles: [TILE.SWAMP, TILE.SWAMP2], accent: TILE.MOSS, road: TILE.DOCK, wall: ['dead_tree'], fx: 'fog', pool: 'water', shore: TILE.MOSS2, torch: 'torch',
    overlay: { color: 0x102010, alpha: 0.15 }, props: [['dead_tree', 0.025], ['bush', 0.025]], deco: [['reeds', 0.08], ['lily', 0.03]],
  },
  4: {
    tiles: [TILE.DARK, TILE.DARK2], accent: TILE.MOSS2, road: TILE.DIRT, wall: ['pine'], fx: 'leaf', torch: 'torch',
    overlay: { color: 0x000820, alpha: 0.15 }, props: [['pine', 0.08], ['rock', 0.02]], deco: [['tuft', 0.06]],
  },
  5: {
    tiles: [TILE.SAND, TILE.DESERT], accent: TILE.DESERT2, road: TILE.DOCK, wall: ['palm'], pool: 'water', shore: TILE.SAND, torch: 'torch_blue',
    props: [['palm', 0.03], ['rock', 0.015]], deco: [['shell', 0.04], ['starfish', 0.02]],
  },
  6: {
    tiles: [TILE.DIRT, TILE.DIRT2], accent: TILE.GRASS2, road: TILE.PATH, wall: ['palisade'], torch: 'torch',
    props: [['tent_goblin', 0.012], ['palisade', 0.015], ['rock', 0.02], ['dead_tree', 0.015]], deco: [['bones', 0.02], ['tuft', 0.03]],
  },
  7: {
    tiles: [TILE.GRAVE, TILE.GRAVE2], road: TILE.STONE, wall: ['dead_tree'], fx: 'fog', torch: 'torch_purple',
    overlay: { color: 0x1a0a30, alpha: 0.35 }, props: [['tombstone', 0.05], ['dead_tree', 0.025]], deco: [['bones', 0.03], ['wisp_lantern', 0.012]],
  },
  8: {
    tiles: [TILE.CAVE, TILE.CAVE2], road: TILE.ROCK, wall: ['stalagmite'], pool: 'water', torch: 'torch',
    overlay: { color: 0x05040f, alpha: 0.55 }, props: [['stalagmite', 0.06], ['rock', 0.03]], deco: [['glow_shroom', 0.03]],
  },
  9: {
    tiles: [TILE.DESERT, TILE.DESERT2], accent: TILE.SAND, road: TILE.SAND, wall: ['cactus'], fx: 'ash', torch: 'torch',
    overlay: { color: 0x402000, alpha: 0.08 }, props: [['cactus', 0.03], ['rock', 0.02], ['pillar', 0.006]], deco: [['bones', 0.02]],
  },
  10: {
    tiles: [TILE.STONE, TILE.STONE2], accent: TILE.MOSS, road: TILE.PLAZA, wall: ['pillar'], torch: 'torch',
    props: [['pillar', 0.04], ['rock', 0.025], ['tree', 0.01]], deco: [['tuft', 0.04], ['flower_patch', 0.015]],
  },
  11: {
    tiles: [TILE.SNOW, TILE.SNOW2], road: TILE.ICE, wall: ['snow_pine'], fx: 'snow', torch: 'torch_blue',
    props: [['snow_pine', 0.075], ['rock_snow', 0.02]], deco: [['tuft', 0.015]],
  },
  12: {
    tiles: [TILE.ICE, TILE.SNOW], accent: TILE.ICE2, road: TILE.SNOW2, wall: ['ice_crystal', 'snow_pine'], fx: 'snow', pool: 'water', shore: TILE.ICE, torch: 'torch_blue',
    overlay: { color: 0x203a60, alpha: 0.12 }, props: [['ice_crystal', 0.035], ['snow_pine', 0.03], ['rock_snow', 0.015]], deco: [],
  },
  13: {
    tiles: [TILE.CAVE, TILE.CAVE2], road: TILE.ROCK, wall: ['crystal'], fx: 'sparkle', torch: 'torch_blue',
    overlay: { color: 0x05040f, alpha: 0.5 }, props: [['crystal', 0.045], ['stalagmite', 0.03]], deco: [['glow_shroom', 0.02]],
  },
  14: {
    tiles: [TILE.DARK, TILE.GRAVE], road: TILE.GRAVE2, wall: ['dead_tree'], fx: 'fog', torch: 'torch_purple',
    overlay: { color: 0x100828, alpha: 0.42 }, props: [['dead_tree', 0.055], ['tombstone', 0.02]], deco: [['wisp_lantern', 0.015], ['tuft', 0.03]],
  },
  15: {
    tiles: [TILE.TOXIC, TILE.TOXIC2], road: TILE.DIRT, wall: ['dead_tree', 'mushroom_big'], fx: 'spore', pool: 'water', shore: TILE.SWAMP, torch: 'torch_purple',
    overlay: { color: 0x203010, alpha: 0.22 }, props: [['dead_tree', 0.03], ['mushroom_big', 0.02]], deco: [['bones', 0.03], ['glow_shroom', 0.03]],
  },
  16: {
    tiles: [TILE.ROCK, TILE.ROCK2], accent: TILE.DIRT, road: TILE.DIRT, wall: ['boulder'], torch: 'torch',
    props: [['boulder', 0.04], ['rock', 0.035], ['pine', 0.015]], deco: [['tuft', 0.03], ['bones', 0.01]],
  },
  17: {
    tiles: [TILE.BRICK, TILE.BRICK2], road: TILE.BASALT, wall: ['obelisk'], fx: 'ember', pool: 'lava', torch: 'torch',
    overlay: { color: 0x300000, alpha: 0.25 }, props: [['obelisk', 0.022], ['pillar', 0.01]], deco: [['bones', 0.03]],
  },
  18: {
    tiles: [TILE.BASALT, TILE.BASALT2], road: TILE.ROCK, wall: ['lava_rock'], fx: 'ember', pool: 'lava', shore: TILE.BASALT2, torch: 'torch',
    overlay: { color: 0x3a0a00, alpha: 0.25 }, props: [['lava_rock', 0.045], ['dead_tree', 0.02]], deco: [['bones', 0.015]],
  },
  19: {
    tiles: [TILE.VOID, TILE.VOID2], road: TILE.BRICK, wall: ['void_crystal'], fx: 'sparkle', torch: 'torch_purple',
    overlay: { color: 0x000000, alpha: 0.48 }, props: [['void_crystal', 0.04], ['obelisk', 0.015]], deco: [['wisp_lantern', 0.012]],
  },
  20: {
    tiles: [TILE.GOLD, TILE.GOLD2], road: TILE.BASALT, wall: ['boulder', 'lava_rock'], fx: 'ember', pool: 'lava', shore: TILE.BASALT, torch: 'torch',
    overlay: { color: 0x301000, alpha: 0.15 }, props: [['dragon_bone', 0.012], ['lava_rock', 0.03], ['boulder', 0.02]], deco: [['bones', 0.02]],
  },
};
