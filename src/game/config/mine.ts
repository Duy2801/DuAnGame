// Hang Mỏ Đá Ngầm: mỗi tầng là lưới đá, đập đá ra quặng, tìm thang 🪜 để xuống sâu hơn.
// Tầng càng sâu đá càng cứng, quặng càng quý. Cứ 10 tầng có thang máy lưu tiến độ.

export const MINE_COLS = 6;
export const MINE_ROWS = 4;
/** thang máy: mỗi bội số tầng này lưu lại để lần sau xuống thẳng */
export const MINE_CHECKPOINT = 10;

/** thể lực: mỗi nhát cuốc tốn 1, tự hồi theo thời gian thực (kể cả khi offline) */
export const MINE_ENERGY = { base: 60, perPick: 15, regenMs: 20_000 };
/** ăn đồ ăn trong hang hồi thể lực = HP hồi / hệ số này */
export const MINE_FOOD_DIV = 5;

export interface OreItemDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
}

export const ORE_ITEMS: OreItemDef[] = [
  { id: 'ore_copper', name: 'Quặng đồng', emoji: '🟠', price: 18 },
  { id: 'ore_iron', name: 'Quặng sắt', emoji: '⚙️', price: 45 },
  { id: 'ore_silver', name: 'Quặng bạc', emoji: '🥈', price: 110 },
  { id: 'ore_gold', name: 'Quặng vàng', emoji: '🥇', price: 260 },
  { id: 'gem_ruby', name: 'Hồng ngọc', emoji: '❤️‍🔥', price: 600 },
  { id: 'gem_diamond', name: 'Kim cương thô', emoji: '💎', price: 1400 },
];

export type RockId = 'dirt' | 'stone' | 'copper' | 'iron' | 'silver' | 'gold' | 'crystal' | 'ruby' | 'diamond' | 'chest';

export interface RockDef {
  id: RockId;
  name: string;
  /** số nhát cơ bản (cộng thêm theo độ sâu) */
  hp: number;
  /** tầng bắt đầu xuất hiện */
  from: number;
  weight: number;
  loot?: { item: string; qty: [number, number] };
  color: string;
  speck: string;
}

export const ROCKS: RockDef[] = [
  { id: 'dirt', name: 'Đất', hp: 1, from: 1, weight: 30, color: '#8a6a42', speck: '#6a4e2e' },
  { id: 'stone', name: 'Đá', hp: 2, from: 1, weight: 34, color: '#8a8478', speck: '#5a564e' },
  { id: 'copper', name: 'Mạch đồng', hp: 3, from: 1, weight: 16, loot: { item: 'ore_copper', qty: [1, 2] }, color: '#8a8478', speck: '#e08a3a' },
  { id: 'iron', name: 'Mạch sắt', hp: 4, from: 8, weight: 12, loot: { item: 'ore_iron', qty: [1, 2] }, color: '#77716a', speck: '#c8c8d0' },
  { id: 'silver', name: 'Mạch bạc', hp: 5, from: 18, weight: 9, loot: { item: 'ore_silver', qty: [1, 2] }, color: '#6a6a72', speck: '#e8f0ff' },
  { id: 'gold', name: 'Mạch vàng', hp: 6, from: 30, weight: 7, loot: { item: 'ore_gold', qty: [1, 2] }, color: '#5e5a52', speck: '#f2c230' },
  { id: 'crystal', name: 'Pha lê', hp: 6, from: 40, weight: 5, loot: { item: 'crystal', qty: [1, 2] }, color: '#4a5a72', speck: '#7fe0ff' },
  { id: 'ruby', name: 'Hồng ngọc', hp: 7, from: 55, weight: 3.5, loot: { item: 'gem_ruby', qty: [1, 1] }, color: '#4a3a42', speck: '#ff3a5a' },
  { id: 'diamond', name: 'Kim cương', hp: 8, from: 70, weight: 2, loot: { item: 'gem_diamond', qty: [1, 1] }, color: '#3a3a4a', speck: '#ffffff' },
  { id: 'chest', name: 'Rương cổ', hp: 2, from: 3, weight: 1.6, color: '#8a5a2e', speck: '#f2c230' },
];
export const ROCK_BY_ID = Object.fromEntries(ROCKS.map((r) => [r.id, r])) as Record<RockId, RockDef>;

/** đá cứng thêm 1 nhát mỗi chừng này tầng */
export const MINE_HP_PER_FLOORS = 25;
/** rương cổ: vàng theo tầng, có khi kim cương */
export const MINE_CHEST = { goldPerFloor: 25, gemChance: 0.35, gems: [2, 6] as [number, number] };

/** cuốc chim: sức đập mỗi nhát và giá nâng cấp lên cấp kế */
export const PICKAXES: { name: string; emoji: string; power: number; cost?: { gold: number; items: Record<string, number> } }[] = [
  { name: 'Cuốc gỗ', emoji: '⛏️', power: 1, cost: { gold: 800, items: { ore_copper: 10 } } },
  { name: 'Cuốc đồng', emoji: '⛏️', power: 2, cost: { gold: 5000, items: { ore_copper: 20, ore_iron: 12 } } },
  { name: 'Cuốc sắt', emoji: '⛏️', power: 3, cost: { gold: 25000, items: { ore_iron: 25, ore_silver: 12 } } },
  { name: 'Cuốc bạc', emoji: '⛏️', power: 5, cost: { gold: 120000, items: { ore_silver: 25, ore_gold: 15 } } },
  { name: 'Cuốc kim cương', emoji: '💎', power: 8 },
];
