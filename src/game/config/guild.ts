import type { HeroClass, MissionDef, Rarity } from '../types';

export const RANKS = [
  { name: 'F', xp: 0 },
  { name: 'E', xp: 100 },
  { name: 'D', xp: 350 },
  { name: 'C', xp: 900 },
  { name: 'B', xp: 2000 },
  { name: 'A', xp: 4000 },
  { name: 'S', xp: 8000 },
];

export function rankIndex(xp: number): number {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  return i;
}

export const RARITY: Record<Rarity, { power: number; costMult: number }> = {
  N: { power: 10, costMult: 1 },
  R: { power: 16, costMult: 1.3 },
  SR: { power: 26, costMult: 1.7 },
  SSR: { power: 42, costMult: 2.2 },
};

export const CLASSES: Record<HeroClass, { name: string; emoji: string; perk: string }> = {
  warrior: { name: 'Kiếm sĩ', emoji: '⚔️', perk: '+15% sức mạnh bản thân' },
  mage: { name: 'Pháp sư', emoji: '🔮', perk: '+10% vàng của cả đội' },
  archer: { name: 'Cung thủ', emoji: '🏹', perk: '-10% thời gian nhiệm vụ' },
  healer: { name: 'Mục sư', emoji: '✨', perk: '+6% tỉ lệ thành công' },
  farmer: { name: 'Nông dân chiến binh', emoji: '🧑‍🌾', perk: '+30% tỉ lệ rơi đồ' },
};

export const CLASS_IDS = Object.keys(CLASSES) as HeroClass[];

export const RECRUIT = {
  gold: { cost: 150, odds: { N: 0.62, R: 0.28, SR: 0.09, SSR: 0.01 } },
  gems: { cost: 30, odds: { N: 0, R: 0.6, SR: 0.32, SSR: 0.08 } },
} satisfies Record<string, { cost: number; odds: Record<Rarity, number> }>;

export const HERO_NAMES = [
  'Lâm', 'Mai', 'Khôi', 'An', 'Bảo', 'Vy', 'Phong', 'Linh', 'Tuấn', 'Hạ', 'Minh', 'Thảo',
  'Kiên', 'Ngân', 'Dũng', 'Yến', 'Huy', 'Trúc', 'Sơn', 'Nhi', 'Long', 'Châu', 'Quân', 'Ly',
];

export const HERO_MAX_LEVEL = 30;
export const MAX_TEAM = 3;

export const MISSIONS: MissionDef[] = [
  { id: 'rats', name: 'Diệt chuột kho thóc', emoji: '🐀', rankReq: 0, durationSec: 45, reqPower: 10, gold: [30, 50], xp: 10, drops: [] },
  {
    id: 'herbs', name: 'Hái thảo dược bìa rừng', emoji: '🌿', rankReq: 0, durationSec: 90, reqPower: 15, gold: [50, 80], xp: 15,
    drops: [{ item: 'seed_mushroom', chance: 0.1, qty: 1 }],
  },
  {
    id: 'slime', name: 'Săn slime đồng cỏ', emoji: '🟢', rankReq: 1, durationSec: 180, reqPower: 25, gold: [120, 180], xp: 30,
    drops: [{ item: 'slime_gel', chance: 0.7, qty: 2 }],
  },
  {
    id: 'escort', name: 'Hộ tống thương nhân', emoji: '🐴', rankReq: 1, durationSec: 300, reqPower: 35, gold: [220, 320], xp: 45,
    drops: [], gems: { chance: 0.3, qty: 2 },
  },
  {
    id: 'wolves', name: 'Đánh bầy sói đêm', emoji: '🐺', rankReq: 2, durationSec: 480, reqPower: 55, gold: [400, 560], xp: 70,
    drops: [{ item: 'wolf_fang', chance: 0.6, qty: 2 }, { item: 'seed_mushroom', chance: 0.25, qty: 1 }],
  },
  {
    id: 'crystal', name: 'Thám hiểm hang pha lê', emoji: '🕳️', rankReq: 3, durationSec: 900, reqPower: 85, gold: [900, 1250], xp: 120,
    drops: [{ item: 'crystal', chance: 0.6, qty: 1 }, { item: 'seed_fairyberry', chance: 0.15, qty: 1 }],
  },
  {
    id: 'goblin', name: 'Truy quét tổ goblin', emoji: '👺', rankReq: 4, durationSec: 1500, reqPower: 130, gold: [1800, 2500], xp: 200,
    drops: [{ item: 'goblin_relic', chance: 0.5, qty: 1 }], gems: { chance: 0.5, qty: 5 },
  },
  {
    id: 'dragon', name: 'Thảo phạt rồng con', emoji: '🐉', rankReq: 5, durationSec: 2700, reqPower: 200, gold: [4000, 5600], xp: 400,
    drops: [{ item: 'dragon_scale', chance: 0.5, qty: 1 }, { item: 'seed_fairyberry', chance: 0.4, qty: 2 }], gems: { chance: 1, qty: 10 },
  },
];

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m]));
